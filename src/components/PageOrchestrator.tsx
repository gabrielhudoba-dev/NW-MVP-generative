"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { collectContext, fetchWeather, type VisitorContext } from "@/lib/context/collect-context";
import {
  track,
  trackOnce,
  setTrackContext,
  observeScrollBelowHero,
  markHeroMount,
  getTimeSinceHeroMount,
  detectDevice,
  NW_EVENTS,
  buildTrackingContext,
  buildExposurePayload,
} from "@/lib/analytics";
import type { DeviceContext } from "@/lib/analytics/device";
import { runPageDecision } from "@/lib/decision/engine";
import type { PageDecision } from "@/lib/decision/types";
import { updatePosterior, REWARD_WEIGHTS } from "@/lib/learning/posterior";
import { PERSONAS_MAP, type PersonaPreset } from "@/lib/personas/presets";
import { Hero } from "./hero/Hero";
import { SectionRenderer } from "./sections/SectionRenderer";
import { CalEmbed } from "./BookingModal";
import { DebugFullView } from "./debug/DebugFullView";
import { PersonaSwitcher } from "./debug/PersonaSwitcher";

function useDebugMode() {
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);
  return debug;
}

function usePersonaMode() {
  const [personaId, setPersonaId] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("persona");
    if (p !== null) setPersonaId(p || null);
  }, []);
  return [personaId, setPersonaId] as const;
}

function usePersonaEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(new URLSearchParams(window.location.search).has("persona"));
  }, []);
  return enabled;
}

/**
 * Page orchestrator — runs the decision engine and distributes
 * resolved content to dumb renderer components.
 *
 * This is the only component with decision logic.
 * Decision engine is synchronous — no async AI calls.
 */
export function PageOrchestrator() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<VisitorContext | null>(null);
  const [device, setDevice] = useState<DeviceContext | null>(null);
  const [decision, setDecision] = useState<PageDecision | null>(null);
  const decisionRef = useRef<PageDecision | null>(null);
  const showDebug = useDebugMode();
  const personaEnabled = usePersonaEnabled();
  const [personaId, setPersonaId] = usePersonaMode();

  // ── Posterior update on learning events ──────────────────────
  const handleLearningEvent = useCallback((eventKey: string) => {
    const d = decisionRef.current;
    if (!d) return;
    const reward = REWARD_WEIGHTS[eventKey];
    if (!reward) return;

    updatePosterior("hero",             d.hero_variant,         reward);
    updatePosterior("description",      d.description_variant,  reward);
    updatePosterior("proof",            d.proof_variant,        reward);
    updatePosterior("cta",              d.cta_variant,          reward);
    updatePosterior("section_sequence", d.section_sequence_id,  reward);
  }, []);

  // ── Persona switch handler ────────────────────────────────────
  const handlePersonaChange = useCallback((persona: PersonaPreset | null) => {
    if (!persona) {
      setPersonaId(null);
      const realCtx = collectContext();
      const realDev = detectDevice();
      setCtx(realCtx);
      setDevice(realDev);
      const d = runPageDecision(realCtx, realDev);
      decisionRef.current = d;
      setDecision(d);
      return;
    }
    setPersonaId(persona.id);
    setCtx(persona.ctx);
    setDevice(persona.device);
    const d = runPageDecision(persona.ctx, persona.device);
    decisionRef.current = d;
    setDecision(d);
  }, [setPersonaId]);

  // ── Main decision pipeline ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    let detected: VisitorContext;
    let dev: DeviceContext;

    if (personaId && PERSONAS_MAP[personaId]) {
      const preset = PERSONAS_MAP[personaId];
      detected = preset.ctx;
      dev = preset.device;
    } else {
      detected = collectContext();
      dev = detectDevice();
    }

    setCtx(detected);
    setDevice(dev);
    markHeroMount();

    // Synchronous decision (0ms)
    const d = runPageDecision(detected, dev);
    decisionRef.current = d;
    setDecision(d);

    if (!personaEnabled) {
      trackOnce(NW_EVENTS.HERO_SEEN);
      if (detected.isReturning) trackOnce(NW_EVENTS.RETURN_VISITOR_DETECTED);

      // Exposure event (primary personalization tracking)
      track(NW_EVENTS.PERSONALIZED_PAGE_SEEN, buildExposurePayload(detected, d));

      // State + variant tracking
      track(NW_EVENTS.HERO_STATE_DERIVED, {
        state_key: d.state_key,
        snapshot_id: d.snapshot_id,
        ...d.state,
      });
      track(NW_EVENTS.HERO_VARIANT_SELECTED, {
        hero_variant: d.hero_variant,
        description_variant: d.description_variant,
        proof_variant: d.proof_variant,
        cta_variant: d.cta_variant,
        decision_mode: d.decision_mode,
        epsilon_value: d.epsilon_value,
        snapshot_id: d.snapshot_id,
      });
      trackOnce(NW_EVENTS.HERO_VARIANT_SEEN);
      track(NW_EVENTS.SECTION_SEQUENCE_SELECTED, {
        section_sequence_id: d.section_sequence_id,
        section_ids: d.sections.join(","),
        snapshot_id: d.snapshot_id,
      });

      setTrackContext(buildTrackingContext(detected, d));

      // Weather (display-only, non-blocking)
      fetchWeather().then((weather) => {
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

      // 45s engagement timer
      const engagementTimer = setTimeout(() => {
        track(NW_EVENTS.TIME_ENGAGED_45S);
        handleLearningEvent("time_engaged_45s");
      }, 45_000);

      return () => {
        cancelled = true;
        clearTimeout(bounceTimer);
        clearTimeout(engagementTimer);
      };
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scroll tracking ───────────────────────────────────────────
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !decision) return;
    return observeScrollBelowHero(el);
  }, [decision]);

  // ── CTA click handlers ────────────────────────────────────────
  const handleHeroCtaClick = useCallback(() => {
    if (!decision) return;
    const elapsed = getTimeSinceHeroMount();
    track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
      cta_label: decision.content.cta.label,
      cta_variant: decision.cta_variant,
      time_to_primary_cta_click_ms: elapsed,
    });
    if (elapsed !== null) {
      track(NW_EVENTS.TIME_TO_CTA_RECORDED, { time_to_primary_cta_click_ms: elapsed });
    }
    handleLearningEvent("cta_clicked");
  }, [decision, handleLearningEvent]);

  const handleSectionCtaClick = useCallback((sectionId: string) => {
    track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
      cta_source: sectionId,
      cta_label: "section_cta",
    });
    handleLearningEvent("cta_clicked");
  }, [handleLearningEvent]);

  // ── Debug view ────────────────────────────────────────────────
  if (showDebug) return <DebugFullView />;

  if (!decision || !ctx || !device) return null;

  return (
    <>
      <div ref={heroRef}>
        <Hero
          content={decision.content}
          stateKey={decision.state_key}
          selectionMethod={decision.decision_mode}
          onCtaClick={handleHeroCtaClick}
        />
      </div>

      <SectionRenderer
        sectionIds={decision.sections}
        onCtaClick={handleSectionCtaClick}
      />

      <CalEmbed />

      {personaEnabled && (
        <PersonaSwitcher
          activeId={personaId}
          decision={decision}
          onChange={handlePersonaChange}
        />
      )}
    </>
  );
}
