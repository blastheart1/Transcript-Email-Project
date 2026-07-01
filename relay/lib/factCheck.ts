import type { Fabrication, Severity } from "./types";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");

interface Pattern {
  kind: string;
  re: RegExp;
  severity: Severity;
}

// The "dangerous" tokens a draft must never invent. Dates/times are handled by
// the LLM auditor (they're often legitimately inferred); these are hard facts.
const PATTERNS: Pattern[] = [
  { kind: "email address", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g, severity: "high" },
  { kind: "link", re: /\b(?:https?:\/\/|www\.)[^\s)>\]"']+/gi, severity: "high" },
  { kind: "phone number", re: /(?:\+?\d[\d\s().-]{7,}\d)/g, severity: "high" },
  { kind: "dollar amount", re: /\$\s?\d[\d,]*(?:\.\d+)?/g, severity: "medium" },
];

function isGrounded(token: string, kind: string, transcript: string): boolean {
  const n = norm(token);
  if (transcript.includes(n)) return true;
  if (kind === "phone number") {
    const digits = token.replace(/\D/g, "");
    return digits.length > 0 && transcript.replace(/\D/g, "").includes(digits);
  }
  if (kind === "email address") {
    const domain = n.split("@")[1];
    return !!domain && transcript.includes(domain);
  }
  if (kind === "link") {
    const host = n.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
    return !!host && transcript.includes(host);
  }
  return false;
}

/**
 * Deterministic grounding check: any email / link / phone / amount that appears
 * in the draft but is absent from the transcript is a fabrication. Pure & fast —
 * runs before the LLM auditor and catches the highest-risk invented facts.
 */
export function groundingFabrications(draftText: string, transcript: string): Fabrication[] {
  const t = norm(transcript);
  const out: Fabrication[] = [];
  const seen = new Set<string>();
  for (const { kind, re, severity } of PATTERNS) {
    const matches = draftText.match(re) || [];
    for (const raw of matches) {
      const token = raw.trim().replace(/[.,;:]+$/, "");
      const key = `${kind}:${norm(token)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (isGrounded(token, kind, t)) continue;
      out.push({ text: token, severity, why: `This ${kind} does not appear in the transcript.` });
    }
  }
  return out;
}

export function hasHighSeverity(fabrications: Fabrication[]): boolean {
  return fabrications.some((f) => f.severity === "high");
}
