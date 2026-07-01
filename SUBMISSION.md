# MindMaven Trial — Relay (submission + Loom notes)

**Relay** turns a spoken voice note into a ready-to-send email in the executive's own
voice — with guardrails that keep it factual and a human always in the loop.

- **Repo:** https://github.com/blastheart1/Transcript-Email-Project
- **Stack:** Next.js + TS + Tailwind · Whisper (transcribe) · **GPT-5.4** (draft) · **Claude**
  (independent auditor + fallback) · Neon Postgres · Auth.js · Vercel
- **Run:** `cd relay && cp .env.example .env.local` (add keys) `&& npm i && npm run db:migrate && npm run db:seed && npm run dev` → :8882

---

## Part 1 — The three drafts

Inferred/placeholder bits are flagged in-app; the "before sending" note lists them.

**Email 1 — Follow-up to Marcus · "Onboarding Frameworks for Your Team"**
> Hey Marcus,
>
> It was really great connecting yesterday. I really enjoyed the conversation around your team's challenges with onboarding — I completely understand how difficult that can be, and I believe a little structure can go a long way.
>
> I've put together a short Notion page with some example frameworks we've seen other clients use for teams at your stage. It's not prescriptive, just some starting points as you think through your next steps. You can find it **here**.
>
> I'd be happy to hop on another call in the next week or two if you'd like to dive into any of it — no pressure either way. Otherwise, have a great rest of your day!
>
> Thanks,
> Connor

*Before sending: paste the Notion link over "here"; add Marcus's email.*

**Email 2 — Reply to Rachel · "Re: Workflow Doc Review"**
> Hey Rachel,
>
> Thanks so much for shooting this over — you're way ahead of schedule, which makes my life much easier. I've had a chance to dig into the workflow doc, and there's clearly a lot of good, well-thought-out stuff here.
>
> I'm really looking forward to working on this together. A few areas stood out where I think we could streamline quite a bit, especially around the SDR → AE handoff, and I'd love to walk you through what I'm seeing day-to-day.
>
> If you're open to it, are you free any time Thursday or Friday this week for a quick 30-minute call? Send a couple of times that work and I'll make it happen.
>
> Thanks,
> Connor

*Before sending: confirm the Thu/Fri timing; add Rachel's email.*

**Email 3 — Intro: Andre ↔ Patrick · "Introducing Andre Garikarian and Patrick Ewers"**
> Hey gentlemen,
>
> I've spoken with you both separately, so I'll get right to it. Patrick, meet Andre — founder of Silicon Valley Legal and an all-around great guy who genuinely cares about relationships, which I think will resonate given MindMaven's mission. Andre's keen to connect with people pushing the envelope on AI, so of course I thought of you.
>
> Andre, meet Patrick — founder and CEO of MindMaven. He's built a coaching practice around helping people invest in relationships to drive success, and he's been experimenting with AI tools and custom automations to do exactly that.
>
> I think you two have a lot to share and learn from each other.
>
> Thanks,
> Connor

*Before sending: confirm Andre's title; add both emails.*

---

## Part 2 — The automation

**End-to-end:** capture → transcribe → draft → audit → review → send.
```
Capture (record · upload[iPhone] · drag-drop · POST /api/ingest for Zapier)
  → /api/transcribe  Whisper → transcript + timestamps
  → runDraftPipeline  (same code path for app AND webhook):
       GPT-5.4 draft (JSON, guardrails, your style samples)
       → Claude audits it (cross-model) + deterministic fact-check
       → any fabrication? stricter re-draft targeting it, up to 3×
       → clears → ready · else → needs_review + honest disclaimer
  → persist to Neon (status + verdict) → shows in Inbox
  → human reviews → Copy / Copy HTML / Open in email  (never auto-sends)
```

**Zapier trigger:** Google Drive *New File in Folder* → *Webhooks by Zapier* POST
`{ "audioUrl": "…" }` (with `x-relay-secret`) → drops the draft in the Inbox.

