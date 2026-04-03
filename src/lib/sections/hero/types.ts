/**
 * Hero section content types — matches the approved Content document.
 */

export type HeadlineCategory = "problem" | "authority" | "action";

export interface HeadlineOption {
  id: string;
  category: HeadlineCategory;
  text: string;
}

export type DescriptionLength = "medium" | "short";

export interface DescriptionOption {
  id: string;
  length: DescriptionLength;
  text: string;
}

export type CtaPressure = "direct" | "guided" | "soft" | "diagnostic";

export interface CtaOption {
  id: string;
  label: string;
  pressure: CtaPressure;
}

export type ProofType = "showreel" | "kpi" | "argument" | "none";

export interface ProofOption {
  id: string;
  type: ProofType;
  content: string;
}

/** Assembled hero — resolved content for all 4 slots */
export interface HeroContent {
  headline: HeadlineOption;
  description: DescriptionOption;
  cta: CtaOption;
  proof: ProofOption;
}
