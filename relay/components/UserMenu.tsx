"use client";

import { signOut } from "next-auth/react";

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
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

export function UserMenu({ user }: { user: SessionUser | null }) {
  if (!user) {
    return (
      <div className="mt-3 flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-[9px] min-w-0">
          <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-tint-chip text-xs font-bold text-slate-400">
            ?
          </div>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold">Guest</div>
            <div className="truncate text-[11px] text-muted">Not signed in</div>
          </div>
        </div>
        <a
          href="/login"
          className="flex-none text-[12px] font-semibold text-primary"
          data-tip="Sign in to your account"
        >
          Sign in
        </a>
      </div>
    );
  }

  function handleSignOut() {
    document.cookie = "relay_guest=; path=/; max-age=0; samesite=lax";
    void signOut({ redirectTo: "/login" });
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-2 px-1">
      <div className="flex min-w-0 items-center gap-[9px]">
        <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#DCE6E8] text-xs font-bold text-primary">
          {initials(user)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold">{user.name || "Signed in"}</div>
          <div className="truncate text-[11px] text-muted">{user.email}</div>
        </div>
      </div>
      <button
        onClick={handleSignOut}
        aria-label="Sign out"
        className="flex-none cursor-pointer border-none bg-transparent text-[12px] font-semibold text-slate-400 hover:text-primary"
        data-tip="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}
