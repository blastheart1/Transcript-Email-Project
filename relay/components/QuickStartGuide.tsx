"use client";

import { useRelay } from "@/lib/store";
import { CloseIcon } from "./icons";

const STEPS = [
  {
    title: "Capture a voice note",
    body: "Record in the app, upload an audio file, or post one in from any recorder via webhook.",
  },
  {
    title: "Review the draft side by side",
    body: "See your transcript next to the email. Anything Relay guessed is highlighted so you can confirm it fast.",
    highlight: "highlighted",
  },
  {
    title: "Tune, then send",
    body: "Adjust tone or length, edit inline, then copy or open it in your email — ready to send.",
  },
];

export function QuickStartGuide() {
  const { closeGuide } = useRelay();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(16,36,43,.5)] p-6"
      onClick={closeGuide}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick start guide"
        className="max-h-[90vh] w-full max-w-[560px] overflow-auto rounded-[18px] bg-white shadow-[0_24px_70px_rgba(16,36,43,.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-[26px] pt-[26px]">
          <div>
            <div className="mb-[7px] text-[11.5px] font-bold uppercase tracking-[.7px] text-primary">Quick start</div>
            <h2 className="m-0 text-[22px] font-bold tracking-[-.3px]">Voice note in, polished email out</h2>
            <p className="m-0 mt-2 text-sm leading-relaxed text-slate-400">
              Three steps. Relay drafts; you stay in control of every send.
            </p>
          </div>
          <button
            onClick={closeGuide}
            aria-label="Close guide"
            className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-slate-400"
            data-tip="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1 px-[26px] pb-2 pt-[22px]">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-[15px] rounded-xl p-3.5 hover:bg-tint-row">
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] bg-tint text-[15px] font-bold text-primary">
                {i + 1}
              </div>
              <div>
                <div className="mb-[3px] text-[15px] font-bold">{step.title}</div>
                <div className="text-[13.5px] leading-relaxed text-slate-400">
                  {step.highlight ? (
                    <>
                      {step.body.split(step.highlight)[0]}
                      <mark className="rounded-[2px] border-b-[1.5px] border-dashed border-warn-mark bg-warn-bg px-0.5 text-warn-ink">
                        {step.highlight}
                      </mark>
                      {step.body.split(step.highlight)[1]}
                    </>
                  ) : (
                    step.body
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-3 px-[26px] pb-[26px] pt-4">
          <span className="text-[12.5px] text-faint">You can reopen this anytime from the sidebar.</span>
          <button
            onClick={closeGuide}
            className="h-11 cursor-pointer rounded-[10px] border-none bg-primary px-[26px] text-[14.5px] font-semibold text-white"
            data-tip="Jump into your inbox"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}
