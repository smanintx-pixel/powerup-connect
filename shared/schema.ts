import { pgSchema, text, integer, bigint, serial, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";

// All companion-app tables live in their own Postgres schema ("connect") so they
// stay separate from the ticketing tables in the same Supabase project and are
// not exposed through Supabase's public data API.
export const connect = pgSchema("connect");
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { CONFERENCE_YEARS, INTEREST_OPTIONS } from "./event";

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
  phone: text("phone").notNull().default(""),
  phoneVisible: boolean("phone_visible").notNull().default(false), // show phone to her connections
  emailVisible: boolean("email_visible").notNull().default(false), // show email to her connections
  interests: text("interests").notNull().default("[]"), // JSON string array, from INTEREST_OPTIONS
  pastYears: text("past_years").notNull().default("[]"), // JSON number array, from CONFERENCE_YEARS
  accessCode: text("access_code").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// Shared rules for the profile extras (used at sign-up and when editing).
export const phoneSchema = z
  .string()
  .trim()
  .max(24, "That phone number is too long")
  .regex(/^[0-9+().\-\s]*$/, "Use digits, spaces and + ( ) - . only")
  .refine((v) => v === "" || v.replace(/\D/g, "").length >= 7, "Enter a full phone number");
export const interestsSchema = z
  .array(z.enum(INTEREST_OPTIONS))
  .max(INTEREST_OPTIONS.length)
  .transform((v) => Array.from(new Set(v)));
export const pastYearsSchema = z
  .array(z.number().int())
  .max(CONFERENCE_YEARS.length)
  .refine((v) => v.every((y) => (CONFERENCE_YEARS as readonly number[]).includes(y)), "Pick from the listed conference years")
  .transform((v) => Array.from(new Set(v)).sort((a, b) => a - b));

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, passwordHash: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    accessCode: z.string().min(1, "Access code is required"),
    tags: z.array(z.string()).optional().default([]),
    phone: phoneSchema.optional().default(""),
    phoneVisible: z.boolean().optional().default(false),
    emailVisible: z.boolean().optional().default(false),
    interests: interestsSchema.optional().default([]),
    pastYears: pastYearsSchema.optional().default([]),
  });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Public-safe user shape (no password hash; JSON columns decoded)
export type PublicUser = Omit<User, "passwordHash" | "tags" | "interests" | "pastYears"> & {
  tags: string[];
  interests: string[];
  pastYears: number[];
};

// Profile photos. The browser resizes a photo before upload, so each row is
// small. The key is random and is the only thing that appears in the photo's
// address, so an address cannot be guessed from a user id.
export const userPhotos = connect.table("user_photos", {
  key: text("key").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  mime: text("mime").notNull(),
  data: text("data").notNull(), // base64
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type UserPhoto = typeof userPhotos.$inferSelect;

// Connection requests. One row per direction: "from" asked "to". Two women are
// connected once a row between them is accepted. A declined request stays on
// file so the same person cannot keep asking.
export const REQUEST_STATUSES = ["pending", "accepted", "declined"] as const;
export const connectionRequests = connect.table("connection_requests", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  status: text("status").notNull().default("pending"), // one of REQUEST_STATUSES
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  respondedAt: bigint("responded_at", { mode: "number" }),
}, (t) => [
  uniqueIndex("connection_requests_pair_idx").on(t.fromUserId, t.toUserId),
  index("connection_requests_to_idx").on(t.toUserId, t.status),
]);
export type ConnectionRequest = typeof connectionRequests.$inferSelect;

/**
 * How the signed-in woman stands with another attendee.
 * "outgoing" also covers a request the other woman declined: the sender is
 * never told she was turned down.
 */
export type Relation = "none" | "outgoing" | "incoming" | "connected";

// Private notes and follow-up date, owned by the viewer, about a connection
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

// One row per call an attendee starts with the AI host, to cap calls per person.
export const hostCalls = connect.table("host_calls", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (t) => [index("host_calls_user_idx").on(t.userId, t.createdAt)]);

// A business in the Black-owned business directory (shared/businesses.json,
// built from data/black-owned-businesses-nova.md by scripts/import-businesses.mjs).
export type Business = {
  slug: string;
  name: string;
  type: string;
  category: string;
  area: string; // "" when the list gives no county or city section
  city: string;
  specialty: string;
  owner: string;
  address: string;
  addressNote: string;
  phone: string;
  email: string; // only where the business publishes one itself
  website: string;
  needsCheck: string; // non-empty = flagged in the list; hidden in the app
};

// Businesses an attendee saved for later.
export const businessSaves = connect.table("business_saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  slug: text("slug").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
}, (t) => [uniqueIndex("business_saves_user_slug_idx").on(t.userId, t.slug)]);

// Sign-in sessions. Only a SHA-256 hash of the token is stored, so a copy of this
// table cannot be used to sign in as someone.
export const sessions = connect.table("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);
export type Session = typeof sessions.$inferSelect;

// Conference sessions shown on the Sessions page. Named event_sessions so it
// is not confused with the sign-in "sessions" table above.
export const eventSessions = connect.table("event_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  presenter: text("presenter").notNull().default(""),
  track: text("track").notNull().default(""), // e.g. "Workshop", "Reception"
  timeLabel: text("time_label").notNull().default(""), // free text, e.g. "12:00 to 4:00"
  description: text("description").notNull().default(""),
  recordingUrl: text("recording_url").notNull().default(""), // empty until the recording is posted
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
export type EventSession = typeof eventSessions.$inferSelect;

// Slides, handouts and guides that go with a session. Each one is a link.
export const MATERIAL_KINDS = ["slides", "handout", "guide", "link"] as const;
export const sessionMaterials = connect.table("session_materials", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("handout"), // one of MATERIAL_KINDS
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [index("session_materials_session_idx").on(t.sessionId)]);
export type SessionMaterial = typeof sessionMaterials.$inferSelect;

export type SessionWithMaterials = EventSession & { materials: SessionMaterial[] };
