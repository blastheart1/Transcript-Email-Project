"use client";

import { useRelay, type View } from "@/lib/store";
import { PlusIcon } from "./icons";

const TITLES: Record<View, [string, string]> = {
  inbox: ["Inbox", "Your voice notes and drafts"],
  capture: ["New capture", "Record, upload, or connect a source"],
  draft: ["Draft review", ""],
  settings: ["Settings", "Profile and account"],
};

export function Header() {
  const { state, setView } = useRelay();
  const [title, sub] = TITLES[state.view];

  return (
    <header className="sticky top-0 z-20 hidden h-[62px] flex-none items-center justify-between border-b border-line bg-white px-[26px] md:flex">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="m-0 text-[17px] font-bold tracking-[-.2px]">{title}</h1>
        {sub && <span className="text-[13px] font-medium text-muted">{sub}</span>}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setView("capture")}
          className="flex h-[38px] cursor-pointer items-center gap-[7px] rounded-lg border-none bg-primary px-[15px] text-[13.5px] font-semibold text-white"
          data-tip="Start a new voice note"
        >
          <PlusIcon size={15} />
          New capture
        </button>
      </div>
    </header>
  );
}
