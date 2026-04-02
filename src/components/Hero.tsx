"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  variants,
  returningOverrides,
  eveningOverrides,
  type VariantId,
  type HeroCopy,
} from "@/lib/variants";
import {
  detectVisitorContext,
  detectWeather,
  type VisitorContext,
} from "@/lib/personalization";
import { track, observeScrollBelowHero } from "@/lib/analytics";
import { HeroContent } from "./HeroContent";
import { BookingModal } from "./BookingModal";
import { TrustSignal } from "./TrustSignal";

function resolveCopy(ctx: VisitorContext): HeroCopy {
  const base = { ...variants[ctx.variant] };

  // Apply evening overrides
  if (ctx.timeOfDay === "evening") {
    Object.assign(base, eveningOverrides[ctx.variant]);
  }

  // Apply returning visitor overrides (takes precedence)
  if (ctx.isReturning) {
    Object.assign(base, returningOverrides[ctx.variant]);
  }

  return base;
}

interface HeroProps {
  /** Force a specific variant — useful for testing / preview */
  forceVariant?: VariantId;
}

export function Hero({ forceVariant }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ctx, setCtx] = useState<VisitorContext | null>(null);

  useEffect(() => {
    const detected = detectVisitorContext();
    if (forceVariant) detected.variant = forceVariant;
    setCtx(detected);

    // Track variant impression
    track({ name: "nw_hero_seen", variant: detected.variant });
    track({
      name: "nw_hero_variant_seen",
      variant: detected.variant,
      isReturning: detected.isReturning,
    });

    if (detected.isReturning) {
      track({ name: "nw_return_visitor_detected", variant: detected.variant });
    }

    // Fetch weather async — non-blocking, updates when ready
    detectWeather().then((weather) => {
      setCtx((prev) => (prev ? { ...prev, weather } : prev));
    });
  }, [forceVariant]);

  // Scroll tracking
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !ctx) return;
    return observeScrollBelowHero(el, ctx.variant);
  }, [ctx]);

  const handleBookingOpen = useCallback(() => {
    setBookingOpen(true);
  }, []);

  // Skeleton while detecting context (prevents layout shift)
  if (!ctx) {
    return (
      <section
        ref={heroRef}
        className="flex min-h-svh items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-full max-w-2xl animate-pulse space-y-6 px-6">
          <div className="h-14 w-3/4 rounded-lg bg-neutral-100" />
          <div className="h-6 w-2/3 rounded bg-neutral-100" />
          <div className="h-5 w-1/2 rounded bg-neutral-100" />
          <div className="flex gap-4">
            <div className="h-12 w-36 rounded-lg bg-neutral-100" />
            <div className="h-12 w-32 rounded-lg bg-neutral-100" />
          </div>
        </div>
      </section>
    );
  }

  const copy = resolveCopy(ctx);

  return (
    <>
      <section
        ref={heroRef}
        className="
          relative flex min-h-svh flex-col justify-center
          px-6 py-20 sm:px-12 lg:px-24
        "
        data-variant={ctx.variant}
        data-returning={ctx.isReturning}
      >
        {/* Subtle top-left brand mark */}
        <div className="absolute left-6 top-8 sm:left-12 lg:left-24">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Native Works
          </span>
        </div>

        {/* Variant badge — only visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute right-6 top-8 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-400">
            <span>Variant {ctx.variant}</span>
            <span className="text-neutral-200">|</span>
            <span>{ctx.timeOfDay}</span>
            {ctx.isReturning && (
              <>
                <span className="text-neutral-200">|</span>
                <span>returning</span>
              </>
            )}
          </div>
        )}

        {/* Hero content */}
        <HeroContent
          copy={copy}
          variant={ctx.variant}
          onBookingOpen={handleBookingOpen}
        />

        {/* Trust signal — bottom of hero */}
        <div className="mt-16 sm:mt-20">
          <TrustSignal />
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-neutral-300">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-bounce"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </div>
      </section>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        variant={ctx.variant}
      />
    </>
  );
}
