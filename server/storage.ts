import {
  accessCodes,
  users,
  connections,
  messages,
  sessions,
  userPhotos,
  type UserPhoto,
  type AccessCode,
  type InsertAccessCode,
  type User,
  type Connection,
  type InsertConnection,
  type Message,
  type InsertMessage,
} from "../shared/schema";
import { eq, and, or, desc, ne, lt, sql } from "drizzle-orm";
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

  // Messages
  listConversation(userId: number, otherUserId: number): Promise<Message[]>;
  listConversationsForUser(userId: number): Promise<Message[]>;
  createMessage(msg: InsertMessage): Promise<Message>;

  // Profile photos
  setUserPhoto(userId: number, key: string, mime: string, data: string): Promise<void>;
  getPhotoByKey(key: string): Promise<UserPhoto | undefined>;
  deleteUserPhoto(userId: number): Promise<void>;

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
