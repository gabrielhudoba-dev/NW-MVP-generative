"use client";

import { PERSONAS, type PersonaPreset } from "@/lib/personas/presets";
import type { PageDecision } from "@/lib/decision/types";

interface PersonaSwitcherProps {
  activeId: string | null;
  decision: PageDecision | null;
  onChange: (persona: PersonaPreset | null) => void;
}

/**
 * Persona switcher — floating bar for design preview.
 *
 * Shown when ?persona is in the URL.
 * Lets designers flip between visitor profiles to see
 * how every component adapts to each persona.
 */
export function PersonaSwitcher({ activeId, decision, onChange }: PersonaSwitcherProps) {
  const active = PERSONAS.find((p) => p.id === activeId) ?? null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
      {/* Tabs */}
      <div className="flex items-center gap-0 overflow-x-auto border-b border-neutral-100">
        {/* Live mode */}
        <button
          onClick={() => onChange(null)}
          className={`
            shrink-0 px-4 py-2.5 text-xs font-medium transition-colors
            ${activeId === null
              ? "border-b-2 border-neutral-900 text-neutral-900"
              : "text-neutral-400 hover:text-neutral-600"
            }
          `}
        >
          Live
        </button>

        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p)}
            className={`
              shrink-0 px-4 py-2.5 text-xs font-medium transition-colors
              ${activeId === p.id
                ? "border-b-2 border-neutral-900 text-neutral-900"
                : "text-neutral-400 hover:text-neutral-600"
              }
            `}
          >
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{
              backgroundColor: activeId === p.id ? "#171717" : "#d4d4d4",
            }} />
            {p.id}
          </button>
        ))}
      </div>

      {/* Detail bar */}
      <div className="flex items-center gap-6 px-4 py-2">
        {active ? (
          <>
            <div className="shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-300">
                Persona {active.id}
              </p>
              <p className="text-xs font-medium text-neutral-700">{active.label}</p>
            </div>

            <div className="h-6 w-px bg-neutral-100" />

            <InfoChip label="device" value={active.device.device_type} />
            <InfoChip label="time" value={active.ctx.timeOfDay} />
            <InfoChip label="referrer" value={active.ctx.acquisition.referrer_group} />
            <InfoChip label="returning" value={active.ctx.isReturning ? "yes" : "no"} />
            {active.ctx.isWeekend && <InfoChip label="weekend" value="yes" />}
            {active.ctx.acquisition.utm_medium && (
              <InfoChip label="utm_medium" value={active.ctx.acquisition.utm_medium} />
            )}

            <div className="h-6 w-px bg-neutral-100" />

            {decision && (
              <>
                <InfoChip label="state" value={decision.hero.state_key} highlight />
                <InfoChip label="headline" value={shortId(decision.hero.selected_ids.headline)} />
                <InfoChip label="desc" value={shortId(decision.hero.selected_ids.description)} />
                <InfoChip label="cta" value={shortId(decision.hero.selected_ids.cta)} />
                <InfoChip label="proof" value={shortId(decision.hero.selected_ids.proof)} />
                <InfoChip label="method" value={decision.hero.selection_method} />
                {decision.hero.rules_applied.length > 0 && (
                  <InfoChip
                    label="guardrails"
                    value={String(decision.hero.rules_applied.length)}
                    highlight
                  />
                )}

                <div className="h-6 w-px bg-neutral-100" />

                <InfoChip
                  label="sections"
                  value={decision.sections.section_ids.join(" \u2192 ")}
                />
              </>
            )}
          </>
        ) : (
          <p className="text-xs text-neutral-400">
            Live mode — using real visitor context. Click a persona to preview.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="shrink-0">
      <span className="text-[10px] uppercase tracking-wider text-neutral-300">{label} </span>
      <span className={`text-[11px] font-medium tabular-nums ${
        highlight ? "text-green-600" : "text-neutral-600"
      }`}>
        {value}
      </span>
    </div>
  );
}

function shortId(id: string): string {
  return id
    .replace("headline_", "")
    .replace("desc_", "")
    .replace("cta_", "")
    .replace("proof_", "");
}
