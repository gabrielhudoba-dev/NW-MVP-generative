export type VariantId = "A" | "B" | "C";

export interface HeroCopy {
  headline: string;
  subheadline: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
}

/**
 * Variant A — Problem-led
 * Leads with the pain: product complexity breaking clarity.
 */
const variantA: HeroCopy = {
  headline: "Your product grew.\nYour clarity didn't.",
  subheadline:
    "When products scale, decisions fragment. Features multiply. Systems drift. Teams lose sight of how it should actually work.",
  body: "Native Works defines how your product should work — so your team builds with precision, not guesswork.",
  primaryCta: "Book a call",
  secondaryCta: "See how we work",
};

/**
 * Variant B — Authority-led
 * Leads with what Native Works is: a product authority.
 */
const variantB: HeroCopy = {
  headline: "Digital product authority\nfor complex systems.",
  subheadline:
    "We define how products should work — the structure, decisions, and systems that turn complexity into clarity.",
  body: "Teams ship better when product direction is precise. We make it precise.",
  primaryCta: "Book a call",
  secondaryCta: "What we do",
};

/**
 * Variant C — Action-led
 * Leads with the outcome: speed and directness.
 */
const variantC: HeroCopy = {
  headline: "Fix your product thinking\nbefore it gets expensive.",
  subheadline:
    "Misaligned product decisions compound. The cost shows up later — in rework, drift, and lost momentum.",
  body: "One conversation to see if we can help.",
  primaryCta: "Book a 30-min call",
  secondaryCta: "Learn more",
};

export const variants: Record<VariantId, HeroCopy> = {
  A: variantA,
  B: variantB,
  C: variantC,
};

/** Returning visitor overrides — shorter, more direct */
export const returningOverrides: Partial<Record<VariantId, Partial<HeroCopy>>> =
  {
    A: {
      subheadline: "You've been here before. Let's skip the intro.",
      primaryCta: "Book your call",
    },
    B: {
      subheadline: "Ready to get precise about your product?",
      primaryCta: "Let's talk",
    },
    C: {
      body: "You already know the problem. Let's solve it.",
      primaryCta: "Book now",
    },
  };

/** Evening copy — lower cognitive load */
export const eveningOverrides: Partial<Record<VariantId, Partial<HeroCopy>>> = {
  A: {
    body: "We help teams define how their product should work. Worth a conversation.",
  },
  B: {
    body: "Clear product thinking. That's what we do.",
  },
  C: {
    body: "A short call. No pitch. Just clarity.",
  },
};
