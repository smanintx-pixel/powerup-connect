import crypto from "node:crypto";
import { storage } from "./storage";

const SESSION_DAYS = 30;

// Passwords are stored as "scrypt:<salt>:<hash>".
export function hashPassword(password: string, salt?: string): string {
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return `scrypt:${useSalt}:${hash}`;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts[0] === "scrypt" && parts.length === 3) {
    return safeEqual(hashPassword(password, parts[1]), stored);
  }
  // Older "<salt>:<sha256>" format from the first prototype.
  if (parts.length === 2 && parts[0]) {
    const legacy = crypto.createHash("sha256").update(parts[0] + password).digest("hex");
    return safeEqual(`${parts[0]}:${legacy}`, stored);
  }
  return false;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Sessions live in the database so they survive restarts and work when every
// request is handled by a fresh serverless function.
export async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await storage.createSession(hashToken(token), userId, expiresAt);
  return token;
}

export async function getUserIdForToken(token: string | undefined): Promise<number | undefined> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return undefined;
  return storage.getSessionUserId(hashToken(token));
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await storage.deleteSession(hashToken(token));
}
