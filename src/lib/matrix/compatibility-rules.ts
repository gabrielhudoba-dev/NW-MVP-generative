/**
 * Cross-slot compatibility rules for hero content.
 *
 * These are hard constraints — if a combination violates any rule,
 * it must be corrected before rendering.
 */

import type { HeroContent } from "../content/content-types";

interface CompatibilityViolation {
  rule: string;
  description: string;
}

/**
 * Checks a hero content combination for compatibility violations.
 * Returns empty array if valid.
 */
export function checkHeroCompatibility(content: HeroContent): CompatibilityViolation[] {
  const violations: CompatibilityViolation[] = [];

  // Action headline should not pair with soft CTA (conflicting urgency)
  if (content.headline.category === "action" && content.cta.pressure === "soft") {
    violations.push({
      rule: "action_headline_no_soft_cta",
      description: "Action headline requires direct or guided CTA",
    });
  }

  // Problem headline should not pair with direct CTA (too aggressive for unaware visitor)
  if (content.headline.category === "problem" && content.cta.pressure === "direct") {
    violations.push({
      rule: "problem_headline_no_direct_cta",
      description: "Problem headline should use guided or soft CTA",
    });
  }

  // Short description should not pair with heavy proof (cognitive overload mismatch)
  if (content.description.length === "short" && content.proof.type === "showreel_kpi") {
    violations.push({
      rule: "short_desc_no_heavy_proof",
      description: "Short description should not pair with combined showreel+kpi",
    });
  }

  return violations;
}

/**
 * Validates a section sequence for coherence.
 * Returns empty array if valid.
 */
export function checkSectionSequenceCoherence(sectionIds: string[]): CompatibilityViolation[] {
  const violations: CompatibilityViolation[] = [];

  // Must not have two consecutive CTA sections
  for (let i = 0; i < sectionIds.length - 1; i++) {
    if (sectionIds[i].startsWith("cta_") && sectionIds[i + 1].startsWith("cta_")) {
      violations.push({
        rule: "no_consecutive_ctas",
        description: `Consecutive CTA sections at positions ${i} and ${i + 1}`,
      });
    }
  }

  // Must not have more than 2 proof sections
  const proofCount = sectionIds.filter((id) => id.startsWith("proof_")).length;
  if (proofCount > 2) {
    violations.push({
      rule: "max_two_proof_sections",
      description: `${proofCount} proof sections exceed maximum of 2`,
    });
  }

  return violations;
}
