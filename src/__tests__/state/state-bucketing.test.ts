import { describe, it, expect } from "vitest";
import {
  intentBucket,
  trustBucket,
  energyBucket,
  deriveStateKey,
} from "@/lib/state/state-types";
import { makeState } from "../helpers";

describe("intentBucket", () => {
  it("returns 'exploring' when intent < 0.35", () => {
    expect(intentBucket(makeState({ intent_score: 0.0 }))).toBe("exploring");
    expect(intentBucket(makeState({ intent_score: 0.1 }))).toBe("exploring");
    expect(intentBucket(makeState({ intent_score: 0.34 }))).toBe("exploring");
  });

  it("returns 'evaluating' at exactly 0.35", () => {
    expect(intentBucket(makeState({ intent_score: 0.35 }))).toBe("evaluating");
  });

  it("returns 'evaluating' when 0.35 <= intent < 0.6", () => {
    expect(intentBucket(makeState({ intent_score: 0.5 }))).toBe("evaluating");
    expect(intentBucket(makeState({ intent_score: 0.59 }))).toBe("evaluating");
  });

  it("returns 'ready' at exactly 0.6", () => {
    expect(intentBucket(makeState({ intent_score: 0.6 }))).toBe("ready");
  });

  it("returns 'ready' when intent >= 0.6", () => {
    expect(intentBucket(makeState({ intent_score: 0.8 }))).toBe("ready");
    expect(intentBucket(makeState({ intent_score: 1.0 }))).toBe("ready");
  });
});

describe("trustBucket", () => {
  it("returns 'low' when trust < 0.35", () => {
    expect(trustBucket(makeState({ trust_score: 0.0 }))).toBe("low");
    expect(trustBucket(makeState({ trust_score: 0.34 }))).toBe("low");
  });

  it("returns 'medium' at exactly 0.35", () => {
    expect(trustBucket(makeState({ trust_score: 0.35 }))).toBe("medium");
  });

  it("returns 'medium' when 0.35 <= trust < 0.5", () => {
    expect(trustBucket(makeState({ trust_score: 0.45 }))).toBe("medium");
    expect(trustBucket(makeState({ trust_score: 0.49 }))).toBe("medium");
  });

  it("returns 'high' at exactly 0.5", () => {
    expect(trustBucket(makeState({ trust_score: 0.5 }))).toBe("high");
  });

  it("returns 'high' when trust >= 0.5", () => {
    expect(trustBucket(makeState({ trust_score: 0.7 }))).toBe("high");
    expect(trustBucket(makeState({ trust_score: 1.0 }))).toBe("high");
  });
});

describe("energyBucket", () => {
  it("returns 'low' when energy < 0.45", () => {
    expect(energyBucket(makeState({ energy_score: 0.0 }))).toBe("low");
    expect(energyBucket(makeState({ energy_score: 0.44 }))).toBe("low");
  });

  it("returns 'high' at exactly 0.45", () => {
    expect(energyBucket(makeState({ energy_score: 0.45 }))).toBe("high");
  });

  it("returns 'high' when energy >= 0.45", () => {
    expect(energyBucket(makeState({ energy_score: 0.7 }))).toBe("high");
    expect(energyBucket(makeState({ energy_score: 1.0 }))).toBe("high");
  });
});

describe("deriveStateKey", () => {
  it("formats as intent_trust_energy", () => {
    const key = deriveStateKey(makeState({
      intent_score: 0.1,
      trust_score: 0.1,
      energy_score: 0.1,
    }));
    expect(key).toBe("exploring_low_low");
  });

  it("returns evaluating_high_high for mid-high state", () => {
    expect(deriveStateKey(makeState({
      intent_score: 0.5,
      trust_score: 0.7,
      energy_score: 0.8,
    }))).toBe("evaluating_high_high");
  });

  it("returns ready_medium_low", () => {
    expect(deriveStateKey(makeState({
      intent_score: 0.7,
      trust_score: 0.4,
      energy_score: 0.3,
    }))).toBe("ready_medium_low");
  });

  it("covers all 18 possible combinations at boundary", () => {
    const intents = [0.1, 0.4, 0.7] as const;
    const trusts = [0.1, 0.4, 0.6] as const;
    const energies = [0.2, 0.6] as const;
    const keys = new Set<string>();

    for (const i of intents) {
      for (const t of trusts) {
        for (const e of energies) {
          keys.add(deriveStateKey(makeState({
            intent_score: i,
            trust_score: t,
            energy_score: e,
          })));
        }
      }
    }
    // 3 intent × 3 trust × 2 energy = 18 unique keys
    expect(keys.size).toBe(18);
  });
});
