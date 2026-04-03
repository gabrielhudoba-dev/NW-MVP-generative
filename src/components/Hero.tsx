"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  getTimeSinceHeroMount,
  detectDevice,
  NW_EVENTS,
} from "@/lib/analytics";
import { runDecision, runDecisionFast } from "@/lib/decision/engine";
import { heroConfig, type HeroDecision } from "@/lib/sections/hero";
import { HeroContent } from "./HeroContent";
import { RewriteText } from "./RewriteText";
import { BookingModal } from "./BookingModal";

const ALL_EVENT_NAMES = Object.values(NW_EVENTS);

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

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ctx, setCtx] = useState<VisitorContext | null>(null);
  const [decision, setDecision] = useState<HeroDecision | null>(null);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const activeSnapshotRef = useRef<string | null>(null);
  const showDebug = useDebugMode();

  // ── Decision pipeline — instant deterministic, then async AI upgrade ──
  useEffect(() => {
    let cancelled = false;

    const detected = detectVisitorContext();
    const device = detectDevice();
    setCtx(detected);

    // Set initial shared tracking context
    setTrackContext({
      visitor_type: detected.isReturning ? "returning" : "new",
      time_bucket: detected.timeOfDay,
      locale: detected.locale,
      language: detected.language,
      medium: detected.acquisition.medium,
      utm_source: detected.acquisition.utm_source,
      referrer_group: detected.acquisition.referrer_group,
    });

    markHeroMount();
    trackOnce(NW_EVENTS.HERO_SEEN);

    if (detected.isReturning) {
      trackOnce(NW_EVENTS.RETURN_VISITOR_DETECTED);
    }

    // ── Step 1: INSTANT deterministic render ──
    const instant = runDecisionFast(heroConfig, detected, device);
    activeSnapshotRef.current = instant.snapshot_id;
    setDecision(instant);

    track(NW_EVENTS.HERO_STATE_DERIVED, {
      state_key: instant.state_key,
      snapshot_id: instant.snapshot_id,
      ...instant.state_vector,
    });

    track(NW_EVENTS.HERO_VARIANT_SELECTED, {
      ...instant.selected_ids,
      state_key: instant.state_key,
      snapshot_id: instant.snapshot_id,
      selection_method: "deterministic",
    });

    trackOnce(NW_EVENTS.HERO_VARIANT_SEEN);

    // Enrich shared context with deterministic result
    setTrackContext({
      visitor_type: detected.isReturning ? "returning" : "new",
      time_bucket: detected.timeOfDay,
      locale: detected.locale,
      language: detected.language,
      medium: detected.acquisition.medium,
      utm_source: detected.acquisition.utm_source,
      referrer_group: detected.acquisition.referrer_group,
      headline_id: instant.selected_ids.headline,
      description_id: instant.selected_ids.description,
      cta_id: instant.selected_ids.cta,
      proof_id: instant.selected_ids.proof,
      state_key: instant.state_key,
      snapshot_id: instant.snapshot_id,
      selection_method: instant.selection_method,
      cta_label: instant.content.cta.label,
    });

    // ── Step 2: Async AI upgrade — replaces deterministic when ready ──
    const currentSnapshotId = instant.snapshot_id;

    runDecision(heroConfig, detected, device, currentSnapshotId).then((aiDecision) => {
      if (cancelled) return;

      // Stale response guard: only apply if this snapshot is still active
      if (activeSnapshotRef.current !== currentSnapshotId) return;

      if (aiDecision.selection_method === "ai") {
        setDecision(aiDecision);

        // Update tracking context with AI-selected IDs
        setTrackContext({
          headline_id: aiDecision.selected_ids.headline,
          description_id: aiDecision.selected_ids.description,
          cta_id: aiDecision.selected_ids.cta,
          proof_id: aiDecision.selected_ids.proof,
          selection_method: "ai",
          cta_label: aiDecision.content.cta.label,
          snapshot_id: aiDecision.snapshot_id,
        });

        track(NW_EVENTS.HERO_AI_SCORING_COMPLETED, {
          selection_method: "ai",
          snapshot_id: aiDecision.snapshot_id,
          scoring_model: aiDecision.scoring?.model,
          scoring_latency_ms: aiDecision.scoring?.latency_ms,
        });

        // Log variant re-selection by AI
        track(NW_EVENTS.HERO_VARIANT_SELECTED, {
          ...aiDecision.selected_ids,
          state_key: aiDecision.state_key,
          snapshot_id: aiDecision.snapshot_id,
          selection_method: "ai",
        });
      }
    });

    // ── Weather: fetch as display-only signal, no re-scoring ──
    detectWeather().then((weather) => {
      if (cancelled) return;
      setCtx((prev) => (prev ? { ...prev, weather } : prev));
    });

    // Bounce detection
    const bounceTimer = setTimeout(() => {
      trackOnce(NW_EVENTS.SESSION_BOUNCED_FROM_HERO);
    }, 10_000);

    const cancelBounce = () => clearTimeout(bounceTimer);
    window.addEventListener("scroll", cancelBounce, { once: true });
    window.addEventListener("click", cancelBounce, { once: true });

    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll tracking
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !decision) return;
    return observeScrollBelowHero(el);
  }, [decision]);

  // Poll sessionStorage for event log
  useEffect(() => {
    if (!showDebug) return;
    const read = () => {
      try {
        const raw = sessionStorage.getItem("nw_events");
        if (raw) setEvents(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    };
    read();
    const id = setInterval(read, 500);
    return () => clearInterval(id);
  }, [showDebug]);

  const handleCtaClick = useCallback(() => {
    if (!decision) return;
    const elapsed = getTimeSinceHeroMount();
    track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
      cta_label: decision.content.cta.label,
      time_to_primary_cta_click_ms: elapsed,
    });
    if (elapsed !== null) {
      track(NW_EVENTS.TIME_TO_CTA_RECORDED, {
        time_to_primary_cta_click_ms: elapsed,
      });
    }
    setBookingOpen(true);
  }, [decision]);

  // No skeleton — always render immediately
  if (!decision || !ctx) {
    return null;
  }

  const { content } = decision;

  return (
    <>
      <section
        ref={heroRef}
        className="
          relative flex min-h-svh flex-col justify-center
          px-6 py-20 sm:px-12 lg:px-24
        "
        data-state-key={decision.state_key}
        data-method={decision.selection_method}
      >
        {/* Top bar: brand left, CTA right */}
        <div className="absolute left-6 right-6 top-8 flex items-center justify-between sm:left-12 sm:right-12 lg:left-24 lg:right-24">
          <span className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-neutral-900">
            Native Works
          </span>
          <button
            onClick={handleCtaClick}
            className="
              rounded-full bg-neutral-900 px-5 py-2 text-[0.8125rem] font-medium text-white
              transition-all duration-200
              hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/10
              active:bg-neutral-700 active:scale-[0.97]
            "
          >
            <RewriteText text={content.cta.label} />
          </button>
        </div>

        {/* Debug panel */}
        {showDebug && (
          <div className="absolute right-6 top-20 z-10 max-h-[80vh] overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 text-xs text-neutral-500 backdrop-blur-sm sm:right-12 lg:right-24">
            <p
              className="mb-2 font-medium uppercase tracking-widest text-neutral-300"
              style={{ fontSize: "10px" }}
            >
              Generative context
            </p>
            <ul className="space-y-1">
              <li>
                <span className="text-neutral-300">state:</span> {decision.state_key}
              </li>
              <li>
                <span className="text-neutral-300">timeOfDay:</span> {ctx.timeOfDay}
              </li>
              <li>
                <span className="text-neutral-300">returning:</span> {String(ctx.isReturning)}
              </li>
              <li>
                <span className="text-neutral-300">locale:</span> {ctx.locale}
              </li>
              <li>
                <span className="text-neutral-300">weather:</span>{" "}
                {ctx.weather.condition ?? "loading\u2026"}
              </li>
              <li>
                <span className="text-neutral-300">temp:</span>{" "}
                {ctx.weather.temp !== null ? `${ctx.weather.temp}°C` : "loading\u2026"}
              </li>
              <li>
                <span className="text-neutral-300">city:</span>{" "}
                {ctx.weather.city ?? "loading\u2026"}
              </li>
              <li>
                <span className="text-neutral-300">device:</span> {detectDevice().device_type}
              </li>
              <li>
                <span className="text-neutral-300">referrer:</span>{" "}
                {ctx.acquisition.referrer_group}
              </li>
              <li>
                <span className="text-neutral-300">utm_source:</span>{" "}
                {ctx.acquisition.utm_source ?? "\u2014"}
              </li>
            </ul>

            {/* AI status */}
            <div className="my-2 h-px bg-neutral-100" />
            <p
              className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
              style={{ fontSize: "10px" }}
            >
              AI status
            </p>
            {decision.selection_method === "ai" ? (
              <p className="text-green-500">active — AI scoring applied</p>
            ) : (
              <p className="text-amber-500">{decision.ai_error}</p>
            )}

            {/* Rules applied */}
            <div className="my-2 h-px bg-neutral-100" />
            <p
              className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
              style={{ fontSize: "10px" }}
            >
              Rules ({decision.rules_applied.length})
            </p>
            {decision.rules_applied.length > 0 ? (
              <ul className="space-y-0.5">
                {decision.rules_applied.map((rule) => (
                  <li key={rule} className="flex items-center gap-1.5">
                    <span className="text-amber-400">{"\u25CF"}</span>
                    <span className="text-neutral-500">{rule}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-300">none — no guardrails triggered</p>
            )}

            {/* State vector */}
            <div className="my-2 h-px bg-neutral-100" />
            <p
              className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
              style={{ fontSize: "10px" }}
            >
              State vector
            </p>
            <ul className="space-y-0.5">
              {Object.entries(decision.state_vector).map(([key, val]) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="text-neutral-300">{key.replace("_score", "")}:</span>
                  <div className="h-1.5 flex-1 rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-400"
                      style={{ width: `${(val as number) * 100}%` }}
                    />
                  </div>
                  <span className="w-7 text-right">{(val as number).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            {/* Selected content */}
            <div className="my-2 h-px bg-neutral-100" />
            <p
              className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
              style={{ fontSize: "10px" }}
            >
              Selected
            </p>
            <ul className="space-y-0.5">
              {Object.entries(decision.selected_ids).map(([slot, id]) => (
                <li key={slot}>
                  <span className="text-neutral-300">{slot}:</span> {id}
                </li>
              ))}
            </ul>

            {/* Scoring details */}
            {decision.scoring && (
              <>
                <div className="my-2 h-px bg-neutral-100" />
                <p
                  className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
                  style={{ fontSize: "10px" }}
                >
                  Scoring ({decision.scoring.model} · {decision.scoring.latency_ms}ms)
                </p>
                <ul className="space-y-0.5">
                  {Object.entries(decision.scoring.scores)
                    .flatMap(([, slotScores]) => slotScores)
                    .sort((a, b) => b.score - a.score)
                    .map((s) => {
                      const isSelected = Object.values(decision.selected_ids).includes(s.id);
                      return (
                        <li key={s.id} className="flex items-center gap-1">
                          <span className={isSelected ? "text-green-400" : "text-neutral-300"}>
                            {isSelected ? "\u25CF" : "\u25CB"}
                          </span>
                          <span
                            className={isSelected ? "text-neutral-500" : "text-neutral-300"}
                          >
                            {s.id}
                          </span>
                          <span className="ml-auto">{s.score.toFixed(2)}</span>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}

            {/* Events */}
            <div className="my-2 h-px bg-neutral-100" />
            <p
              className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
              style={{ fontSize: "10px" }}
            >
              Events ({events.length}/{ALL_EVENT_NAMES.length})
            </p>
            <ul className="max-h-40 space-y-0.5 overflow-y-auto">
              {ALL_EVENT_NAMES.map((eventName) => {
                const fired = events.filter((ev) => ev.name === eventName);
                const last = fired.length > 0 ? fired[fired.length - 1] : null;
                let color = "text-neutral-300";
                if (last) {
                  color = last.status === "sent" ? "text-green-400" : "text-amber-400";
                }
                return (
                  <li key={eventName} className="flex items-baseline gap-1.5">
                    <span className={`shrink-0 ${color}`}>{"\u25CF"}</span>
                    <span className={last ? "text-neutral-500" : "text-neutral-300"}>
                      {eventName.replace("nw_", "")}
                    </span>
                    {fired.length > 1 && (
                      <span className="text-neutral-300" style={{ fontSize: "9px" }}>
                        {"\u00D7"}
                        {fired.length}
                      </span>
                    )}
                    {last && (
                      <span className="ml-auto text-neutral-300" style={{ fontSize: "9px" }}>
                        {new Date(last.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Hero content — headline + description */}
        <HeroContent
          headline={content.headline.text}
          description={content.description.text}
        />

        {/* Proof widget — bottom right */}
        {content.proof.type !== "none" && (
          <div className="absolute bottom-10 right-6 sm:right-12 lg:right-24">
            {content.proof.type === "showreel" ? (
              <div className="group relative aspect-video w-40 cursor-pointer overflow-hidden rounded-2xl bg-neutral-100/80 ring-1 ring-neutral-200/40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-72 hover:shadow-xl hover:shadow-neutral-900/[0.04] sm:w-48 sm:hover:w-80">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/80 to-neutral-100/60" />
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-900/[0.04] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                    <svg className="ml-0.5 h-3 w-3 text-neutral-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : content.proof.type === "kpi" ? (
              <div className="flex flex-col items-end gap-2">
                {content.proof.content.split(" | ").map((stat, i) => (
                  <RewriteText
                    key={i}
                    text={stat}
                    as="p"
                    className="text-right text-[0.8rem] font-medium tracking-wide tabular-nums text-neutral-400/80"
                  />
                ))}
              </div>
            ) : (
              <RewriteText
                text={content.proof.content}
                as="p"
                className="max-w-[17rem] text-right text-[0.8rem] leading-[1.6] text-neutral-400/80"
              />
            )}
          </div>
        )}
      </section>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} variant="A" />
    </>
  );
}
