"use client";

import type { SectionId, SectionContent } from "@/lib/content/content-types";
import { SECTIONS_MAP } from "@/lib/content/sections";
import { PROOFS_MAP } from "@/lib/content/proofs";

interface SectionRendererProps {
  sectionIds: SectionId[];
  onCtaClick?: (sectionId: SectionId) => void;
}

/**
 * Section rhythm — heading LEFT, body RIGHT on desktop.
 * Section number is a small label above the heading.
 * Strong typographic contrast: large heading vs. smaller body.
 * Pattern taken from reference: "The Work." / "The Method." structure.
 */
export function SectionRenderer({ sectionIds, onCtaClick }: SectionRendererProps) {
  return (
    <>
      {sectionIds.map((id, index) => {
        const section = SECTIONS_MAP[id];
        if (!section) return null;

        const isCta    = !!section.ctaLabel;
        const isProof  = !!section.proofRef;

        if (isCta) {
          return (
            <CtaSection
              key={id}
              section={section}
              index={index + 1}
              onCtaClick={onCtaClick ? () => onCtaClick(id) : undefined}
            />
          );
        }
        if (isProof)            return <ProofSection         key={id} section={section} index={index + 1} />;
        if (id === "business_model") return <BusinessModelSection key={id} section={section} index={index + 1} />;
        return <ContentSection key={id} section={section} index={index + 1} />;
      })}
    </>
  );
}

/* ── Shared padding ── */
const px = "px-5 sm:px-10 lg:px-14 xl:px-[52px]";

/* ── Content Section — heading left / body right ── */
function ContentSection({ section, index }: { section: SectionContent; index: number }) {
  if (!section.title && !section.body) return null;
  const paragraphs = section.body?.split("\n\n").filter(Boolean) ?? [];

  return (
    <section className={px} style={{ background: "#fff" }}>
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-28">
        {/* Number label */}
        <p
          className="mb-6 text-[0.625rem] tabular-nums font-medium"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          {String(index).padStart(2, "0")}
        </p>

        {/* Heading left / body right */}
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          {section.title && (
            <h2
              className="leading-[1.05] tracking-[-0.025em]"
              style={{
                fontFamily:    "var(--font-display)",
                color:         "var(--ink)",
                fontSize:      "var(--text-section)",
                fontWeight:    "var(--heading-weight)",
                lineHeight:    "var(--heading-leading)",
                letterSpacing: "var(--heading-tracking)",
              }}
            >
              {section.title}
            </h2>
          )}

          <div className="flex flex-col justify-end">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="mb-4 last:mb-0 whitespace-pre-line text-[0.9375rem] leading-[1.8]"
                style={{ color: "var(--muted-strong)" }}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA Section — dark, large heading, description + CTA row ── */
function CtaSection({
  section,
  index,
  onCtaClick,
}: {
  section: SectionContent;
  index: number;
  onCtaClick?: () => void;
}) {
  return (
    <section className={px} style={{ background: "var(--surface-dark)" }}>
      <div className="py-20 sm:py-28 lg:py-36">
        {/* Number */}
        <p
          className="mb-8 text-[0.625rem] tabular-nums font-medium"
          style={{ color: "rgba(241,250,255,0.3)", letterSpacing: "0.12em" }}
        >
          {String(index).padStart(2, "0")}
        </p>

        {/* Heading */}
        {section.title && (
          <h2
            className="mb-12 leading-[1.05] tracking-[-0.025em]"
            style={{
              color: "var(--ink-on-dark)",
              fontSize:      "var(--text-section)",
              fontWeight:    "var(--heading-weight)",
              lineHeight:    "var(--heading-leading)",
              letterSpacing: "var(--heading-tracking)",
            }}
          >
            {section.title}
          </h2>
        )}

        {/* Body + CTA row */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {section.body && (
            <p
              className="max-w-[28rem] text-[0.9375rem] leading-[1.7]"
              style={{ color: "rgba(241,250,255,0.6)" }}
            >
              {section.body}
            </p>
          )}

          <button
            data-cal-namespace="15min"
            data-cal-link="native-works-oxvx0d/15min"
            data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
            onClick={onCtaClick}
            className="inline-flex h-12 shrink-0 items-center rounded-full border px-8 text-[1rem] font-medium transition-all duration-150 hover:opacity-65 active:scale-[0.97]"
            style={{ borderColor: "var(--ink-on-dark)", color: "var(--ink-on-dark)" }}
          >
            {section.ctaLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Proof Section ── */
function ProofSection({ section, index }: { section: SectionContent; index: number }) {
  const proof = section.proofRef ? PROOFS_MAP[section.proofRef] : null;
  if (!proof?.content) return null;

  return (
    <section className={px} style={{ background: "#fff" }}>
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-28">
        <p
          className="mb-6 text-[0.625rem] tabular-nums font-medium"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          {String(index).padStart(2, "0")}
        </p>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          {section.title && (
            <h2
              className="leading-[1.05] tracking-[-0.025em]"
              style={{
                fontFamily:    "var(--font-display)",
                color:         "var(--ink)",
                fontSize:      "var(--text-section)",
                fontWeight:    "var(--heading-weight)",
                lineHeight:    "var(--heading-leading)",
                letterSpacing: "var(--heading-tracking)",
              }}
            >
              {section.title}
            </h2>
          )}

          <div className="flex items-end">
            <p
              className="leading-[1.6] tracking-[-0.01em]"
              style={{
                color: "var(--ink)",
                fontSize: "clamp(1.0625rem, 1.5vw, 1.25rem)",
                fontWeight: 500,
              }}
            >
              {proof.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Business Model Section — ruled list ── */
function BusinessModelSection({ section, index }: { section: SectionContent; index: number }) {
  const items = section.body?.split("\n").filter(l => l.trim()) ?? [];

  return (
    <section className={px} style={{ background: "#fff" }}>
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-28">
        <p
          className="mb-6 text-[0.625rem] tabular-nums font-medium"
          style={{ color: "var(--muted)", letterSpacing: "0.12em" }}
        >
          {String(index).padStart(2, "0")}
        </p>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
          {section.title && (
            <h2
              className="leading-[1.05] tracking-[-0.025em]"
              style={{
                fontFamily:    "var(--font-display)",
                color:         "var(--ink)",
                fontSize:      "var(--text-section)",
                fontWeight:    "var(--heading-weight)",
                lineHeight:    "var(--heading-leading)",
                letterSpacing: "var(--heading-tracking)",
              }}
            >
              {section.title}
            </h2>
          )}

          <div style={{ borderTop: "1px solid var(--rule)" }}>
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-baseline gap-6 py-5"
                style={{ borderBottom: "1px solid var(--rule)" }}
              >
                <span
                  className="w-5 shrink-0 text-[0.625rem] tabular-nums font-medium"
                  style={{ color: "var(--muted)", letterSpacing: "0.08em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-[1rem] leading-[1.4] tracking-[-0.01em]"
                  style={{ color: "var(--ink)", fontWeight: 500 }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
