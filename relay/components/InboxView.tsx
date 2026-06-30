"use client";

import { useMemo } from "react";
import { useRelay, type InboxFilter } from "@/lib/store";
import { statusInfo } from "@/lib/status";
import type { Note } from "@/lib/types";
import { SearchIcon } from "./icons";

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "sent", label: "Sent" },
];

function snippet(text: string) {
  return text.length > 96 ? text.slice(0, 96) + "…" : text;
}

function matches(note: Note, q: string, filter: InboxFilter) {
  if (filter === "drafts" && !(note.status === "ready" || note.status === "transcribing")) return false;
  if (filter === "sent" && note.status !== "sent") return false;
  if (!q) return true;
  const hay = `${note.person} ${note.subject} ${note.transcript}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function InboxView() {
  const { state, dispatch, selectNote } = useRelay();
  const rows = useMemo(
    () => state.notes.filter((n) => matches(n, state.search, state.filter)),
    [state.notes, state.search, state.filter],
  );

  return (
    <section className="mx-auto max-w-[920px] px-[26px] pb-[60px] pt-[26px]">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={state.search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", search: e.target.value })}
            placeholder="Search voice notes"
            aria-label="Search voice notes"
            className="h-10 w-full rounded-[9px] border border-line bg-white pl-9 pr-3 text-sm"
            data-tip-down
            data-tip="Search by recipient, subject, or what you said"
          />
        </div>
        <div className="flex gap-1.5 rounded-[9px] bg-tint-chip p-1">
          {FILTERS.map((f) => {
            const active = state.filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => dispatch({ type: "SET_FILTER", filter: f.key })}
                className={[
                  "rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  active ? "bg-white font-semibold shadow-[0_1px_2px_rgba(16,36,43,.06)]" : "font-medium text-slate-400",
                ].join(" ")}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {rows.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted">
            {state.loading ? "Loading your voice notes…" : "No voice notes match your search."}
          </div>
        )}
        {rows.map((note) => {
          const si = statusInfo(note.status);
          return (
            <button
              key={note.id}
              onClick={() => selectNote(note.id)}
              className="flex w-full items-center gap-4 border-b border-line-soft bg-white px-[18px] py-4 text-left last:border-b-0 hover:bg-tint-row"
            >
              <span
                aria-hidden="true"
                className="h-[9px] w-[9px] flex-none rounded-full"
                style={{ background: si.dot }}
              />
              <div className="w-[148px] min-w-0 flex-none">
                <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-[.5px] text-muted">
                  {note.type}
                </div>
                <div className="truncate text-[14.5px] font-bold">{note.person}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 truncate text-sm font-semibold text-slate-700">
                  {note.subject}
                </div>
                <div className="truncate text-[13px] text-muted">{snippet(note.transcript)}</div>
              </div>
              <div className="flex flex-none flex-col items-end gap-[7px]">
                <span className="text-xs text-faint">{note.received}</span>
                <span
                  tabIndex={0}
                  data-tip={si.tip}
                  className="whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11.5px] font-bold"
                  style={{ background: si.badgeBg, color: si.badgeColor }}
                >
                  {si.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="mx-0.5 mt-3.5 text-center text-[12.5px] text-faint">
        Drafts are generated automatically and held here for your review — nothing sends without you.
      </p>
    </section>
  );
}
