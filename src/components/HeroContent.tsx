"use client";

import { RewriteText } from "./RewriteText";

interface HeroContentProps {
  headline: string;
  description: string;
}

export function HeroContent({ headline, description }: HeroContentProps) {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      {/* Headline */}
      <RewriteText
        text={headline}
        as="h1"
        className="text-4xl font-semibold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-[3.5rem]"
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
        className="max-w-xl text-lg leading-relaxed text-neutral-500 sm:text-xl"
      />
    </div>
  );
}
