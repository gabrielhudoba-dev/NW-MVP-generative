"use client";

import { RewriteText } from "./RewriteText";

interface HeroContentProps {
  headline: string;
  description: string;
}

export function HeroContent({ headline, description }: HeroContentProps) {
  return (
    <div className="flex max-w-4xl flex-col gap-5 sm:gap-6">
      {/* Headline */}
      <RewriteText
        text={headline}
        as="h1"
        className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-neutral-900 sm:text-[3.25rem] sm:tracking-[-0.035em] lg:text-[4rem] lg:tracking-[-0.04em]"
      >
        {(displayed) =>
          displayed.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))
        }
      </RewriteText>

      {/* Description */}
      <RewriteText
        text={description}
        as="p"
        className="max-w-lg text-[1.05rem] leading-[1.7] text-neutral-500 sm:text-lg sm:leading-[1.7]"
      />
    </div>
  );
}
