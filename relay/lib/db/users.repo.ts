import { eq } from "drizzle-orm";
import { db } from "./client";
import { users } from "./schema";

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return rows[0] ?? null;
}

/** Idempotent upsert of a credentials user by email — used by the seed script. */
export async function upsertCredentialsUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
}): Promise<void> {
  const email = input.email.toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) {
    await db
      .update(users)
      .set({ name: input.name, passwordHash: input.passwordHash, role: input.role ?? "owner" })
      .where(eq(users.id, existing.id));
    return;
  }
  await db.insert(users).values({
    email,
    name: input.name,
    passwordHash: input.passwordHash,
    role: input.role ?? "owner",
  });
}
