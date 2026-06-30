"use client";

import { useState } from "react";
import { useRelay } from "@/lib/store";
import { GUARDRAILS, SENDER, DEFAULT_SIGN_OFF } from "@/lib/constants";
import { FileIcon, ShieldIcon, BookmarkIcon, MailIcon, CheckIcon, CloseIcon } from "./icons";
import { WebhookSettings } from "./WebhookSettings";

export function SettingsView() {
  const { state, addStyleSample, removeStyleSample, showToast } = useRelay();
  const samples = state.styleSamples;

  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  function save() {
    const trimmed = body.trim();
    if (!trimmed) {
      showToast({ kind: "error", msg: "Paste the email text before saving the sample." }, 3000);
      return;
    }
    const name = title.trim() || trimmed.split("\n")[0].slice(0, 48) || "Style sample";
    addStyleSample({ title: name, body: trimmed });
    setTitle("");
    setBody("");
    setAdding(false);
    showToast({ kind: "ready", msg: `Added “${name}” — Relay will match this voice.` });
  }

  return (
    <section className="mx-auto flex max-w-[760px] flex-col gap-[18px] px-[26px] pb-[60px] pt-[26px]">
      {/* Voice & style profile */}
      <div className="rounded-[14px] border border-line bg-white p-6">
        <h2 className="m-0 mb-1 text-base font-bold">Voice &amp; style profile</h2>
        <p className="m-0 mb-5 text-[13.5px] leading-relaxed text-slate-400">
          Relay studies your past emails to match your voice — greetings, sign-offs, sentence rhythm, and how warm you tend to be.
        </p>

        <label className="mb-[7px] block text-xs font-semibold text-slate-400">
          Style samples <span className="font-medium text-faint">· {samples.length} learned · used to match your tone</span>
        </label>
        <div className="mb-3 flex flex-col gap-2">
          {samples.map((s, i) => {
            const open = expanded === i;
            return (
              <div key={`${s.title}-${i}`} className="rounded-[9px] border border-line">
                <div className="flex items-center gap-[11px] px-3.5 py-[11px]">
                  <FileIcon size={16} className="text-muted" />
                  <button
                    onClick={() => setExpanded(open ? null : i)}
                    className="min-w-0 flex-1 cursor-pointer border-none bg-transparent text-left"
                    data-tip="Click to preview this sample"
                  >
                    <div className="truncate text-[13.5px] font-semibold">{s.title}</div>
                    <div className="text-xs text-faint">{open ? "Hide preview" : `${s.body.length} characters · click to preview`}</div>
                  </button>
                  <span className="text-xs font-semibold text-success">Learned</span>
                  <button
                    onClick={() => {
                      void removeStyleSample(s.id);
                      if (open) setExpanded(null);
                    }}
                    aria-label={`Remove ${s.title}`}
                    className="flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-md border border-line bg-white text-muted hover:text-danger"
                    data-tip="Remove this style sample"
                  >
                    <CloseIcon size={13} />
                  </button>
                </div>
                {open && (
                  <pre className="m-0 max-h-[220px] overflow-auto whitespace-pre-wrap border-t border-line-soft bg-tint-soft px-3.5 py-3 font-sans text-[13px] leading-[1.6] text-slate-600">
                    {s.body}
                  </pre>
                )}
              </div>
            );
          })}
          {samples.length === 0 && (
            <div className="rounded-[9px] border border-dashed border-line px-3.5 py-4 text-center text-[13px] text-muted">
              No style samples yet — add one so Relay can match your voice.
            </div>
          )}
        </div>

        {adding ? (
          <div className="rounded-[10px] border border-line bg-tint-soft p-3.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Label (optional) — e.g. “Warm intro email”"
              aria-label="Style sample label"
              className="mb-2 h-9 w-full rounded-lg border border-line bg-white px-3 text-[13.5px]"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste one of your real sent emails here…"
              aria-label="Style sample text"
              className="min-h-[140px] w-full resize-y rounded-lg border border-line bg-white p-3 text-[13.5px] leading-[1.6]"
            />
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={save}
                className="h-9 cursor-pointer rounded-lg border-none bg-primary px-4 text-[13px] font-semibold text-white"
                data-tip="Save and start matching this sample"
              >
                Save sample
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setTitle("");
                  setBody("");
                }}
                className="h-9 cursor-pointer rounded-lg border border-line bg-white px-4 text-[13px] font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="h-10 cursor-pointer rounded-[9px] border border-primary bg-white px-4 text-[13.5px] font-semibold text-primary"
            data-tip="Add more of your sent emails to sharpen the match"
          >
            Add a style sample
          </button>
        )}

        <div className="my-[22px] h-px bg-line-soft" />

        <label className="mb-[7px] block text-xs font-semibold text-slate-400">Default sign-off</label>
        <textarea
          defaultValue={DEFAULT_SIGN_OFF}
          rows={2}
          aria-label="Default sign-off"
          className="mb-[18px] w-full resize-none rounded-[9px] border border-line px-3 py-2.5 text-sm"
          data-tip-down
          data-tip="Appended to every draft unless you say otherwise"
        />

        <label className="mb-[7px] block text-xs font-semibold text-slate-400">Default tone</label>
        <div className="flex max-w-[340px] gap-1 rounded-[9px] bg-tint-chip p-[3px]">
          {["Warm", "Neutral", "Direct"].map((t, i) => (
            <span
              key={t}
              className={[
                "flex-1 rounded-md py-2 text-center text-[13px]",
                i === 0 ? "bg-white font-semibold shadow-[0_1px_2px_rgba(16,36,43,.06)]" : "font-medium text-slate-400",
              ].join(" ")}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Drafting guardrails */}
      <div className="rounded-[14px] border border-line bg-white p-6">
        <div className="mb-1 flex items-center gap-[9px]">
          <ShieldIcon size={17} className="text-primary" />
          <h2 className="m-0 text-base font-bold">Drafting guardrails</h2>
          <span
            tabIndex={0}
            data-tip="These rules are enforced on every draft and can't be turned off"
            className="ml-0.5 rounded-full bg-success-bg px-[9px] py-[3px] text-[11px] font-bold text-success"
          >
            Always on
          </span>
        </div>
        <p className="m-0 mb-[18px] text-[13.5px] leading-relaxed text-slate-400">
          The strict rules Relay follows when turning a voice note into a draft. They keep the AI on-voice and stop it inventing anything you didn’t say.
        </p>

        <div className="mb-[18px] rounded-[11px] border border-line-soft bg-tint-soft px-1 py-1.5">
          {GUARDRAILS.map((g) => (
            <div key={g.title} className="flex items-start gap-[11px] border-b border-line-faint px-3.5 py-[11px] last:border-b-0">
              <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success-bg text-success">
                <CheckIcon size={12} strokeWidth={3} />
              </span>
              <div>
                <div className="text-[13.5px] font-bold text-ink-2">{g.title}</div>
                <div className="mt-0.5 text-[13px] leading-[1.55] text-slate-400">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <label className="mb-[7px] block text-xs font-semibold text-slate-400">
          Style baseline <span className="font-medium text-faint">· the only writing Relay imitates</span>
        </label>
        <div className="flex items-start gap-[11px] rounded-[10px] border border-line px-3.5 py-3">
          <BookmarkIcon size={17} className="mt-px flex-none text-primary" />
          <div className="text-[13px] leading-[1.6] text-slate-600">
            Drafts are matched <strong className="font-bold">only</strong> against your {samples.length} saved style sample{samples.length === 1 ? "" : "s"} above — not the open internet or generic “professional email” patterns. Add or remove samples to change the baseline.
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-[11px] border border-line p-3.5">
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold">Require review before sending</div>
            <div className="mt-0.5 text-[12.5px] text-muted">Relay never sends on its own — every draft waits for you.</div>
          </div>
          <span
            role="switch"
            aria-checked="true"
            aria-label="Require review before sending (locked on)"
            tabIndex={0}
            data-tip="Locked on — a core guardrail"
            className="relative h-6 w-[42px] flex-none cursor-not-allowed rounded-full bg-primary"
          >
            <span className="absolute left-[21px] top-[3px] h-[18px] w-[18px] rounded-full bg-white" />
          </span>
        </div>
      </div>

      {/* Sending account */}
      <div className="rounded-[14px] border border-line bg-white p-6">
        <h2 className="m-0 mb-1 text-base font-bold">Sending account</h2>
        <p className="m-0 mb-[18px] text-[13.5px] leading-relaxed text-slate-400">
          Where “Open in email” sends your finished drafts.
        </p>
        <div className="flex items-center gap-[13px] rounded-[11px] border border-line p-3.5">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] bg-tint text-primary">
            <MailIcon size={19} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{SENDER.email}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-success">
              <span className="h-[7px] w-[7px] rounded-full bg-success-dot" />
              Connected
            </div>
          </div>
          <button
            className="h-9 cursor-pointer rounded-lg border border-line bg-white px-3.5 text-[13px] font-semibold text-slate-600"
            data-tip="Switch the connected mailbox"
          >
            Change
          </button>
        </div>
      </div>

      {/* Webhook & automation */}
      <WebhookSettings />
    </section>
  );
}
