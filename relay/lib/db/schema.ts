import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import type {
  TranscriptSegment,
  BodySegment,
  Assumption,
  NoteStatus,
  NoteType,
} from "../types";

// ---- Auth.js (NextAuth) adapter tables ----

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // app extensions
  passwordHash: text("passwordHash"),
  role: text("role").default("user").notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---- App tables ----

export const notes = pgTable("notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  person: text("person").notNull().default(""),
  type: text("type").$type<NoteType>().notNull().default("Note"),
  subject: text("subject").notNull().default(""),
  status: text("status").$type<NoteStatus>().notNull().default("ready"),
  receivedLabel: text("received_label").notNull().default("Just now"),
  duration: text("duration").notNull().default("—"),
  transcript: text("transcript").notNull().default(""),
  toEmail: text("to_email").notNull().default(""),
  cc: text("cc").notNull().default(""),
  bcc: text("bcc").notNull().default(""),
  audioUrl: text("audio_url"),
  tone: text("tone"),
  length: text("length"),
  model: text("model"),
  provider: text("provider"),
  source: text("source").notNull().default("upload"),
  errorMessage: text("error_message"),
  segments: jsonb("segments").$type<TranscriptSegment[]>().notNull().default([]),
  paragraphs: jsonb("paragraphs").$type<BodySegment[][]>().notNull().default([]),
  assumptions: jsonb("assumptions").$type<Assumption[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const styleSamples = pgTable("style_samples", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  body: text("body").notNull(),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("singleton"),
  defaultSignoff: text("default_signoff").notNull().default("Thanks,\nConnor"),
  defaultTone: text("default_tone").notNull().default("Warm"),
  senderEmail: text("sender_email").notNull().default("connor@mindmaven.com"),
  webhookEnabled: boolean("webhook_enabled").notNull().default(true),
  webhookSecret: text("webhook_secret"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NoteRow = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;
export type StyleSampleRow = typeof styleSamples.$inferSelect;
export type AppSettingsRow = typeof appSettings.$inferSelect;
