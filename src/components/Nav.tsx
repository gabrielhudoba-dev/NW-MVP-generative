"use client";

import Link from "next/link";
import { NwLogo } from "./NwLogo";
import { useMenu } from "./MenuProvider";

interface NavProps {
  variant?: "transparent" | "solid";
}

export function Nav({ variant = "transparent" }: NavProps) {
  const { open, navigating, toggle } = useMenu();

  /* Hide nav chrome instantly when zoom-in navigation starts */
  const hidden = open && navigating;

  return (
    <>
    <nav
      className="flex items-center px-5 pt-7 pb-4 sm:px-10 lg:px-14 xl:px-[52px]"
      style={{
        position: "fixed",
        top:      0,
        left:     0,
        right:    0,
        zIndex:   open ? 60 : 40,
        opacity:  hidden ? 0 : 1,
        transition: "opacity 0.15s ease",
        pointerEvents: hidden ? "none" : undefined,
        ...(variant === "solid" && !open
          ? { background: "#fff" }
          : {}),
      }}
    >
      {/* Logo — always visible, switches to white when menu open */}
      <Link href="/" aria-label="Native Works home">
        <NwLogo
          height="36"
          style={{
            color:      open ? "var(--ink-on-dark)" : "var(--ink)",
            transition: "color 0.2s ease",
          }}
        />
      </Link>

      <div className="flex-1" />

      {/* Burger ↔ X */}
      <button
        onClick={toggle}
        className="flex flex-col justify-center gap-[6px] w-8 h-8 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <span
          className="block h-px w-6 rounded-full transition-all duration-300 origin-center"
          style={{
            background: open ? "var(--ink-on-dark)" : "var(--ink)",
            transform:  open ? "translateY(3.5px) rotate(45deg)" : "none",
          }}
        />
        <span
          className="block h-px w-6 rounded-full transition-all duration-300 origin-center"
          style={{
            background: open ? "var(--ink-on-dark)" : "var(--ink)",
            transform:  open ? "translateY(-3.5px) rotate(-45deg)" : "none",
          }}
        />
      </button>
    </nav>
    {/* Spacer — occupies the same flow space the fixed nav would */}
    <div className="pt-7 pb-4" style={{ visibility: "hidden" }}>
      <div style={{ height: 36 }} />
    </div>
    </>
  );
}
