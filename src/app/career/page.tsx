import { Nav } from "@/components/Nav";

export default function CareerPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "#fff", minHeight: "60vh" }}>
        <div className="px-5 sm:px-10 lg:px-14 xl:px-[52px] py-20 sm:py-28">
          <h1 className="mb-5" style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-h1)",
              fontWeight: "var(--heading-weight)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight: "var(--heading-leading)",
              color: "var(--ink)",
            }}>
            Career
          </h1>
          <p style={{ color: "var(--muted)", marginTop: "1.5rem", fontSize: "0.9375rem" }}>
            Coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
