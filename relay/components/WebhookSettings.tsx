"use client";

import { useEffect, useState } from "react";
import { useRelay } from "@/lib/store";

interface PublicSettings {
  webhookEnabled: boolean;
  webhookSecretSet: boolean;
}

export function WebhookSettings() {
  const { showToast } = useRelay();
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [secret, setSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);

  const endpoint =
    typeof window !== "undefined" ? `${window.location.origin}/api/ingest` : "/api/ingest";

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSettings(d.settings))
      .catch(() => {});
  }, []);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      showToast({ kind: "error", msg: "Couldn't update webhook settings." }, 3500);
      return;
    }
    const d = await res.json();
    setSettings(d.settings);
  }

  function copyEndpoint() {
    navigator.clipboard?.writeText(endpoint).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function test() {
    setTesting(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-relay-secret": secret },
        body: JSON.stringify({ ping: true }),
      });
      if (res.status === 401) showToast({ kind: "error", msg: "Test failed: secret rejected (401)." }, 4000);
      else if (res.status === 403) showToast({ kind: "error", msg: "Test failed: webhook is disabled." }, 4000);
      else showToast({ kind: "ready", msg: "Webhook reachable and authorized ✓" });
    } catch {
      showToast({ kind: "error", msg: "Test failed: endpoint unreachable." }, 4000);
    } finally {
      setTesting(false);
    }
  }

  const enabled = settings?.webhookEnabled ?? true;

  return (
    <div className="rounded-[14px] border border-line bg-white p-6">
      <div className="mb-1 flex items-center gap-[9px]">
        <h2 className="m-0 text-base font-bold">Webhook &amp; automation</h2>
        <span
          className={[
            "rounded-full px-[9px] py-[3px] text-[11px] font-bold",
            enabled ? "bg-success-bg text-success" : "bg-tint-chip text-slate-400",
          ].join(" ")}
        >
          {enabled ? "Live" : "Disabled"}
        </span>
      </div>
      <p className="m-0 mb-[18px] text-[13.5px] leading-relaxed text-slate-400">
        Let external tools (Zapier, Make, n8n, a script) POST audio in. Pair a Google Drive
        “New file in folder” trigger with a POST to this endpoint to auto-draft new recordings.
      </p>

      <label className="mb-1.5 block text-xs font-semibold text-slate-400">Ingest endpoint</label>
      <div className="mb-[18px] flex gap-2">
        <input
          type="text"
          readOnly
          value={endpoint}
          aria-label="Webhook endpoint URL"
          className="h-10 flex-1 rounded-[9px] border border-line bg-canvas px-3 font-mono text-[13px] text-slate-600"
        />
        <button
          onClick={copyEndpoint}
          className="h-10 cursor-pointer rounded-[9px] border border-line bg-white px-3.5 text-[13px] font-semibold text-slate-600"
          data-tip="Copy the endpoint URL"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Enable / disable */}
      <div className="mb-3 flex items-center justify-between gap-3 rounded-[11px] border border-line p-3.5">
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold">Accept incoming audio</div>
          <div className="mt-0.5 text-[12.5px] text-muted">When off, the endpoint returns 403 and drafts nothing.</div>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle webhook"
          onClick={() => patch({ webhookEnabled: !enabled })}
          className={[
            "relative h-6 w-[42px] flex-none cursor-pointer rounded-full border-none transition-colors",
            enabled ? "bg-primary" : "bg-line",
          ].join(" ")}
        >
          <span
            className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all"
            style={{ left: enabled ? 21 : 3 }}
          />
        </button>
      </div>

      {/* Secret */}
      <label className="mb-1.5 block text-xs font-semibold text-slate-400">
        Shared secret <span className="font-medium text-faint">· {settings?.webhookSecretSet ? "set — senders must include it" : "not set — endpoint is open"}</span>
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter a secret (sent as x-relay-secret)"
          aria-label="Webhook secret"
          className="h-10 min-w-[200px] flex-1 rounded-[9px] border border-line bg-white px-3 font-mono text-[13px]"
        />
        <button
          onClick={() => {
            if (!secret.trim()) {
              showToast({ kind: "error", msg: "Enter a secret first." }, 2500);
              return;
            }
            void patch({ webhookSecret: secret.trim() });
            showToast({ kind: "ready", msg: "Webhook secret saved." });
          }}
          className="h-10 cursor-pointer rounded-[9px] border-none bg-primary px-4 text-[13px] font-semibold text-white"
          data-tip="Require this secret on incoming requests"
        >
          Save secret
        </button>
        <button
          onClick={() => {
            setSecret("");
            void patch({ webhookSecret: "" });
            showToast({ kind: "info", msg: "Webhook secret cleared." });
          }}
          className="h-10 cursor-pointer rounded-[9px] border border-line bg-white px-4 text-[13px] font-semibold text-slate-600"
          data-tip="Remove the secret (endpoint becomes open)"
        >
          Clear
        </button>
        <button
          onClick={test}
          disabled={testing}
          className="h-10 cursor-pointer rounded-[9px] border border-primary bg-white px-4 text-[13px] font-semibold text-primary disabled:opacity-60"
          data-tip="Send a test ping with the secret above"
        >
          {testing ? "Testing…" : "Test"}
        </button>
      </div>
    </div>
  );
}
