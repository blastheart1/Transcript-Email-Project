import type { Metadata } from "next";
import Link from "next/link";
import {
  MicIcon,
  FileIcon,
  MailIcon,
  ShieldIcon,
  RefreshIcon,
  BookmarkIcon,
  EditIcon,
  SendIcon,
  UploadIcon,
  PhoneIcon,
  SettingsIcon,
  InfoIcon,
  AlertIcon,
  CheckIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Relay — Automation flow",
  description: "How Relay turns a voice note into a ready-to-send email, end to end.",
  robots: { index: false, follow: false }, // unlisted — reachable only by link
};

type IconType = typeof MicIcon;

const STEPS: { n: number; title: string; desc: string; Icon: IconType }[] = [
  {
    n: 1,
    title: "Capture",
    desc: "An executive records or drops in a voice note — in-app mic, file upload (incl. an iPhone Voice Memo), drag-and-drop, or a POST to the webhook from any tool.",
    Icon: MicIcon,
  },
  {
    n: 2,
    title: "Transcribe",
    desc: "OpenAI Whisper turns the audio into text with timestamped segments (forced to English). The transcript becomes the single source of truth.",
    Icon: FileIcon,
  },
  {
    n: 3,
    title: "Draft",
    desc: "GPT-5.4 writes the email as structured JSON, in the executive's voice (learned only from saved style samples), with every inferred span marked as a flagged guess.",
    Icon: MailIcon,
  },
  {
    n: 4,
    title: "Audit (cross-model)",
    desc: "An independent model — Claude — checks the draft against the transcript, plus a deterministic scan for invented emails, links, phones, and amounts.",
    Icon: ShieldIcon,
  },
  {
    n: 5,
    title: "Reprocess if needed",
    desc: "Any fabrication triggers a stricter re-draft that targets the exact findings, then re-audits — up to 3 passes. If it still can't clear, the note is held for review with an honest disclaimer.",
    Icon: RefreshIcon,
  },
  {
    n: 6,
    title: "Persist",
    desc: "The draft and its audit verdict are saved to Postgres (Neon) with a status of ready or needs-review, so it appears in the Inbox — even for webhook-ingested notes.",
    Icon: BookmarkIcon,
  },
  {
    n: 7,
    title: "Review",
    desc: "The reviewer sees the transcript beside the email, with guesses highlighted and a faithfulness panel. They can adjust tone, length, or model and Redraft.",
    Icon: EditIcon,
  },
  {
    n: 8,
    title: "Send — always by a human",
    desc: "Copy, copy the Gmail-ready HTML, or open it in an email client. Relay never sends on its own; the final send is always a human decision.",
    Icon: SendIcon,
  },
];

const SOURCES: { title: string; desc: string; Icon: IconType }[] = [
  { title: "Record", desc: "Capture a note right in the browser (Chrome/Firefox/Edge/Safari).", Icon: MicIcon },
  { title: "Upload — iPhone", desc: "Pick a Voice Memo or audio file from the phone's Files browser.", Icon: PhoneIcon },
  { title: "Drag & drop", desc: "Drop an audio file anywhere on the page to draft it.", Icon: UploadIcon },
  { title: "Webhook", desc: "POST audio to /api/ingest from Zapier, Make, n8n, or a script.", Icon: SettingsIcon },
];

const DECISIONS: { title: string; body: string; Icon: IconType }[] = [
  {
    title: "Model choice — and why",
    body: "Whisper for transcription; GPT-5.4 for the first draft (strong instruction-following + structured output, so fewer retries); Claude as both the automatic fallback and the independent auditor. Using two providers on purpose means the checker rarely shares the writer's blind spots. The model is switchable per note in the UI.",
    Icon: InfoIcon,
  },
  {
    title: "Prompt design decision",
    body: "The draft is returned as structured JSON where every inferred span is marked flagged with a “confirm this” tip, and the prompt states the voice note is the ONLY source of truth. That single decision is what makes “flag every guess” enforceable and reviewable instead of hoping the prose behaves.",
    Icon: FileIcon,
  },
  {
    title: "Keeping it on-voice",
    body: "Relay imitates only the executive's saved style samples (real sent emails) — not generic “professional email” patterns. Samples are editable and stored per workspace, and the auditor scores how well each draft matches that voice.",
    Icon: CheckIcon,
  },
  {
    title: "When the AI gets it wrong",
    body: "Layered defense: prompt rules → deterministic fact-check → cross-model audit → reprocess up to 3× to clear fabrications → if it still can't, hold as “Needs review” with an honest disclaimer about whether the source note is the likely limiter. Missing details are left blank, never invented.",
    Icon: AlertIcon,
  },
];

const IDEAS: { group: string; items: string[] }[] = [
  {
    group: "More triggers (same endpoint)",
    items: [
      "Zapier / Make / n8n: Google Drive “New file in folder” → POST { audioUrl } to /api/ingest.",
      "Native Google Drive / Gmail push (watch + Pub/Sub) to remove the Zapier dependency.",
      "Recorder apps (Otter, Fathom, Voice Memos), Twilio voicemail, or a Telegram/WhatsApp voice bot.",
      "Email-in: a dedicated inbound address that drafts any forwarded voice memo.",
    ],
  },
  {
    group: "Scheduled jobs & scripts (cron)",
    items: [
      "Poll a Drive/Dropbox folder every few minutes as a robust fallback trigger.",
      "Recovery cron to re-drive notes stuck transcribing or errored.",
      "Daily digest nudging any unsent “ready” drafts; weekly style-profile refresh from recently sent mail.",
      "A local folder-watcher / CLI that POSTs any new recording for a desktop dictation flow.",
    ],
  },
  {
    group: "Production hardening",
    items: [
      "Async ingest (queue) + idempotency keys + HMAC-signed webhooks; audit log + dead-letter.",
      "Gmail “Create Draft” so the finished email lands in the real Drafts folder, formatted.",
      "Recipient auto-fill from Google Contacts / HubSpot instead of leaving the To field blank.",
      "Push updates (LISTEN/NOTIFY or realtime) instead of polling; golden-output eval harness; cost-based model routing.",
    ],
  },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
        <MicIcon size={16} strokeWidth={2} className="text-white" />
      </span>
      <div className="leading-none">
        <div className="text-[15px] font-bold tracking-[-.2px]">Relay</div>
        <div className="mt-0.5 text-[11px] font-medium text-muted">Voice notes → email</div>
      </div>
    </div>
  );
}

