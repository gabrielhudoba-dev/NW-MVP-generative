"use client";

import type { SectionId, SectionContent } from "@/lib/content/content-types";
import { SECTIONS_MAP } from "@/lib/content/sections";
import { PROOFS_MAP } from "@/lib/content/proofs";

interface SectionRendererProps {
  sectionIds: SectionId[];
  onCtaClick?: (sectionId: SectionId) => void;
}

/**
 * Section renderer — extends the Figma visual language (#F1FAFF / #081254)
 * through the rest of the page.
 *
 * ContentSection:      light surface, index label, large heading, body text
 * CtaSection:          dark navy inversion (#081254), outlined pill button
 * ProofSection:        raised surface, large quote text
 * BusinessModelSection: horizontal rule list, clean numbered items
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
        if (isProof) return <ProofSection key={id} section={section} index={index + 1} />;
        if (id === "business_model") return <BusinessModelSection key={id} section={section} index={index + 1} />;
        return <ContentSection key={id} section={section} index={index + 1} />;
      })}
    </>
  );
}

/* ── Index label ── */
function SectionIndex({ index }: { index: number }) {
  return (
    <span
      className="block text-[0.625rem] tabular-nums font-medium"
      style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
    >
      {String(index).padStart(2, "0")}
    </span>
  );
}

/* ── Content Section ── */
function ContentSection({ section, index }: { section: SectionContent; index: number }) {
  if (!section.title && !section.body) return null;
  const paragraphs = section.body?.split("\n\n").filter(Boolean) ?? [];

  return (
    <section
      className="px-5 sm:px-10 lg:px-14 xl:px-[52px]"
      style={{ background: "#fff" }}
    >
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[88px_1fr] lg:gap-16">
          <div className="pt-[0.3rem]">
            <SectionIndex index={index} />
          </div>

          <div className="max-w-[36rem]">
            {section.title && (
              <h2
                className="mb-7 leading-[1.1] tracking-[-0.02em]"
                style={{
                  color: "var(--ink)",
                  fontSize: "clamp(1.5rem, 2.75vw, 2.25rem)",
                  fontWeight: 400,
                }}
              >
                {section.title}
              </h2>
            )}
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

/* ── CTA Section — dark navy inversion ── */
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
    <section style={{ background: "var(--surface-dark)" }}>
      <div className="px-5 py-20 sm:px-10 sm:py-28 lg:px-14 lg:py-36 xl:px-[52px]">
        <p
          className="mb-10 text-[0.625rem] tabular-nums font-medium sm:mb-14"
          style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
        >
          {String(index).padStart(2, "0")}
        </p>

        {section.title && (
          <h2
            className="mb-10 max-w-[22ch] leading-[1.06] tracking-[-0.025em] sm:mb-12"
            style={{
              color: "var(--ink-on-dark)",
              fontSize: "clamp(2rem, 4.5vw, 3.75rem)",
              fontWeight: 400,
            }}
          >
            {section.title}
          </h2>
        )}

        {/* Outlined pill button — matches Figma secondary CTA style */}
        <button
          data-cal-namespace="15min"
          data-cal-link="native-works-oxvx0d/15min"
          data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
          onClick={onCtaClick}
          className="inline-flex h-12 items-center rounded-full border px-8 text-[1.0625rem] font-medium transition-all duration-150 hover:opacity-65 active:scale-[0.97]"
          style={{
            borderColor: "var(--ink-on-dark)",
            color: "var(--ink-on-dark)",
            fontWeight: 500,
          }}
        >
          {section.ctaLabel}
        </button>
      </div>
    </section>
  );
}

/* ── Proof Section ── */
function ProofSection({ section, index }: { section: SectionContent; index: number }) {
  const proof = section.proofRef ? PROOFS_MAP[section.proofRef] : null;
  if (!proof?.content) return null;

  return (
    <section style={{ background: "#fff" }}>
      <div className="px-5 py-16 sm:px-10 sm:py-20 lg:px-14 lg:py-24 xl:px-[52px]">
        <div className="grid gap-8 lg:grid-cols-[88px_1fr] lg:gap-16">
          <div className="pt-[0.3rem]">
            <SectionIndex index={index} />
          </div>

          <div className="max-w-[44rem]">
            {section.title && (
              <p
                className="mb-5 text-[0.625rem] font-medium uppercase tracking-[0.1em]"
                style={{ color: "var(--muted)" }}
              >
                {section.title}
              </p>
            )}
            <p
              className="leading-[1.6] tracking-[-0.01em]"
              style={{
                color: "var(--ink)",
                fontSize: "clamp(1.125rem, 1.75vw, 1.375rem)",
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

/* ── Business Model Section ── */
function BusinessModelSection({ section, index }: { section: SectionContent; index: number }) {
  const items = section.body?.split("\n").filter(l => l.trim()) ?? [];

  return (
    <section
      className="px-5 sm:px-10 lg:px-14 xl:px-[52px]"
      style={{ background: "#fff" }}
    >
      <div style={{ height: "1px", background: "var(--rule)" }} />

      <div className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[88px_1fr] lg:gap-16">
          <div className="pt-[0.3rem]">
            <SectionIndex index={index} />
          </div>

          <div>
            {section.title && (
              <h2
                className="mb-10 leading-[1.1] tracking-[-0.02em]"
                style={{
                  color: "var(--ink)",
                  fontSize: "clamp(1.5rem, 2.75vw, 2.25rem)",
                  fontWeight: 400,
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
                    className="w-6 shrink-0 text-[0.625rem] tabular-nums font-medium"
                    style={{ color: "var(--muted)", letterSpacing: "0.08em" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[1.0625rem] leading-[1.35] tracking-[-0.01em]"
                    style={{ color: "var(--ink)", fontWeight: 500 }}
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
