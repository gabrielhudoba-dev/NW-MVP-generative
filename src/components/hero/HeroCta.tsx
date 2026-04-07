"use client";

interface HeroCtaProps {
  label: string;
  onClick?: () => void;
}

export function HeroCta({ label, onClick }: HeroCtaProps) {
  return (
    <button
      data-cal-namespace="15min"
      data-cal-link="native-works-oxvx0d/15min"
      data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
      onClick={onClick}
      className="rounded-full px-6 py-2.5 text-[0.8125rem] font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.97]"
      style={{
        background: "var(--ink)",
        color: "var(--surface)",
      }}
    >
      {label}
    </button>
  );
}
