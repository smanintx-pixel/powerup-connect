import type { Express, Request } from "express";
import { storage } from "./storage";
import { hashPassword, verifyPassword, createSession, getUserIdForToken, destroySession } from "./auth";
import crypto from "node:crypto";
import {
  insertUserSchema,
  insertConnectionSchema,
  insertMessageSchema,
  phoneSchema,
  interestsSchema,
  pastYearsSchema,
} from "../shared/schema";
import { MAX_PHOTO_BYTES } from "../shared/event";
import { z } from "zod";
import type { User, PublicUser } from "../shared/schema";

function parseList<T>(json: string | null | undefined): T[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toPublicUser(user: User): PublicUser {
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    tags: parseList<string>(user.tags),
    interests: parseList<string>(user.interests),
    pastYears: parseList<number>(user.pastYears),
  };
}

// What one attendee may see about another: the profile, never the email
// address or the access code she signed up with, and her phone number only
// if she chose to show it.
function toAttendeeView(user: User): PublicUser {
  return {
    ...toPublicUser(user),
    email: "",
    accessCode: "",
    phone: user.phoneVisible ? user.phone : "",
  };
}

// Accepts a browser data URL for a small JPEG, PNG or WebP and returns the
// raw bytes, or a message saying what is wrong with it.
function readPhotoDataUrl(dataUrl: unknown): { mime: string; data: string } | { error: string } {
  if (typeof dataUrl !== "string") return { error: "No photo was sent." };
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return { error: "Use a JPEG, PNG or WebP photo." };
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length === 0) return { error: "That photo is empty." };
  if (bytes.length > MAX_PHOTO_BYTES) return { error: "That photo is too large. Try a smaller one." };
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP";
  const ok = (m[1] === "image/jpeg" && isJpeg) || (m[1] === "image/png" && isPng) || (m[1] === "image/webp" && isWebp);
  if (!ok) return { error: "That file is not a valid photo." };
  return { mime: m[1], data: bytes.toString("base64") };
}

function getToken(req: Request): string | undefined {
  const header = req.headers["authorization"];
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return undefined;
}

async function requireAuth(req: Request): Promise<User | null> {
  const token = getToken(req);
  const userId = await getUserIdForToken(token);
  if (!userId) return null;
  const user = await storage.getUser(userId);
  return user ?? null;
}

