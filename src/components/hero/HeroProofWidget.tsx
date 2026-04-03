"use client";

import type { ProofType } from "@/lib/content/content-types";
import { RewriteText } from "../RewriteText";

interface HeroProofWidgetProps {
  type: ProofType;
  content: string;
}

/**
 * Proof widget — bottom-right of hero.
 * Pure renderer. Receives type + content from parent.
 */
export function HeroProofWidget({ type, content }: HeroProofWidgetProps) {
  if (type === "none") return null;

  return (
    <div className="absolute bottom-10 right-6 sm:right-12 lg:right-24">
      {type === "showreel_kpi" ? (
        <div className="flex items-end gap-6">
          <KpiStats content={content} />
          <ShowreelThumb />
        </div>
      ) : type === "showreel" ? (
        <ShowreelThumb />
      ) : type === "kpi" ? (
        <KpiStats content={content} />
      ) : (
        <RewriteText
          text={content}
          as="p"
          className="max-w-[17rem] text-right text-[0.8rem] leading-[1.6] text-neutral-400/80"
        />
      )}
    </div>
  );
}

function ShowreelThumb() {
  return (
    <div className="group relative aspect-video w-64 cursor-pointer overflow-hidden rounded-2xl ring-1 ring-neutral-200/40 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-96 hover:shadow-xl hover:shadow-neutral-900/[0.06] sm:w-80 sm:hover:w-[28rem]">
      <img src="/showreel-thumb.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
          <svg className="ml-0.5 h-3 w-3 text-neutral-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function KpiStats({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end gap-2">
      {content.split(" | ").map((stat, i) => (
        <RewriteText
          key={i}
          text={stat}
          as="p"
          className="text-right text-[0.8rem] font-medium tracking-wide tabular-nums text-neutral-400/80"
        />
      ))}
    </div>
  );
}
