import { describe, it, expect } from "vitest";
import { selectSectionsDeterministic, applySectionAIScores } from "@/lib/decision/select-sections";
import { makeState } from "../helpers";
import type { SectionId } from "@/lib/content/content-types";
import type { SlotScore } from "@/lib/decision/types";

describe("selectSectionsDeterministic", () => {
  it("returns exploring default for low intent, medium trust, high energy", () => {
    const state = makeState({
      intent_score: 0.2,
      trust_score: 0.4,
      energy_score: 0.6,
    });
    const result = selectSectionsDeterministic(state, false, "snap_test");
    expect(result.section_ids).toEqual([
      "shift", "consequence", "position_light", "cta_soft",
    ]);
    expect(result.selection_method).toBe("deterministic");
  });

  it("returns evaluating default for mid intent, medium trust, high energy", () => {
    const state = makeState({
      intent_score: 0.5,
      trust_score: 0.4,
      energy_score: 0.6,
    });
    const result = selectSectionsDeterministic(state, false, "snap_test");
    expect(result.section_ids).toEqual([
      "position", "market_shift", "working_model", "intervention_logic", "cta_direct",
    ]);
  });

  it("returns ready default for high intent, medium trust, high energy", () => {
    const state = makeState({
      intent_score: 0.7,
      trust_score: 0.4,
      energy_score: 0.6,
    });
    const result = selectSectionsDeterministic(state, false, "snap_test");
    expect(result.section_ids).toEqual([
      "business_model", "cta_direct", "proof_optional",
    ]);
  });

  it("has correct metadata", () => {
    const state = makeState({ intent_score: 0.2 });
    const result = selectSectionsDeterministic(state, false, "snap_123");
    expect(result.snapshot_id).toBe("snap_123");
    expect(result.selection_method).toBe("deterministic");
    expect(result.ai_scores).toBeNull();
    expect(result.ai_error).toBe("deterministic-only");
    expect(result.state_vector).toEqual(state);
  });
});

describe("applySectionAIScores", () => {
  it("reorders sections by AI score (highest first)", () => {
    const state = makeState({ intent_score: 0.2, trust_score: 0.4, energy_score: 0.6 });
    const base = selectSectionsDeterministic(state, false, "snap_test");
    // Base: ["shift", "consequence", "position_light", "cta_soft"]

    const aiScores: SlotScore[] = [
      { id: "cta_soft", score: 0.95, reason: "ai" },
      { id: "shift", score: 0.3, reason: "ai" },
      { id: "consequence", score: 0.7, reason: "ai" },
      { id: "position_light", score: 0.6, reason: "ai" },
    ];

    const result = applySectionAIScores(base, aiScores);
    expect(result.section_ids).toEqual([
      "cta_soft", "consequence", "position_light", "shift",
    ]);
    expect(result.selection_method).toBe("ai");
    expect(result.ai_scores).toEqual(aiScores);
    expect(result.ai_error).toBeNull();
  });

  it("keeps only allowed sections, ignores extra AI IDs", () => {
    const state = makeState({ intent_score: 0.7, trust_score: 0.4, energy_score: 0.6 });
    const base = selectSectionsDeterministic(state, false, "snap_test");
    // Base: ["business_model", "cta_direct", "proof_optional"]

    const aiScores: SlotScore[] = [
      { id: "business_model", score: 0.9, reason: "ai" },
      { id: "cta_direct", score: 0.8, reason: "ai" },
      { id: "proof_optional", score: 0.5, reason: "ai" },
      { id: "shift", score: 0.99, reason: "ai" }, // not in allowed
    ];

    const result = applySectionAIScores(base, aiScores);
    // Only the 3 base sections remain
    expect(result.section_ids).toHaveLength(3);
    expect(result.section_ids).not.toContain("shift");
  });

  it("uses 0.5 default for unscored sections", () => {
    const state = makeState({ intent_score: 0.2, trust_score: 0.4, energy_score: 0.6 });
    const base = selectSectionsDeterministic(state, false, "snap_test");

    // Only score 2 of 4 sections
    const aiScores: SlotScore[] = [
      { id: "cta_soft", score: 0.9, reason: "ai" },
      { id: "shift", score: 0.1, reason: "ai" },
    ];

    const result = applySectionAIScores(base, aiScores);
    // cta_soft (0.9) > consequence (0.5 default) = position_light (0.5 default) > shift (0.1)
    expect(result.section_ids[0]).toBe("cta_soft");
    expect(result.section_ids[result.section_ids.length - 1]).toBe("shift");
  });
});
