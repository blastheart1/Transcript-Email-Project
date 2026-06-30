# Relay

**Voice notes → polished email.** Speak a quick note; Relay transcribes it and drafts
a send-ready email *in your own voice* — then gets out of the way so you review and send.

Built from the Relay design prototype as a full **Next.js (App Router) + TypeScript +
Tailwind** application with a real capture → transcribe → draft → review → send pipeline.

---

## Quick start

```bash
cp .env.example .env.local      # add your OPENAI_API_KEY
npm install
npm run dev                     # http://localhost:8882
```

One `OPENAI_API_KEY` powers both steps:

| Step          | Default model        | Override env              | Notes                                   |
| ------------- | -------------------- | ------------------------- | --------------------------------------- |
| Transcription | `whisper-1`          | `OPENAI_TRANSCRIBE_MODEL` | OpenAI only — no Anthropic equivalent   |
| Drafting      | `gpt-4o`             | `OPENAI_DRAFT_MODEL`      | user-selectable in the UI (see below)   |
| Drafting (fallback) | `claude-sonnet-4-6` | `ANTHROPIC_DRAFT_MODEL` | used if OpenAI fails / key absent (set `ANTHROPIC_API_KEY`) |

Without a key the UI still runs fully on the seeded demo notes; only live
transcription/drafting needs the key (errors surface as a toast, never a crash).

### Choosing a model

The Draft review screen has a **Model** dropdown (OpenAI + Anthropic). Switching
re-drafts the current note with that model. `/api/providers` reports which keys are
configured so unavailable models are clearly disabled. Whichever model is chosen,
**drafting falls back to the other provider** if the first fails.

### Try it with the sample notes

The provided recordings live in `../Resources/Sample Voicenotes/`
(`Email_Dictation_1..3.m4a`). With a key set, go to **New capture → Upload**, pick one,
and watch it transcribe and draft. You can also **drag the file anywhere** on the page.

---

## How it works

```
Capture (record / upload / drag-drop)
   │  audio Blob
   ▼
POST /api/transcribe   → Whisper (verbose_json) → transcript + timestamped segments
   │
   ▼
POST /api/draft        → GPT (JSON-schema structured output)
   │                     • writes ONLY in Connor's voice (style samples)
   │                     • flags every inferred span + lists assumptions
   ▼
Draft review           → transcript ‖ email, tone/length controls, inline edit
   │
   ▼
Copy  /  Open in email (mailto)   ← you always send, never the AI
```

### The guardrails are the product

Relay's value is *trust*. The drafting prompt enforces seven always-on rules (see
`lib/constants.ts` → `GUARDRAILS`), the most important being **never invent facts**.
When the speaker is vague ("3pm eastern", "the founder thing", a video with no URL),
Relay resolves it for readability **but marks that span** `flagged` with a tip, surfaces
it under *"What Relay changed & assumed,"* and leaves a missing recipient address blank.
Those highlights are the reviewer's checklist.

### Send-ready HTML email + preview

The Draft review's email card toggles between **Review** (plain text with the
guardrail highlights) and **Email** — a live preview of the actual HTML message that
will be sent, rendered in a sandboxed iframe. The template (`lib/emailHtml.ts`) is
**Gmail-first and Outlook-safe**: table-based layout, inline styles only, an MSO
conditional ghost wrapper, a web-safe font stack, and Relay's teal accent + signature
block. **Copy HTML** puts both `text/html` and `text/plain` on the clipboard so it
pastes formatted straight into a Gmail/Outlook compose window. (Review highlights are
never included in the sent email.)

---

## Project structure

```
relay/
├── app/
│   ├── layout.tsx              # root layout, Public Sans via next/font
│   ├── page.tsx                # mounts RelayProvider + Shell
│   ├── globals.css             # base resets, tooltip, responsive sidebar
│   └── api/
│       ├── transcribe/route.ts # Whisper → transcript + segments
│       ├── draft/route.ts      # structured-output drafting (provider-agnostic)
│       └── providers/route.ts  # which provider keys are configured
├── components/                 # Shell, Sidebar, Header, one file per screen, ModelPicker
│   ├── InboxView · CaptureView · DraftView · SettingsView
│   ├── QuickStartGuide · DragOverlay · Toast · icons
├── lib/
│   ├── types.ts                # shared domain + API types
│   ├── constants.ts            # persona, guardrails, style samples, sign-off
│   ├── prompts.ts              # drafting system prompt + JSON schema
│   ├── draftEngine.ts          # OpenAI-primary + Anthropic-fallback drafting
│   ├── openai.ts · anthropic.ts# server-only provider clients + model config
│   ├── models.ts               # selectable model catalog (client-safe)
│   ├── emailHtml.ts            # Gmail-first / Outlook-safe HTML email builder
│   ├── store.tsx               # React context + reducer, async pipeline, persistence
│   ├── useRecorder.ts          # cross-browser MediaRecorder + live level meter
│   ├── useTooltips.ts          # global data-tip tooltips
│   ├── status.ts · format.ts   # status mapping, body/mailto/clock helpers
│   └── seed.ts                 # demo inbox (worked guardrail examples)
├── tests/                      # vitest unit tests
├── scripts/test-real-route.mjs # end-to-end route test against the sample audio
└── …config (tailwind, tsconfig, next, postcss, vitest)
```

### Notes on the implementation

- **State**: a single `RelayProvider` (Context + `useReducer`) owns notes and view
  state; the inbox persists to `localStorage` so uploads survive a reload.
- **Recording** is real and cross-browser (Chrome/Firefox/Edge → WebM/Opus,
  Safari → MP4/AAC) with a live Web-Audio level meter.
- **Server-only secrets**: the OpenAI SDK is imported only in API routes; the client
  talks to `/api/*` and never sees the key.
- **Webhook** capture is intentionally left as "Coming soon," matching the prototype.

## Scripts & testing

```bash
npm run dev        # local dev
npm run build      # production build (also type-checks + lints)
npm run start      # serve the production build
npm run lint       # eslint
npm test           # vitest unit tests (format, prompts, email HTML, draft engine, models)
npm run test:real  # END-TO-END: uploads Resources/Sample Voicenotes/*.m4a to the
                   # running app and validates transcribe → draft + guardrails
```

The validation loop for any pipeline change is **build → `npm test` → `npm run test:real`**.
`test:real` needs the app running (`npm run dev`) and a key in `.env.local`; it exercises
the real Whisper + drafting routes against the three provided sample recordings and checks
the output shape, type classification, sign-off, and that no recipient address is fabricated.

## Deploy

Deploys to Vercel as-is. Set `OPENAI_API_KEY` (and optional model overrides) as an
environment variable in the project settings.
