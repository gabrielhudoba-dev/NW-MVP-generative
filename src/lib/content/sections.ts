/**
 * Section content registry — all approved strategic sections.
 *
 * Each section has a fixed ID, title, and body.
 * The decision engine selects which sections to show and in what order.
 */

import type { SectionContent, SectionId } from "./content-types";

export const SECTIONS: SectionContent[] = [
  {
    id: "shift",
    title: "Digital product creation is changing.",
    body: "AI is accelerating everything. Faster output. Shorter cycles. More frequent change. Speed increases. User expectations are gonna increase.\n\nHow people interact with systems will change. The need to keep them clear, useful, and trustworthy will not.",
  },
  {
    id: "consequence",
    title: "Product quality under change becomes the real advantage.",
    body: "Shorter cycles. Features are adopted faster. Maintaining product quality becomes harder. User expectations rise. Not just growth, but staying relevant.\n\nMost products degrade over time:\n• Rework becomes more frequent\n• Expectations rise faster than quality\n• Complexity grows faster than value\n• Consistency breaks down over time\n• Products lose relevance under change",
  },
  {
    id: "market_shift",
    title: "Where value is moving.",
    body: "Agencies:\n• Execution becoming automated\n• Talent renting\n• Becomes less relevant\n\nAuthority companies:\n• Expert guidance and quality oversight\n• Provide certainty\n• Enable confident decisions",
  },
  {
    id: "position",
    title: "New model.",
    body: "Senior-led, end-to-end. Fewer workflow steps. AI-accelerated iteration. Clearer outcomes. Higher quality. Faster path to value. Production-ready output.\n\nDiscovery → Structure → Core Flow (in code) → Lead Design → System → Expansion → Validation → Delivery",
  },
  {
    id: "position_light",
    title: "We define how digital products should work.",
    body: "A clearer path to value. Senior-led. End-to-end. Built for clarity under change.",
  },
  {
    id: "working_model",
    title: "Inside the team. Inside the product.",
    body: "Senior-led, end-to-end. One person owns the product. Small, precise team. Authority-level experts, on demand. Continuous visibility. Daily updates. Shared workspace. Fast feedback. Decisions made in context.",
  },
  {
    id: "intervention_logic",
    title: "Where we intervene.",
    body: "Products stall. Often before they break through. This is where product expertise has the highest leverage.\n\n• Early Product\n• Scaling Product\n• Capacity Gaps\n• Competitive Pressure\n• Acceleration",
  },
  {
    id: "business_model",
    title: "Three ways to engage.",
    body: "Product Sprint\nCore Flow Sprint\nContinuous Product Partnership",
  },
  {
    id: "proof_showreel",
    title: "Selected work",
    proofRef: "proof_showreel_a",
    body: "",
  },
  {
    id: "proof_kpi",
    title: "Impact",
    proofRef: "proof_kpi_a",
    body: "",
  },
  {
    id: "proof_argument",
    title: "Why products break",
    proofRef: "proof_argument_a",
    body: "",
  },
  {
    id: "proof_optional",
    title: "",
    body: "",
  },
  {
    id: "cta_soft",
    title: "Next step",
    ctaLabel: "Talk to us",
    body: "",
  },
  {
    id: "cta_direct",
    title: "Next step",
    ctaLabel: "Book a call",
    body: "",
  },
];

export const SECTIONS_MAP: Record<SectionId, SectionContent> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s])
) as Record<SectionId, SectionContent>;
