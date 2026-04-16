import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { getSituation, SITUATIONS } from "@/lib/content/situations";

export async function generateStaticParams() {
  return SITUATIONS.map((s) => ({ slug: s.slug }));
}

/* Placeholder section — heading only, no content yet */
function Section({ label }: { label: string }) {
  return (
    <div
      className="py-14"
      style={{ borderBottom: "1px solid var(--rule)" }}
    >
      <p
        className="text-[0.625rem] font-medium uppercase tracking-[0.12em]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </p>
    </div>
  );
}

export default async function SituationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const situation = getSituation(slug);
  if (!situation) notFound();

  const idx  = SITUATIONS.findIndex((s) => s.slug === slug);
  const next = SITUATIONS[(idx + 1) % SITUATIONS.length];

  return (
    <>
      <Nav />
      <main style={{ background: "#fff" }}>

        {/* ── Header ── */}
        <div
          className="px-5 sm:px-10 lg:px-14 xl:px-[52px] pt-20 pb-16 sm:pt-28 sm:pb-20"
          style={{ borderBottom: "1px solid var(--rule)" }}
        >
          <Link
            href="/situations"
            className="inline-flex items-center gap-2 mb-10 text-[0.8125rem] font-medium"
            style={{ color: "var(--muted)" }}
          >
            ← Back
          </Link>

          <h1 style={{
              fontFamily:    "var(--font-display)",
              fontSize:      "var(--text-h1)",
              fontWeight:    "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight:    "var(--heading-leading)",
              color:         "var(--ink)",
            }}>
            {situation.title}
          </h1>
        </div>

        {/* ── Placeholder sections — labels only ── */}
        <div className="px-5 sm:px-10 lg:px-14 xl:px-[52px]">
          <Section label="Situation" />
          <Section label="Signals"   />
          <Section label="Approach"  />
          <Section label="Outcome"   />
        </div>

        {/* ── Next situation ── */}
        <div style={{ borderTop: "1px solid var(--rule)" }}>
          <Link
            href={`/situations/${next.slug}`}
            className="group flex items-center justify-between px-5 sm:px-10 lg:px-14 xl:px-[52px] py-10"
          >
            <div>
              <p
                className="mb-1 text-[0.625rem] font-medium uppercase tracking-[0.12em]"
                style={{ color: "var(--muted)" }}
              >
                Next situation
              </p>
              <p
                style={{
                  fontFamily:    "var(--font-display)",
                  fontSize:      "clamp(1.25rem, 2.5vw, 1.75rem)",
                  fontWeight:    "var(--heading-weight)",
                  letterSpacing: "var(--heading-tracking)",
                  color:         "var(--ink)",
                }}
              >
                {next.title}
              </p>
            </div>
            <span
              className="text-[1.5rem] transition-transform duration-150 group-hover:translate-x-1"
              style={{ color: "var(--muted)" }}
            >
              →
            </span>
          </Link>
        </div>

      </main>
    </>
  );
}
