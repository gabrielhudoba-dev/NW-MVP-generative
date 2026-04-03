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
 * Hero — typography-led, asymmetric composition.
 *
 * Headline anchored bottom-left at large scale.
 * Proof counterweights bottom-right.
 * Warm surface, no accent — restraint is the accent.
 */
export function Hero({ content, stateKey, selectionMethod, onCtaClick }: HeroProps) {
  return (
    <section
      className="relative flex min-h-svh flex-col"
      data-state-key={stateKey}
      data-method={selectionMethod}
    >
      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4 sm:px-12 lg:px-16 xl:px-24">
        <span
          className="text-[0.75rem] font-medium uppercase"
          style={{ color: "var(--muted-strong)", letterSpacing: "0.08em" }}
        >
          Native Works
        </span>
        <HeroCta label={content.cta.label} onClick={onCtaClick} />
      </nav>

      {/* ── Content ── */}
      <div className="flex flex-1 items-end px-6 pb-12 sm:px-12 sm:pb-16 lg:px-16 lg:pb-20 xl:px-24">
        <div className="flex w-full flex-col gap-12 lg:flex-row lg:items-end lg:justify-between lg:gap-24">
          {/* Headline + description */}
          <div className="flex max-w-[42rem] flex-col gap-5 lg:gap-6">
            <RewriteText
              text={content.headline.text}
              as="h1"
              className="text-[clamp(2.25rem,6vw,4.75rem)] font-medium leading-[1.06] tracking-[-0.03em]"
              style={{ color: "var(--ink)" }}
            />
            <RewriteText
              text={content.description.text}
              as="p"
              className="max-w-[26rem] text-[1.0625rem] leading-[1.7]"
              style={{ color: "var(--muted)" }}
            />
          </div>

          {/* Proof widget */}
          <div className="shrink-0 lg:pb-1">
            <HeroProofWidget type={content.proof.type} content={content.proof.content} />
          </div>
        </div>
      </div>

      {/* ── Bottom rule ── */}
      <div
        className="mx-6 sm:mx-12 lg:mx-16 xl:mx-24"
        style={{ height: "1px", background: "var(--rule)" }}
      />
    </section>
  );
}
