"use client";

import type { SectionId, SectionContent } from "@/lib/content/content-types";
import { SECTIONS_MAP } from "@/lib/content/sections";
import { PROOFS_MAP } from "@/lib/content/proofs";

interface SectionRendererProps {
  sectionIds: SectionId[];
  onCtaClick?: (sectionId: SectionId) => void;
}

/**
 * Section renderer — editorial pacing with rhythm shifts.
 *
 * Content sections: left-aligned, numbered, generous whitespace.
 * CTA sections: inverted (dark surface), centered, maximum breath.
 * Proof sections: subtle warm background, restrained.
 * Each section gets a thin top rule + index number for editorial feel.
 */
export function SectionRenderer({ sectionIds, onCtaClick }: SectionRendererProps) {
  return (
    <>
      {sectionIds.map((id, index) => {
        const section = SECTIONS_MAP[id];
        if (!section) return null;

        const isCta = !!section.ctaLabel;
        const isProof = !!section.proofRef;

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

        if (isProof) {
          return <ProofSection key={id} section={section} index={index + 1} />;
        }

        // Business model gets special layout
        if (id === "business_model") {
          return <BusinessModelSection key={id} section={section} index={index + 1} />;
        }

        return <ContentSection key={id} section={section} index={index + 1} />;
      })}
    </>
  );
}

/* ── Section Index Label ── */

function SectionIndex({ index }: { index: number }) {
  return (
    <span
      className="block text-[0.6875rem] tabular-nums font-medium"
      style={{ color: "var(--muted)", letterSpacing: "0.06em" }}
    >
      {String(index).padStart(2, "0")}
    </span>
  );
}

/* ── Content Section ── */

function ContentSection({ section, index }: { section: SectionContent; index: number }) {
  if (!section.title && !section.body) return null;

  return (
    <section className="px-6 sm:px-12 lg:px-16 xl:px-24">
      {/* Top rule */}
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
          {/* Left: index */}
          <div className="pt-1">
            <SectionIndex index={index} />
          </div>

          {/* Right: content */}
          <div className="max-w-xl">
            {section.title && (
              <h2
                className="mb-6 text-[clamp(1.375rem,2.5vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em]"
                style={{ color: "var(--ink)" }}
              >
                {section.title}
              </h2>
            )}
            {section.body && (
              <div className="space-y-4">
                {section.body.split("\n\n").map((paragraph, i) => (
                  <p
                    key={i}
                    className="whitespace-pre-line text-[0.9375rem] leading-[1.75] sm:text-base"
                    style={{ color: "var(--muted-strong)" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA Section (inverted) ── */

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
    <section
      className="px-6 sm:px-12 lg:px-16 xl:px-24"
      style={{ background: "var(--surface-dark)" }}
    >
      <div className="py-20 sm:py-24 lg:py-32">
        <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
          {/* Left: index */}
          <div className="pt-1">
            <span
              className="block text-[0.6875rem] tabular-nums font-medium"
              style={{ color: "var(--muted)", letterSpacing: "0.06em" }}
            >
              {String(index).padStart(2, "0")}
            </span>
          </div>

          {/* Right: CTA content */}
          <div className="flex max-w-xl flex-col gap-8">
            {section.title && (
              <h2
                className="text-[clamp(1.375rem,2.5vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em]"
                style={{ color: "var(--ink-on-dark)" }}
              >
                {section.title}
              </h2>
            )}
            <div>
              <button
                data-cal-namespace="15min"
                data-cal-link="native-works-oxvx0d/15min"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                onClick={onCtaClick}
                className="
                  rounded-full px-7 py-3 text-[0.875rem] font-medium
                  transition-all duration-200
                  hover:opacity-85
                  active:scale-[0.97]
                "
                style={{
                  background: "var(--surface)",
                  color: "var(--ink)",
                }}
              >
                {section.ctaLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Proof Section ── */

function ProofSection({ section, index }: { section: SectionContent; index: number }) {
  const proof = section.proofRef ? PROOFS_MAP[section.proofRef] : null;
  if (!proof || !proof.content) return null;

  return (
    <section
      className="px-6 sm:px-12 lg:px-16 xl:px-24"
      style={{ background: "var(--surface-raised)" }}
    >
      <div className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
          {/* Left: index */}
          <div className="pt-1">
            <SectionIndex index={index} />
          </div>

          {/* Right: proof content */}
          <div className="max-w-xl">
            {section.title && (
              <h2
                className="mb-4 text-[0.75rem] font-medium uppercase"
                style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
              >
                {section.title}
              </h2>
            )}
            <p
              className="text-[1.125rem] leading-[1.65] font-medium tracking-[-0.01em]"
              style={{ color: "var(--ink)" }}
            >
              {proof.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Business Model Section (structured) ── */

function BusinessModelSection({ section, index }: { section: SectionContent; index: number }) {
  const items = section.body
    ? section.body.split("\n").filter((line) => line.trim())
    : [];

  return (
    <section className="px-6 sm:px-12 lg:px-16 xl:px-24">
      {/* Top rule */}
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
          {/* Left: index */}
          <div className="pt-1">
            <SectionIndex index={index} />
          </div>

          {/* Right: title + items */}
          <div>
            {section.title && (
              <h2
                className="mb-10 text-[clamp(1.375rem,2.5vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em]"
                style={{ color: "var(--ink)" }}
              >
                {section.title}
              </h2>
            )}
            <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
              {items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <span
                    className="text-[0.6875rem] tabular-nums font-medium"
                    style={{ color: "var(--muted)", letterSpacing: "0.06em" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[0.9375rem] font-medium leading-[1.4]"
                    style={{ color: "var(--ink)" }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
