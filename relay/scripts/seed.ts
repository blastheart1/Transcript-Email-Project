/**
 * Idempotent seed for the Relay Neon database.
 *
 * Run:  npm run db:seed
 *       (= node --env-file=.env.local --experimental-strip-types scripts/seed.ts)
 *
 * Seeds: the 3 style samples, the singleton app_settings, a bcrypt credentials
 * user, and the 3 Part-1 email drafts (from the sample voice notes).
 */
import bcrypt from "bcryptjs";
import { STYLE_SAMPLES, SENDER } from "../lib/constants";
import { P1_SEED_NOTES } from "../lib/seedData";
import { upsertStyleSample } from "../lib/db/style-samples.repo";
import { upsertNote } from "../lib/db/notes.repo";
import { upsertCredentialsUser } from "../lib/db/users.repo";
import { getSettings } from "../lib/db/settings.repo";

const SEED_USER_EMAIL = process.env.SEED_USER_EMAIL || "connor@mindmaven.com";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "relay-demo-2026";

async function main() {
  // 1) Style samples (the assignment's Connor references)
  for (let i = 0; i < STYLE_SAMPLES.length; i++) {
    const s = STYLE_SAMPLES[i];
    await upsertStyleSample({ id: `style-${i + 1}`, title: s.title, body: s.body, sort: i + 1 });
  }
  console.log(`✓ ${STYLE_SAMPLES.length} style samples`);

  // 2) Settings singleton (created with defaults if absent)
  await getSettings();
  console.log("✓ app_settings ready");

  // 3) Credentials user (bcrypt)
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 10);
  await upsertCredentialsUser({
    email: SEED_USER_EMAIL,
    name: SENDER.fullName,
    passwordHash,
    role: "owner",
  });
  console.log(`✓ user ${SEED_USER_EMAIL} (password: ${SEED_USER_PASSWORD})`);

  // 4) Part-1 seed notes
  for (const n of P1_SEED_NOTES) {
    await upsertNote(n);
  }
  console.log(`✓ ${P1_SEED_NOTES.length} P1 notes`);

  console.log("\nSeed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
