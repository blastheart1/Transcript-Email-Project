# MindMaven Trial Project — Relay

**Relay** turns a spoken voice note into a polished, ready-to-send email written in
your own voice — with strict guardrails so it never invents facts and flags every
guess for your review.

## Repository layout

```
TrialProject/                 ← repo root
├── README.md                 ← you are here
├── .gitignore                ← root ignores (OS junk, secrets, Resources/)
├── relay/                    ← the Next.js application (see relay/README.md)
│   ├── app/                  ← App Router pages + API routes
│   ├── components/           ← React UI components
│   ├── lib/                  ← types, prompts, OpenAI helpers, state
│   ├── public/               ← static assets
│   └── package.json
└── Resources/                ← provided reference material (git-ignored)
    └── Sample Voicenotes/     ← Email_Dictation_1..3.m4a — local test audio
```

### Why `Resources/` is git-ignored

It holds the provided sample recordings (large binary `.m4a` files) and design
exports. They're inputs for local testing, not application source, so they stay out
of version control. Keep them locally to test the upload → transcribe → draft flow.

## Getting started

```bash
cd relay
cp .env.example .env.local      # then add your OPENAI_API_KEY
npm install
npm run dev                     # http://localhost:8882
```

See [`relay/README.md`](relay/README.md) for the full app documentation, architecture,
and the drafting guardrails.
