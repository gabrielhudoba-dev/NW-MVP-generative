import { Nav } from "@/components/Nav";

export default function CapabilitiesPage() {
  return (
    <>
      <Nav variant="solid" />
      <main style={{ background: "#fff", minHeight: "60vh" }}>
        <div className="px-5 sm:px-10 lg:px-14 xl:px-[52px] py-20 sm:py-28">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-section)",
              fontWeight: "var(--heading-weight)",
              color: "var(--ink)",
              letterSpacing: "var(--heading-tracking)",
              lineHeight: "var(--heading-leading)",
            }}
          >
            Capabilities
          </h1>
          <p style={{ color: "var(--muted)", marginTop: "1.5rem", fontSize: "0.9375rem" }}>
            Coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
