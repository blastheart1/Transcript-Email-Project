"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Note,
  Tone,
  Length,
  TranscribeResponse,
  DraftResponse,
  StyleSampleRecord,
} from "./types";
import { DEFAULT_SIGN_OFF, DEFAULT_TONE, DEFAULT_LENGTH, SENDER } from "./constants";
import { DEFAULT_MODEL_ID } from "./models";

export type View = "inbox" | "capture" | "draft" | "settings";
export type InboxFilter = "all" | "drafts" | "sent";
export interface Toast {
  kind: "info" | "ready" | "error";
  msg: string;
}
export interface ProviderAvailability {
  openai: boolean;
  anthropic: boolean;
}

interface State {
  notes: Note[];
  view: View;
  selectedId: string | null;
  search: string;
  filter: InboxFilter;
  editing: boolean;
  tone: Tone;
  length: Length;
  model: string;
  styleSamples: StyleSampleRecord[];
  providers: ProviderAvailability | null;
  loading: boolean;
  regenerating: boolean;
  guide: boolean;
  copied: boolean;
  dragging: boolean;
  toast: Toast | null;
}

type Action =
  | { type: "SET_VIEW"; view: View }
  | { type: "SELECT_NOTE"; id: string }
  | { type: "SET_SEARCH"; search: string }
  | { type: "SET_FILTER"; filter: InboxFilter }
  | { type: "SET_EDITING"; editing: boolean }
  | { type: "SET_TONE"; tone: Tone }
  | { type: "SET_LENGTH"; length: Length }
  | { type: "SET_MODEL"; model: string }
  | { type: "SET_STYLES"; samples: StyleSampleRecord[] }
  | { type: "SET_PROVIDERS"; providers: ProviderAvailability }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_REGENERATING"; value: boolean }
  | { type: "SET_GUIDE"; value: boolean }
  | { type: "SET_COPIED"; value: boolean }
  | { type: "SET_DRAGGING"; value: boolean }
  | { type: "SET_TOAST"; toast: Toast | null }
  | { type: "ADD_NOTE"; note: Note }
  | { type: "UPDATE_NOTE"; id: string; patch: Partial<Note> }
  | { type: "REMOVE_NOTE"; id: string }
  | { type: "SET_NOTES"; notes: Note[] };

const MODEL_KEY = "relay.model.v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, view: action.view, copied: false };
    case "SELECT_NOTE": {
      const note = state.notes.find((n) => n.id === action.id);
      return {
        ...state,
        view: "draft",
        selectedId: action.id,
        editing: false,
        copied: false,
        tone: note?.tone ?? DEFAULT_TONE,
        length: note?.length ?? DEFAULT_LENGTH,
      };
    }
    case "SET_SEARCH":
      return { ...state, search: action.search };
    case "SET_FILTER":
      return { ...state, filter: action.filter };
    case "SET_EDITING":
      return { ...state, editing: action.editing };
    case "SET_TONE":
      return { ...state, tone: action.tone };
    case "SET_LENGTH":
      return { ...state, length: action.length };
    case "SET_MODEL":
      return { ...state, model: action.model };
    case "SET_STYLES":
      return { ...state, styleSamples: action.samples };
    case "SET_PROVIDERS":
      return { ...state, providers: action.providers };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_REGENERATING":
      return { ...state, regenerating: action.value };
    case "SET_GUIDE":
      return { ...state, guide: action.value };
    case "SET_COPIED":
      return { ...state, copied: action.value };
    case "SET_DRAGGING":
      return { ...state, dragging: action.value };
    case "SET_TOAST":
      return { ...state, toast: action.toast };
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes.filter((n) => n.id !== action.note.id)] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.id ? { ...n, ...action.patch } : n)),
      };
    case "REMOVE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
    case "SET_NOTES": {
      // Preserve any locally-held audio object URLs across a server refresh.
      const audio = new Map(state.notes.map((n) => [n.id, n.audioURL] as const));
      const notes = action.notes.map((n) => ({ ...n, audioURL: n.audioURL ?? audio.get(n.id) ?? null }));
      return { ...state, notes };
    }
    default:
      return state;
  }
}

const initialState: State = {
  notes: [],
  view: "inbox",
  selectedId: null,
  search: "",
  filter: "all",
  editing: false,
  tone: DEFAULT_TONE,
  length: DEFAULT_LENGTH,
  model: DEFAULT_MODEL_ID,
  styleSamples: [],
  providers: null,
  loading: true,
  regenerating: false,
  guide: true,
  copied: false,
  dragging: false,
  toast: null,
};

