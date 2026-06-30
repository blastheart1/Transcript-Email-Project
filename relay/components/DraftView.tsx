"use client";

import { useEffect, useState } from "react";
import { useRelay } from "@/lib/store";
import { statusInfo } from "@/lib/status";
import { bodyText, buildMailto, textToParagraphs, flagCount } from "@/lib/format";
import { buildEmailHtml } from "@/lib/emailHtml";
import { ModelPicker } from "./ModelPicker";
import type { Tone, Length } from "@/lib/types";
import {
  ChevronLeftIcon,
  MicIcon,
  MailIcon,
  EditIcon,
  RefreshIcon,
  CopyIcon,
  SendIcon,
  PlayIcon,
  InfoIcon,
} from "./icons";

const TONES: Tone[] = ["Warm", "Neutral", "Direct"];
const LENGTHS: Length[] = ["Concise", "Standard", "Detailed"];

const TONE_TIPS: Record<Tone, string> = {
  Warm: "Warmer, more personal",
  Neutral: "Balanced and professional",
  Direct: "Shorter and to the point",
};
const LENGTH_TIPS: Record<Length, string> = {
  Concise: "Trim to essentials",
  Standard: "As dictated",
  Detailed: "Add a little more context",
};

function pillClass(active: boolean) {
  return [
    "rounded-md px-3 py-1.5 text-[12.5px] font-semibold cursor-pointer border-none transition-colors",
    active ? "bg-white text-primary shadow-[0_1px_2px_rgba(16,36,43,.08)]" : "bg-transparent text-slate-400",
  ].join(" ");
}

