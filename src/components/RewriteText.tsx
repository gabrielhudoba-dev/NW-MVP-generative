"use client";

import { useState, useEffect, useRef } from "react";

const CHAR_MS = 22;

interface RewriteTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "p" | "span";
  children?: (displayed: string) => React.ReactNode;
}

/**
 * Typewriter effect — when text changes, types out the new value
 * character by character. First render is instant.
 */
export function RewriteText({ text, className, style, as: Tag = "span", children }: RewriteTextProps) {
  const [displayed, setDisplayed] = useState(text);
  const prevRef = useRef(text);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (text === prevRef.current) return;
    prevRef.current = text;

    if (timerRef.current) clearTimeout(timerRef.current);

    let i = 0;
    setDisplayed("");

    function tick() {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        timerRef.current = setTimeout(tick, CHAR_MS);
      } else {
        timerRef.current = null;
      }
    }

    timerRef.current = setTimeout(tick, CHAR_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  if (children) {
    return <Tag className={className} style={style}>{children(displayed)}</Tag>;
  }

  return <Tag className={className} style={style}>{displayed}</Tag>;
}
