"use client";

import type { PageDecision } from "@/lib/decision/types";
import type { VisitorContext } from "@/lib/context/collect-context";
import type { DeviceContext } from "@/lib/analytics/device";

interface DebugPanelProps {
  decision: PageDecision;
  ctx: VisitorContext;
  device: DeviceContext;
}

/**
 * Debug panel — shown when ?debug=true.
 *
 * Displays full decision chain:
 * - Context, state vector, allowed options, scores, selections, sections.
 */
export function DebugPanel({ decision, ctx, device }: DebugPanelProps) {
  const { hero, sections } = decision;

  return (
    <div className="fixed right-4 top-20 z-50 max-h-[80vh] w-72 overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 text-xs text-neutral-500 shadow-lg backdrop-blur-sm">
      {/* Context */}
      <Section title="Context">
        <Row label="state" value={hero.state_key} />
        <Row label="timeOfDay" value={ctx.timeOfDay} />
        <Row label="weekend" value={String(ctx.isWeekend)} />
        <Row label="returning" value={String(ctx.isReturning)} />
        <Row label="locale" value={ctx.locale} />
        <Row label="weather" value={ctx.weather.condition ?? "loading\u2026"} />
        <Row label="temp" value={ctx.weather.temp !== null ? `${ctx.weather.temp}\u00B0C` : "\u2014"} />
        <Row label="city" value={ctx.weather.city ?? "\u2014"} />
        <Row label="device" value={device.device_type} />
        <Row label="referrer" value={ctx.acquisition.referrer_group} />
        <Row label="utm_source" value={ctx.acquisition.utm_source ?? "\u2014"} />
      </Section>

      {/* State vector */}
      <Section title="State vector">
        {Object.entries(hero.state_vector).map(([key, val]) => (
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

      {/* AI status */}
      <Section title="AI status">
        {hero.selection_method === "ai" ? (
          <p className="text-green-500">active — AI scoring applied</p>
        ) : (
          <p className="text-amber-500">{hero.ai_error}</p>
        )}
      </Section>

      {/* Rules */}
      <Section title={`Rules (${hero.rules_applied.length})`}>
        {hero.rules_applied.length > 0 ? (
          hero.rules_applied.map((rule) => (
            <li key={rule} className="flex items-center gap-1.5">
              <span className="text-amber-400">{"\u25CF"}</span>
              <span>{rule}</span>
            </li>
          ))
        ) : (
          <p className="text-neutral-300">none</p>
        )}
      </Section>

      {/* Hero selected */}
      <Section title="Hero selected">
        {Object.entries(hero.selected_ids).map(([slot, id]) => (
          <Row key={slot} label={slot} value={id} />
        ))}
      </Section>

      {/* Scoring details */}
      {hero.scoring && (
        <Section title={`Scoring (${hero.scoring.model} \u00B7 ${hero.scoring.latency_ms}ms)`}>
          {Object.entries(hero.scoring.scores)
            .flatMap(([, slotScores]) => slotScores)
            .sort((a, b) => b.score - a.score)
            .map((s) => {
              const isSelected = Object.values(hero.selected_ids).includes(s.id);
              return (
                <li key={s.id} className="flex items-center gap-1">
                  <span className={isSelected ? "text-green-400" : "text-neutral-300"}>
                    {isSelected ? "\u25CF" : "\u25CB"}
                  </span>
                  <span className={isSelected ? "text-neutral-500" : "text-neutral-300"}>
                    {s.id}
                  </span>
                  <span className="ml-auto tabular-nums">{s.score.toFixed(2)}</span>
                </li>
              );
            })}
        </Section>
      )}

      {/* Section sequence */}
      <Section title={`Sections (${sections.section_ids.length})`}>
        {sections.section_ids.map((id, i) => (
          <li key={id} className="flex items-center gap-1.5">
            <span className="text-neutral-300">{i + 1}.</span>
            <span>{id}</span>
          </li>
        ))}
        <p className="mt-1 text-neutral-300">
          method: <span className={
            sections.selection_method === "ai" ? "text-green-500" : "text-neutral-500"
          }>{sections.selection_method}</span>
        </p>
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
