"use client";

import { useRelay } from "@/lib/store";
import { MODELS } from "@/lib/models";
import type { DraftProvider } from "@/lib/types";

const GROUPS: { provider: DraftProvider; label: string; envKey: string }[] = [
  { provider: "openai", label: "OpenAI", envKey: "OPENAI_API_KEY" },
  { provider: "anthropic", label: "Anthropic (fallback)", envKey: "ANTHROPIC_API_KEY" },
];

export function ModelPicker({ onChange }: { onChange?: () => void }) {
  const { state, setModel } = useRelay();
  const { providers } = state;

  const isAvailable = (p: DraftProvider) => (providers ? providers[p] : true);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[.6px] text-muted">Model</span>
      <select
        value={state.model}
        aria-label="Drafting model"
        data-tip-down
        data-tip="Choose which AI model drafts your email"
        onChange={(e) => {
          setModel(e.target.value);
          onChange?.();
        }}
        className="h-[30px] cursor-pointer rounded-lg border border-line bg-white px-2.5 text-[12.5px] font-semibold text-slate-600 focus-visible:outline-primary"
      >
        {GROUPS.map((g) => {
          const available = isAvailable(g.provider);
          return (
            <optgroup key={g.provider} label={available ? g.label : `${g.label} — set ${g.envKey}`}>
              {MODELS.filter((m) => m.provider === g.provider).map((m) => (
                <option key={m.id} value={m.id} disabled={!available}>
                  {m.label}
                  {m.hint ? ` · ${m.hint}` : ""}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
}
