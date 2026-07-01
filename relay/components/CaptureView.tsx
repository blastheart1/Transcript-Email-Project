"use client";

import { useEffect, useState } from "react";
import { useRelay } from "@/lib/store";
import { useRecorder, extForMime } from "@/lib/useRecorder";
import { ACCEPT_AUDIO } from "@/lib/constants";
import { formatClock } from "@/lib/format";
import { MicIcon, CheckIcon, UploadIcon, AlertIcon, PhoneIcon } from "./icons";

type Tab = "record" | "upload" | "webhook";

function tabClass(active: boolean) {
  return [
    "flex-1 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold cursor-pointer border-none transition-colors",
    active ? "bg-white text-ink shadow-[0_1px_2px_rgba(16,36,43,.08)]" : "bg-transparent text-slate-400",
  ].join(" ");
}

export function CaptureView() {
  const { ingestAudio, setView } = useRelay();
  const [tab, setTab] = useState<Tab>("record");
  const [copiedHook, setCopiedHook] = useState(false);
  const rec = useRecorder(32);

  // On phones, default to Upload — the most reliable way to bring in an existing
  // recording (e.g. an iPhone Voice Memo) without fighting in-browser recording.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches) {
      setTab("upload");
    }
  }, []);

  const endpoint =
    typeof window !== "undefined" ? `${window.location.origin}/api/ingest` : "/api/ingest";

  function copyEndpoint() {
    navigator.clipboard?.writeText(endpoint).catch(() => {});
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 1600);
  }

  const recording = rec.recState === "recording";
  const recorded = rec.recState === "recorded";

  const hint =
    rec.recState === "recording"
      ? "Recording… tap the mic to stop"
      : rec.recState === "requesting"
        ? "Waiting for microphone permission…"
        : rec.recState === "denied"
          ? "Microphone blocked — allow it, then tap to retry"
          : rec.recState === "unsupported"
            ? "Recording unavailable — use Upload instead"
            : "Tap the mic to start recording your note";

  const micBg =
    rec.recState === "recording"
      ? "#B83C3C"
      : rec.recState === "denied" || rec.recState === "unsupported"
        ? "#9AA6AB"
        : "#0E3A4F";

  function transcribeRecording() {
    if (!rec.blob) return;
    const ext = extForMime(rec.blob.type || "");
    const stamp = formatClock(rec.recSecs).replace(":", "");
    void ingestAudio(rec.blob, `voice-note-${stamp}.${ext || "webm"}`);
    rec.discard();
    setView("inbox");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void ingestAudio(f, f.name);
    if (e.target) e.target.value = "";
    setView("inbox");
  }

  return (
    <section className="mx-auto max-w-[760px] px-[26px] pb-[60px] pt-[26px]">
      <div className="mb-[22px] flex max-w-[420px] gap-1 rounded-[11px] bg-tint-chip p-1">
        <button className={tabClass(tab === "record")} onClick={() => setTab("record")} data-tip-down data-tip="Record a note right now">
          Record
        </button>
        <button className={tabClass(tab === "upload")} onClick={() => setTab("upload")} data-tip-down data-tip="Upload an existing audio file">
          Upload
        </button>
        <button className={tabClass(tab === "webhook")} onClick={() => setTab("webhook")} data-tip-down data-tip="Connect an external recorder">
          Webhook
        </button>
      </div>

      {/* RECORD */}
      {tab === "record" && (
        <div className="rounded-[14px] border border-line bg-white px-8 py-9 text-center">
          {rec.recError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2.5 rounded-[10px] border border-warn-line bg-warn-bg px-3.5 py-3 text-left text-[13px] font-medium leading-relaxed text-warn-ink"
            >
              <AlertIcon size={17} className="mt-px flex-none" />
              <span>{rec.recError}</span>
            </div>
          )}

          {!recorded && (
            <>
              <button
                onClick={rec.toggle}
                aria-label="Start or stop recording"
                data-tip={rec.recState === "recording" ? "Stop recording" : rec.recState === "denied" ? "Retry — allow the microphone" : "Start recording"}
                className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-full border-none text-white shadow-[0_8px_24px_rgba(14,58,79,.28)]"
                style={{
                  background: micBg,
                  cursor: rec.recState === "requesting" ? "wait" : rec.recState === "unsupported" ? "not-allowed" : "pointer",
                  animation: recording || rec.recState === "requesting" ? "pulse 1.4s ease-in-out infinite" : "none",
                  pointerEvents: rec.recState === "requesting" || rec.recState === "unsupported" ? "none" : "auto",
                  opacity: rec.recState === "unsupported" ? 0.7 : 1,
                }}
              >
                <MicIcon size={30} />
              </button>
              <div className="my-[26px] mb-2.5 flex h-10 items-center justify-center gap-[3px]">
                {rec.levels.map((v, i) => (
                  <span
                    key={i}
                    className="w-[3px] flex-none rounded-[3px]"
                    style={{
                      height: recording ? "100%" : "5px",
                      background: recording ? "#0E3A4F" : "#CDD6D9",
                      transformOrigin: "center",
                      transform: recording ? `scaleY(${v.toFixed(3)})` : "none",
                      transition: "transform .08s linear",
                    }}
                  />
                ))}
              </div>
              <div className="text-[26px] font-bold tabular-nums tracking-[.5px]">
                {recording || rec.recSecs > 0 ? formatClock(rec.recSecs) : "0:00"}
              </div>
              <div className="mt-1.5 text-[13.5px] text-muted">{hint}</div>
            </>
          )}

          {recorded && (
            <>
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success">
                <CheckIcon size={24} />
              </div>
              <div className="mb-1 text-base font-bold">Recording ready</div>
              <div className="mb-[18px] text-[13.5px] text-muted">Give it a listen, then send it off to be drafted.</div>
              {rec.audioURL && (
                <audio controls src={rec.audioURL} className="mx-auto mb-[22px] block w-full max-w-[420px]" />
              )}
              <div className="flex justify-center gap-2.5">
                <button
                  onClick={rec.discard}
                  className="h-[42px] cursor-pointer rounded-[9px] border border-line bg-white px-[18px] text-sm font-semibold text-slate-600"
                  data-tip="Discard and record again"
                >
                  Re-record
                </button>
                <button
                  onClick={transcribeRecording}
                  className="h-[42px] cursor-pointer rounded-[9px] border-none bg-primary px-[22px] text-sm font-semibold text-white"
                  data-tip="Send this recording for transcription and drafting"
                >
                  Transcribe &amp; draft
                </button>
              </div>
            </>
          )}

          <div className="mt-[26px] text-[11.5px] leading-relaxed text-faint">
            Works in Chrome, Firefox, Edge and Safari. Your browser will ask for microphone permission the first time.
          </div>
        </div>
      )}

      {/* UPLOAD */}
      {tab === "upload" && (
        <>
          {/* A <label> opens the native file picker reliably on iOS Safari. */}
          <label
            className="group flex cursor-pointer flex-col items-center rounded-[14px] border-2 border-dashed border-[#CBD5D8] bg-white px-6 py-10 text-center hover:border-primary hover:bg-tint-soft sm:py-12"
            data-tip="Choose a voice note from your phone or computer"
          >
            <input
              type="file"
              accept={ACCEPT_AUDIO}
              onChange={onFile}
              className="sr-only"
              aria-label="Choose a voice note"
            />
            <span className="mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-[13px] bg-tint">
              <UploadIcon size={24} className="text-primary" />
            </span>
            <span className="mb-[5px] text-base font-bold">Upload a voice note</span>
            <span className="mb-1 text-[13.5px] text-muted">
              <strong className="font-bold text-slate-600">.m4a</strong> recommended · also MP3, WAV, MP4 or WEBM · up to 25&nbsp;min
            </span>
            <span className="mb-5 text-[12.5px] text-faint">
              Tap to choose from your phone — or drag a file here on desktop.
            </span>
            <span className="inline-flex h-[44px] items-center rounded-[9px] border border-primary bg-white px-[22px] text-sm font-semibold text-primary">
              Choose file
            </span>
          </label>

          <div className="mt-3 flex items-start gap-2.5 rounded-[11px] border border-line bg-tint-soft px-4 py-3 text-left text-[12.5px] leading-relaxed text-slate-500">
            <PhoneIcon size={17} className="mt-px flex-none text-primary" />
            <span>
              <strong className="font-semibold text-slate-600">On iPhone:</strong> open{" "}
              <strong className="font-semibold">Voice Memos</strong>, tap the note → the{" "}
              <strong>•••</strong> menu → <strong>Save to Files</strong> (or Share → Save to Files).
              Then tap <em>Choose file</em> above and pick it from <strong>Browse</strong>. Recent
              audio also shows directly in the picker.
            </span>
          </div>
        </>
      )}

      {/* WEBHOOK */}
      {tab === "webhook" && (
        <div className="rounded-[14px] border border-line bg-white p-7">
          <div className="mb-1.5 flex items-center gap-2">
            <h2 className="m-0 text-base font-bold">Connect a recorder</h2>
            <span
              className="rounded-full bg-success-bg px-2 py-[3px] text-[11px] font-semibold text-success"
              data-tip="This endpoint is live — POST audio and Relay drafts it automatically"
            >
              Live
            </span>
          </div>
          <p className="m-0 mb-[18px] text-[13.5px] leading-relaxed text-slate-400">
            POST audio from any device or service (a dictation app, Zapier, Make, n8n, your own script) and Relay will transcribe and draft it automatically — returning a ready-to-send email.
          </p>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Ingest endpoint</label>
          <div className="mb-[18px] flex gap-2">
            <input
              type="text"
              readOnly
              value={endpoint}
              aria-label="Webhook endpoint URL"
              className="h-10 flex-1 rounded-[9px] border border-line bg-canvas px-3 font-mono text-[13px] text-slate-600"
            />
            <button
              onClick={copyEndpoint}
              className="h-10 cursor-pointer rounded-[9px] border border-line bg-white px-3.5 text-[13px] font-semibold text-slate-600"
              data-tip="Copy the endpoint URL"
            >
              {copiedHook ? "Copied" : "Copy"}
            </button>
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Recommended Zap (Google Drive → Relay)</label>
          <div className="mb-[18px] flex flex-col gap-3.5">
            {[
              <><strong className="font-bold text-slate-600">Trigger:</strong> Google Drive — <em>New File in Folder</em> (your “Voice notes” folder).</>,
              <><strong className="font-bold text-slate-600">Action:</strong> Webhooks by Zapier — <em>POST</em> to the endpoint above with <code className="rounded bg-tint-chip px-1.5 py-px font-mono text-[12.5px]">{`{ "audioUrl": "{{file download URL}}" }`}</code>.</>,
              <>Relay transcribes (Whisper), drafts in your voice, and returns the email + HTML — store it or send it from the Zap.</>,
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-tint text-[12.5px] font-bold text-primary">
                  {i + 1}
                </span>
                <div className="text-[13.5px] leading-relaxed text-slate-600">{step}</div>
              </div>
            ))}
          </div>

          <label className="mb-1.5 block text-xs font-semibold text-slate-400">Or test from your terminal</label>
          <pre className="m-0 overflow-auto rounded-[10px] border border-line bg-ink px-3.5 py-3 font-mono text-[12px] leading-[1.6] text-white">{`curl -X POST ${endpoint} \\
  -F audio=@"voice-note.m4a"`}</pre>
          <p className="m-0 mt-2.5 text-[12px] leading-relaxed text-faint">
            Accepts a multipart <code className="rounded bg-tint-chip px-1 py-px font-mono">audio</code> file or JSON <code className="rounded bg-tint-chip px-1 py-px font-mono">{`{ audioUrl }`}</code>. Set <code className="rounded bg-tint-chip px-1 py-px font-mono">RELAY_INGEST_SECRET</code> to require an <code className="rounded bg-tint-chip px-1 py-px font-mono">x-relay-secret</code> header.
          </p>
        </div>
      )}
    </section>
  );
}
