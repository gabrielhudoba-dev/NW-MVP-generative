"use client";

import { track, getTimeSinceHeroMount, NW_EVENTS } from "@/lib/analytics";
import { RewriteText } from "./RewriteText";

interface HeroContentProps {
  headline: string;
  description: string;
  ctaLabel: string;
  proof: string | null;
  onBookingOpen: () => void;
}

export function HeroContent({
  headline,
  description,
  ctaLabel,
  proof,
  onBookingOpen,
}: HeroContentProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* Headline */}
      <RewriteText
        text={headline}
        as="h1"
        className="text-4xl font-semibold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.5rem]"
      >
        {(displayed) =>
          displayed.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))
        }
      </RewriteText>

      {/* Description */}
      <RewriteText
        text={description}
        as="p"
        className="max-w-xl text-lg leading-relaxed text-neutral-500 sm:text-xl"
      />

      {/* Proof signal */}
      {proof && (
        <RewriteText
          text={proof}
          as="p"
          className="max-w-lg text-sm text-neutral-400"
        />
      )}

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => {
            const elapsed = getTimeSinceHeroMount();
            track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
              cta_label: ctaLabel,
              time_to_primary_cta_click_ms: elapsed,
            });
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
          <RewriteText text={ctaLabel} />
        </button>
      </div>
    </div>
  );
}
