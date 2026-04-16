import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SITUATIONS } from "@/lib/content/situations";

export default function SituationsPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "#fff", minHeight: "70vh" }}>

        {/* Header */}
        <div
          className="px-5 sm:px-10 lg:px-14 xl:px-[52px] pt-20 pb-16 sm:pt-28 sm:pb-20"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <h1
            className="mb-5"
            style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "var(--text-h1)",
              fontWeight:    "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight:    "var(--heading-leading)",
              color:         "var(--ink)",
            }}
          >
            Situations
          </h1>
          <h2
            style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "var(--text-h2)",
              fontWeight:    "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight:    "var(--heading-leading)",
              color:         "var(--muted-strong)",
              width:         "100%",
            }}
          >
            We work best when there is a specific<br />
            problem on the table.
          </h2>
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
                    fontSize:      "var(--text-h3)",
                    fontWeight:    "var(--heading-weight)",
                    letterSpacing: "var(--heading-tracking)",
                    lineHeight:    "var(--heading-leading)",
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
