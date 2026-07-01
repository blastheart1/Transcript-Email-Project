"use client";

import { useMemo } from "react";
import { useRelay, type InboxFilter } from "@/lib/store";
import { statusInfo } from "@/lib/status";
import type { Note } from "@/lib/types";
import { SearchIcon, ArchiveIcon, UnarchiveIcon } from "./icons";

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "sent", label: "Sent" },
  { key: "archived", label: "Archived" },
];

function snippet(text: string) {
  return text.length > 96 ? text.slice(0, 96) + "…" : text;
}

function matches(note: Note, q: string, filter: InboxFilter) {
  const archived = !!note.archived;
  if (filter === "archived") {
    if (!archived) return false;
  } else {
    if (archived) return false;
    if (
      filter === "drafts" &&
      !(note.status === "ready" || note.status === "transcribing" || note.status === "needs_review")
    )
      return false;
    if (filter === "sent" && note.status !== "sent") return false;
  }
  if (!q) return true;
  const hay = `${note.person} ${note.subject} ${note.transcript}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

export function InboxView() {
  const { state, dispatch, selectNote, saveNote, showToast } = useRelay();
  const rows = useMemo(
    () => state.notes.filter((n) => matches(n, state.search, state.filter)),
    [state.notes, state.search, state.filter],
  );

  function toggleArchive(note: Note) {
    const next = !note.archived;
    void saveNote(note.id, { archived: next });
    showToast({ kind: next ? "info" : "ready", msg: next ? "Note archived." : "Note restored to inbox." });
  }

  function ArchiveButton({ note }: { note: Note }) {
    const archived = !!note.archived;
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleArchive(note);
        }}
        aria-label={archived ? "Restore from archive" : "Archive note"}
        data-tip={archived ? "Restore to inbox" : "Archive"}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-primary"
      >
        {archived ? <UnarchiveIcon size={16} /> : <ArchiveIcon size={16} />}
      </button>
    );
  }

  const emptyMsg = state.loading
    ? "Loading your voice notes…"
    : state.filter === "archived"
      ? "No archived notes."
      : "No voice notes match your search.";

  return (
    <section className="mx-auto max-w-[920px] px-4 pb-10 pt-5 md:px-[26px] md:pb-[60px] md:pt-[26px]">
      <div className="mb-[18px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", search: e.target.value })}
            placeholder="Search voice notes"
            aria-label="Search voice notes"
            className="h-11 w-full rounded-[10px] border border-line bg-white pl-9 pr-3 text-sm md:h-10"
            data-tip-down
            data-tip="Search by recipient, subject, or what you said"
          />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="inline-flex gap-1.5 rounded-[10px] bg-tint-chip p-1">
            {FILTERS.map((f) => {
              const active = state.filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => dispatch({ type: "SET_FILTER", filter: f.key })}
                  className={[
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors",
                    active ? "bg-white font-semibold shadow-[0_1px_2px_rgba(16,36,43,.06)]" : "font-medium text-slate-400",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-5 py-12 text-center text-sm text-muted">
          {emptyMsg}
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards (no chopped columns) */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {rows.map((note) => {
              const si = statusInfo(note.status);
              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectNote(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectNote(note.id);
                    }
                  }}
                  className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-line bg-white p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: si.dot }} />
                      <span className="truncate text-[11px] font-semibold uppercase tracking-[.5px] text-muted">
                        {note.type}
                      </span>
                    </div>
                    <span className="flex-none text-[11.5px] text-faint">{note.received}</span>
                  </div>
                  <div className="text-[15px] font-bold leading-snug">{note.person}</div>
                  <div className="line-clamp-1 text-[13.5px] font-semibold text-slate-700">{note.subject}</div>
                  <div className="line-clamp-2 text-[12.5px] leading-snug text-muted">{snippet(note.transcript)}</div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span
                      className="whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11.5px] font-bold"
                      style={{ background: si.badgeBg, color: si.badgeColor }}
                    >
                      {si.label}
                    </span>
                    <ArchiveButton note={note} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: dense row list (unchanged) */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-white md:block">
            {rows.map((note) => {
              const si = statusInfo(note.status);
              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectNote(note.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectNote(note.id);
                    }
                  }}
                  className="group flex w-full cursor-pointer items-center gap-4 border-b border-line-soft bg-white px-[18px] py-4 text-left last:border-b-0 hover:bg-tint-row"
                >
                  <span aria-hidden="true" className="h-[9px] w-[9px] flex-none rounded-full" style={{ background: si.dot }} />
                  <div className="w-[148px] min-w-0 flex-none">
                    <div className="mb-[3px] text-[11px] font-semibold uppercase tracking-[.5px] text-muted">{note.type}</div>
                    <div className="truncate text-[14.5px] font-bold">{note.person}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 truncate text-sm font-semibold text-slate-700">{note.subject}</div>
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
                  <div className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                    <ArchiveButton note={note} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mx-0.5 mt-3.5 text-center text-[12.5px] text-faint">
        Drafts are generated automatically and held here for your review — nothing sends without you.
      </p>
    </section>
  );
}
