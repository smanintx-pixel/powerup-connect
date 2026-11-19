import { pgSchema, text, integer, bigint, serial, uniqueIndex, index } from "drizzle-orm/pg-core";

// All companion-app tables live in their own Postgres schema ("connect") so they
// stay separate from the ticketing tables in the same Supabase project and are
// not exposed through Supabase's public data API.
export const connect = pgSchema("connect");
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Access codes bundled with conference registration
export const accessCodes = connect.table("access_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  maxUses: integer("max_uses").notNull(),
  useCount: integer("use_count").notNull().default(0),
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({
  id: true,
  useCount: true,
});
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;

// Attendees
export const users = connect.table("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  title: text("title").notNull().default(""),
  company: text("company").notNull().default(""),
  bio: text("bio").notNull().default(""),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  tags: text("tags").notNull().default("[]"), // JSON string array
  accessCode: text("access_code").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, passwordHash: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    accessCode: z.string().min(1, "Access code is required"),
    tags: z.array(z.string()).optional().default([]),
  });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Public-safe user shape (no password hash)
export type PublicUser = Omit<User, "passwordHash" | "tags"> & { tags: string[] };

// Connections — private notes owned by the viewer
export const connections = connect.table("connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // owner of the note
  connectedUserId: integer("connected_user_id").notNull(),
  note: text("note").notNull().default(""),
  reminderDate: text("reminder_date"), // nullable ISO date string
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (t) => [uniqueIndex("connections_owner_target_idx").on(t.userId, t.connectedUserId)]);

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;

// Messages
export const messages = connect.table("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  body: text("body").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (t) => [index("messages_sender_idx").on(t.senderId), index("messages_receiver_idx").on(t.receiverId)]);

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Sign-in sessions. Only a SHA-256 hash of the token is stored, so a copy of this
// table cannot be used to sign in as someone.
export const sessions = connect.table("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);
export type Session = typeof sessions.$inferSelect;
