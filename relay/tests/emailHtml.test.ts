import { describe, it, expect } from "vitest";
import { buildEmailHtml } from "../lib/emailHtml";
import type { Note } from "../lib/types";

const note: Note = {
  id: "t1",
  person: "Dana Whitfield",
  type: "Intro",
  subject: "Intro <Chief> & friends",
  status: "ready",
  received: "8:02 AM",
  duration: "0:41",
  toEmail: "",
  transcript: "...",
  paragraphs: [
    [{ t: "Hi Dana," }],
    [{ t: "Great to meet you " }, { t: "next Tuesday", flagged: true, tip: "confirm" }, { t: "." }],
    [{ t: "Thanks,\nConnor" }],
  ],
  assumptions: [],
};

describe("buildEmailHtml", () => {
  const html = buildEmailHtml(note);

  it("produces a full HTML document", () => {
    expect(html.startsWith("<!DOCTYPE html")).toBe(true);
    expect(html).toContain("</html>");
  });

  it("includes an Outlook (MSO) conditional block for compatibility", () => {
    expect(html).toContain("[if mso]");
    expect(html).toContain('role="presentation"');
  });

  it("escapes HTML special characters from user content", () => {
    expect(html).toContain("Intro &lt;Chief&gt; &amp; friends");
    expect(html).not.toContain("<Chief>");
  });

  it("renders the body but NOT the review-only flag markup", () => {
    expect(html).toContain("Great to meet you next Tuesday.");
    expect(html).not.toContain("flagged");
    expect(html).not.toContain("dashed");
  });

  it("converts newlines in the sign-off to <br> and adds the signature", () => {
    expect(html).toContain("Thanks,<br>Connor");
    expect(html).toContain("Connor Kelly");
  });
});
