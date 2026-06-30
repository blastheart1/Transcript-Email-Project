#!/usr/bin/env node
/**
 * Real end-to-end route test: uploads the provided sample voice notes to the
 * running app's /api/transcribe and /api/draft endpoints and validates the
 * output shape and that the guardrails held.
 *
 * Usage:  npm run dev   (in another terminal)
 *         npm run test:real
 *
 * Env:    RELAY_URL  (default http://localhost:3000)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, basename } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.RELAY_URL || "http://localhost:8882";
const SAMPLE_DIR = resolve(__dirname, "../../Resources/Sample Voicenotes");
const FILES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["Email_Dictation_1.m4a", "Email_Dictation_2.m4a", "Email_Dictation_3.m4a"];

const ok = (c, m) => console.log(`  ${c ? "✓" : "✗"} ${m}`);
let failures = 0;
const assert = (cond, msg) => {
  ok(cond, msg);
  if (!cond) failures++;
};

async function reachable() {
  try {
    const r = await fetch(`${BASE}/api/providers`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function transcribe(path) {
  const buf = readFileSync(path);
  const fd = new FormData();
  fd.append("audio", new Blob([buf], { type: "audio/m4a" }), basename(path));
  const r = await fetch(`${BASE}/api/transcribe`, { method: "POST", body: fd });
  const json = await r.json();
  if (!r.ok) throw new Error(`transcribe ${r.status}: ${json.error || "unknown"}`);
  return json;
}

async function draft(transcript, segments) {
  const r = await fetch(`${BASE}/api/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      segments,
      tone: "Warm",
      length: "Standard",
      styleSamples: [],
      signOff: "Thanks,\nConnor",
      senderName: "Connor",
      model: "gpt-4o",
    }),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(`draft ${r.status}: ${json.error || "unknown"}`);
  return json;
}

function flatBody(d) {
  return d.paragraphs.map((p) => p.map((s) => s.t).join("")).join("\n\n");
}

async function run() {
  console.log(`Relay real-route test → ${BASE}\n`);
  const providers = await reachable();
  if (!providers) {
    console.error("✗ App not reachable. Start it first:  npm run dev");
    process.exit(1);
  }
  if (!providers.openai && !providers.anthropic) {
    console.error("✗ No drafting provider configured (set OPENAI_API_KEY in .env.local).");
    process.exit(1);
  }
  console.log(`Providers: openai=${providers.openai} anthropic=${providers.anthropic}\n`);

  for (const f of FILES) {
    const path = resolve(SAMPLE_DIR, f);
    console.log(`▶ ${f}`);
    if (!existsSync(path)) {
      assert(false, `file exists at ${path}`);
      continue;
    }
    try {
      const t = await transcribe(path);
      assert(typeof t.transcript === "string" && t.transcript.length > 0, "transcript is non-empty");
      assert(Array.isArray(t.segments), "segments is an array");
      assert(/^\d+:\d{2}$/.test(t.duration || ""), `duration formatted (${t.duration})`);
      console.log(`     transcript: "${t.transcript.slice(0, 80).replace(/\n/g, " ")}…"`);

      const d = await draft(t.transcript, t.segments);
      assert(Array.isArray(d.paragraphs) && d.paragraphs.length > 0, "draft has paragraphs");
      assert(typeof d.subject === "string" && d.subject.length > 0, `subject present ("${d.subject}")`);
      assert(["Follow-up", "Intro", "Reply", "Note"].includes(d.type), `type classified (${d.type})`);
      const body = flatBody(d);
      assert(/thanks,?\s*\n?connor/i.test(body), "sign-off present (Thanks, Connor)");
      const flaggedRuns = d.paragraphs.flat().filter((s) => s.flagged).length;
      console.log(`     provider=${d.provider} model=${d.model} type=${d.type} flagged-spans=${flaggedRuns} flagged-assumptions=${d.assumptions.filter((a) => a.flagged).length}`);
    } catch (err) {
      assert(false, `pipeline error: ${err.message}`);
    }
    console.log("");
  }

  console.log(failures === 0 ? "All real-route checks passed ✓" : `${failures} check(s) failed ✗`);
  process.exit(failures === 0 ? 0 : 1);
}

run();
