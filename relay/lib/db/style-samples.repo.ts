import { asc, eq } from "drizzle-orm";
import { db } from "./client";
import { styleSamples, type StyleSampleRow } from "./schema";
import type { StyleSampleRecord } from "../types";

function rowTo(r: StyleSampleRow): StyleSampleRecord {
  return { id: r.id, title: r.title, body: r.body };
}

export async function listStyleSamples(): Promise<StyleSampleRecord[]> {
  const rows = await db.select().from(styleSamples).orderBy(asc(styleSamples.sort), asc(styleSamples.createdAt));
  return rows.map(rowTo);
}

export async function createStyleSample(input: { title: string; body: string; sort?: number }): Promise<StyleSampleRecord> {
  const [row] = await db
    .insert(styleSamples)
    .values({ title: input.title, body: input.body, sort: input.sort ?? 100 })
    .returning();
  return rowTo(row);
}

export async function deleteStyleSample(id: string): Promise<void> {
  await db.delete(styleSamples).where(eq(styleSamples.id, id));
}

/** Idempotent upsert by id — used by the seed script. */
export async function upsertStyleSample(input: { id: string; title: string; body: string; sort: number }): Promise<void> {
  await db
    .insert(styleSamples)
    .values(input)
    .onConflictDoUpdate({
      target: styleSamples.id,
      set: { title: input.title, body: input.body, sort: input.sort },
    });
}
