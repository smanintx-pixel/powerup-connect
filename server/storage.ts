import {
  accessCodes,
  users,
  connections,
  connectionRequests,
  hostCalls,
  consentRecords,
  reports,
  businessSaves,
  messages,
  sessions,
  userPhotos,
  eventSessions,
  sessionMaterials,
  type UserPhoto,
  type SessionWithMaterials,
  type AccessCode,
  type InsertAccessCode,
  type User,
  type Connection,
  type ConnectionRequest,
  type Relation,
  type InsertConnection,
  type Message,
  type InsertMessage,
} from "../shared/schema";
import { eq, and, or, desc, ne, lt, gt, sql } from "drizzle-orm";
import { getDb } from "./db";

export interface IStorage {
  // Access codes
  getAccessCodeByCode(code: string): Promise<AccessCode | undefined>;
  incrementAccessCodeUse(id: number): Promise<void>;
  createAccessCode(code: InsertAccessCode): Promise<AccessCode>;

  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id">): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, "id" | "email" | "passwordHash" | "createdAt">>): Promise<User | undefined>;
  listUsers(excludeId?: number): Promise<User[]>;

  // Connections
  getConnection(userId: number, connectedUserId: number): Promise<Connection | undefined>;
  listConnectionsForUser(userId: number): Promise<Connection[]>;
  upsertConnection(userId: number, connectedUserId: number, updates: Partial<Pick<Connection, "note" | "reminderDate">>): Promise<Connection>;

  // Connection requests
  listRequestsForUser(userId: number): Promise<ConnectionRequest[]>;
  getRelation(userId: number, otherUserId: number): Promise<Relation>;
  requestConnection(userId: number, otherUserId: number): Promise<Relation>;
  respondToRequest(userId: number, fromUserId: number, accept: boolean): Promise<boolean>;
  removeConnection(userId: number, otherUserId: number): Promise<void>;
  countRequestsSentSince(userId: number, since: number): Promise<number>;

  // Saved businesses
  listSavedBusinessSlugs(userId: number): Promise<string[]>;
  saveBusiness(userId: number, slug: string): Promise<void>;
  unsaveBusiness(userId: number, slug: string): Promise<void>;

  // AI host calls
  countHostCallsSince(userId: number, since: number): Promise<number>;
  recordHostCall(userId: number, consentVersion: string): Promise<void>;

  // Consent, reports, deletion
  addConsentRecord(userId: number, subject: string, kind: "terms" | "host" | "host_withdrawn", version: string): Promise<void>;
  latestHostConsent(userId: number): Promise<{ kind: string; version: string } | undefined>;
  createReport(r: { reporterId: number; reportedUserId: number; reportedName: string; reason: string; details: string }): Promise<void>;
  countReportsSince(reporterId: number, since: number): Promise<number>;
  deleteUser(userId: number): Promise<void>;

  // Messages
  listConversation(userId: number, otherUserId: number): Promise<Message[]>;
  listConversationsForUser(userId: number): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;

  // Profile photos
  setUserPhoto(userId: number, key: string, mime: string, data: string): Promise<void>;
  getPhotoByKey(key: string): Promise<UserPhoto | undefined>;
  deleteUserPhoto(userId: number): Promise<void>;

  // Conference sessions, with their recording link and materials
  listEventSessions(): Promise<SessionWithMaterials[]>;

