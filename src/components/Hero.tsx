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
  detectDevice,
  NW_EVENTS,
  type DeviceContext,
} from "@/lib/analytics";
import { selectHero, reselectHeroFast } from "@/lib/decision/select-hero";
import type { HeroDecision } from "@/lib/hero/types";
import { HeroContent } from "./HeroContent";
import { BookingModal } from "./BookingModal";

const ALL_EVENT_NAMES = Object.values(NW_EVENTS);

interface StoredEvent {
  name: string;
  timestamp: number;
  status?: "sent" | "local";
  [key: string]: unknown;
}

/** Tracks which methods have contributed to the current decision */
interface DecisionHistory {
  initial: "deterministic";
  current: "deterministic" | "ai";
  upgrades: { method: string; timestamp: number }[];
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
  const [history, setHistory] = useState<DecisionHistory | null>(null);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const showDebug = useDebugMode();

  // Keep refs for async callbacks
  const ctxRef = useRef<VisitorContext | null>(null);
  const deviceRef = useRef<DeviceContext | null>(null);

  // ── Decision pipeline — instant deterministic, then async AI upgrade ──
  useEffect(() => {
    let cancelled = false;

    const detected = detectVisitorContext();
    const device = detectDevice();
    ctxRef.current = detected;
    deviceRef.current = device;
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
    const instant = reselectHeroFast(detected, device);
    setDecision(instant);
    setHistory({
      initial: "deterministic",
      current: "deterministic",
      upgrades: [{ method: "deterministic", timestamp: Date.now() }],
    });

    track(NW_EVENTS.HERO_STATE_DERIVED, {
      state_key: instant.state_key,
      ...instant.state_vector,
    });

    track(NW_EVENTS.HERO_VARIANT_SELECTED, {
      ...instant.selected_ids,
      state_key: instant.state_key,
      selection_method: "deterministic",
    });

    trackOnce(NW_EVENTS.HERO_VARIANT_SEEN);

    // ── Step 2: Async AI upgrade ──
    selectHero(detected, device).then((aiDecision) => {
      if (cancelled) return;
      if (aiDecision.selection_method === "ai") {
        setDecision(aiDecision);
        setHistory((prev) =>
          prev
            ? {
                ...prev,
                current: "ai",
                upgrades: [...prev.upgrades, { method: "ai", timestamp: Date.now() }],
              }
            : prev
        );

        track(NW_EVENTS.HERO_AI_SCORING_COMPLETED, {
          selection_method: "ai",
          scoring_model: aiDecision.scoring?.model,
          scoring_latency_ms: aiDecision.scoring?.latency_ms,
        });
      }
    });

    // ── Step 3: Weather arrives → re-score ──
    detectWeather().then((weather) => {
      if (cancelled) return;
      const updatedCtx = { ...detected, weather };
      ctxRef.current = updatedCtx;
      setCtx(updatedCtx);

      const updated = reselectHeroFast(updatedCtx, device);
      setDecision(updated);
      setHistory((prev) =>
        prev
          ? {
              ...prev,
              current: "deterministic",
              upgrades: [...prev.upgrades, { method: "weather-rescore", timestamp: Date.now() }],
            }
          : prev
      );
    });

    // Enrich shared context
    setTrackContext({
      visitor_type: detected.isReturning ? "returning" : "new",
      time_bucket: detected.timeOfDay,
      locale: detected.locale,
      language: detected.language,
      medium: detected.acquisition.medium,
      utm_source: detected.acquisition.utm_source,
      referrer_group: detected.acquisition.referrer_group,
      headline_id: instant.selected_ids.headline_id,
      description_id: instant.selected_ids.description_id,
      cta_id: instant.selected_ids.cta_id,
      proof_id: instant.selected_ids.proof_id,
      state_key: instant.state_key,
      selection_method: instant.selection_method,
      cta_label: instant.assembled.cta.label,
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

  const handleBookingOpen = useCallback(() => {
    setBookingOpen(true);
  }, []);

  // No skeleton — always render immediately
  if (!decision || !ctx) {
    return null;
  }

  const { assembled } = decision;

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
        {/* Brand mark */}
        <div className="absolute left-6 top-8 sm:left-12 lg:left-24">
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Native Works
          </span>
        </div>

        {/* Debug panel */}
        {showDebug && (
          <div className="absolute right-6 top-8 z-10 max-h-[90vh] overflow-y-auto rounded-lg border border-neutral-200 bg-white/95 px-4 py-3 text-xs text-neutral-500 backdrop-blur-sm sm:right-12 lg:right-24">
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
                <span className="text-neutral-300">method:</span>{" "}
                <span
                  className={
                    decision.selection_method === "ai" ? "text-green-500" : "text-amber-500"
                  }
                >
                  {decision.selection_method}
                </span>
              </li>
              {history && (
                <li>
                  <span className="text-neutral-300">pipeline:</span>{" "}
                  <span className="text-neutral-400">
                    {history.upgrades.map((u) => u.method).join(" → ")}
                  </span>
                </li>
              )}
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
              <li>
                <span className="text-neutral-300">headline:</span>{" "}
                {decision.selected_ids.headline_id}
              </li>
              <li>
                <span className="text-neutral-300">desc:</span>{" "}
                {decision.selected_ids.description_id}
              </li>
              <li>
                <span className="text-neutral-300">cta:</span> {decision.selected_ids.cta_id}
              </li>
              <li>
                <span className="text-neutral-300">proof:</span>{" "}
                {decision.selected_ids.proof_id}
              </li>
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
                  {[
                    ...decision.scoring.headline_scores.map((s) => ({ ...s, slot: "h" })),
                    ...decision.scoring.description_scores.map((s) => ({ ...s, slot: "d" })),
                    ...decision.scoring.cta_scores.map((s) => ({ ...s, slot: "c" })),
                    ...decision.scoring.proof_scores.map((s) => ({ ...s, slot: "p" })),
                  ]
                    .sort((a, b) => b.score - a.score)
                    .map((s) => {
                      const isSelected = Object.values(decision.selected_ids).includes(s.id);
                      return (
                        <li key={`${s.slot}_${s.id}`} className="flex items-center gap-1">
                          <span className={isSelected ? "text-green-400" : "text-neutral-300"}>
                            {isSelected ? "\u25CF" : "\u25CB"}
                          </span>
                          <span
                            className={isSelected ? "text-neutral-500" : "text-neutral-300"}
                          >
                            {s.id.split("_").slice(1).join("_")}
                          </span>
                          <span className="ml-auto">{s.score.toFixed(2)}</span>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}

            {/* Decision history */}
            {history && history.upgrades.length > 1 && (
              <>
                <div className="my-2 h-px bg-neutral-100" />
                <p
                  className="mb-1.5 font-medium uppercase tracking-widest text-neutral-300"
                  style={{ fontSize: "10px" }}
                >
                  Decision history
                </p>
                <ul className="space-y-0.5">
                  {history.upgrades.map((u, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <span
                        className={
                          i === history.upgrades.length - 1
                            ? "text-green-400"
                            : "text-neutral-300"
                        }
                      >
                        {i === history.upgrades.length - 1 ? "\u25CF" : "\u25CB"}
                      </span>
                      <span
                        className={
                          i === history.upgrades.length - 1
                            ? "text-neutral-500"
                            : "text-neutral-300"
                        }
                      >
                        {u.method}
                      </span>
                      <span className="ml-auto text-neutral-300" style={{ fontSize: "9px" }}>
                        {new Date(u.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
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

        {/* Hero content — rendered from assembled decision */}
        <HeroContent
          headline={assembled.headline.text}
          description={assembled.description.text}
          ctaLabel={assembled.cta.label}
          proof={assembled.proof.type !== "none" ? assembled.proof.content : null}
          onBookingOpen={handleBookingOpen}
        />
      </section>

      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} variant="A" />
    </>
  );
}
