"use client";

import type { HeroCopy, VariantId } from "@/lib/variants";
import { track } from "@/lib/analytics";

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

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => {
            track({ name: "nw_primary_cta_clicked", variant });
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

        <button
          onClick={() => {
            track({ name: "nw_secondary_cta_clicked", variant });
            // MVP: scroll to a future "how we work" section
            // For now, just track the click
          }}
          className="
            rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm
            font-medium text-neutral-600 transition-all hover:border-neutral-300
            hover:text-neutral-900 active:scale-[0.98]
          "
        >
          {copy.secondaryCta}
        </button>
      </div>
    </div>
  );
}
