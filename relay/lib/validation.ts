import { z } from "zod";

const segment = z.object({ time: z.string(), text: z.string() });
const bodySeg = z.object({ t: z.string(), flagged: z.boolean().optional(), tip: z.string().optional() });
const assumption = z.object({ t: z.string(), flagged: z.boolean().optional(), tip: z.string().optional() });

export const noteInputSchema = z.object({
  id: z.string().optional(),
  person: z.string().optional(),
  type: z.enum(["Follow-up", "Intro", "Reply", "Note"]).optional(),
  subject: z.string().optional(),
  status: z.enum(["transcribing", "ready", "sent", "error"]).optional(),
  received: z.string().optional(),
  duration: z.string().optional(),
  transcript: z.string().optional(),
  toEmail: z.string().optional(),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  audioURL: z.string().nullable().optional(),
  segments: z.array(segment).optional(),
  paragraphs: z.array(z.array(bodySeg)).optional(),
  assumptions: z.array(assumption).optional(),
  tone: z.enum(["Warm", "Neutral", "Direct"]).optional(),
  length: z.enum(["Concise", "Standard", "Detailed"]).optional(),
  source: z.string().optional(),
  errorMessage: z.string().optional(),
});

export const styleSampleInputSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1),
});

export const settingsPatchSchema = z.object({
  defaultSignoff: z.string().optional(),
  defaultTone: z.enum(["Warm", "Neutral", "Direct"]).optional(),
  senderEmail: z.string().email().optional(),
  webhookEnabled: z.boolean().optional(),
  webhookSecret: z.string().nullable().optional(),
});

export function zodError(err: unknown) {
  if (err instanceof z.ZodError) return err.issues;
  return null;
}
