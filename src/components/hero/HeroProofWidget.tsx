"use client";

import type { ProofType } from "@/lib/content/content-types";
import { RewriteText } from "../RewriteText";

interface HeroProofWidgetProps {
  type: ProofType;
  content: string;
}

/**
 * Proof widget — bottom-right counterweight in hero.
 * Each proof type has distinct visual treatment.
 */
export function HeroProofWidget({ type, content }: HeroProofWidgetProps) {
  if (type === "none") return null;

  return (
    <div className="flex flex-col items-end gap-5">
      {type === "showreel_kpi" ? (
        <>
          <ShowreelThumb />
          <KpiStats content={content} />
        </>
      ) : type === "showreel" ? (
        <ShowreelThumb />
      ) : type === "kpi" ? (
        <KpiStats content={content} />
      ) : (
        <ArgumentProof content={content} />
      )}
    </div>
  );
}

function ShowreelThumb() {
  return (
    <div
      className="
        group relative aspect-video w-56 cursor-pointer overflow-hidden
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:w-72 sm:w-72 sm:hover:w-96
      "
      style={{ borderRadius: "var(--radius)" }}
    >
      <img
        src="/showreel-thumb.webp"
        alt="Selected work"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/10" />
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="
            flex h-10 w-10 items-center justify-center rounded-full
            bg-white/90 backdrop-blur-sm
            transition-transform duration-300 group-hover:scale-110
          "
        >
          <svg className="ml-0.5 h-3.5 w-3.5" fill="var(--ink)" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function KpiStats({ content }: { content: string }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      {content.split(" | ").map((stat, i) => (
        <RewriteText
          key={i}
          text={stat}
          as="p"
          className="text-right text-[0.8125rem] font-medium tabular-nums"
          style={{ color: "var(--muted)" }}
        />
      ))}
    </div>
  );
}

function ArgumentProof({ content }: { content: string }) {
  return (
    <p
      className="max-w-[16rem] text-right text-[0.875rem] leading-[1.6]"
      style={{ color: "var(--muted)" }}
    >
      {content}
    </p>
  );
}
