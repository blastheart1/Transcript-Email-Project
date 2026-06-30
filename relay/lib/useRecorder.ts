"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecState =
  | "idle"
  | "requesting"
  | "recording"
  | "recorded"
  | "denied"
  | "unsupported";

interface RecorderApi {
  recState: RecState;
  recError: string;
  recSecs: number;
  audioURL: string | null;
  /** The captured recording, ready to hand to transcription. */
  blob: Blob | null;
  /** Live amplitude per bar (0..1), length === barCount. */
  levels: number[];
  toggle: () => void;
  discard: () => void;
}

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

function pickMime(): string {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  for (const c of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(c)) return c;
    } catch {
      /* keep trying */
    }
  }
  return "";
}

export function extForMime(m: string): string {
  if (/mp4/.test(m)) return "m4a";
  if (/ogg/.test(m)) return "ogg";
  return "webm";
}

/**
 * Real cross-browser in-app recording (Chrome / Firefox / Edge / Safari) with a
 * live level meter, ported from the design prototype. Returns a ready Blob.
 */
export function useRecorder(barCount = 32): RecorderApi {
  const [recState, setRecState] = useState<RecState>("idle");
  const [recError, setRecError] = useState("");
  const [recSecs, setRecSecs] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [levels, setLevels] = useState<number[]>(() => new Array(barCount).fill(0.12));

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const urlRef = useRef<string | null>(null);
  const acRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const extRef = useRef<string>("webm");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const stopMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (acRef.current) {
      acRef.current.close().catch(() => {});
      acRef.current = null;
    }
    setLevels(new Array(barCount).fill(0.12));
  }, [barCount]);

  const startMeter = useCallback(
    (stream: MediaStream) => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const ac = new AC();
        acRef.current = ac;
        const src = ac.createMediaStreamSource(stream);
        const an = ac.createAnalyser();
        an.fftSize = 64;
        src.connect(an);
        const data = new Uint8Array(an.frequencyBinCount);
        const loop = () => {
          an.getByteFrequencyData(data);
          const next = new Array(barCount);
          for (let i = 0; i < barCount; i++) {
            const v = data[(i * 2) % data.length] / 255;
            next[i] = Math.max(0.12, Math.min(1, v * 1.7));
          }
          setLevels(next);
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch {
        /* meter is best-effort */
      }
    },
    [barCount],
  );

  const stopRec = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopMeter();
    try {
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    } catch {
      stopStream();
    }
  }, [stopMeter, stopStream]);

  const start = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    const md = navigator.mediaDevices;
    if (!(md && md.getUserMedia) || typeof MediaRecorder === "undefined") {
      setRecState("unsupported");
      setRecError(
        "This browser doesn’t support in-app recording. Try the latest Chrome, Firefox, or Edge — or upload an audio file instead.",
      );
      return;
    }
    setRecState("requesting");
    setRecError("");
    md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then((stream) => {
        streamRef.current = stream;
        const mime = pickMime();
        extRef.current = extForMime(mime);
        let rec: MediaRecorder;
        try {
          rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        } catch {
          try {
            rec = new MediaRecorder(stream);
          } catch {
            stopStream();
            setRecState("unsupported");
            setRecError("Recording isn’t supported in this browser. Please upload an audio file instead.");
            return;
          }
        }
        recRef.current = rec;
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size) chunksRef.current.push(e.data);
        };
        rec.onstop = () => {
          const type = (chunksRef.current[0] as Blob | undefined)?.type || mime || "audio/webm";
          const b = new Blob(chunksRef.current, { type });
          const url = URL.createObjectURL(b);
          urlRef.current = url;
          setBlob(b);
          setAudioURL(url);
          setRecState("recorded");
          stopStream();
        };
        startMeter(stream);
        try {
          rec.start();
        } catch {
          stopStream();
          setRecState("idle");
          setRecError("Couldn’t start the recorder. Please try again.");
          return;
        }
        setRecState("recording");
        setRecSecs(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
      })
      .catch((err: DOMException) => {
        const name = err?.name;
        const denied = name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError";
        let msg: string;
        if (denied)
          msg =
            "Microphone access is blocked. Click the camera/lock icon in your browser’s address bar, allow the microphone, then try again.";
        else if (name === "NotFoundError" || name === "DevicesNotFoundError")
          msg = "No microphone was found. Connect a mic and try again.";
        else if (name === "NotReadableError" || name === "TrackStartError")
          msg = "Your microphone is being used by another app. Close it and try again.";
        else msg = `Couldn’t access the microphone${name ? ` (${name})` : ""}. Check your browser’s site permissions.`;
        setRecState(denied ? "denied" : "idle");
        setRecError(msg);
      });
  }, [startMeter, stopStream]);

  const toggle = useCallback(() => {
    if (recState === "recording") stopRec();
    else start();
  }, [recState, start, stopRec]);

  const discard = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    chunksRef.current = [];
    setBlob(null);
    setAudioURL(null);
    setRecSecs(0);
    setRecError("");
    setRecState("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopRec();
      stopStream();
      stopMeter();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { recState, recError, recSecs, audioURL, blob, levels, toggle, discard };
}
