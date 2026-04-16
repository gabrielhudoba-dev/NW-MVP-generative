"use client";

import type { HeroContent } from "@/lib/content/content-types";
import { Nav } from "../Nav";

interface HeroProps {
  content: HeroContent;
  stateKey: string;
  selectionMethod: string;
  onCtaClick?: () => void;
}

export function Hero({ content, stateKey, selectionMethod, onCtaClick }: HeroProps) {
  return (
    <section
      className="relative flex min-h-svh flex-col"
      style={{ background: "#fff" }}
      data-state-key={stateKey}
      data-method={selectionMethod}
    >
      {/* ── Nav ── */}
      <Nav />

      {/* ── Two-column content ── */}
      <div className="flex flex-1 flex-col justify-start px-5 pb-12 pt-[8vh] sm:px-10 lg:px-14 lg:pb-16 lg:pt-[10vh] xl:px-[52px]">
        <div className="grid w-full items-stretch gap-12 lg:grid-cols-[1fr_420px] lg:gap-16 xl:grid-cols-[1fr_480px] xl:gap-20">

          {/* ── Left column: text ── */}
          <div className="flex flex-col">
            <h1
              className="mb-7 sm:mb-8 lg:mb-9"
              style={{
                fontFamily:    "var(--font-display)",
                color:         "var(--ink)",
                fontSize:      "var(--text-h1)",
                lineHeight:    "var(--heading-leading)",
                fontWeight:    "var(--heading-weight)",
                letterSpacing: "var(--heading-tracking)",
              }}
            >
              {content.headline.text}
            </h1>

            <p
              className="mb-9 max-w-[32rem] text-[1.0625rem] leading-[1.6] sm:mb-10 sm:text-[1.125rem]"
              style={{ color: "var(--ink)", fontWeight: "var(--body-weight)" }}
            >
              {content.description.text}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                data-cal-namespace="15min"
                data-cal-link="native-works-oxvx0d/15min"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                onClick={onCtaClick}
                className="inline-flex h-12 items-center rounded-full px-8 text-[1.0625rem] font-medium transition-all duration-150 hover:opacity-85 active:scale-[0.97]"
                style={{ background: "var(--ink)", color: "var(--ink-on-dark)", fontWeight: "var(--body-weight)" }}
              >
                {content.cta.label}
              </button>

              <button
                className="inline-flex h-12 items-center rounded-full border px-8 text-[1.0625rem] font-medium transition-all duration-150 hover:opacity-65 active:scale-[0.97]"
                style={{ borderColor: "var(--ink)", color: "var(--ink)", fontWeight: "var(--body-weight)" }}
              >
                See how we work
              </button>
            </div>
          </div>

          {/* ── Right column: visual proof ── */}
          <HeroVisual type={content.proof.type} content={content.proof.content} />
        </div>
      </div>
    </section>
  );
}

/* ── Right column visual ── */
function HeroVisual({ type, content }: { type: string; content: string }) {
  if (type !== "kpi" && type !== "argument") {
    return (
      <div className="hidden lg:block w-full self-stretch min-h-[480px] overflow-hidden rounded-[2rem] relative">
        <img
          src="/deimage.png"
          alt="Selected work"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  if (type === "kpi") {
    return (
      <div
        className="hidden w-full flex-col justify-center gap-6 rounded-[2rem] p-10 lg:flex xl:p-12 self-stretch"
        style={{ background: "var(--surface-raised)" }}
      >
        {content.split(" | ").map((stat, i) => (
          <div key={i} className="flex flex-col gap-1">
            <p
              className="text-[0.6875rem] font-medium uppercase tracking-[0.1em]"
              style={{ color: "var(--muted)" }}
            >
              {i === 0 ? "Onboarding" : "Task completion"}
            </p>
            <p
              className="text-[2rem] font-medium leading-none tracking-[-0.02em]"
              style={{ color: "var(--ink)" }}
            >
              {stat.match(/\d+%/)?.[0] ?? stat}
            </p>
            <p
              className="text-[0.875rem] leading-[1.5]"
              style={{ color: "var(--muted-strong)" }}
            >
              {stat}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="hidden w-full flex-col justify-center rounded-[2rem] p-10 lg:flex xl:p-12 self-stretch"
      style={{ background: "var(--surface-raised)" }}
    >
      <p
        className="text-[1.25rem] font-medium leading-[1.5] tracking-[-0.01em]"
        style={{ color: "var(--ink)" }}
      >
        {content}
      </p>
    </div>
  );
}
