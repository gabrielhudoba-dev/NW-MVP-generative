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
import {
  track,
  trackOnce,
  setTrackContext,
  observeScrollBelowHero,
  markHeroMount,
  NW_EVENTS,
} from "@/lib/analytics";

const ALL_EVENT_NAMES = Object.values(NW_EVENTS);
import { HeroContent } from "./HeroContent";
import { BookingModal } from "./BookingModal";

function resolveCopy(ctx: VisitorContext): HeroCopy {
  const base = { ...variants[ctx.variant] };

  if (ctx.timeOfDay === "evening") {
    Object.assign(base, eveningOverrides[ctx.variant]);
  }

  if (ctx.isReturning) {
    Object.assign(base, returningOverrides[ctx.variant]);
  }

  return base;
}

const VARIANT_LABELS: Record<VariantId, string> = {
  A: "problem-led",
  B: "authority-led",
  C: "action-led",
};

interface HeroProps {
  forceVariant?: VariantId;
}

interface StoredEvent {
  name: string;
  timestamp: number;
  status?: "sent" | "local";
  [key: string]: unknown;
}

function useDebugMode() {
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebug(params.has("debug"));
  }, []);
  return debug;
}

export function Hero({ forceVariant }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ctx, setCtx] = useState<VisitorContext | null>(null);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const showDebug = useDebugMode();

  // Initialize context + set shared tracking properties
  useEffect(() => {
    const detected = detectVisitorContext();
    if (forceVariant) detected.variant = forceVariant;
    setCtx(detected);

    const copy = resolveCopy(detected);

    // Set shared context that enriches every future event
    setTrackContext({
      hero_variant: detected.variant,
      hero_variant_label: VARIANT_LABELS[detected.variant],
      headline_id: `${detected.variant}_headline`,
      cta_label: copy.primaryCta,
      visitor_type: detected.isReturning ? "returning" : "new",
      time_bucket: detected.timeOfDay,
      locale: detected.locale,
      language: detected.language,
      country: detected.country,
      // acquisition
      medium: detected.acquisition.medium,
      utm_source: detected.acquisition.utm_source,
      utm_medium: detected.acquisition.utm_medium,
      utm_campaign: detected.acquisition.utm_campaign,
      referrer: detected.acquisition.referrer,
      referrer_group: detected.acquisition.referrer_group,
    });

    // Mark timing origin
    markHeroMount();

    // Fire impression events (deduplicated via trackOnce)
    trackOnce(NW_EVENTS.HERO_SEEN);
    trackOnce(NW_EVENTS.HERO_VARIANT_SEEN);

    if (detected.isReturning) {
      trackOnce(NW_EVENTS.RETURN_VISITOR_DETECTED);
    }

    if (forceVariant) {
      track(NW_EVENTS.VARIANT_FORCED, { source: "prop" });
    }

    // Fetch weather async, update context when ready
    detectWeather().then((weather) => {
      setCtx((prev) => (prev ? { ...prev, weather } : prev));
      // Update shared context with weather
      setTrackContext({
        hero_variant: detected.variant,
        hero_variant_label: VARIANT_LABELS[detected.variant],
        headline_id: `${detected.variant}_headline`,
        cta_label: copy.primaryCta,
        visitor_type: detected.isReturning ? "returning" : "new",
        time_bucket: detected.timeOfDay,
        locale: detected.locale,
        language: detected.language,
        country: detected.country,
        city: weather.city,
        weather: weather.condition,
        temperature_c: weather.temp,
        utm_source: detected.acquisition.utm_source,
        utm_medium: detected.acquisition.utm_medium,
        utm_campaign: detected.acquisition.utm_campaign,
        referrer: detected.acquisition.referrer,
        referrer_group: detected.acquisition.referrer_group,
      });
    });

    // Bounce detection — if user leaves within 10s without any interaction
    const bounceTimer = setTimeout(() => {
      // Will only fire if no scroll or CTA happened
      trackOnce(NW_EVENTS.SESSION_BOUNCED_FROM_HERO);
    }, 10_000);

    const cancelBounce = () => clearTimeout(bounceTimer);
    window.addEventListener("scroll", cancelBounce, { once: true });
    window.addEventListener("click", cancelBounce, { once: true });

    return () => {
      cancelBounce();
      window.removeEventListener("scroll", cancelBounce);
      window.removeEventListener("click", cancelBounce);
    };
  }, [forceVariant]);

  // Scroll tracking
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !ctx) return;
    return observeScrollBelowHero(el);
  }, [ctx]);

  // Poll sessionStorage for event log
  useEffect(() => {
    if (!showDebug) return;
    const read = () => {
      try {
        const raw = sessionStorage.getItem("nw_events");
        if (raw) setEvents(JSON.parse(raw));
      } catch { /* ignore */ }
    };
    read();
    const id = setInterval(read, 500);
    return () => clearInterval(id);
  }, [showDebug]);

  const handleBookingOpen = useCallback(() => {
    setBookingOpen(true);
  }, []);

  // Skeleton
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
        {/* Brand mark */}
        <div className="absolute left-6 top-8 sm:left-12 lg:left-24">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Native Works
          </span>
        </div>

        {/* Generative context panel — visible with ?debug in URL */}
        {showDebug && (
          <div className="absolute right-6 top-8 z-10 rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 text-xs text-neutral-500 backdrop-blur-sm sm:right-12 lg:right-24">
            <p className="mb-2 font-medium uppercase tracking-widest text-neutral-300" style={{ fontSize: "10px" }}>
              Generative context
            </p>
            <ul className="space-y-1">
              <li><span className="text-neutral-300">variant:</span> {ctx.variant} ({VARIANT_LABELS[ctx.variant]})</li>
              <li><span className="text-neutral-300">timeOfDay:</span> {ctx.timeOfDay}</li>
              <li><span className="text-neutral-300">returning:</span> {String(ctx.isReturning)}</li>
              <li><span className="text-neutral-300">locale:</span> {ctx.locale}</li>
              <li><span className="text-neutral-300">country:</span> {ctx.country ?? "—"}</li>
              <li><span className="text-neutral-300">weather:</span> {ctx.weather.condition ?? "loading…"}</li>
              <li><span className="text-neutral-300">temp:</span> {ctx.weather.temp !== null ? `${ctx.weather.temp}°C` : "loading…"}</li>
              <li><span className="text-neutral-300">city:</span> {ctx.weather.city ?? "loading…"}</li>
              <li><span className="text-neutral-300">medium:</span> {ctx.acquisition.medium}</li>
              <li><span className="text-neutral-300">referrer:</span> {ctx.acquisition.referrer_group}</li>
              <li><span className="text-neutral-300">utm_source:</span> {ctx.acquisition.utm_source ?? "—"}</li>
              <li><span className="text-neutral-300">utm_medium:</span> {ctx.acquisition.utm_medium ?? "—"}</li>
              <li><span className="text-neutral-300">utm_campaign:</span> {ctx.acquisition.utm_campaign ?? "—"}</li>
            </ul>
            <div className="my-2 h-px bg-neutral-100" />
            <p className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300" style={{ fontSize: "10px" }}>
              Events ({events.length}/{ALL_EVENT_NAMES.length})
            </p>
            <ul className="max-h-52 space-y-0.5 overflow-y-auto">
              {ALL_EVENT_NAMES.map((eventName) => {
                const fired = events.filter((ev) => ev.name === eventName);
                const last = fired.length > 0 ? fired[fired.length - 1] : null;
                let color = "text-neutral-300"; // not fired yet
                if (last) {
                  color = last.status === "sent" ? "text-green-400" : "text-amber-400";
                }
                return (
                  <li key={eventName} className="flex items-baseline gap-1.5">
                    <span className={`shrink-0 ${color}`}>●</span>
                    <span className={last ? "text-neutral-500" : "text-neutral-300"}>
                      {eventName.replace("nw_", "")}
                    </span>
                    {fired.length > 1 && (
                      <span className="text-neutral-300" style={{ fontSize: "9px" }}>×{fired.length}</span>
                    )}
                    {last && (
                      <span className="ml-auto text-neutral-300" style={{ fontSize: "9px" }}>
                        {new Date(last.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Hero content */}
        <HeroContent
          copy={copy}
          variant={ctx.variant}
          onBookingOpen={handleBookingOpen}
        />
      </section>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        variant={ctx.variant}
      />
    </>
  );
}
