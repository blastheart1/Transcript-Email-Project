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
import type { Note, Tone, Length, TranscribeResponse, DraftResponse } from "./types";
import { SEED_NOTES } from "./seed";
import {
  STYLE_SAMPLES,
  DEFAULT_SIGN_OFF,
  DEFAULT_TONE,
  DEFAULT_LENGTH,
  SENDER,
  type StyleSample,
} from "./constants";
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
  styleSamples: StyleSample[];
  providers: ProviderAvailability | null;
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
  | { type: "ADD_STYLE_SAMPLE"; sample: StyleSample }
  | { type: "REMOVE_STYLE_SAMPLE"; index: number }
  | { type: "HYDRATE_STYLES"; samples: StyleSample[] }
  | { type: "SET_PROVIDERS"; providers: ProviderAvailability }
  | { type: "SET_REGENERATING"; value: boolean }
  | { type: "SET_GUIDE"; value: boolean }
  | { type: "SET_COPIED"; value: boolean }
  | { type: "SET_DRAGGING"; value: boolean }
  | { type: "SET_TOAST"; toast: Toast | null }
  | { type: "ADD_NOTE"; note: Note }
  | { type: "UPDATE_NOTE"; id: string; patch: Partial<Note> }
  | { type: "HYDRATE"; notes: Note[] };

const STORAGE_KEY = "relay.notes.v1";
const MODEL_KEY = "relay.model.v1";
const STYLES_KEY = "relay.styles.v1";

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
    case "ADD_STYLE_SAMPLE":
      return { ...state, styleSamples: [...state.styleSamples, action.sample] };
    case "REMOVE_STYLE_SAMPLE":
      return { ...state, styleSamples: state.styleSamples.filter((_, i) => i !== action.index) };
    case "HYDRATE_STYLES":
      return { ...state, styleSamples: action.samples };
    case "SET_PROVIDERS":
      return { ...state, providers: action.providers };
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
      return { ...state, notes: [action.note, ...state.notes] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.id ? { ...n, ...action.patch } : n)),
      };
    case "HYDRATE":
      return { ...state, notes: action.notes };
    default:
      return state;
  }
}

const initialState: State = {
  notes: SEED_NOTES,
  view: "inbox",
  selectedId: "n1",
  search: "",
  filter: "all",
  editing: false,
  tone: DEFAULT_TONE,
  length: DEFAULT_LENGTH,
  model: DEFAULT_MODEL_ID,
  styleSamples: STYLE_SAMPLES,
  providers: null,
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
  addStyleSample: (sample: StyleSample) => void;
  removeStyleSample: (index: number) => void;
  showToast: (toast: Toast, ms?: number) => void;
  /** Upload/record handoff: create a note, transcribe, then draft. */
  ingestAudio: (file: File | Blob, displayName: string) => Promise<void>;
  /** Re-draft the current note with the active tone/length. */
  regenerate: (id?: string) => Promise<void>;
}

const RelayContext = createContext<RelayContextValue | null>(null);

