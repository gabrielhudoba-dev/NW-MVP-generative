import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SITUATIONS } from "@/lib/content/situations";

export default function SituationsPage() {
  return (
    <>
      <Nav variant="solid" />
      <main style={{ background: "#fff", minHeight: "70vh" }}>

        {/* Header */}
        <div
          className="px-5 sm:px-10 lg:px-14 xl:px-[52px] pt-20 pb-16 sm:pt-28 sm:pb-20"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <p
            className="mb-5 text-[0.625rem] font-medium uppercase tracking-[0.12em]"
            style={{ color: "var(--muted)" }}
          >
            Situations
          </p>
          <h1
            className="max-w-[28rem]"
            style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "var(--text-section)",
              fontWeight:    "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight:    "var(--heading-leading)",
              color:         "var(--ink)",
            }}
          >
            We work best when there is a specific problem on the table.
          </h1>
        </div>

        {/* List */}
        <ul className="px-5 sm:px-10 lg:px-14 xl:px-[52px]">
          {SITUATIONS.map((s, i) => (
            <li key={s.slug} style={{ borderBottom: "1px solid var(--rule)" }}>
              <Link
                href={`/situations/${s.slug}`}
                className="group flex items-baseline gap-5 py-6"
              >
                <span
                  className="shrink-0 w-6 text-[0.625rem] tabular-nums font-medium"
                  style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span
                  style={{
                    fontFamily:    "var(--font-display)",
                    fontSize:      "clamp(1.25rem, 2.5vw, 1.75rem)",
                    fontWeight:    "var(--heading-weight)",
                    letterSpacing: "var(--heading-tracking)",
                    lineHeight:    1.15,
                    color:         "var(--ink)",
                  }}
                >
                  {s.title}
                </span>

                <span
                  className="ml-auto shrink-0 text-[0.8125rem] font-medium opacity-0 group-hover:opacity-100 translate-x-[-4px] group-hover:translate-x-0 transition-all duration-150"
                  style={{ color: "var(--muted)" }}
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>

      </main>
    </>
  );
}
