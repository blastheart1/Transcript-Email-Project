"use client";

import type { Toast as ToastType } from "@/lib/store";

const DOT: Record<ToastType["kind"], string> = {
  ready: "#5FBF8E",
  info: "#E0B24D",
  error: "#E06A6A",
};

export function Toast({ toast }: { toast: ToastType }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[320] flex max-w-[90vw] -translate-x-1/2 items-center gap-[11px] rounded-xl bg-toast px-[18px] py-[13px] text-[13.5px] font-semibold text-white shadow-[0_14px_38px_rgba(16,36,43,.32)]"
    >
      <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: DOT[toast.kind] }} />
      <span>{toast.msg}</span>
    </div>
  );
}
