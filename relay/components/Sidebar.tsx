"use client";

import { useRelay } from "@/lib/store";
import { MicIcon, InboxIcon, SettingsIcon, HelpIcon } from "./icons";
import { UserMenu, type SessionUser } from "./UserMenu";

function navClass(active: boolean) {
  return [
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold cursor-pointer text-left border-none transition-colors",
    active ? "bg-primary text-white" : "bg-transparent text-slate-500 hover:bg-tint-row",
  ].join(" ");
}

export function Sidebar({ user }: { user: SessionUser | null }) {
  const { state, setView, openGuide } = useRelay();
  const readyCount = state.notes.filter((n) => n.status === "ready").length;
  const inboxActive = state.view === "inbox";

  return (
    <aside
      id="sidebar"
      className="hidden h-full w-[236px] flex-none flex-col overflow-y-auto border-r border-line bg-white px-4 py-[22px] md:flex"
    >
      <div className="brandblock mb-2 flex items-center gap-2.5 border-b border-[#EDF0F1] px-1.5 pb-5">
        <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg bg-primary">
          <MicIcon size={16} strokeWidth={2} className="text-white" />
        </div>
        <div>
          <div className="text-base font-bold leading-none tracking-[-.2px]">Relay</div>
          <div className="mt-0.5 text-[11px] font-medium text-muted">Voice notes → email</div>
        </div>
      </div>

      <nav className="navgroup flex flex-col gap-[3px]" aria-label="Primary">
        <button
          onClick={() => setView("inbox")}
          className={navClass(inboxActive)}
          data-tip-down
          data-tip="All captured voice notes and their drafts"
        >
          <InboxIcon size={17} />
          <span>Inbox</span>
          <span
            className={[
              "ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11.5px] font-bold",
              inboxActive ? "bg-white/20 text-white" : "bg-tint-chip text-slate-400",
            ].join(" ")}
          >
            {readyCount}
          </span>
        </button>
        <button
          onClick={() => setView("capture")}
          className={navClass(state.view === "capture")}
          data-tip-down
          data-tip="Record, upload, or connect a recorder"
        >
          <MicIcon size={17} />
          <span>New capture</span>
        </button>
        <button
          onClick={() => setView("settings")}
          className={navClass(state.view === "settings")}
          data-tip-down
          data-tip="Style profile and sending account"
        >
          <SettingsIcon size={17} />
          <span>Settings</span>
        </button>
      </nav>

      <div className="sidefoot mt-auto border-t border-[#EDF0F1] px-1.5 pb-1 pt-3.5">
        <button
          onClick={openGuide}
          className="flex w-full items-center gap-[9px] rounded-lg border border-line bg-tint-soft px-2.5 py-2.5 text-[13px] font-semibold text-slate-500 cursor-pointer"
          data-tip="Reopen the quick start guide"
        >
          <HelpIcon size={16} />
          Quick start guide
        </button>
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
