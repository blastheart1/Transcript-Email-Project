"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRelay, type View } from "@/lib/store";
import type { SessionUser } from "./UserMenu";
import { MicIcon, InboxIcon, SettingsIcon, HelpIcon, PlusIcon } from "./icons";

const TABS: { key: View; label: string; Icon: typeof InboxIcon }[] = [
  { key: "inbox", label: "Inbox", Icon: InboxIcon },
  { key: "capture", label: "Capture", Icon: MicIcon },
  { key: "settings", label: "Settings", Icon: SettingsIcon },
];

export function MobileNav({ user }: { user: SessionUser | null }) {
  const { state, setView, openGuide } = useRelay();
  const [menu, setMenu] = useState(false);
  const readyCount = state.notes.filter(
    (n) => !n.archived && (n.status === "ready" || n.status === "needs_review"),
  ).length;

  function go(v: View) {
    setView(v);
    setMenu(false);
  }

  return (
    <>
      {/* Top brand bar */}
      <header className="pt-safe fixed inset-x-0 top-0 z-40 border-b border-line bg-white md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => go("inbox")} className="flex items-center gap-2 border-none bg-transparent">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MicIcon size={16} strokeWidth={2} className="text-white" />
            </span>
            <span className="text-[15px] font-bold tracking-[-.2px]">Relay</span>
          </button>
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Account and help"
            aria-expanded={menu}
            className="flex h-9 min-w-[36px] items-center justify-center rounded-full border border-line bg-white px-2 text-[11px] font-bold text-primary"
          >
            {user ? initials(user) : "•••"}
          </button>
        </div>

        {menu && (
          <>
            <button
              aria-label="Close menu"
              onClick={() => setMenu(false)}
              className="fixed inset-0 z-40 cursor-default border-none bg-transparent"
            />
            <div className="absolute right-3 top-[54px] z-50 w-60 overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_40px_rgba(16,36,43,.18)]">
              {user ? (
                <div className="border-b border-line-soft px-3.5 py-2.5">
                  <div className="truncate text-[13px] font-semibold">{user.name || "Signed in"}</div>
                  <div className="truncate text-[11.5px] text-muted">{user.email}</div>
                </div>
              ) : null}
              <button
                onClick={() => {
                  openGuide();
                  setMenu(false);
                }}
                className="flex w-full items-center gap-2.5 border-none bg-white px-3.5 py-3 text-left text-[13.5px] font-semibold text-slate-600"
              >
                <HelpIcon size={16} /> Quick start guide
              </button>
              {user ? (
                <button
                  onClick={() => {
                    document.cookie = "relay_guest=; path=/; max-age=0; samesite=lax";
                    void signOut({ redirectTo: "/login" });
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-line-soft bg-white px-3.5 py-3 text-left text-[13.5px] font-semibold text-slate-600"
                >
                  Sign out
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex w-full items-center gap-2.5 border-t border-line-soft bg-white px-3.5 py-3 text-left text-[13.5px] font-semibold text-primary"
                >
                  Sign in
                </a>
              )}
            </div>
          </>
        )}
      </header>

      {/* Bottom tab bar */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden" aria-label="Primary">
        <div className="flex">
          {TABS.map(({ key, label, Icon }) => {
            const active = state.view === key || (key === "inbox" && state.view === "draft");
            return (
              <button
                key={key}
                onClick={() => go(key)}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 ${active ? "text-primary" : "text-slate-400"}`}
              >
                {key === "capture" ? <PlusIcon size={22} strokeWidth={2} /> : <Icon size={22} />}
                <span className="text-[11px] font-semibold">{label}</span>
                {key === "inbox" && readyCount > 0 && (
                  <span className="absolute right-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {readyCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

function initials(user: SessionUser): string {
  const base = user.name || user.email || "?";
  return base
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}