export function DraftView() {
  const { state, dispatch, currentNote, setView, regenerate, showToast } = useRelay();
  const note = currentNote();
  const [editText, setEditText] = useState("");
  const [bodyView, setBodyView] = useState<"review" | "html">("review");
  const [copiedHtml, setCopiedHtml] = useState(false);

  useEffect(() => {
    if (state.editing && note) setEditText(bodyText(note));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.editing]);

  if (!note) {
    return (
      <section className="mx-auto max-w-[1120px] px-[26px] pb-[60px] pt-5 text-sm text-muted">
        No note selected.
      </section>
    );
  }

  const si = statusInfo(note.status);
  const flags = flagCount(note);

  function setTone(t: Tone) {
    dispatch({ type: "SET_TONE", tone: t });
    void regenerate(note!.id);
  }
  function setLen(l: Length) {
    dispatch({ type: "SET_LENGTH", length: l });
    void regenerate(note!.id);
  }

  function commitEdit() {
    if (state.editing) {
      dispatch({ type: "UPDATE_NOTE", id: note!.id, patch: { paragraphs: textToParagraphs(editText) } });
    }
    dispatch({ type: "SET_EDITING", editing: !state.editing });
  }

  function copyEmail() {
    const txt = bodyText(note!);
    navigator.clipboard?.writeText(txt).catch(() => {});
    dispatch({ type: "SET_COPIED", value: true });
    setTimeout(() => dispatch({ type: "SET_COPIED", value: false }), 1800);
  }

  async function copyHtml() {
    const html = buildEmailHtml(note!);
    const text = bodyText(note!);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard?.writeText(html);
      }
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 1800);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  }

  function markSent() {
    dispatch({ type: "UPDATE_NOTE", id: note!.id, patch: { status: "sent", received: "Just now" } });
    showToast({ kind: "ready", msg: "Opening your email client…" });
  }

  return (
    <section className="mx-auto max-w-[1120px] px-[26px] pb-[60px] pt-5">
      <button
        onClick={() => setView("inbox")}
        className="mb-3 inline-flex cursor-pointer items-center gap-1.5 border-none bg-transparent px-1 py-1.5 text-[13px] font-semibold text-slate-400"
        data-tip="Back to all voice notes"
      >
        <ChevronLeftIcon size={15} />
        Inbox
      </button>

      {/* Processing */}
      {note.status === "transcribing" && (
        <div className="rounded-[14px] border border-line bg-white px-8 py-[60px] text-center">
          <div className="mx-auto mb-[18px] h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-line border-t-primary" />
          <div className="text-base font-bold">Transcribing your note…</div>
          <div className="mt-1.5 text-[13.5px] text-muted">
            The draft for {note.person} will appear here in a moment.
          </div>
        </div>
      )}

      {/* Error */}
      {note.status === "error" && (
        <div className="rounded-[14px] border border-warn-line bg-warn-bg px-8 py-10 text-center">
          <div className="text-base font-bold text-warn-ink">Couldn’t finish this draft</div>
          <div className="mx-auto mt-2 max-w-[440px] text-[13.5px] leading-relaxed text-warn-ink">
            {note.errorMessage || "Something went wrong."}
          </div>
        </div>
      )}

      {/* Ready */}
      {(note.status === "ready" || note.status === "sent") && (
        <>
          <div className="mb-[18px] flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2.5">
                <h2 className="m-0 text-[21px] font-bold tracking-[-.3px]">{note.subject}</h2>
                <span
                  tabIndex={0}
                  data-tip={si.tip}
                  className="whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11.5px] font-bold"
                  style={{ background: si.badgeBg, color: si.badgeColor }}
                >
                  {si.label}
                </span>
              </div>
              <div className="text-[13.5px] text-muted">
                {note.type} to {note.person} · captured {note.received}
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[.6px] text-muted">Tone</span>
                <div className="flex gap-1 rounded-lg bg-tint-chip p-[3px]">
                  {TONES.map((t) => (
                    <button key={t} onClick={() => setTone(t)} className={pillClass(state.tone === t)} data-tip-down data-tip={TONE_TIPS[t]}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-[.6px] text-muted">Length</span>
                <div className="flex gap-1 rounded-lg bg-tint-chip p-[3px]">
                  {LENGTHS.map((l) => (
                    <button key={l} onClick={() => setLen(l)} className={pillClass(state.length === l)} data-tip-down data-tip={LENGTH_TIPS[l]}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <ModelPicker onChange={() => regenerate(note.id)} />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-start gap-[18px]">
            {/* Transcript */}
            <div className="overflow-hidden rounded-[14px] border border-line bg-white">
              <div className="flex items-center justify-between border-b border-line-soft bg-tint-soft px-[18px] py-[15px]">
                <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.5px] text-slate-500">
                  <MicIcon size={15} />
                  Voice note
                </div>
                <span className="text-xs text-faint">{note.duration}</span>
              </div>
              <div className="border-b border-line-soft px-[18px] py-4">
                {note.audioURL ? (
                  <audio controls src={note.audioURL} className="w-full" />
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full border-none bg-primary text-white"
                      data-tip="Original recording isn’t stored for sample notes"
                      aria-label="Play recording"
                    >
                      <PlayIcon size={14} />
                    </button>
                    <div className="relative h-1 flex-1 rounded-[3px] bg-line">
                      <span className="absolute left-0 top-0 h-full w-0 rounded-[3px] bg-primary" />
                    </div>
                    <span className="text-xs tabular-nums text-faint">{note.duration}</span>
                  </div>
                )}
              </div>
              {note.segments && note.segments.length > 0 ? (
                <div className="px-[18px] pb-3.5 pt-2.5">
                  {note.segments.map((seg, i) => (
                    <div key={i} className="flex gap-3.5 border-b border-line-faint py-2 last:border-b-0">
                      <span
                        tabIndex={0}
                        data-tip={`Jump to ${seg.time} in the recording`}
                        className="w-[34px] flex-none cursor-pointer pt-[3px] font-mono text-xs font-bold tabular-nums text-primary"
                      >
                        {seg.time}
                      </span>
                      <span className="text-[14.5px] leading-[1.7] text-slate-450">{seg.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-[18px] text-[14.5px] leading-[1.75] text-slate-450">{note.transcript}</div>
              )}
            </div>

            {/* Email */}
            <div className="relative overflow-hidden rounded-[14px] border border-line bg-white">
              {state.regenerating && (
                <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-white/[.78] backdrop-blur-[1px]">
                  <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-line border-t-primary" />
                  <span className="text-[13px] font-semibold text-slate-500">
                    Rewriting in a {state.tone.toLowerCase()}, {state.length.toLowerCase()} tone…
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-b border-line-soft bg-tint-soft px-[18px] py-[15px]">
                <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.5px] text-slate-500">
                  <MailIcon size={15} />
                  Drafted email
                </div>
                <div className="flex items-center gap-2.5">
                  {!state.editing && (
                    <div className="flex gap-0.5 rounded-lg bg-tint-chip p-[3px]">
                      <button
                        onClick={() => setBodyView("review")}
                        className={pillClass(bodyView === "review")}
                        data-tip-down
                        data-tip="Plain text with review highlights"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => setBodyView("html")}
                        className={pillClass(bodyView === "html")}
                        data-tip-down
                        data-tip="Preview the actual HTML email (Gmail-first)"
                      >
                        Email
                      </button>
                    </div>
                  )}
                  <button
                    onClick={commitEdit}
                    className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent text-[12.5px] font-semibold text-primary"
                    data-tip={state.editing ? "Finish editing" : "Edit the email text inline"}
                  >
                    <EditIcon size={14} />
                    {state.editing ? "Done" : "Edit"}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-[9px] border-b border-line-soft px-[18px] py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-[52px] flex-none text-xs font-semibold text-muted">To</span>
                  <input
                    type="text"
                    value={note.toEmail}
                    onChange={(e) => dispatch({ type: "UPDATE_NOTE", id: note.id, patch: { toEmail: e.target.value } })}
                    placeholder="Add recipient email"
                    aria-label="Recipient email"
                    className="flex-1 border-none bg-transparent py-0.5 text-sm font-medium"
                    data-tip={note.toEmail ? undefined : "Address wasn’t in the voice note — add it before sending"}
                  />
                </div>
                <div className="h-px bg-line-faint" />
                <div className="flex items-center gap-2.5">
                  <span className="w-[52px] flex-none text-xs font-semibold text-muted">Subject</span>
                  <input
                    type="text"
                    value={note.subject}
                    onChange={(e) => dispatch({ type: "UPDATE_NOTE", id: note.id, patch: { subject: e.target.value } })}
                    aria-label="Email subject"
                    className="flex-1 border-none bg-transparent py-0.5 text-sm font-semibold"
                  />
                </div>
              </div>

              {state.editing ? (
                <div className="px-[18px] py-4">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    aria-label="Edit email body"
                    className="min-h-[300px] w-full resize-y rounded-[10px] border border-line bg-tint-soft p-3.5 text-[14.5px] leading-[1.7] text-ink-2"
                  />
                </div>
              ) : bodyView === "html" ? (
                <div className="bg-canvas p-3">
                  <iframe
                    title="HTML email preview"
                    sandbox=""
                    srcDoc={buildEmailHtml(note)}
                    className="h-[460px] w-full rounded-[10px] border border-line bg-white"
                  />
                </div>
              ) : (
                <div className="px-[22px] py-5">
                  {note.paragraphs.map((para, pi) => (
                    <p key={pi} className="m-0 mb-3.5 whitespace-pre-wrap text-[14.5px] leading-[1.75] text-ink-2 last:mb-0">
                      {para.map((seg, si2) =>
                        seg.flagged ? (
                          <mark
                            key={si2}
                            tabIndex={0}
                            data-tip={seg.tip}
                            className="cursor-help rounded-[2px] border-b-[1.5px] border-dashed border-warn-mark bg-warn-bg px-px text-warn-ink"
                          >
                            {seg.t}
                          </mark>
                        ) : (
                          <span key={si2}>{seg.t}</span>
                        ),
                      )}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2.5 border-t border-line-soft bg-tint-soft px-[18px] py-3.5">
                <button
                  onClick={() => regenerate(note.id)}
                  className="flex h-10 cursor-pointer items-center gap-[7px] rounded-[9px] border border-line bg-white px-3.5 text-[13.5px] font-semibold text-slate-600"
                  data-tip="Re-draft with the current tone and length"
                >
                  <RefreshIcon size={15} />
                  Regenerate
                </button>
                <div className="flex-1" />
                {bodyView === "html" && !state.editing ? (
                  <button
                    onClick={copyHtml}
                    className="flex h-10 cursor-pointer items-center gap-[7px] rounded-[9px] border px-3.5 text-[13.5px] font-semibold"
                    style={{
                      borderColor: copiedHtml ? "#2E6B4F" : "#E3E7EA",
                      background: copiedHtml ? "#E7F1EC" : "#fff",
                      color: copiedHtml ? "#205C42" : "#3A4A52",
                    }}
                    data-tip="Copy formatted HTML — paste straight into Gmail"
                  >
                    <CopyIcon size={15} />
                    {copiedHtml ? "Copied HTML" : "Copy HTML"}
                  </button>
                ) : (
                  <button
                    onClick={copyEmail}
                    className="flex h-10 cursor-pointer items-center gap-[7px] rounded-[9px] border px-3.5 text-[13.5px] font-semibold"
                    style={{
                      borderColor: state.copied ? "#2E6B4F" : "#E3E7EA",
                      background: state.copied ? "#E7F1EC" : "#fff",
                      color: state.copied ? "#205C42" : "#3A4A52",
                    }}
                    data-tip="Copy the full email to your clipboard"
                  >
                    <CopyIcon size={15} />
                    {state.copied ? "Copied" : "Copy"}
                  </button>
                )}
                <a
                  href={buildMailto(note)}
                  target="_blank"
                  rel="noopener"
                  onClick={markSent}
                  className="flex h-10 items-center gap-[7px] rounded-[9px] bg-primary px-4 text-[13.5px] font-semibold text-white no-underline"
                  data-tip="Open this draft in your email client"
                >
                  <SendIcon size={15} />
                  Open in email
                </a>
              </div>
            </div>
          </div>

          {/* Assumptions */}
          <div className="mt-[18px] overflow-hidden rounded-[14px] border border-line bg-white">
            <div className="flex items-center gap-[9px] border-b border-line-soft px-[18px] py-[15px]">
              <InfoIcon size={16} className="text-primary" />
              <h3 className="m-0 text-sm font-bold">What Relay changed &amp; assumed</h3>
              {flags > 0 && (
                <span className="ml-0.5 text-xs font-medium text-muted">· {flags} need a look</span>
              )}
            </div>
            <ul className="m-0 list-none py-2">
              {note.assumptions.map((a, i) => (
                <li key={i} className="flex items-start gap-[11px] px-[18px] py-[9px]">
                  <span
                    tabIndex={0}
                    data-tip={a.flagged ? a.tip || "Worth a quick check" : "Cleaned up automatically"}
                    className="flex h-5 w-5 flex-none cursor-help items-center justify-center rounded-full text-[11px] font-bold"
                    style={
                      a.flagged
                        ? { background: "#FBF3E2", color: "#8A6516" }
                        : { background: "#E7F1EC", color: "#205C42" }
                    }
                  >
                    {a.flagged ? "!" : "✓"}
                  </span>
                  <span className="text-[13.5px] leading-[1.55] text-slate-600">{a.t}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
