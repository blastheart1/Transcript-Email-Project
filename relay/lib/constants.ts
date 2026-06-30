// Static configuration: persona, guardrails, and the style corpus Relay
// matches against. These mirror the design prototype's Settings screen.

export const SENDER = {
  name: "Connor",
  fullName: "Connor Kelly",
  initials: "CK",
  role: "Senior Coach · Mindmaven",
  email: "connor@mindmaven.com",
};

export const DEFAULT_SIGN_OFF = "Thanks,\nConnor";

export const DEFAULT_TONE = "Warm" as const;
export const DEFAULT_LENGTH = "Standard" as const;

/**
 * The seven always-on drafting guardrails. Shown verbatim in Settings and
 * compiled into the drafting system prompt.
 */
export const GUARDRAILS = [
  {
    title: "Stay on Connor's voice",
    desc: "Match tone, rhythm, and phrasing to the saved style samples only — no generic AI phrasing.",
  },
  {
    title: "Never invent facts",
    desc: "No made-up names, dates, times, links, or email addresses. If it wasn't in the note, it doesn't go in the draft.",
  },
  {
    title: "Flag every guess",
    desc: "Anything inferred or low-confidence is highlighted and listed under “What Relay changed & assumed.”",
  },
  {
    title: "Leave gaps blank",
    desc: "Missing recipient, link, or detail is left empty for you to fill — never silently fabricated.",
  },
  {
    title: "Clean up, don't embellish",
    desc: "Remove filler and false starts while preserving your meaning; add nothing you didn't say.",
  },
  {
    title: "Keep your structure",
    desc: "Warm opener, concise body, and your saved “Thanks, Connor” sign-off every time.",
  },
  {
    title: "Never auto-send",
    desc: "Drafts always wait in your inbox for review — sending is your call, not the AI's.",
  },
];

/**
 * Connor's saved style samples — the ONLY writing Relay imitates. These are
 * real sent emails in his voice, used to anchor greetings, rhythm, and warmth.
 */
export interface StyleSample {
  title: string;
  body: string;
}

// These are Connor's actual writing samples provided in the assignment — the
// ONLY corpus Relay imitates for tone/voice. Seeded by default; editable in Settings.
export const STYLE_SAMPLES: StyleSample[] = [
  {
    title: "Intro Regarding Chief of Staff",
    body: `Hi there Portia,

It's wonderful to meet you! I was thrilled to hear that Liz is in the midst of hiring a Chief of Staff—I'm certain that hire will bring a huge amount of life to her day-to-day. I'd love to connect on Tuesday of next week when I'm back in the office. 3:00 PM EST works great for me! I'll keep an eye out for that invite. Looking forward to talking soon!

Thanks,
Connor`,
  },
  {
    title: "Personalized AI Workshop",
    body: `Hey Sarah,

Apologies for the wait on this — and thank you so much for thinking of me! This definitely sounds like an intriguing opportunity, and I'd love to hear more about what you're envisioning.

That said, I want to be upfront: I probably won't be the right person to lead this one. We're expecting a baby girl sometime in the first half of May, so I'll be offline on paternity leave right around the time you're looking at for the in-person session.

All that said, I would love to hop on a quick call to chat through this with you and see if I can get you pointed in the right direction. Even if the timing doesn't work for me to facilitate, I may be able to help you think through format, content, and who might be a great fit—there are also some additional MM coaches who could be a great fit for this! Would you be open to a quick call early next week to discuss?

Thanks,
Connor`,
  },
  {
    title: "Quick follow-up and resources",
    body: `Hey Larry,

Really enjoyed getting to connect with you this afternoon. Super excited by what you're building and experimenting with. You gave me some much-needed inspiration to dive back into Claude Cowork and see just how much it can do now. I'll be very curious to hear your thoughts on OpenClaw once you get it up and running!

On that note, I promised a couple videos from my favorite OpenClaw content creators. If you only watch one, make it this: The only OpenClaw tutorial you'll ever need (March 2026 edition). Here's another video with some valuable use-cases: 5 OpenClaw use cases you need to implement IMMEDIATELY. Finally, here's a deeper dive into the Mission Control: OpenClaw is 100x better with this tool (Mission Control).

I hope those videos help! And if you hit any snags (which is almost inevitable with OpenClaw setup), don't forget to leverage AI! Copy and paste what you're experiencing into ChatGPT and ask for step-by-step guidance under the assumption that you do not have technical experience. It took a lot of back-and-forth (and a moment or three where I wanted to throw my computer out the window), but I was finally able to get there with enough experimentation.

Let me know if there's anything I can do to help!

Thanks,
Connor`,
  },
];

export const ACCEPT_AUDIO =
  ".m4a,audio/mp4,audio/x-m4a,audio/aac,audio/mpeg,audio/wav,audio/webm,video/mp4,audio/*";
