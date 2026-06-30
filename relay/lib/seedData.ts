// AUTO-GENERATED from the three sample voice notes via the Relay pipeline,
// lightly curated. These are the Part 1 deliverable, persisted as seed entries.
// Regenerate by running the pipeline on Resources/Sample Voicenotes/*.m4a.
import type { Note } from "./types";

export type SeedNote = Note & { source: string };

export const P1_SEED_NOTES: SeedNote[] = [
  {
    "id": "seed-marcus",
    "person": "Marcus",
    "type": "Follow-up",
    "subject": "Onboarding Frameworks for Your Team",
    "status": "ready",
    "received": "9:14 AM",
    "duration": "1:31",
    "transcript": "Hey, this is an email draft to Marcus. Let's say something like, hey Marcus, it was really great connecting yesterday. I really enjoyed the conversation around your team's challenges around onboarding. I completely understand how difficult that can be. That's definitely one of the areas where I feel like a little bit of structure goes a long way. I put together a short notion page with some example frameworks, like frameworks that we've seen other clients use for teams kind of at your stage of an organization or company. It's not prescriptive so much. It's just more starting points that might be useful as you think through what your next steps need to be as you scale. You can find it here. I'd be happy to hop on another call with you sometime in the next week or two if you want to dive into any of it. No expectation, no pressure, but let me know if you'd like to make that happen. Otherwise, I hope you have a great rest of your day and have a great weekend. Thanks, Connor.",
    "toEmail": "",
    "cc": "",
    "bcc": "",
    "segments": [
      {
        "time": "0:00",
        "text": "Hey, this is an email draft to Marcus. Let's say something like, hey Marcus, it was really great connecting yesterday. I really enjoyed the conversation around your team's challenges around onboarding."
      },
      {
        "time": "0:21",
        "text": "I completely understand how difficult that can be. That's definitely one of the areas where I feel like a little bit of structure goes a long way. I put together a short notion page with some example frameworks, like frameworks that we've seen other clients use for teams kind of at"
      },
      {
        "time": "0:46",
        "text": "your stage of an organization or company. It's not prescriptive so much. It's just more starting points that might be useful as you think through what your next steps need to be as you scale. You can find it here. I'd be happy to hop on another call with you sometime in the next"
      },
      {
        "time": "1:12",
        "text": "week or two if you want to dive into any of it. No expectation, no pressure, but let me know if you'd like to make that happen. Otherwise, I hope you have a great rest of your day and have a great weekend. Thanks, Connor."
      }
    ],
    "paragraphs": [
      [
        {
          "t": "Hey Marcus,"
        }
      ],
      [
        {
          "t": "It was really great connecting yesterday. I really enjoyed the conversation around your team's challenges with onboarding. I completely understand how difficult that can be, and I believe a little bit of structure can go a long way."
        }
      ],
      [
        {
          "t": "I've put together a short Notion page with some example frameworks that we've seen other clients use for teams at your stage. It's not prescriptive, just some starting points that might be useful as you think through your next steps as you scale. You can find it "
        },
        {
          "t": "here",
          "flagged": true,
          "tip": "insert link to Notion page"
        }
      ],
      [
        {
          "t": "I'd be happy to hop on another call with you sometime in the next week or two if you want to dive into any of it. No expectation, no pressure, but let me know if you'd like to make that happen. Otherwise, I hope you have a great rest of your day and a great weekend."
        }
      ],
      [
        {
          "t": "Thanks, Connor"
        }
      ]
    ],
    "assumptions": [
      {
        "t": "Chose 'Hey Marcus' for the greeting based on the note."
      },
      {
        "t": "Subject line created based on the conversation topic."
      },
      {
        "t": "Inserted a placeholder for the Notion page link.",
        "flagged": true,
        "tip": "insert link to Notion page"
      },
      {
        "t": "Assumed the offer to call was for the next week or two."
      },
      {
        "t": "Cleaned up filler and structured the email as per the note."
      }
    ],
    "tone": "Warm",
    "length": "Standard",
    "model": "gpt-4o",
    "provider": "openai",
    "source": "seed"
  },
  {
    "id": "seed-rachel",
    "person": "Rachel",
    "type": "Reply",
    "subject": "Re: Workflow Doc Review",
    "status": "ready",
    "received": "8:02 AM",
    "duration": "1:16",
    "transcript": "This is a reply to the email in my inbox from Rachel Maddick. Let's write a reply back that says something like, Hey Rachel, thanks so much for shooting this my way. You are way ahead of schedule and that makes my life much easier. So thank you for getting this sent over. I've had a chance to dig into it a little bit, check out the workflow doc and there's obviously a lot of good stuff here you put in. Clearly put a lot of work, a lot of thought into this. I'm really looking forward to working on this together. There's clearly a few areas that stood out where I think we could streamline things quite a bit, especially around the handoff between SDRs and AEs. I'd love to walk you through what I'm seeing day-to-day. If that's something that you'd be open to, are you available any time Thursday or Friday of this week for a quick 30-minute call? Let me know a couple times it worked for you and I'm certain I can accommodate. Thanks, Connor.",
    "toEmail": "",
    "cc": "",
    "bcc": "",
    "segments": [
      {
        "time": "0:00",
        "text": "This is a reply to the email in my inbox from Rachel Maddick. Let's write a reply back that says something like, Hey Rachel, thanks so much for shooting this my way. You are way ahead of schedule and that makes my life much easier."
      },
      {
        "time": "0:19",
        "text": "So thank you for getting this sent over. I've had a chance to dig into it a little bit, check out the workflow doc and there's obviously a lot of good stuff here you put in. Clearly put a lot of work, a lot of thought into this."
      },
      {
        "time": "0:38",
        "text": "I'm really looking forward to working on this together. There's clearly a few areas that stood out where I think we could streamline things quite a bit, especially around the handoff between SDRs and AEs. I'd love to walk you through what I'm seeing day-to-day."
      },
      {
        "time": "0:59",
        "text": "If that's something that you'd be open to, are you available any time Thursday or Friday of this week for a quick 30-minute call? Let me know a couple times it worked for you and I'm certain I can accommodate. Thanks, Connor."
      }
    ],
    "paragraphs": [
      [
        {
          "t": "Hey Rachel,"
        }
      ],
      [
        {
          "t": "Thanks so much for shooting this my way. You are way ahead of schedule and that makes my life much easier. So thank you for getting this sent over. I've had a chance to dig into it a little bit, check out the workflow doc and there's obviously a lot of good stuff here you put in. Clearly put a lot of work, a lot of thought into this."
        }
      ],
      [
        {
          "t": "I'm really looking forward to working on this together. There's clearly a few areas that stood out where I think we could streamline things quite a bit, especially around the handoff between SDRs and AEs. I'd love to walk you through what I'm seeing day-to-day."
        }
      ],
      [
        {
          "t": "If that's something that you'd be open to, are you available any time "
        },
        {
          "t": "Thursday or Friday of this week",
          "flagged": true,
          "tip": "confirm specific dates for the call"
        },
        {
          "t": " for a quick 30-minute call? Let me know a couple times it worked for you and I'm certain I can accommodate."
        }
      ],
      [
        {
          "t": "Thanks, Connor"
        }
      ]
    ],
    "assumptions": [
      {
        "t": "Chose greeting 'Hey Rachel' based on the note's tone."
      },
      {
        "t": "Inserted placeholder for Thursday or Friday, assuming this week is intended.",
        "flagged": true,
        "tip": "confirm specific dates for the call"
      },
      {
        "t": "Structured email with a warm and appreciative tone as per note."
      }
    ],
    "tone": "Warm",
    "length": "Standard",
    "model": "gpt-4o",
    "provider": "openai",
    "source": "seed"
  },
  {
    "id": "seed-intro",
    "person": "Andre and Patrick",
    "type": "Intro",
    "subject": "Introducing Andre Garikarian and Patrick Ewers",
    "status": "ready",
    "received": "Yesterday",
    "duration": "2:00",
    "transcript": "This is a introduction email between Andre Garikarian from Silicon Valley Legal and Patrick Ewers from MindMaven. I just want to say something like, you know, hey gentlemen, I've spoken to you both separately about this so you know I'll get I'll get right to it. Patrick meets Andre. Andre is, I believe he's the founder of Silicon Valley Legal and just an all-around great guy like you. I guess we can talk about how he really has an affinity for relationships, truly cares about him and I I think that's something Patrick would really resonate with because of his company's mission on relationships, so we can touch on that point. And we can just say something to the fact that he was looking to connect with with folks who have been experimenting and kind of pushing the envelope on AI, so of course I thought of you. And then we can say Andre meets Patrick and you know Patrick's the founder and CEO of MindMaven. We can talk about how he built a whole coaching practice around helping people better invest into relationships to drive success but focus on the happiness and fulfillment side of the work as well. And say he's been really testing out interesting ways of using AI tools and maybe mentioned building like custom automations to really help people find leverage and and like continue investing into relationships. Something to that effect. If you could turn that into an email that would be awesome. Thanks.",
    "toEmail": "",
    "cc": "",
    "bcc": "",
    "segments": [
      {
        "time": "0:00",
        "text": "This is a introduction email between Andre Garikarian from Silicon Valley Legal and Patrick Ewers from MindMaven. I just want to say something like, you know, hey gentlemen, I've spoken to you both separately about this so you know I'll"
      },
      {
        "time": "0:19",
        "text": "get I'll get right to it. Patrick meets Andre. Andre is, I believe he's the founder of Silicon Valley Legal and just an all-around great guy like you. I guess we can talk about how he really has an affinity for relationships, truly cares"
      },
      {
        "time": "0:44",
        "text": "about him and I I think that's something Patrick would really resonate with because of his company's mission on relationships, so we can touch on that point. And we can just say something to the fact that he was looking to connect with with folks who have been experimenting and kind of pushing the"
      },
      {
        "time": "1:08",
        "text": "envelope on AI, so of course I thought of you. And then we can say Andre meets Patrick and you know Patrick's the founder and CEO of MindMaven. We can talk about how he built a whole coaching practice around helping people better"
      },
      {
        "time": "1:25",
        "text": "invest into relationships to drive success but focus on the happiness and fulfillment side of the work as well. And say he's been really testing out interesting ways of using AI tools and maybe mentioned building like custom automations to really help people find"
      },
      {
        "time": "1:48",
        "text": "leverage and and like continue investing into relationships. Something to that effect. If you could turn that into an email that would be awesome. Thanks."
      }
    ],
    "paragraphs": [
      [
        {
          "t": "Hey gentlemen,"
        }
      ],
      [
        {
          "t": "I've spoken to you both separately about this, so I'll get right to it. Patrick, meet Andre. Andre is the founder of Silicon Valley Legal and just an all-around great guy like you. He truly has an affinity for relationships and genuinely cares about them, which I think will resonate with you given MindMaven's mission."
        }
      ],
      [
        {
          "t": "Andre is looking to connect with folks who have been experimenting and pushing the envelope on AI, so of course I thought of you."
        }
      ],
      [
        {
          "t": "Andre, meet Patrick. Patrick is the founder and CEO of MindMaven. He's built a whole coaching practice around helping people better invest in relationships to drive success, with a focus on happiness and fulfillment. He's been testing out interesting ways of using AI tools, including building custom automations to help people continue investing in relationships."
        }
      ],
      [
        {
          "t": "I think you both have a lot to share and learn from each other."
        }
      ],
      [
        {
          "t": "Thanks, Connor"
        }
      ]
    ],
    "assumptions": [
      {
        "t": "Chose \"Hey gentlemen\" as the greeting based on context."
      },
      {
        "t": "Structured the email to introduce Andre and Patrick to each other."
      },
      {
        "t": "Assumed Andre is the founder of Silicon Valley Legal.",
        "flagged": true,
        "tip": "confirm Andre's role as founder."
      },
      {
        "t": "Did not include email addresses as they were not provided.",
        "flagged": true,
        "tip": "add recipient emails."
      },
      {
        "t": "Kept the focus on relationships and AI as discussed."
      }
    ],
    "tone": "Warm",
    "length": "Standard",
    "model": "gpt-4o",
    "provider": "openai",
    "source": "seed"
  }
];
