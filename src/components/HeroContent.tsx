"use client";

import type { HeroCopy, VariantId } from "@/lib/variants";
import { track, getTimeSinceHeroMount, NW_EVENTS } from "@/lib/analytics";

interface HeroContentProps {
  copy: HeroCopy;
  variant: VariantId;
  onBookingOpen: () => void;
}

export function HeroContent({ copy, variant, onBookingOpen }: HeroContentProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* Headline */}
      <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.5rem]">
        {copy.headline.split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </h1>

      {/* Subheadline */}
      <p className="max-w-xl text-lg leading-relaxed text-neutral-500 sm:text-xl">
        {copy.subheadline}
      </p>

      {/* Body */}
      <p className="max-w-lg text-base leading-relaxed text-neutral-600">
        {copy.body}
      </p>

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => {
            const elapsed = getTimeSinceHeroMount();
            track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
              cta_label: copy.primaryCta,
              time_to_primary_cta_click_ms: elapsed,
            });
            // Also record timing as its own event for easy analysis
            if (elapsed !== null) {
              track(NW_EVENTS.TIME_TO_CTA_RECORDED, {
                time_to_primary_cta_click_ms: elapsed,
              });
            }
            onBookingOpen();
          }}
          className="
            rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white
            transition-all hover:bg-neutral-800 active:bg-neutral-700
            active:scale-[0.98]
          "
        >
          {copy.primaryCta}
        </button>
      </div>
    </div>
  );
}
