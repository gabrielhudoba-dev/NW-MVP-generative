"use client";

import type { HeroContent } from "@/lib/content/content-types";
import { RewriteText } from "../RewriteText";
import { HeroCta } from "./HeroCta";
import { HeroProofWidget } from "./HeroProofWidget";

interface HeroProps {
  content: HeroContent;
  stateKey: string;
  selectionMethod: string;
  onCtaClick?: () => void;
}

/**
 * Hero section — pure renderer.
 *
 * No decision logic, no context detection, no state derivation.
 * Receives resolved content + metadata from parent.
 */
export function Hero({ content, stateKey, selectionMethod, onCtaClick }: HeroProps) {
  return (
    <section
      className="
        relative flex min-h-svh flex-col justify-center
        px-6 py-20 sm:px-12 lg:px-24
      "
      data-state-key={stateKey}
      data-method={selectionMethod}
    >
      {/* Top bar: brand left, CTA right */}
      <div className="absolute left-6 right-6 top-8 flex items-center justify-between sm:left-12 sm:right-12 lg:left-24 lg:right-24">
        <span className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-neutral-900">
          Native Works
        </span>
        <HeroCta label={content.cta.label} onClick={onCtaClick} />
      </div>

      {/* Headline + description */}
      <div className="flex max-w-2xl flex-col gap-5 sm:gap-6">
        <RewriteText
          text={content.headline.text}
          as="h1"
          className="text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-neutral-900 sm:text-[3.25rem] sm:tracking-[-0.035em] lg:text-[4rem] lg:tracking-[-0.04em]"
        />
        <RewriteText
          text={content.description.text}
          as="p"
          className="max-w-lg text-[1.05rem] leading-[1.7] text-neutral-500 sm:text-lg sm:leading-[1.7]"
        />
      </div>

      {/* Proof widget */}
      <HeroProofWidget type={content.proof.type} content={content.proof.content} />
    </section>
  );
}
