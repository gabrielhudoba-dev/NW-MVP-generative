"use client";

import { RewriteText } from "../RewriteText";

interface HeroCtaProps {
  label: string;
  onClick?: () => void;
}

/**
 * Hero CTA button — top-right, pill shape.
 * Cal.com popup is triggered via data-cal-* attributes.
 * No decision logic — receives label from parent.
 */
export function HeroCta({ label, onClick }: HeroCtaProps) {
  return (
    <button
      data-cal-namespace="15min"
      data-cal-link="native-works-oxvx0d/15min"
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
      onClick={onClick}
      className="
        rounded-full bg-neutral-900 px-5 py-2 text-[0.8125rem] font-medium text-white
        transition-all duration-200
        hover:bg-neutral-800 hover:shadow-lg hover:shadow-neutral-900/10
        active:bg-neutral-700 active:scale-[0.97]
      "
    >
      <RewriteText text={label} />
    </button>
  );
}
