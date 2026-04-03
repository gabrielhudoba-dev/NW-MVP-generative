"use client";

import { useState, useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const STEP_MS = 18;
const SCRAMBLE_ROUNDS = 3;

interface RewriteTextProps {
  text: string;
  className?: string;
  as?: "h1" | "p" | "span";
  children?: (displayed: string) => React.ReactNode;
}

/**
 * Displays text with a scramble-decode animation when the value changes.
 * First render is instant — animation only triggers on subsequent changes.
 */
export function RewriteText({ text, className, as: Tag = "span", children }: RewriteTextProps) {
  const [displayed, setDisplayed] = useState(text);
  const prevRef = useRef(text);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (text === prevRef.current) return;
    prevRef.current = text;

    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const target = text;
    const maxLen = Math.max(displayed.length, target.length);
    let resolved = 0;
    let tick = 0;

    function step() {
      tick++;
      const charsPerStep = Math.max(1, Math.floor(maxLen / 20));

      if (tick % SCRAMBLE_ROUNDS === 0) {
        resolved = Math.min(resolved + charsPerStep, maxLen);
      }

      let out = "";
      for (let i = 0; i < maxLen; i++) {
        if (i < resolved) {
          out += target[i] ?? "";
        } else if (i < target.length) {
          out += target[i] === " " ? " " : CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      }

      setDisplayed(out);

      if (resolved < maxLen) {
        rafRef.current = requestAnimationFrame(() => {
          setTimeout(step, STEP_MS);
        });
      } else {
        setDisplayed(target);
        rafRef.current = null;
      }
    }

    step();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (children) {
    return <Tag className={className}>{children(displayed)}</Tag>;
  }

  return <Tag className={className}>{displayed}</Tag>;
}
