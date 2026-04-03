"use client";

import type { SectionId, SectionContent } from "@/lib/content/content-types";
import { SECTIONS_MAP } from "@/lib/content/sections";
import { PROOFS_MAP } from "@/lib/content/proofs";

interface SectionRendererProps {
  sectionIds: SectionId[];
  onCtaClick?: (sectionId: SectionId) => void;
}

/**
 * Section renderer — displays a sequence of strategic sections.
 *
 * Pure renderer. Receives section IDs from the decision engine.
 * No decision logic inside.
 */
export function SectionRenderer({ sectionIds, onCtaClick }: SectionRendererProps) {
  return (
    <>
      {sectionIds.map((id) => {
        const section = SECTIONS_MAP[id];
        if (!section) return null;
        return (
          <SectionBlock
            key={id}
            section={section}
            onCtaClick={onCtaClick ? () => onCtaClick(id) : undefined}
          />
        );
      })}
    </>
  );
}

function SectionBlock({
  section,
  onCtaClick,
}: {
  section: SectionContent;
  onCtaClick?: () => void;
}) {
  // Skip empty sections (proof_optional with no content)
  if (!section.title && !section.body && !section.ctaLabel && !section.proofRef) {
    return null;
  }

  // CTA sections
  if (section.ctaLabel) {
    return (
      <section className="px-6 py-20 sm:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl text-center">
          {section.title && (
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 sm:text-2xl">
              {section.title}
            </h2>
          )}
          <button
            data-cal-namespace="15min"
            data-cal-link="native-works-oxvx0d/15min"
            data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
            onClick={onCtaClick}
            className="
              rounded-full bg-neutral-900 px-8 py-3 text-sm font-medium text-white
              transition-all duration-200
              hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/10
              active:bg-neutral-700 active:scale-[0.97]
            "
          >
            {section.ctaLabel}
          </button>
        </div>
      </section>
    );
  }

  // Proof sections
  if (section.proofRef) {
    const proof = PROOFS_MAP[section.proofRef];
    return (
      <section className="px-6 py-20 sm:px-12 lg:px-24">
        <div className="max-w-3xl">
          {section.title && (
            <h2 className="mb-6 text-xl font-semibold text-neutral-900 sm:text-2xl">
              {section.title}
            </h2>
          )}
          {proof && proof.content && (
            <p className="text-base leading-relaxed text-neutral-500">
              {proof.content}
            </p>
          )}
        </div>
      </section>
    );
  }

  // Content sections
  return (
    <section className="px-6 py-20 sm:px-12 lg:px-24">
      <div className="max-w-3xl">
        <h2 className="mb-6 text-xl font-semibold text-neutral-900 sm:text-2xl lg:text-3xl">
          {section.title}
        </h2>
        {section.body && (
          <div className="space-y-4 text-base leading-relaxed text-neutral-500 sm:text-lg">
            {section.body.split("\n\n").map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
