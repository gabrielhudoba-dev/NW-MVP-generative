"use client";

interface RewriteTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "p" | "span";
  children?: (displayed: string) => React.ReactNode;
}

export function RewriteText({ text, className, style, as: Tag = "span", children }: RewriteTextProps) {
  if (children) {
    return <Tag className={className} style={style}>{children(text)}</Tag>;
  }
  return <Tag className={className} style={style}>{text}</Tag>;
}
