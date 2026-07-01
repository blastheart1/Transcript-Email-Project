"use client";

import { useEffect, useRef } from "react";
import { useRelay } from "@/lib/store";
import { useTooltips } from "@/lib/useTooltips";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import type { SessionUser } from "./UserMenu";
import { InboxView } from "./InboxView";
import { CaptureView } from "./CaptureView";
import { DraftView } from "./DraftView";
import { SettingsView } from "./SettingsView";
import { QuickStartGuide } from "./QuickStartGuide";
import { DragOverlay } from "./DragOverlay";
import { Toast } from "./Toast";
import { UploadIcon } from "./icons";

export function Shell({ user }: { user: SessionUser | null }) {
  const { state, dispatch, ingestAudio } = useRelay();
  useTooltips();
  const depth = useRef(0);

  // Global drag-and-drop: drop an audio file anywhere to transcribe.
  useEffect(() => {
    const hasFiles = (e: DragEvent) => {
      try {
        return Array.from(e.dataTransfer?.types || []).includes("Files");
      } catch {
        return false;
      }
    };
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      dispatch({ type: "SET_DRAGGING", value: true });
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current -= 1;
      if (depth.current <= 0) {
        depth.current = 0;
        dispatch({ type: "SET_DRAGGING", value: false });
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      depth.current = 0;
      dispatch({ type: "SET_DRAGGING", value: false });
      const file = e.dataTransfer?.files?.[0];
      if (file) void ingestAudio(file, file.name);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [dispatch, ingestAudio]);

  return (
    <div id="shell" className="flex h-dvh overflow-hidden text-ink">
      <Sidebar user={user} />
      <MobileNav user={user} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Header />
        <div className="min-h-0 flex-1 overflow-auto pb-[76px] pt-14 md:pb-0 md:pt-0">
          {state.view === "inbox" && <InboxView />}
          {state.view === "capture" && <CaptureView />}
          {state.view === "draft" && <DraftView />}
          {state.view === "settings" && <SettingsView />}
        </div>
      </main>

      {state.guide && <QuickStartGuide />}
      {state.dragging && <DragOverlay icon={<UploadIcon size={26} className="text-primary" />} />}
      {state.toast && <Toast toast={state.toast} />}
    </div>
  );
}
