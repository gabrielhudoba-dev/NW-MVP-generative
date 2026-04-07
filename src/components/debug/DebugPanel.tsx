"use client";

import type { PageDecision } from "@/lib/decision/types";
import type { VisitorContext } from "@/lib/context/collect-context";
import type { DeviceContext } from "@/lib/analytics/device";
import type { SlotScore } from "@/lib/decision/types";

interface DebugPanelProps {
  decision: PageDecision;
  ctx: VisitorContext;
  device: DeviceContext;
}

/**
 * Debug panel — shown when ?debug=true.
 *
 * Displays full decision chain:
 * state vector, variant selections, scores, sections, constraints.
 */
export function DebugPanel({ decision, ctx, device }: DebugPanelProps) {
  return (
    <div className="fixed right-4 top-20 z-50 max-h-[80vh] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 text-xs text-neutral-500 shadow-lg backdrop-blur-sm">
      {/* Context */}
      <Section title="Context">
        <Row label="state" value={decision.state_key} />
        <Row label="mode" value={decision.decision_mode} />
        <Row label="ε" value={decision.epsilon_value.toFixed(2)} />
        <Row label="timeOfDay" value={ctx.timeOfDay} />
        <Row label="weekend" value={String(ctx.isWeekend)} />
        <Row label="returning" value={String(ctx.isReturning)} />
        <Row label="locale" value={ctx.locale} />
        <Row label="device" value={device.device_type} />
        <Row label="referrer" value={ctx.acquisition.referrer_group} />
        <Row label="utm_source" value={ctx.acquisition.utm_source ?? "—"} />
        <Row label="weather" value={ctx.weather.condition ?? "loading…"} />
        <Row label="temp" value={ctx.weather.temp !== null ? `${ctx.weather.temp}°C` : "—"} />
      </Section>

      {/* State vector */}
      <Section title="State vector">
        {Object.entries(decision.state).map(([key, val]) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className="text-neutral-300">{key.replace("_score", "")}:</span>
            <div className="h-1.5 flex-1 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-400"
                style={{ width: `${(val as number) * 100}%` }}
              />
            </div>
            <span className="w-7 text-right tabular-nums">{(val as number).toFixed(2)}</span>
          </li>
        ))}
      </Section>

      {/* Variant selections */}
      <Section title="Selected variants">
        <Row label="hero" value={decision.hero_variant} />
        <Row label="description" value={decision.description_variant} />
        <Row label="proof" value={decision.proof_variant} />
        <Row label="cta" value={decision.cta_variant} />
        <Row label="sequence" value={decision.section_sequence_id} />
      </Section>

      {/* Scores */}
      {Object.keys(decision.scores).length > 0 && (
        <Section title="Scores">
          {(Object.entries(decision.scores) as [string, SlotScore[]][])
            .flatMap(([slot, slotScores]) =>
              slotScores.map((s) => ({ ...s, slot }))
            )
            .sort((a, b) => b.score - a.score)
            .map((s) => {
              const isSelected = [
                decision.hero_variant,
                decision.description_variant,
                decision.proof_variant,
                decision.cta_variant,
                decision.section_sequence_id,
              ].includes(s.id);
              return (
                <li key={`${s.slot}:${s.id}`} className="flex items-center gap-1">
                  <span className={isSelected ? "text-green-400" : "text-neutral-300"}>
                    {isSelected ? "●" : "○"}
                  </span>
                  <span className={`truncate ${isSelected ? "text-neutral-500" : "text-neutral-300"}`}>
                    {s.id}
                  </span>
                  <span className="ml-auto shrink-0 tabular-nums">{s.score.toFixed(2)}</span>
                </li>
              );
            })}
        </Section>
      )}

      {/* Constraints */}
      {decision.constraints_applied.length > 0 && (
        <Section title={`Constraints (${decision.constraints_applied.length})`}>
          {decision.constraints_applied.map((c) => (
            <li key={c} className="flex items-center gap-1.5">
              <span className="text-amber-400">●</span>
              <span>{c}</span>
            </li>
          ))}
        </Section>
      )}

      {/* Section sequence */}
      <Section title={`Sections (${decision.sections.length})`}>
        {decision.sections.map((id, i) => (
          <li key={id} className="flex items-center gap-1.5">
            <span className="text-neutral-300">{i + 1}.</span>
            <span>{id}</span>
          </li>
        ))}
      </Section>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="my-2 h-px bg-neutral-100 first:mt-0" />
      <p
        className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
        style={{ fontSize: "10px" }}
      >
        {title}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li>
      <span className="text-neutral-300">{label}:</span> {value}
    </li>
  );
}