export function RelayProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  // Hydrate notes + preferred model from localStorage; fetch provider availability.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const notes = JSON.parse(raw) as Note[];
        if (Array.isArray(notes) && notes.length) dispatch({ type: "HYDRATE", notes });
      }
      const savedModel = localStorage.getItem(MODEL_KEY);
      if (savedModel) dispatch({ type: "SET_MODEL", model: savedModel });
      const savedStyles = localStorage.getItem(STYLES_KEY);
      if (savedStyles) {
        const samples = JSON.parse(savedStyles) as StyleSample[];
        if (Array.isArray(samples)) dispatch({ type: "HYDRATE_STYLES", samples });
      }
    } catch {
      /* ignore corrupt storage */
    }
    hydrated.current = true;

    fetch("/api/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (p) dispatch({ type: "SET_PROVIDERS", providers: p as ProviderAvailability });
      })
      .catch(() => {});
  }, []);

  // Persist notes (without volatile object URLs) whenever they change.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      // Object URLs don't survive a reload; drop them before persisting.
      const serializable = state.notes.map((n) => ({ ...n, audioURL: undefined }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      /* ignore quota errors */
    }
  }, [state.notes]);

  // Persist the chosen model.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(MODEL_KEY, state.model);
    } catch {
      /* ignore */
    }
  }, [state.model]);

  // Persist style samples.
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STYLES_KEY, JSON.stringify(state.styleSamples));
    } catch {
      /* ignore */
    }
  }, [state.styleSamples]);

  const currentNote = useCallback(
    () => state.notes.find((n) => n.id === state.selectedId),
    [state.notes, state.selectedId],
  );

  const setView = useCallback((v: View) => dispatch({ type: "SET_VIEW", view: v }), []);
  const selectNote = useCallback((id: string) => dispatch({ type: "SELECT_NOTE", id }), []);
  const openGuide = useCallback(() => dispatch({ type: "SET_GUIDE", value: true }), []);
  const closeGuide = useCallback(() => dispatch({ type: "SET_GUIDE", value: false }), []);
  const setModel = useCallback((id: string) => dispatch({ type: "SET_MODEL", model: id }), []);

  const showToast = useCallback((toast: Toast, ms = 3400) => {
    dispatch({ type: "SET_TOAST", toast });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => dispatch({ type: "SET_TOAST", toast: null }), ms);
  }, []);

  const draftNote = useCallback(
    async (
      id: string,
      transcript: string,
      segments: Note["segments"],
      tone: Tone,
      length: Length,
      model: string,
      styleSamples: string[],
    ) => {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          segments,
          tone,
          length,
          model,
          styleSamples,
          signOff: DEFAULT_SIGN_OFF,
          senderName: SENDER.name,
        }),
      });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(error || "Drafting failed.");
      }
      return (await res.json()) as DraftResponse;
    },
    [],
  );

  const ingestAudio = useCallback(
    async (file: File | Blob, displayName: string) => {
      const id = "u" + Date.now();
      const nice = displayName.replace(/\.[^.]+$/, "");
      const audioURL = URL.createObjectURL(file);
      const note: Note = {
        id,
        person: "New recipient",
        type: "Note",
        subject: nice,
        status: "transcribing",
        received: "Just now",
        duration: "—",
        transcript: "Transcribing…",
        toEmail: "",
        audioURL,
        paragraphs: [[{ t: "" }]],
        assumptions: [],
        tone: state.tone,
        length: state.length,
      };
      dispatch({ type: "ADD_NOTE", note });
      dispatch({ type: "SELECT_NOTE", id });
      showToast({ kind: "info", msg: `Added “${displayName}” — transcribing now…` });

      try {
        const fd = new FormData();
        fd.append("audio", file, displayName);
        const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
        if (!tRes.ok) {
          const { error } = (await tRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(error || "Transcription failed.");
        }
        const t = (await tRes.json()) as TranscribeResponse;
        dispatch({
          type: "UPDATE_NOTE",
          id,
          patch: { transcript: t.transcript, duration: t.duration, segments: t.segments },
        });

        const draft = await draftNote(
          id,
          t.transcript,
          t.segments,
          state.tone,
          state.length,
          state.model,
          state.styleSamples.map((s) => s.body),
        );
        dispatch({
          type: "UPDATE_NOTE",
          id,
          patch: {
            status: "ready",
            type: draft.type,
            person: draft.person || "New recipient",
            subject: draft.subject || nice,
            toEmail: draft.toEmail,
            paragraphs: draft.paragraphs,
            assumptions: draft.assumptions,
          },
        });
        showToast({ kind: "ready", msg: `“${draft.subject || nice}” is drafted and ready to review.` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        dispatch({ type: "UPDATE_NOTE", id, patch: { status: "error", errorMessage: msg } });
        showToast({ kind: "error", msg }, 5000);
      }
    },
    [state.tone, state.length, state.model, state.styleSamples, showToast, draftNote],
  );

  const regenerate = useCallback(
    async (id?: string) => {
      const noteId = id ?? state.selectedId;
      if (!noteId) return;
      const note = state.notes.find((n) => n.id === noteId);
      if (!note || !note.transcript) return;
      dispatch({ type: "SET_REGENERATING", value: true });
      dispatch({ type: "UPDATE_NOTE", id: noteId, patch: { tone: state.tone, length: state.length } });
      try {
        const draft = await draftNote(
          noteId,
          note.transcript,
          note.segments,
          state.tone,
          state.length,
          state.model,
          state.styleSamples.map((s) => s.body),
        );
        dispatch({
          type: "UPDATE_NOTE",
          id: noteId,
          patch: {
            type: draft.type,
            subject: draft.subject || note.subject,
            toEmail: note.toEmail || draft.toEmail,
            paragraphs: draft.paragraphs,
            assumptions: draft.assumptions,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Couldn’t regenerate.";
        showToast({ kind: "error", msg }, 5000);
      } finally {
        dispatch({ type: "SET_REGENERATING", value: false });
      }
    },
    [state.selectedId, state.notes, state.tone, state.length, state.model, state.styleSamples, draftNote, showToast],
  );

  const addStyleSample = useCallback(
    (sample: StyleSample) => dispatch({ type: "ADD_STYLE_SAMPLE", sample }),
    [],
  );
  const removeStyleSample = useCallback(
    (index: number) => dispatch({ type: "REMOVE_STYLE_SAMPLE", index }),
    [],
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
    ingestAudio,
    regenerate,
  };

  return <RelayContext.Provider value={value}>{children}</RelayContext.Provider>;
}

export function useRelay(): RelayContextValue {
  const ctx = useContext(RelayContext);
  if (!ctx) throw new Error("useRelay must be used within RelayProvider");
  return ctx;
}
