"use client";

import { PERSONAS, type PersonaPreset } from "@/lib/personas/presets";
import type { PageDecision } from "@/lib/decision/types";

interface PersonaSwitcherProps {
  activeId: string | null;
  decision: PageDecision | null;
  onChange: (persona: PersonaPreset | null) => void;
}

/**
 * Persona switcher — right-side panel for design preview.
 *
 * Shown when ?persona is in the URL.
 * Lets designers flip between visitor profiles to see
 * how every component adapts to each persona.
 */
export function PersonaSwitcher({ activeId, decision, onChange }: PersonaSwitcherProps) {
  const active = PERSONAS.find((p) => p.id === activeId) ?? null;

  return (
    <div className="fixed right-4 top-20 z-50 w-56 overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 text-xs shadow-lg backdrop-blur-sm" style={{ maxHeight: "calc(100vh - 6rem)" }}>
      {/* Persona tabs */}
      <div className="flex flex-wrap gap-0 border-b border-neutral-100">
        <button
          onClick={() => onChange(null)}
          className={`
            px-3 py-2 text-[11px] font-medium transition-colors
            ${activeId === null
              ? "bg-neutral-900 text-white"
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
              px-3 py-2 text-[11px] font-medium transition-colors
              ${activeId === p.id
                ? "bg-neutral-900 text-white"
                : "text-neutral-400 hover:text-neutral-600"
              }
            `}
          >
            {p.id}
          </button>
        ))}
      </div>

      {active ? (
        <div className="px-3 py-2.5">
          {/* Persona name */}
          <p className="mb-3 text-[11px] font-semibold text-neutral-900">
            {active.label}
          </p>

          {/* Context */}
          <SectionLabel>Context</SectionLabel>
          <Row label="device" value={active.device.device_type} />
          <Row label="time" value={active.ctx.timeOfDay} />
          <Row label="referrer" value={active.ctx.acquisition.referrer_group} />
          <Row label="returning" value={active.ctx.isReturning ? "yes" : "no"} />
          {active.ctx.isWeekend && <Row label="weekend" value="yes" />}
          {active.ctx.acquisition.utm_medium && (
            <Row label="utm_medium" value={active.ctx.acquisition.utm_medium} />
          )}
          {active.ctx.acquisition.utm_source && (
            <Row label="utm_source" value={active.ctx.acquisition.utm_source} />
          )}

          {decision && (
            <>
              {/* State */}
              <SectionLabel>State</SectionLabel>
              <Row label="key" value={decision.state_key} highlight />
              <Row label="mode" value={decision.decision_mode} />
              {decision.constraints_applied.length > 0 && (
                <Row
                  label="constraints"
                  value={decision.constraints_applied.join(", ")}
                  highlight
                />
              )}

              {/* Hero */}
              <SectionLabel>Hero</SectionLabel>
              <Row label="headline" value={decision.hero_variant} />
              <Row label="desc" value={decision.description_variant} />
              <Row label="cta" value={decision.cta_variant} />
              <Row label="proof" value={decision.proof_variant} />

              {/* Sections */}
              <SectionLabel>Sections</SectionLabel>
              {decision.sections.map((id, i) => (
                <Row key={id} label={String(i + 1)} value={id} />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="px-3 py-3">
          <p className="text-[11px] leading-relaxed text-neutral-400">
            Live mode — real visitor context. Click a persona to preview.
          </p>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 mt-3 text-[10px] font-medium uppercase tracking-widest text-neutral-300 first:mt-0">
      {children}
    </p>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2 py-[2px]">
      <span className="shrink-0 text-[11px] text-neutral-400">{label}</span>
      <span className={`text-right text-[11px] font-medium ${
        highlight ? "text-green-600" : "text-neutral-600"
      }`}>
        {value}
      </span>
    </div>
  );
}