  // Sign-in sessions
  createSession(tokenHash: string, userId: number, expiresAt: number): Promise<void>;
  getSessionUserId(tokenHash: string): Promise<number | undefined>;
  deleteSession(tokenHash: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAccessCodeByCode(code: string) {
    const [row] = await getDb().select().from(accessCodes).where(eq(accessCodes.code, code)).limit(1);
    return row;
  }

  async incrementAccessCodeUse(id: number) {
    await getDb()
      .update(accessCodes)
      .set({ useCount: sql`${accessCodes.useCount} + 1` })
      .where(eq(accessCodes.id, id));
  }

  async createAccessCode(code: InsertAccessCode) {
    const [row] = await getDb().insert(accessCodes).values(code).returning();
    return row;
  }

  async getUser(id: number) {
    if (!Number.isInteger(id)) return undefined;
    const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }

  async getUserByEmail(email: string) {
    const [row] = await getDb().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return row;
  }

  async createUser(user: Omit<User, "id">) {
    const [row] = await getDb().insert(users).values(user).returning();
    return row;
  }

  async updateUser(id: number, updates: Partial<Omit<User, "id" | "email" | "passwordHash" | "createdAt">>) {
    if (Object.keys(updates).length > 0) {
      await getDb().update(users).set(updates).where(eq(users.id, id));
    }
    return this.getUser(id);
  }

  async listUsers(excludeId?: number) {
    const q = getDb().select().from(users);
    return excludeId ? q.where(ne(users.id, excludeId)).orderBy(users.id) : q.orderBy(users.id);
  }

  async getConnection(userId: number, connectedUserId: number) {
    if (!Number.isInteger(connectedUserId)) return undefined;
    const [row] = await getDb()
      .select()
      .from(connections)
      .where(and(eq(connections.userId, userId), eq(connections.connectedUserId, connectedUserId)))
      .limit(1);
    return row;
  }

  async listConnectionsForUser(userId: number) {
    return getDb()
      .select()
      .from(connections)
      .where(eq(connections.userId, userId))
      .orderBy(desc(connections.createdAt));
  }

  async upsertConnection(userId: number, connectedUserId: number, updates: Partial<Pick<Connection, "note" | "reminderDate">>) {
    const existing = await this.getConnection(userId, connectedUserId);
    if (existing) {
      const changes: Partial<Pick<Connection, "note" | "reminderDate">> = {};
      if (updates.note !== undefined) changes.note = updates.note;
      if (updates.reminderDate !== undefined) changes.reminderDate = updates.reminderDate;
      if (Object.keys(changes).length > 0) {
        await getDb().update(connections).set(changes).where(eq(connections.id, existing.id));
      }
      return (await this.getConnection(userId, connectedUserId))!;
    }
    const [row] = await getDb()
      .insert(connections)
      .values({
        userId,
        connectedUserId,
        note: updates.note ?? "",
        reminderDate: updates.reminderDate ?? null,
        createdAt: Date.now(),
      })
      .returning();
    return row;
  }

  // ---------- Connection requests ----------

  private async requestsBetween(a: number, b: number) {
    if (!Number.isInteger(a) || !Number.isInteger(b)) return [];
    return getDb()
      .select()
      .from(connectionRequests)
      .where(
        or(
          and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)),
          and(eq(connectionRequests.fromUserId, b), eq(connectionRequests.toUserId, a))
        )
      );
  }

  async listRequestsForUser(userId: number) {
    return getDb()
      .select()
      .from(connectionRequests)
      .where(or(eq(connectionRequests.fromUserId, userId), eq(connectionRequests.toUserId, userId)))
      .orderBy(desc(connectionRequests.createdAt));
  }

  async getRelation(userId: number, otherUserId: number): Promise<Relation> {
    return relationFrom(userId, await this.requestsBetween(userId, otherUserId));
  }

  async requestConnection(userId: number, otherUserId: number): Promise<Relation> {
    const rows = await this.requestsBetween(userId, otherUserId);
    if (rows.some((r) => r.status === "accepted")) return "connected";
    // She already asked me (even if I said no earlier): asking her back connects us.
    const hers = rows.find((r) => r.fromUserId === otherUserId);
    if (hers) {
      await getDb()
        .update(connectionRequests)
        .set({ status: "accepted", respondedAt: Date.now() })
        .where(eq(connectionRequests.id, hers.id));
      return "connected";
    }
    // I already asked. Pending or declined, there is nothing more to send.
    if (rows.some((r) => r.fromUserId === userId)) return "outgoing";
    await getDb()
      .insert(connectionRequests)
      .values({ fromUserId: userId, toUserId: otherUserId, status: "pending", createdAt: Date.now() })
      .onConflictDoNothing();
    return this.getRelation(userId, otherUserId);
  }

  async respondToRequest(userId: number, fromUserId: number, accept: boolean) {
    if (!Number.isInteger(fromUserId)) return false;
    const updated = await getDb()
      .update(connectionRequests)
      .set({ status: accept ? "accepted" : "declined", respondedAt: Date.now() })
      .where(
        and(
          eq(connectionRequests.fromUserId, fromUserId),
          eq(connectionRequests.toUserId, userId),
          eq(connectionRequests.status, "pending")
        )
      )
      .returning({ id: connectionRequests.id });
    return updated.length > 0;
  }

  // Ends a connection, or withdraws my own pending request. A request I sent
  // that she declined is kept, so removing cannot be used to ask again.
  async removeConnection(userId: number, otherUserId: number) {
    const rows = await this.requestsBetween(userId, otherUserId);
    for (const r of rows) {
      const mineAndPending = r.fromUserId === userId && r.status === "pending";
      if (r.status === "accepted" || mineAndPending) {
        await getDb().delete(connectionRequests).where(eq(connectionRequests.id, r.id));
      }
    }
  }

  async countRequestsSentSince(userId: number, since: number) {
    const [row] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, userId), gt(connectionRequests.createdAt, since)));
    return row?.n ?? 0;
  }

  async listSavedBusinessSlugs(userId: number) {
    const rows = await getDb()
      .select({ slug: businessSaves.slug })
      .from(businessSaves)
      .where(eq(businessSaves.userId, userId))
      .orderBy(desc(businessSaves.createdAt));
    return rows.map((r) => r.slug);
  }

  async saveBusiness(userId: number, slug: string) {
    await getDb().insert(businessSaves).values({ userId, slug, createdAt: Date.now() }).onConflictDoNothing();
  }

  async unsaveBusiness(userId: number, slug: string) {
    await getDb().delete(businessSaves).where(and(eq(businessSaves.userId, userId), eq(businessSaves.slug, slug)));
  }

  async countHostCallsSince(userId: number, since: number) {
    const [row] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(hostCalls)
      .where(and(eq(hostCalls.userId, userId), gt(hostCalls.createdAt, since)));
    return row?.n ?? 0;
  }

  async recordHostCall(userId: number, consentVersion: string) {
    await getDb().insert(hostCalls).values({ userId, consentVersion, createdAt: Date.now() });
  }

  async addConsentRecord(userId: number, subject: string, kind: "terms" | "host" | "host_withdrawn", version: string) {
    await getDb().insert(consentRecords).values({ userId, subject, kind, version, createdAt: Date.now() });
  }

  async latestHostConsent(userId: number) {
    const [row] = await getDb()
      .select({ kind: consentRecords.kind, version: consentRecords.version })
      .from(consentRecords)
      .where(and(eq(consentRecords.userId, userId), or(eq(consentRecords.kind, "host"), eq(consentRecords.kind, "host_withdrawn"))))
      .orderBy(desc(consentRecords.createdAt), desc(consentRecords.id))
      .limit(1);
    return row;
  }

  async createReport(r: { reporterId: number; reportedUserId: number; reportedName: string; reason: string; details: string }) {
    await getDb().insert(reports).values({ ...r, status: "open", createdAt: Date.now() });
  }

  async countReportsSince(reporterId: number, since: number) {
    const [row] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(reports)
      .where(and(eq(reports.reporterId, reporterId), gt(reports.createdAt, since)));
    return row?.n ?? 0;
  }

  // Everything tied to the account goes with it (the database cascades to
  // photos, connections, requests, notes, messages in both directions, saves,
  // host calls and sign-in sessions). Consent records and reports keep their
  // rows with the user id cleared.
  async deleteUser(userId: number) {
    await getDb().delete(users).where(eq(users.id, userId));
  }

  async listConversation(userId: number, otherUserId: number) {
    if (!Number.isInteger(otherUserId)) return [];
    return getDb()
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
          and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.createdAt);
  }

  async listConversationsForUser(userId: number) {
    return getDb()
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(msg: InsertMessage) {
    const [row] = await getDb().insert(messages).values({ ...msg, createdAt: Date.now() }).returning();
    return row;
  }

  async setUserPhoto(userId: number, key: string, mime: string, data: string) {
    await getDb()
      .insert(userPhotos)
      .values({ key, userId, mime, data, createdAt: Date.now() })
      .onConflictDoUpdate({
        target: userPhotos.userId,
        set: { key, mime, data, createdAt: Date.now() },
      });
  }

  async getPhotoByKey(key: string) {
    const [row] = await getDb().select().from(userPhotos).where(eq(userPhotos.key, key)).limit(1);
    return row;
  }

  async deleteUserPhoto(userId: number) {
    await getDb().delete(userPhotos).where(eq(userPhotos.userId, userId));
  }

  async listEventSessions() {
    const rows = await getDb()
      .select()
      .from(eventSessions)
      .where(eq(eventSessions.published, true))
      .orderBy(eventSessions.sortOrder, eventSessions.id);
    const materials = await getDb()
      .select()
      .from(sessionMaterials)
      .orderBy(sessionMaterials.sortOrder, sessionMaterials.id);
    return rows.map((row) => ({ ...row, materials: materials.filter((m) => m.sessionId === row.id) }));
  }

  async createSession(tokenHash: string, userId: number, expiresAt: number) {
    await getDb().insert(sessions).values({ tokenHash, userId, createdAt: Date.now(), expiresAt });
  }

  async getSessionUserId(tokenHash: string) {
    const [row] = await getDb().select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
    if (!row || row.expiresAt < Date.now()) return undefined;
    return row.userId;
  }

  async deleteSession(tokenHash: string) {
    await getDb().delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  async deleteExpiredSessions() {
    await getDb().delete(sessions).where(lt(sessions.expiresAt, Date.now()));
  }
}

export const storage = new DatabaseStorage();

/** Works out how `userId` stands with the other woman from the request rows between them. */
export function relationFrom(userId: number, rows: ConnectionRequest[]): Relation {
  if (rows.some((r) => r.status === "accepted")) return "connected";
  if (rows.some((r) => r.fromUserId === userId)) return "outgoing"; // pending, or declined (not revealed)
  if (rows.some((r) => r.toUserId === userId && r.status === "pending")) return "incoming";
  return "none";
}