export function registerRoutes(app: Express): void {
  // ---------- AUTH ----------

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByEmail(parsed.email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      const codeRow = await storage.getAccessCodeByCode(parsed.accessCode.trim().toUpperCase());
      if (!codeRow) {
        return res.status(400).json({ message: "That access code isn't recognized. Check your conference registration email." });
      }
      if (codeRow.useCount >= codeRow.maxUses) {
        return res.status(400).json({ message: "This access code has reached its usage limit." });
      }

      const passwordHash = hashPassword(parsed.password);
      const user = await storage.createUser({
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        title: parsed.title ?? "",
        company: parsed.company ?? "",
        bio: parsed.bio ?? "",
        linkedinUrl: parsed.linkedinUrl ?? "",
        photoUrl: "", // photos are uploaded after sign-up, never taken from a pasted address
        tags: JSON.stringify(parsed.tags ?? []),
        phone: parsed.phone ?? "",
        phoneVisible: parsed.phoneVisible ?? false,
        interests: JSON.stringify(parsed.interests ?? []),
        pastYears: JSON.stringify(parsed.pastYears ?? []),
        accessCode: codeRow.code,
        createdAt: Date.now(),
      });
      await storage.incrementAccessCodeUse(codeRow.id);

      const token = await createSession(user.id);
      res.json({ token, user: toPublicUser(user) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message ?? "Invalid input." });
      }
      console.error(err);
      res.status(500).json({ message: "Something went wrong creating your account." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }
      const user = await storage.getUserByEmail(email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ message: "Incorrect email or password." });
      }
      const token = await createSession(user.id);
      res.json({ token, user: toPublicUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong logging in." });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    res.json({ user: toPublicUser(user) });
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      await destroySession(getToken(req));
    } catch (err) {
      console.error(err);
    }
    res.json({ ok: true });
  });

  // ---------- PROFILE ----------

  app.patch("/api/users/me", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const schema = z.object({
      name: z.string().min(1).optional(),
      title: z.string().optional(),
      company: z.string().optional(),
      bio: z.string().optional(),
      linkedinUrl: z.string().optional(),
      tags: z.array(z.string()).optional(),
      phone: phoneSchema.optional(),
      phoneVisible: z.boolean().optional(),
      interests: interestsSchema.optional(),
      pastYears: pastYearsSchema.optional(),
    });
    try {
      const parsed = schema.parse(req.body);
      const updates: Record<string, unknown> = { ...parsed };
      if (parsed.tags) updates.tags = JSON.stringify(parsed.tags);
      if (parsed.interests) updates.interests = JSON.stringify(parsed.interests);
      if (parsed.pastYears) updates.pastYears = JSON.stringify(parsed.pastYears);
      const updated = await storage.updateUser(user.id, updates);
      res.json({ user: toPublicUser(updated!) });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0]?.message ?? "Invalid input." });
      }
      res.status(500).json({ message: "Could not update profile." });
    }
  });

  // ---------- PROFILE PHOTO ----------

  app.post("/api/users/me/photo", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const photo = readPhotoDataUrl((req.body as { dataUrl?: unknown } | undefined)?.dataUrl);
    if ("error" in photo) return res.status(400).json({ message: photo.error });
    try {
      const key = crypto.randomBytes(16).toString("hex");
      await storage.setUserPhoto(user.id, key, photo.mime, photo.data);
      const updated = await storage.updateUser(user.id, { photoUrl: `/api/photos/${key}` });
      res.json({ user: toPublicUser(updated!) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not save your photo." });
    }
  });

  app.delete("/api/users/me/photo", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    try {
      await storage.deleteUserPhoto(user.id);
      const updated = await storage.updateUser(user.id, { photoUrl: "" });
      res.json({ user: toPublicUser(updated!) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Could not remove your photo." });
    }
  });

  // Photos are requested by <img> tags, which cannot send the sign-in token,
  // so this route is open. The key in the address is random and changes with
  // every upload, which also lets browsers cache a photo for good.
  app.get("/api/photos/:key", async (req, res) => {
    const key = req.params.key;
    if (!/^[0-9a-f]{32}$/.test(key)) return res.status(404).end();
    try {
      const photo = await storage.getPhotoByKey(key);
      if (!photo) return res.status(404).end();
      res.setHeader("Content-Type", photo.mime);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.end(Buffer.from(photo.data, "base64"));
    } catch (err) {
      console.error(err);
      res.status(500).end();
    }
  });

  // ---------- DIRECTORY ----------

  app.get("/api/directory", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const all = await storage.listUsers(user.id);
    res.json({ users: all.map(toAttendeeView) });
  });

  app.get("/api/users/:id", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const target = await storage.getUser(Number(req.params.id));
    if (!target) return res.status(404).json({ message: "Attendee not found." });
    res.json({ user: toAttendeeView(target) });
  });

  // ---------- CONNECTIONS ----------

  app.get("/api/connections", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const conns = await storage.listConnectionsForUser(user.id);
    const withUsers = await Promise.all(
      conns.map(async (c) => {
        const other = await storage.getUser(c.connectedUserId);
        return { ...c, user: other ? toAttendeeView(other) : null };
      })
    );
    res.json({ connections: withUsers.filter((c) => c.user !== null) });
  });

  app.get("/api/connections/:connectedUserId", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const conn = await storage.getConnection(user.id, Number(req.params.connectedUserId));
    res.json({ connection: conn ?? null });
  });

  app.post("/api/connections/:connectedUserId", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const connectedUserId = Number(req.params.connectedUserId);
    if (connectedUserId === user.id) {
      return res.status(400).json({ message: "You can't connect with yourself." });
    }
    const target = await storage.getUser(connectedUserId);
    if (!target) return res.status(404).json({ message: "Attendee not found." });

    const schema = z.object({
      note: z.string().optional(),
      reminderDate: z.string().nullable().optional(),
    });
    try {
      const parsed = schema.parse(req.body ?? {});
      const conn = await storage.upsertConnection(user.id, connectedUserId, {
        note: parsed.note,
        reminderDate: parsed.reminderDate,
      });
      res.json({ connection: conn });
    } catch (err) {
      res.status(400).json({ message: "Invalid input." });
    }
  });

  // ---------- MESSAGES ----------

  app.get("/api/messages", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const all = await storage.listConversationsForUser(user.id);
    const otherIds = Array.from(
      new Set(all.map((m) => (m.senderId === user.id ? m.receiverId : m.senderId)))
    );
    const conversations = await Promise.all(
      otherIds.map(async (otherId) => {
        const other = await storage.getUser(otherId);
        const thread = all.filter((m) => m.senderId === otherId || m.receiverId === otherId);
        const last = thread.sort((a, b) => b.createdAt - a.createdAt)[0];
        return other
          ? { user: toAttendeeView(other), lastMessage: last ?? null }
          : null;
      })
    );
    const filtered = conversations
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => (b.lastMessage?.createdAt ?? 0) - (a.lastMessage?.createdAt ?? 0));
    res.json({ conversations: filtered });
  });

  app.get("/api/messages/:otherUserId", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const otherUserId = Number(req.params.otherUserId);
    const thread = await storage.listConversation(user.id, otherUserId);
    res.json({ messages: thread });
  });

  app.post("/api/messages/:otherUserId", async (req, res) => {
    const user = await requireAuth(req);
    if (!user) return res.status(401).json({ message: "Not logged in." });
    const otherUserId = Number(req.params.otherUserId);
    const target = await storage.getUser(otherUserId);
    if (!target) return res.status(404).json({ message: "Attendee not found." });
    try {
      const parsed = insertMessageSchema.parse({
        senderId: user.id,
        receiverId: otherUserId,
        body: req.body?.body,
      });
      const msg = await storage.createMessage(parsed);
      res.json({ message: msg });
    } catch (err) {
      res.status(400).json({ message: "Message can't be empty." });
    }
  });
}
