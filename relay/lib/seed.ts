import type { Note } from "./types";

/**
 * Seed inbox — the same demo notes shown in the design prototype. They let the
 * Inbox / Draft review screens be explored immediately, with no API key, and
 * double as worked examples of the guardrails (flagged guesses + assumptions).
 */
export const SEED_NOTES: Note[] = [
  {
    id: "n1",
    person: "Marcus Bell",
    type: "Follow-up",
    subject: "Quick follow-up and resources",
    status: "ready",
    received: "9:14 AM",
    duration: "1:12",
    toEmail: "",
    transcript:
      "Hey, uh, this one’s for Marcus — Marcus Bell. We met this afternoon at the, the founder thing. Um, really enjoyed the conversation, super excited about what he’s building. He kind of gave me the push to dive back into Claude Cowork. I promised him a couple videos — the, the only tutorial you’ll ever need, the March edition, then the five use cases one, and the deeper dive on Mission Control. Uh, and remind him, when he hits snags just lean on AI, copy-paste into ChatGPT, ask for step by step. Sign off the usual. Thanks.",
    segments: [
      { time: "0:00", text: "Hey, uh, this one’s for Marcus — Marcus Bell. We met this afternoon at the, the founder thing." },
      { time: "0:11", text: "Um, really enjoyed the conversation, super excited about what he’s building. He kind of gave me the push to dive back into Claude Cowork." },
      { time: "0:27", text: "I promised him a couple videos — the, the only tutorial you’ll ever need, the March edition, then the five use cases one, and the deeper dive on Mission Control." },
      { time: "0:51", text: "Uh, and remind him, when he hits snags just lean on AI, copy-paste into ChatGPT, ask for step by step." },
      { time: "1:06", text: "Sign off the usual. Thanks." },
    ],
    paragraphs: [
      [{ t: "Hey Marcus," }],
      [
        { t: "Really enjoyed getting to connect with you " },
        { t: "this afternoon", flagged: true, tip: "You said “the founder thing” — inferred timing. Confirm the event or time." },
        { t: ". Super excited by what you’re building, and you gave me the push I needed to dive back into Claude Cowork and see how far it’s come." },
      ],
      [
        { t: "As promised, here are a few videos from my favorite creators. If you only watch one, make it " },
        { t: "“The only tutorial you’ll ever need (March 2026)”", flagged: true, tip: "Link wasn’t dictated — placeholder inserted. Paste the real URL before sending." },
        { t: ". A couple more worth your time: " },
        { t: "“5 use cases to implement immediately”", flagged: true, tip: "Placeholder link — confirm URL." },
        { t: " and a deeper dive on " },
        { t: "Mission Control", flagged: true, tip: "Placeholder link — confirm URL." },
        { t: "." },
      ],
      [
        { t: "And if you hit any snags (almost inevitable with setup like this), lean on AI — paste exactly what you’re seeing into ChatGPT and ask for step-by-step guidance, assuming no technical background. It took me plenty of back-and-forth, but I got there with enough experimentation." },
      ],
      [{ t: "Let me know if there’s anything I can do to help!" }],
      [{ t: "Thanks,\nConnor" }],
    ],
    assumptions: [
      { t: "Set the greeting to “Hey Marcus,” to match your usual casual opener." },
      { t: "Removed filler (“uh,” “um”) and false starts while keeping your phrasing." },
      { t: "“The founder thing” → “this afternoon.” Couldn’t confirm the event name.", flagged: true, tip: "Low confidence — verify before sending." },
      { t: "Inserted placeholder links for all three videos.", flagged: true, tip: "3 links still need real URLs." },
      { t: "Recipient address wasn’t dictated — left the To field blank.", flagged: true, tip: "Add Marcus’s email." },
    ],
  },
  {
    id: "n2",
    person: "Dana Whitfield",
    type: "Intro",
    subject: "Intro Regarding Chief of Staff",
    status: "ready",
    received: "8:02 AM",
    duration: "0:41",
    toEmail: "",
    transcript:
      "Okay, intro email to Dana — she’s the Chief of Staff Liz is hiring. Um, wonderful to meet her, I was thrilled to hear Liz is hiring a chief of staff, it’ll bring a ton of life to her day to day. I’d love to connect sometime next week when I’m back in the office — Tuesday, let’s say 3pm eastern. I’ll watch for the invite. Looking forward to it.",
    segments: [
      { time: "0:00", text: "Okay, intro email to Dana — she’s the Chief of Staff Liz is hiring." },
      { time: "0:08", text: "Um, wonderful to meet her, I was thrilled to hear Liz is hiring a chief of staff, it’ll bring a ton of life to her day to day." },
      { time: "0:23", text: "I’d love to connect sometime next week when I’m back in the office — Tuesday, let’s say 3pm eastern." },
      { time: "0:35", text: "I’ll watch for the invite. Looking forward to it." },
    ],
    paragraphs: [
      [{ t: "Hi Dana," }],
      [{ t: "It’s wonderful to meet you! I was thrilled to hear that Liz is in the midst of hiring a Chief of Staff — I’m certain that hire will bring a huge amount of life to her day-to-day." }],
      [
        { t: "I’d love to connect " },
        { t: "next Tuesday", flagged: true, tip: "You said “sometime next week… Tuesday.” Confirm the exact date." },
        { t: " when I’m back in the office — " },
        { t: "3:00 PM EST", flagged: true, tip: "Inferred from “3pm eastern.” Confirm the time zone." },
        { t: " works great for me. I’ll keep an eye out for the invite. Looking forward to talking soon!" },
      ],
      [{ t: "Thanks,\nConnor" }],
    ],
    assumptions: [
      { t: "Opened with “Hi Dana,” matching the warm, brief tone of your past intro emails." },
      { t: "Tightened the dictation into your usual two-to-three sentence intro rhythm." },
      { t: "“Next week… Tuesday… 3pm eastern” set as next Tuesday, 3:00 PM EST.", flagged: true, tip: "Confirm date and time zone." },
      { t: "Recipient address wasn’t dictated — left the To field blank.", flagged: true, tip: "Add Dana’s email." },
    ],
  },
  {
    id: "n3",
    person: "Priya Anand",
    type: "Reply",
    subject: "Personalized AI Workshop",
    status: "sent",
    received: "Yesterday",
    duration: "1:05",
    toEmail: "priya@northstar.co",
    transcript:
      "This is a reply to Priya about the AI workshop she wants me to lead. Apologize for the wait, thank her for thinking of me, sounds like a really intriguing opportunity. But be upfront — I’m probably not the right person, we’ve got a baby girl due first half of May so I’ll be on paternity leave right around the in-person session. Offer a quick call to point her in the right direction, mention other MM coaches could be a fit. Ask if she’s open to a call early next week.",
    segments: [
      { time: "0:00", text: "This is a reply to Priya about the AI workshop she wants me to lead." },
      { time: "0:07", text: "Apologize for the wait, thank her for thinking of me, sounds like a really intriguing opportunity." },
      { time: "0:19", text: "But be upfront — I’m probably not the right person, we’ve got a baby girl due first half of May so I’ll be on paternity leave right around the in-person session." },
      { time: "0:41", text: "Offer a quick call to point her in the right direction, mention other MM coaches could be a fit." },
      { time: "0:55", text: "Ask if she’s open to a call early next week." },
    ],
    paragraphs: [
      [{ t: "Hey Priya," }],
      [{ t: "Apologies for the wait on this — and thank you so much for thinking of me! This definitely sounds like an intriguing opportunity, and I’d love to hear more about what you’re envisioning." }],
      [
        { t: "That said, I want to be upfront: I probably won’t be the right person to lead this one. We’re expecting a baby girl sometime in the " },
        { t: "first half of May", flagged: true, tip: "From your note. Confirm before sending." },
        { t: ", so I’ll be offline on paternity leave right around the timing you’re looking at for the in-person session." },
      ],
      [{ t: "All that said, I’d love to hop on a quick call to talk it through and see if I can point you in the right direction. Even if the timing doesn’t work for me to facilitate, I can help you think through format, content, and who might be a great fit — there are also several MM coaches who could be excellent for this." }],
      [{ t: "Would you be open to a quick call early next week to discuss?" }],
      [{ t: "Thanks,\nConnor" }],
    ],
    assumptions: [
      { t: "Mirrored the structure of your past decline-and-redirect emails." },
      { t: "Kept the news warm but upfront, matching your voice." },
      { t: "“First half of May” kept as dictated.", flagged: true, tip: "Confirm the timing." },
    ],
  },
];