interface RelayContextValue {
  state: State;
  dispatch: React.Dispatch<Action>;
  currentNote: () => Note | undefined;
  setView: (v: View) => void;
  selectNote: (id: string) => void;
  openGuide: () => void;
  closeGuide: () => void;
  setModel: (id: string) => void;
  addStyleSample: (sample: { title: string; body: string }) => Promise<void>;
  removeStyleSample: (id: string) => Promise<void>;
  showToast: (toast: Toast, ms?: number) => void;
  /** Persist a note patch to the server (also updates local state). */
  saveNote: (id: string, patch: Partial<Note>) => Promise<void>;
  /** Record → transcribe → draft, persisting to the DB. */
  ingestAudio: (file: File | Blob, displayName: string) => Promise<void>;
  /** Re-draft the current note with the active tone/length/model. */
  regenerate: (id?: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
}

const RelayContext = createContext<RelayContextValue | null>(null);

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(error || `Request failed (${res.status}).`);
  }
  return (await res.json()) as T;
}

export function RelayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = useRef(state.view);
  const editingRef = useRef(state.editing);
  viewRef.current = state.view;
  editingRef.current = state.editing;

  const showToast = useCallback((toast: Toast, ms = 3400) => {
    dispatch({ type: "SET_TOAST", toast });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: "SET_TOAST", toast: null }), ms);
  }, []);

  const refreshNotes = useCallback(async () => {
    try {
      const { notes } = await api<{ notes: Note[] }>("/api/notes");
      dispatch({ type: "SET_NOTES", notes });
    } catch {
      /* keep current notes on transient failure */
    }
  }, []);

  // Initial load: notes, style samples, providers, saved model.
  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(MODEL_KEY);
        if (saved) dispatch({ type: "SET_MODEL", model: saved });
      } catch {
        /* ignore */
      }
      const [notesRes, stylesRes, providersRes] = await Promise.allSettled([
        api<{ notes: Note[] }>("/api/notes"),
        api<{ styleSamples: StyleSampleRecord[] }>("/api/style-samples"),
        api<ProviderAvailability>("/api/providers"),
      ]);
      if (notesRes.status === "fulfilled") dispatch({ type: "SET_NOTES", notes: notesRes.value.notes });
      if (stylesRes.status === "fulfilled") dispatch({ type: "SET_STYLES", samples: stylesRes.value.styleSamples });
      if (providersRes.status === "fulfilled") dispatch({ type: "SET_PROVIDERS", providers: providersRes.value });
      dispatch({ type: "SET_LOADING", value: false });
    })();
  }, []);

  // Keep the inbox fresh (webhook-ingested drafts appear) without clobbering edits.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible" && viewRef.current === "inbox" && !editingRef.current) {
        void refreshNotes();
      }
    };
    const interval = setInterval(tick, 15000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", tick);
    };
  }, [refreshNotes]);

  // Persist model choice (UI preference).
  useEffect(() => {
    try {
      localStorage.setItem(MODEL_KEY, state.model);
    } catch {
      /* ignore */
    }
  }, [state.model]);

  const currentNote = useCallback(
    () => state.notes.find((n) => n.id === state.selectedId),
    [state.notes, state.selectedId],
  );

  const setView = useCallback((v: View) => dispatch({ type: "SET_VIEW", view: v }), []);
  const selectNote = useCallback((id: string) => dispatch({ type: "SELECT_NOTE", id }), []);
  const openGuide = useCallback(() => dispatch({ type: "SET_GUIDE", value: true }), []);
  const closeGuide = useCallback(() => dispatch({ type: "SET_GUIDE", value: false }), []);
  const setModel = useCallback((id: string) => dispatch({ type: "SET_MODEL", model: id }), []);

  const saveNote = useCallback(
    async (id: string, patch: Partial<Note>) => {
      dispatch({ type: "UPDATE_NOTE", id, patch });
      try {
        // audioURL is a local object URL — never persist it.
        const { audioURL: _omit, ...serverPatch } = patch;
        await api(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(serverPatch),
        });
      } catch (err) {
        showToast({ kind: "error", msg: err instanceof Error ? err.message : "Couldn't save." }, 4000);
      }
    },
    [showToast],
  );

  const addStyleSample = useCallback(
    async (sample: { title: string; body: string }) => {
      try {
        const { styleSample } = await api<{ styleSample: StyleSampleRecord }>("/api/style-samples", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sample),
        });
        dispatch({ type: "SET_STYLES", samples: [...state.styleSamples, styleSample] });
      } catch (err) {
        showToast({ kind: "error", msg: err instanceof Error ? err.message : "Couldn't add sample." }, 4000);
      }
    },
    [state.styleSamples, showToast],
  );

  const removeStyleSample = useCallback(
    async (id: string) => {
      const prev = state.styleSamples;
      dispatch({ type: "SET_STYLES", samples: prev.filter((s) => s.id !== id) });
      try {
        await api("/api/style-samples", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch (err) {
        dispatch({ type: "SET_STYLES", samples: prev }); // rollback
        showToast({ kind: "error", msg: err instanceof Error ? err.message : "Couldn't remove sample." }, 4000);
      }
    },
    [state.styleSamples, showToast],
  );

  const draftFor = useCallback(
    async (transcript: string, segments: Note["segments"], tone: Tone, length: Length, model: string) => {
      return api<DraftResponse & { provider?: string; model?: string }>("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          segments,
          tone,
          length,
          model,
          styleSamples: state.styleSamples.map((s) => s.body),
          signOff: DEFAULT_SIGN_OFF,
          senderName: SENDER.name,
        }),
      });
    },
    [state.styleSamples],
  );

  const ingestAudio = useCallback(
    async (file: File | Blob, displayName: string) => {
      const nice = displayName.replace(/\.[^.]+$/, "");
      const audioURL = URL.createObjectURL(file);
      let id: string;
      try {
        const { note } = await api<{ note: Note }>("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person: "New recipient",
            type: "Note",
            subject: nice,
            status: "transcribing",
            received: "Just now",
            duration: "—",
            transcript: "Transcribing…",
            source: "upload",
          }),
        });
        id = note.id;
        dispatch({ type: "ADD_NOTE", note: { ...note, audioURL } });
        dispatch({ type: "SELECT_NOTE", id });
      } catch (err) {
        showToast({ kind: "error", msg: err instanceof Error ? err.message : "Couldn't create note." }, 5000);
        return;
      }

      showToast({ kind: "info", msg: `Added “${displayName}” — transcribing now…` });
      try {
        const fd = new FormData();
        fd.append("audio", file, displayName);
        const t = await (async () => {
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          if (!res.ok) {
            const { error } = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(error || "Transcription failed.");
          }
          return (await res.json()) as TranscribeResponse;
        })();
        await saveNote(id, { transcript: t.transcript, duration: t.duration, segments: t.segments });

        const draft = await draftFor(t.transcript, t.segments, state.tone, state.length, state.model);
        await saveNote(id, {
          status: "ready",
          type: draft.type,
          person: draft.person || "New recipient",
          subject: draft.subject || nice,
          toEmail: draft.toEmail,
          paragraphs: draft.paragraphs,
          assumptions: draft.assumptions,
          tone: state.tone,
          length: state.length,
          model: draft.model,
          provider: draft.provider,
        });
        showToast({ kind: "ready", msg: `“${draft.subject || nice}” is drafted and ready to review.` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        await saveNote(id, { status: "error", errorMessage: msg });
        showToast({ kind: "error", msg }, 5000);
      }
    },
    [state.tone, state.length, state.model, showToast, saveNote, draftFor],
  );

  const regenerate = useCallback(
    async (id?: string) => {
      const noteId = id ?? state.selectedId;
      if (!noteId) return;
      const note = state.notes.find((n) => n.id === noteId);
      if (!note || !note.transcript) return;
      dispatch({ type: "SET_REGENERATING", value: true });
      try {
        const draft = await draftFor(note.transcript, note.segments, state.tone, state.length, state.model);
        await saveNote(noteId, {
          type: draft.type,
          subject: draft.subject || note.subject,
          toEmail: note.toEmail || draft.toEmail,
          paragraphs: draft.paragraphs,
          assumptions: draft.assumptions,
          tone: state.tone,
          length: state.length,
          model: draft.model,
          provider: draft.provider,
        });
      } catch (err) {
        showToast({ kind: "error", msg: err instanceof Error ? err.message : "Couldn't regenerate." }, 5000);
      } finally {
        dispatch({ type: "SET_REGENERATING", value: false });
      }
    },
    [state.selectedId, state.notes, state.tone, state.length, state.model, draftFor, saveNote, showToast],
  );

  const value: RelayContextValue = {
    state,
    dispatch,
    currentNote,
    setView,
    selectNote,
    openGuide,
    closeGuide,
    setModel,
    addStyleSample,
    removeStyleSample,
    showToast,
    saveNote,
    ingestAudio,
    regenerate,
    refreshNotes,
  };

  return <RelayContext.Provider value={value}>{children}</RelayContext.Provider>;
}

export function useRelay(): RelayContextValue {
  const ctx = useContext(RelayContext);
  if (!ctx) throw new Error("useRelay must be used within RelayProvider");
  return ctx;
}
