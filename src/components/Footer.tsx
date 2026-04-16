"use client";

import Link from "next/link";
import { NwLogo } from "./NwLogo";

const LINKS = [
  { href: "/situations",    label: "Situations"         },
  { href: "/capabilities",  label: "Capabilities"       },
  { href: "/leadership",    label: "Leadership"         },
  { href: "/process",       label: "Process"            },
  { href: "/insights",      label: "Insights"           },
  { href: "/career",        label: "Career"             },
  { href: "/become-member", label: "Become a Member"    },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--surface-dark)", color: "var(--ink-on-dark)" }}>

      {/* ── CTA band ── */}
      <div
        className="px-5 sm:px-10 lg:px-14 xl:px-[52px] py-16 sm:py-20"
        style={{ borderBottom: "1px solid rgba(241,250,255,0.08)" }}
      >
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <h2
            className="max-w-[26rem]"
            style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "clamp(1.75rem, 3.5vw, 2.75rem)",
              fontWeight:    "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight:    "var(--heading-leading)",
              color:         "var(--ink-on-dark)",
            }}
          >
            Ready to bring clarity to your product?
          </h2>

          <div className="flex flex-col gap-3 sm:items-end shrink-0">
            <button
              data-cal-namespace="15min"
              data-cal-link="native-works-oxvx0d/15min"
              data-cal-config='{"layout":"month_view"}'
              className="inline-flex h-12 items-center rounded-full px-8 text-[1rem] font-medium transition-opacity duration-150 hover:opacity-85"
              style={{ background: "var(--ink-on-dark)", color: "var(--surface-dark)" }}
            >
              Book a Call
            </button>
            <a
              href="mailto:hello@nativeworks.co"
              className="text-[0.875rem] font-medium"
              style={{ color: "rgba(241,250,255,0.5)" }}
            >
              hello@nativeworks.co
            </a>
          </div>
        </div>
      </div>

      {/* ── Info grid ── */}
      <div className="px-5 sm:px-10 lg:px-14 xl:px-[52px] py-14 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-4">
            <NwLogo height="20" style={{ color: "var(--ink-on-dark)" }} />
            <p
              className="text-[0.875rem] leading-relaxed max-w-[22rem]"
              style={{ color: "rgba(241,250,255,0.45)" }}
            >
              Product clarity, system thinking, and decision quality for teams
              building complex digital products.
            </p>
          </div>

          {/* Site links */}
          <div className="flex flex-col gap-2.5">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[0.875rem] w-fit transition-colors duration-150"
                style={{ color: "rgba(241,250,255,0.5)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(241,250,255,1)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(241,250,255,0.5)")}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Empty col on desktop for balance */}
          <div />
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-6 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(241,250,255,0.08)" }}
        >
          <span className="text-[0.75rem]" style={{ color: "rgba(241,250,255,0.35)" }}>
            © 2025 Native Works
          </span>
          <Link
            href="/privacy"
            className="text-[0.75rem] transition-colors duration-150"
            style={{ color: "rgba(241,250,255,0.35)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(241,250,255,0.6)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(241,250,255,0.35)")}
          >
            Privacy Policy
          </Link>
        </div>
      </div>

    </footer>
  );
}
