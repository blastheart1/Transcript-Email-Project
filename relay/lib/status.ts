import type { NoteStatus } from "./types";

export interface StatusInfo {
  label: string;
  dot: string;
  badgeBg: string;
  badgeColor: string;
  tip: string;
}

/** Visual + copy mapping for a note's status, shared by Inbox and Draft views. */
export function statusInfo(status: NoteStatus): StatusInfo {
  switch (status) {
    case "ready":
      return {
        label: "Draft ready",
        dot: "#2E6B4F",
        badgeBg: "#E7F1EC",
        badgeColor: "#205C42",
        tip: "Drafted and waiting for your review",
      };
    case "transcribing":
      return {
        label: "Transcribing",
        dot: "#B5852A",
        badgeBg: "#FBF3E2",
        badgeColor: "#8A6516",
        tip: "Audio is still being transcribed",
      };
    case "needs_review":
      return {
        label: "Needs review",
        dot: "#C0392B",
        badgeBg: "#FBF3E2",
        badgeColor: "#8A6516",
        tip: "The faithfulness audit flagged unverified claims — check before sending",
      };
    case "error":
      return {
        label: "Needs attention",
        dot: "#B83C3C",
        badgeBg: "#FBE9E9",
        badgeColor: "#9A2F2F",
        tip: "Something went wrong — open to see details",
      };
    default:
      return {
        label: "Sent",
        dot: "#8A969C",
        badgeBg: "#EEF1F2",
        badgeColor: "#5C6B73",
        tip: "You sent this draft",
      };
  }
}