export default function AutomationFlowPage() {
  return (
    <main className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[940px] items-center justify-between px-5 py-3">
          <Brand />
          <Link
            href="/"
            className="rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-600"
          >
            Open the app →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[940px] px-5 pb-20 pt-10 md:pt-14">
        {/* Hero */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.6px] text-primary">
            Unlisted · shareable by link
          </span>
          <h1 className="mt-4 text-[30px] font-bold leading-tight tracking-[-.4px] md:text-[36px]">
            Automation flow
          </h1>
          <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-slate-500">
            How Relay takes an executive's spoken voice note and turns it into a polished,
            ready-to-send email — end to end, with guardrails that keep it factual and a human
            always in the loop.
          </p>
        </div>

        {/* Summary */}
        <section className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { k: "The job", v: "Voice note → ready-to-send email, in the executive's own voice." },
            { k: "The principle", v: "Never invent facts. Flag every guess. Never auto-send." },
            { k: "The build", v: "Whisper + GPT-5.4 draft + Claude cross-model audit, on one endpoint." },
          ].map((c) => (
            <div key={c.k} className="rounded-[14px] border border-line bg-white p-5">
              <div className="text-[11px] font-bold uppercase tracking-[.6px] text-muted">{c.k}</div>
              <div className="mt-2 text-[14px] font-semibold leading-snug text-ink-2">{c.v}</div>
            </div>
          ))}
        </section>

        {/* End-to-end steps */}
        <section className="mb-12">
          <h2 className="mb-1 text-[18px] font-bold">End-to-end flow</h2>
          <p className="mb-5 text-[13.5px] text-slate-400">
            The same pipeline runs whether a note is recorded, uploaded, or posted in via webhook.
          </p>
          <ol className="flex flex-col gap-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-[14px] border border-line bg-white p-4 md:p-5">
                <div className="flex flex-none flex-col items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-tint text-primary">
                    <s.Icon size={18} />
                  </span>
                  {s.n < STEPS.length && <span className="w-px flex-1 bg-line" />}
                </div>
                <div className="pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-faint">STEP {s.n}</span>
                    <h3 className="text-[15px] font-bold">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Capture sources */}
        <section className="mb-12">
          <h2 className="mb-1 text-[18px] font-bold">Capture sources</h2>
          <p className="mb-5 text-[13.5px] text-slate-400">Four ways in — every one feeds the same pipeline.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {SOURCES.map((s) => (
              <div key={s.title} className="flex items-start gap-3 rounded-[14px] border border-line bg-white p-4">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-tint text-primary">
                  <s.Icon size={18} />
                </span>
                <div>
                  <div className="text-[14px] font-bold">{s.title}</div>
                  <div className="mt-0.5 text-[13px] leading-snug text-slate-500">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI decisions */}
        <section className="mb-12">
          <h2 className="mb-1 text-[18px] font-bold">The AI, designed with intention</h2>
          <p className="mb-5 text-[13.5px] text-slate-400">
            Model choices, the one prompt decision that matters, and what happens when the AI is wrong.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {DECISIONS.map((d) => (
              <div key={d.title} className="rounded-[14px] border border-line bg-white p-5">
                <div className="mb-2 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-tint text-primary">
                    <d.Icon size={16} />
                  </span>
                  <h3 className="text-[14.5px] font-bold">{d.title}</h3>
                </div>
                <p className="text-[13.5px] leading-relaxed text-slate-500">{d.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Guardrail callout */}
        <section className="mb-12 rounded-[14px] border border-success/30 bg-success-bg/60 p-5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldIcon size={18} className="text-success" />
            <h2 className="text-[16px] font-bold text-success">The guardrail, in one line</h2>
          </div>
          <p className="text-[14px] leading-relaxed text-slate-600">
            Prompt rules → deterministic fact-check → independent cross-model audit → reprocess up to
            3× to clear any fabrication → if it still can't, hold as <strong>Needs review</strong> and
            say honestly whether the source note is the limiter. Inferred spans are always highlighted;
            missing details are left blank, never invented.
          </p>
        </section>

        {/* Automation ideas / roadmap */}
        <section className="mb-10">
          <h2 className="mb-1 text-[18px] font-bold">Automation ideas &amp; roadmap</h2>
          <p className="mb-5 text-[13.5px] text-slate-400">
            The pipeline is source-agnostic, so new triggers are just new front doors.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {IDEAS.map((col) => (
              <div key={col.group} className="rounded-[14px] border border-line bg-white p-5">
                <h3 className="mb-3 text-[13.5px] font-bold">{col.group}</h3>
                <ul className="flex list-none flex-col gap-2.5 p-0">
                  {col.items.map((it, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-snug text-slate-500">
                      <CheckIcon size={14} strokeWidth={2.5} className="mt-0.5 flex-none text-success" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-line pt-6 text-[12.5px] text-faint">
          Relay · voice notes → email. This page is unlisted and shared by link.
        </footer>
      </div>
    </main>
  );
}
