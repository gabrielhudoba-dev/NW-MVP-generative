"use client";

import { useState } from "react";
import { HEADLINES } from "@/lib/content/headlines";
import { DESCRIPTIONS } from "@/lib/content/descriptions";
import { CTAS } from "@/lib/content/ctas";
import { PROOFS } from "@/lib/content/proofs";
import { Hero } from "../hero/Hero";
import { SectionRenderer } from "../sections/SectionRenderer";
import type { SectionId } from "@/lib/content/content-types";

/**
 * Debug view — activated via ?debug
 * Right-side sticky panel; page content scrolls independently.
 * Monochrome white UI; H/D/C/P/S corner labels stay colored.
 */

const ALL_SECTION_IDS: SectionId[] = [
  "position",
  "working_model",
  "intervention_logic",
  "business_model",
  "shift",
  "consequence",
  "market_shift",
  "proof_kpi",
  "proof_argument",
  "proof_showreel",
  "cta_direct",
  "cta_soft",
];

const SLOT_COLORS: Record<string, string> = {
  H: "#60a5fa",
  D: "#34d399",
  C: "#f59e0b",
  P: "#f472b6",
  S: "#a78bfa",
};

type TabGroup = "headline" | "description" | "cta" | "proof" | "sections";

export function DebugFullView() {
  const [headlineId,     setHeadlineId]     = useState(HEADLINES[0].id);
  const [descId,         setDescId]         = useState(DESCRIPTIONS[1].id);
  const [ctaId,          setCtaId]          = useState(CTAS[3].id);
  const [proofId,        setProofId]        = useState(PROOFS[3].id);
  const [activeSections, setActiveSections] = useState<SectionId[]>([...ALL_SECTION_IDS]);
  const [active,         setActive]         = useState<TabGroup>("headline");

  const headline = HEADLINES.find(h => h.id === headlineId)!;
  const desc     = DESCRIPTIONS.find(d => d.id === descId)!;
  const cta      = CTAS.find(c => c.id === ctaId)!;
  const proof    = PROOFS.find(p => p.id === proofId)!;

  const heroContent = { headline, description: desc, cta, proof };

  function toggleSection(id: SectionId) {
    setActiveSections(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...ALL_SECTION_IDS.filter(s => [...prev, id].includes(s))]
    );
  }

  const TABS: { id: TabGroup; label: string }[] = [
    { id: "headline",    label: "Headline"    },
    { id: "description", label: "Description" },
    { id: "cta",         label: "CTA"         },
    { id: "proof",       label: "Proof"       },
    { id: "sections",    label: "Sections"    },
  ];

  return (
    <div className="flex items-start">

      {/* ── Page content ── */}
      <div className="flex-1 min-w-0">
        <Hero
          content={heroContent}
          stateKey="debug"
          selectionMethod="manual"
        />
        <SectionRenderer sectionIds={activeSections} />
      </div>

      {/* ── Right sidebar ── */}
      <aside
        className="flex-shrink-0 overflow-y-auto"
        style={{
          width:       "260px",
          position:    "sticky",
          top:         0,
          height:      "100vh",
          background:  "#fff",
          borderLeft:  "1px solid #e5e5e5",
        }}
      >
        {/* Summary */}
        <div
          className="px-4 py-3 flex flex-wrap gap-x-3 gap-y-1"
          style={{ borderBottom: "1px solid #e5e5e5" }}
        >
          {[
            { label: "H", value: headlineId,                              color: SLOT_COLORS.H },
            { label: "D", value: descId,                                  color: SLOT_COLORS.D },
            { label: "C", value: ctaId,                                   color: SLOT_COLORS.C },
            { label: "P", value: proofId,                                 color: SLOT_COLORS.P },
            { label: "S", value: `${activeSections.length}/${ALL_SECTION_IDS.length}`, color: SLOT_COLORS.S },
          ].map(({ label, value, color }) => (
            <span key={label} className="text-[0.625rem]" style={{ color: "#bbb" }}>
              <span style={{ color }}>{label}</span>{" "}
              <span style={{ color: "#666" }}>{value}</span>
            </span>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex flex-col" style={{ borderBottom: "1px solid #e5e5e5" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="px-4 py-2.5 text-left text-[0.6875rem] font-medium uppercase tracking-[0.08em] transition-colors"
              style={{
                color:       active === tab.id ? "#000" : "#bbb",
                background:  active === tab.id ? "#f5f5f5" : "transparent",
                borderLeft:  active === tab.id ? "2px solid #000" : "2px solid transparent",
                cursor:      "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <div className="p-3">
          {active === "headline" && (
            <VariantList
              items={HEADLINES.map(h => ({ id: h.id, label: h.id, sub: h.text }))}
              activeId={headlineId}
              onSelect={setHeadlineId}
            />
          )}
          {active === "description" && (
            <VariantList
              items={DESCRIPTIONS.map(d => ({ id: d.id, label: d.id, sub: d.text }))}
              activeId={descId}
              onSelect={setDescId}
            />
          )}
          {active === "cta" && (
            <VariantList
              items={CTAS.map(c => ({ id: c.id, label: c.label, sub: `pressure: ${c.pressure}` }))}
              activeId={ctaId}
              onSelect={setCtaId}
            />
          )}
          {active === "proof" && (
            <VariantList
              items={PROOFS.map(p => ({ id: p.id, label: p.id, sub: p.type }))}
              activeId={proofId}
              onSelect={setProofId}
            />
          )}
          {active === "sections" && (
            <SectionToggleList
              allIds={ALL_SECTION_IDS}
              activeIds={activeSections}
              onToggle={toggleSection}
              onSelectAll={() => setActiveSections([...ALL_SECTION_IDS])}
              onClearAll={() => setActiveSections([])}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── Single-select vertical list ── */
function VariantList({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string; sub: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {items.map(item => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="flex flex-col items-start w-full rounded-lg px-3 py-2.5 text-left transition-all"
            style={{
              background: isActive ? "#000" : "transparent",
              border:     `1px solid ${isActive ? "#000" : "#e5e5e5"}`,
              cursor:     "pointer",
            }}
          >
            <span
              className="text-[0.75rem] font-medium leading-none mb-1"
              style={{ color: isActive ? "#fff" : "#333" }}
            >
              {item.label}
            </span>
            <span
              className="text-[0.625rem] leading-[1.4]"
              style={{ color: isActive ? "#aaa" : "#aaa" }}
            >
              {item.sub.length > 55 ? item.sub.slice(0, 53) + "…" : item.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Multi-toggle section list ── */
function SectionToggleList({
  allIds,
  activeIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: {
  allIds: SectionId[];
  activeIds: SectionId[];
  onToggle: (id: SectionId) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* All / None */}
      <div className="flex gap-2 mb-1">
        {[{ label: "All", action: onSelectAll }, { label: "None", action: onClearAll }].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            className="flex-1 py-1.5 rounded text-[0.625rem] font-medium uppercase tracking-[0.08em] transition-colors"
            style={{ border: "1px solid #e5e5e5", color: "#bbb", cursor: "pointer", background: "transparent" }}
          >
            {label}
          </button>
        ))}
      </div>

      {allIds.map(id => {
        const isOn = activeIds.includes(id);
        return (
          <button
            key={id}
            onClick={() => onToggle(id)}
            className="w-full rounded-lg px-3 py-2 text-left transition-all"
            style={{
              background: isOn ? "#000" : "transparent",
              border:     `1px solid ${isOn ? "#000" : "#e5e5e5"}`,
              cursor:     "pointer",
            }}
          >
            <span
              className="text-[0.75rem] font-medium"
              style={{ color: isOn ? "#fff" : "#aaa" }}
            >
              {id}
            </span>
          </button>
        );
      })}
    </div>
  );
}
