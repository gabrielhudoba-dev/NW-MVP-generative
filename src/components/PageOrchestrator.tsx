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
  buildHeroVariantPayload,
  buildSectionSequencePayload,
} from "@/lib/analytics";
import type { DeviceContext } from "@/lib/analytics/device";
import { runPageDecisionFast, runPageDecision } from "@/lib/decision/engine";
import type { PageDecision } from "@/lib/decision/types";
import { PERSONAS_MAP, type PersonaPreset } from "@/lib/personas/presets";
import { Hero } from "./hero/Hero";
import { SectionRenderer } from "./sections/SectionRenderer";
import { CalEmbed } from "./BookingModal";
import { DebugPanel } from "./debug/DebugPanel";
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
    if (p !== null) {
      // ?persona or ?persona=A — default to showing switcher with initial persona
      setPersonaId(p || null);
    }
  }, []);
  return [personaId, setPersonaId] as const;
}

/** Whether the URL has ?persona (with or without value) */
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
 * All child components are pure renderers.
 */
export function PageOrchestrator() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<VisitorContext | null>(null);
  const [device, setDevice] = useState<DeviceContext | null>(null);
  const [decision, setDecision] = useState<PageDecision | null>(null);
  const activeSnapshotRef = useRef<string | null>(null);
  const showDebug = useDebugMode();
  const personaEnabled = usePersonaEnabled();
  const [personaId, setPersonaId] = usePersonaMode();

  // ── Persona switch handler ──
  const handlePersonaChange = useCallback((persona: PersonaPreset | null) => {
    if (!persona) {
      setPersonaId(null);
      // Re-run with real context
      const realCtx = collectContext();
      const realDev = detectDevice();
      setCtx(realCtx);
      setDevice(realDev);
      const instant = runPageDecisionFast(realCtx, realDev);
      activeSnapshotRef.current = instant.snapshot_id;
      setDecision(instant);
      return;
    }
    setPersonaId(persona.id);
    setCtx(persona.ctx);
    setDevice(persona.device);
    const instant = runPageDecisionFast(persona.ctx, persona.device);
    activeSnapshotRef.current = instant.snapshot_id;
    setDecision(instant);
  }, [setPersonaId]);

  // ── Decision pipeline ──
  useEffect(() => {
    let cancelled = false;

    // If URL has ?persona=X, use that preset instead of real detection
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

    // Skip tracking in persona mode
    if (!personaEnabled) {
      trackOnce(NW_EVENTS.HERO_SEEN);
      if (detected.isReturning) {
        trackOnce(NW_EVENTS.RETURN_VISITOR_DETECTED);
      }
    }

    // Step 1: INSTANT deterministic
    const instant = runPageDecisionFast(detected, dev);
    activeSnapshotRef.current = instant.snapshot_id;
    setDecision(instant);

    if (!personaEnabled) {
      // Track state derived
      track(NW_EVENTS.HERO_STATE_DERIVED, {
        state_key: instant.hero.state_key,
        snapshot_id: instant.snapshot_id,
        ...instant.hero.state_vector,
      });

      // Track hero variant selected
      track(NW_EVENTS.HERO_VARIANT_SELECTED, buildHeroVariantPayload(instant));
      trackOnce(NW_EVENTS.HERO_VARIANT_SEEN);

      // Track section sequence
      track(NW_EVENTS.SECTION_SEQUENCE_SELECTED, buildSectionSequencePayload(instant));

      // Set shared tracking context
      setTrackContext(buildTrackingContext(detected, instant));
    }

    // Step 2: Async AI upgrade — skip in persona mode (deterministic preview only)
    if (!personaEnabled) {
      const currentSnapshotId = instant.snapshot_id;

      runPageDecision(detected, dev, currentSnapshotId).then((aiDecision) => {
        if (cancelled) return;
        if (activeSnapshotRef.current !== currentSnapshotId) return;

        const heroChanged = aiDecision.hero.selection_method === "ai";
        const sectionsChanged = aiDecision.sections.selection_method === "ai";

        if (heroChanged || sectionsChanged) {
          setDecision(aiDecision);
          setTrackContext(buildTrackingContext(detected, aiDecision));

          if (heroChanged) {
            track(NW_EVENTS.HERO_AI_SCORING_COMPLETED, {
              selection_method: "ai",
              snapshot_id: aiDecision.snapshot_id,
              scoring_model: aiDecision.hero.scoring?.model,
              scoring_latency_ms: aiDecision.hero.scoring?.latency_ms,
            });
            track(NW_EVENTS.HERO_VARIANT_SELECTED, buildHeroVariantPayload(aiDecision));
          }

          if (sectionsChanged) {
            track(NW_EVENTS.SECTION_AI_SCORING_COMPLETED, {
              selection_method: "ai",
              snapshot_id: aiDecision.snapshot_id,
            });
            track(NW_EVENTS.SECTION_SEQUENCE_SELECTED, buildSectionSequencePayload(aiDecision));
          }
        }
      });

      // Weather (display-only)
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
    }

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll tracking
  useEffect(() => {
    const el = heroRef.current;
    if (!el || !decision) return;
    return observeScrollBelowHero(el);
  }, [decision]);

  const handleHeroCtaClick = useCallback(() => {
    if (!decision) return;
    const elapsed = getTimeSinceHeroMount();
    track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
      cta_label: decision.hero.content.cta.label,
      time_to_primary_cta_click_ms: elapsed,
    });
    if (elapsed !== null) {
      track(NW_EVENTS.TIME_TO_CTA_RECORDED, { time_to_primary_cta_click_ms: elapsed });
    }
  }, [decision]);

  const handleSectionCtaClick = useCallback((sectionId: string) => {
    track(NW_EVENTS.PRIMARY_CTA_CLICKED, {
      cta_source: sectionId,
      cta_label: "section_cta",
    });
  }, []);

  if (!decision || !ctx || !device) return null;

  return (
    <>
      <div ref={heroRef}>
        <Hero
          content={decision.hero.content}
          stateKey={decision.hero.state_key}
          selectionMethod={decision.hero.selection_method}
          onCtaClick={handleHeroCtaClick}
        />
      </div>

      <SectionRenderer
        sectionIds={decision.sections.section_ids}
        onCtaClick={handleSectionCtaClick}
      />

      <CalEmbed />

      {showDebug && (
        <DebugPanel decision={decision} ctx={ctx} device={device} />
      )}

      {personaEnabled && (
        <>
          <div className="h-20" /> {/* Bottom spacer for fixed switcher */}
          <PersonaSwitcher
            activeId={personaId}
            decision={decision}
            onChange={handlePersonaChange}
          />
        </>
      )}
    </>
  );
}
