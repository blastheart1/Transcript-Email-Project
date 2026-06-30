import { eq } from "drizzle-orm";
import { db } from "./client";
import { appSettings, type AppSettingsRow } from "./schema";

const SINGLETON = "singleton";

export type AppSettings = Omit<AppSettingsRow, "id" | "updatedAt">;

/** Read the singleton settings row, creating it with defaults if missing. */
export async function getSettings(): Promise<AppSettingsRow> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.id, SINGLETON)).limit(1);
  if (rows[0]) return rows[0];
  const [created] = await db.insert(appSettings).values({ id: SINGLETON }).returning();
  return created;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettingsRow> {
  await getSettings(); // ensure row exists
  const [row] = await db
    .update(appSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(appSettings.id, SINGLETON))
    .returning();
  return row;
}

/** Public-safe view (never leaks the raw secret). */
export function toPublicSettings(row: AppSettingsRow) {
  return {
    defaultSignoff: row.defaultSignoff,
    defaultTone: row.defaultTone,
    senderEmail: row.senderEmail,
    webhookEnabled: row.webhookEnabled,
    webhookSecretSet: !!row.webhookSecret,
  };
}
