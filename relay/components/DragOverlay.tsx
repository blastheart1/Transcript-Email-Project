"use client";

import type { ReactNode } from "react";

export function DragOverlay({ icon }: { icon: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(14,58,79,.16)] p-8"
    >
      <div className="rounded-[18px] border-[2.5px] border-dashed border-primary bg-white/[.97] px-[58px] py-11 text-center shadow-[0_24px_64px_rgba(16,36,43,.28)]">
        <div className="mx-auto mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-[14px] bg-tint">
          {icon}
        </div>
        <div className="text-[19px] font-bold tracking-[-.2px]">Drop your voice note to transcribe</div>
        <div className="mt-1.5 text-[13.5px] text-slate-400">
          MP3, M4A, WAV or MP4 — Relay will draft the email automatically
        </div>
      </div>
    </div>
  );
}