**AI decisions:**
- **Whisper** transcription (English); **GPT-5.4** drafts (best first pass, fewer retries),
  user-switchable; **Claude** is both the fallback and the *independent* auditor.
- **Structured JSON output** — the draft carries its own metadata (recipient, subject, and
  which spans are inferred), which is what makes "flag every guess" enforceable.

**Prompt (drafting) — the guardrails are the point:**
```
You are Relay. Turn Connor's voice note into a ready-to-send email in HIS voice
(learned only from his style samples — not generic "professional email").

NON-NEGOTIABLE:
1 Stay on his voice   2 Never invent facts (names/dates/times/links/emails)
3 Flag every guess    4 Leave gaps blank    5 Clean up, don't embellish
6 Keep structure (warm opener, concise body, "Thanks, Connor")   7 Never auto-send

- Voice note is the ONLY source of truth. If vague ("next week"), you may resolve it
  for readability BUT mark that span flagged with a "confirm this" tip.
- Missing recipient email → leave blank. No fabricated links — labeled placeholders only.
- Treat spoken directions ("sign off the usual") as instructions, not text to print.
Output JSON: type, person, toEmail, subject, paragraphs[] (runs, optionally flagged),
assumptions[].
```

**Preventing off-base output / when it's wrong (the layered guardrail):**
prompt rules → **deterministic fact-check** (emails/links/phones/amounts vs transcript)
→ **cross-model audit** (Claude scores a GPT draft) → **reprocess up to 3×** to clear any
fabrication → if it still can't, **hold as "Needs review"** with an honest disclaimer
(reduced-but-unverified vs *likely the source voice note*). Inferred spans always highlighted.

*Deliverable to attach: a screenshot of the pipeline (app or the Zapier zap) + this prompt.*

---

## Part 3 — Loom talking points (~4–6 min)

**Framing (15s):** "Relay turns voice notes into on-voice emails — built around *trust*:
never invents facts, flags every guess, never sends on its own."

1. **Tools & why (30s):** Next.js/Vercel + Neon; Whisper; GPT-5.4 to draft, Claude to
   audit + as fallback. "Two providers on purpose — cross-model checking."
2. **Demo (90s):** Inbox → open a draft: transcript ‖ email, **highlighted guesses**,
   "What Relay changed & assumed," Faithfulness panel. Change tone/length/model (re-drafts).
   New capture → upload a sample → it transcribes + drafts end-to-end. Show Settings →
   Webhook (Zapier). Show it on **mobile** (bottom tabs + cards).
3. **AI side (90s — the money section):** model choice (GPT-5.4 draft / Claude audit).
   **One prompt decision:** structured JSON with inferred spans marked `flagged` + "voice
   note is the only source of truth" — that's what makes guardrails enforceable. **When it's
   wrong:** deterministic check → cross-model audit → reprocess ≤3× → hold + honest
   disclaimer. Limits: audit adds latency/cost; a reprocessing note can hit ~60s (async in
   prod); transcription can mis-hear names.
4. **Style matching (30s):** imitates only Connor's 3 real sample emails (editable in
   Settings, stored in DB) — show the style-match score.
5. **Tradeoffs/assumptions (30s):** single shared workspace; spent extra calls on the audit
   for safety; mailto/Copy-HTML rather than sending via Gmail API; recipient left blank not guessed.
6. **Production next (30s):** async webhook (queue) + HMAC; Gmail "Create Draft"; recipient
   auto-fill from Contacts/CRM; push instead of polling; eval harness; cost-based model routing.

**Close:** "It works end-to-end, but the real point is the guardrail — it's honest about
what it knows, flags what it guessed, and leaves the send to a human."

---

## Checklist
- [x] Part 1 — three drafts (above)
- [x] Part 2 — working automation (repo) + flow + prompt (above)
- [ ] Part 2 — attach a workflow screenshot
- [ ] Part 3 — record & link the Loom
- [ ] Submit in Ashby

*Validation: 52 unit tests + a real-route test over the 3 sample `.m4a` (transcribe → draft
→ cross-model audit → webhook persistence) all pass.*
