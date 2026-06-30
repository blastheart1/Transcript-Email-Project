import type { Note } from "./types";
import { SENDER } from "./constants";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render the email body to clean paragraph HTML (no review highlights). */
function paragraphsToHtml(note: Pick<Note, "paragraphs">): string {
  return note.paragraphs
    .map((p) => p.map((s) => s.t).join(""))
    .map((text) => text.trim())
    .filter(Boolean)
    .map(
      (text) =>
        `<p style="margin:0 0 16px;mso-line-height-rule:exactly;">${escapeHtml(text).replace(/\n/g, "<br>")}</p>`,
    )
    .join("\n");
}

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * Build a Gmail-first, Outlook-safe HTML email that echoes Relay's design
 * language (teal accent, soft card, clean type). Table-based with inline styles
 * only, an MSO ghost wrapper for Outlook width, and a web-safe font stack
 * (Public Sans isn't available in mail clients).
 */
export function buildEmailHtml(note: Note): string {
  const subject = escapeHtml(note.subject || "");
  const body = paragraphsToHtml(note);
  const preheader = escapeHtml(
    note.paragraphs
      .flat()
      .map((s) => s.t)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 110),
  );

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${subject}</title>
<!--[if mso]>
<style type="text/css">table,td,p,div{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:#F6F7F8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F6F7F8;">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E3E7EA;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="height:4px;line-height:4px;font-size:0;background:#0E3A4F;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:32px 36px;font-family:${FONT_STACK};font-size:16px;line-height:1.7;color:#1B2A31;">
            ${body}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;border-top:1px solid #EFF1F2;">
              <tr>
                <td style="padding-top:18px;font-family:${FONT_STACK};font-size:13px;line-height:1.5;color:#8A969C;">
                  <span style="display:block;font-size:14px;font-weight:bold;color:#0E3A4F;">${escapeHtml(SENDER.fullName)}</span>
                  <span style="display:block;">${escapeHtml(SENDER.role.replace(" · ", ", "))}</span>
                  <a href="mailto:${escapeHtml(SENDER.email)}" style="color:#0E3A4F;text-decoration:none;">${escapeHtml(SENDER.email)}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
      <div style="font-family:${FONT_STACK};font-size:11px;color:#A0AAAF;padding:16px 0 0;">Drafted with Relay · reviewed and sent by ${escapeHtml(SENDER.fullName)}</div>
    </td>
  </tr>
</table>
</body>
</html>`;
}
