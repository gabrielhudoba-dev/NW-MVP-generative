export interface Situation {
  slug:  string;
  title: string;
}

export const SITUATIONS: Situation[] = [
  { slug: "launching-product",              title: "Launching Product"               },
  { slug: "redesign",                        title: "Redesign"                        },
  { slug: "onboarding-issues",              title: "Onboarding Issues"               },
  { slug: "poor-engagement",                title: "Poor Engagement"                 },
  { slug: "product-feels-messy",            title: "Product Feels Messy"             },
  { slug: "scaling-product-complexity",     title: "Scaling Product Complexity"      },
  { slug: "lack-of-structure",              title: "Lack of Structure"               },
  { slug: "investor-demo",                  title: "Investor Demo"                   },
  { slug: "internal-team-stuck",            title: "Internal Team Stuck"             },
  { slug: "moving-faster-without-ai",       title: "Moving Faster Without AI Processes" },
];

export function getSituation(slug: string): Situation | undefined {
  return SITUATIONS.find((s) => s.slug === slug);
}
