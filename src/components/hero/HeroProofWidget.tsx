"use client";

import type { ProofType } from "@/lib/content/content-types";

interface HeroProofWidgetProps {
  type: ProofType;
  content: string;
}

export function HeroProofWidget({ type, content }: HeroProofWidgetProps) {
  if (type === "none") return null;

  return (
    <div className="flex flex-col items-end gap-4">
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
        group relative aspect-video w-52 cursor-pointer overflow-hidden
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:w-72 sm:w-64 sm:hover:w-88
      "
      style={{ borderRadius: "var(--radius)" }}
    >
      <img
        src="/showreel-thumb.webp"
        alt="Selected work"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/12" />
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
          <svg className="ml-0.5 h-3 w-3" fill="var(--ink)" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function KpiStats({ content }: { content: string }) {
  const stats = content.split(" | ").filter(Boolean);
  return (
    <div className="flex flex-col items-end gap-1">
      {stats.map((stat, i) => (
        <p
          key={i}
          className="text-right text-[0.8125rem] tabular-nums"
          style={{ color: "var(--muted)", letterSpacing: "0.01em" }}
        >
          {stat}
        </p>
      ))}
    </div>
  );
}

function ArgumentProof({ content }: { content: string }) {
  return (
    <p
      className="max-w-[16rem] text-right text-[0.875rem] leading-[1.6]"
      style={{ color: "var(--muted-strong)" }}
    >
      {content}
    </p>
  );
}
