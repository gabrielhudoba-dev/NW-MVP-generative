"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState, memo,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMenu } from "./MenuProvider";
import { SITUATIONS } from "@/lib/content/situations";

/* ─── constants ─── */
const PAD       = 20;
const GAP       = 10;
const REST_ZOOM = 1.96875;

/** Stagger: ms between batches when mounting iframes for the first time */
const BATCH_SIZE  = 6;
const BATCH_DELAY = 20; // ms between batches

/* ─── Card definition ─── */
interface CardDef {
  href:  string;
  label: string;
  x:     number;
  y:     number;
}

interface Layout {
  cards:  CardDef[];
  totalW: number;
  totalH: number;
}

function buildLayout(aw: number, ah: number): Layout {
  const step  = aw + GAP;
  const vstep = ah + GAP;
  const cards: CardDef[] = [];

  cards.push({ href: "/", label: "Home", x: 0, y: 0 });

  const r1 = vstep;
  cards.push({ href: "/situations", label: "Situations", x: 0, y: r1 });
  SITUATIONS.forEach((s, i) => {
    cards.push({ href: `/situations/${s.slug}`, label: s.title, x: (i + 1) * step, y: r1 });
  });

  const cats = [
    { href: "/capabilities",  label: "Capabilities" },
    { href: "/leadership",    label: "Leadership" },
    { href: "/process",       label: "Process" },
    { href: "/insights",      label: "Insights" },
    { href: "/career",        label: "Career" },
    { href: "/become-member", label: "Become a Member" },
  ];
  cats.forEach((p, i) => {
    cards.push({ href: p.href, label: p.label, x: 0, y: (2 + i) * vstep });
  });

  let maxX = 0;
  for (const c of cards) if (c.x + aw > maxX) maxX = c.x + aw;

  return { cards, totalW: maxX, totalH: (2 + cats.length - 1) * vstep + ah };
}

/* ─── Dimensions ─── */
interface Dims {
  aw: number;
  ah: number;
  sc: number;
  iw: number;
  ih: number;
}

function useDims(): Dims {
  const [d, set] = useState<Dims>({ aw: 300, ah: 180, sc: 0.23, iw: 1280, ih: 800 });

  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const ahByH = (vh - 2 * PAD - 3 * GAP) / 4;
      const awByH = ahByH * (5 / 3);
      const cols  = vw < 768 ? 2 : 3;
      const awByW = (vw - 2 * PAD - (cols - 1) * GAP) / cols;

      const aw = Math.max(60, Math.floor(Math.min(awByW, awByH)));
      const ah = Math.round(aw * 3 / 5);
      const sc = aw / vw;
      const ih = Math.max(vh, Math.ceil(ah / sc));

      set({ aw, ah, sc, iw: vw, ih });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return d;
}

/* ─── Helpers ─── */
function inIframe(): boolean {
  try {
    return typeof window !== "undefined" &&
      (window.frameElement !== null || window.self !== window.top);
  } catch { return true; }
}

function findCardIdx(cards: CardDef[], pathname: string): number {
  const exact = cards.findIndex(c => c.href === pathname);
  if (exact !== -1) return exact;
  return cards.findIndex(c => c.href !== "/" && pathname.startsWith(c.href));
}

/* ─── CardFrame ───
 *  - `mounted`: whether the iframe DOM element exists
 *  - `onLoaded`: callback to notify parent that iframe content is ready
 *  - `hasLoaded`: persistent flag so re-opening doesn't re-fade
 */
const CardFrame = memo(function CardFrame({ href, label, iw, ih, sc, mounted, hasLoaded, onLoaded }: {
  href: string; label: string;
  iw: number; ih: number; sc: number;
  mounted: boolean;
  hasLoaded: boolean;
  onLoaded: () => void;
}) {
  if (!mounted) return null;

  return (
    <iframe
      src={href}
      title={label}
      onLoad={onLoaded}
      style={{
        width:           iw,
        height:          ih,
        border:          "none",
        transform:       `scale(${sc})`,
        transformOrigin: "top left",
        pointerEvents:   "none",
        display:         "block",
        position:        "absolute",
        top:             0,
        left:            0,
        opacity:         hasLoaded ? 1 : 0,
        transition:      "opacity 0.3s ease",
      }}
      tabIndex={-1}
      aria-hidden="true"
    />
  );
});

/* ═══════════════════════════════════════════════════════
 *  ArtboardNav — Figma-style canvas navigation
 *
 *  Loading strategy:
 *   - First open: mount iframes in batches of BATCH_SIZE, BATCH_DELAY apart.
 *     Current page card is always in the first batch.
 *   - Iframes stay mounted after close (no unmount).
 *   - Second open = instant — everything already loaded.
 * ═══════════════════════════════════════════════════════ */
export function ArtboardNav() {
  const { open, close, setNavigating } = useMenu();
  const router   = useRouter();
  const pathname = usePathname();
  const dims     = useDims();
  const { aw, ah, sc, iw, ih } = dims;
  const isIframe = useRef(inIframe());

  const layout = useMemo(() => buildLayout(aw, ah), [aw, ah]);
  const { cards, totalW, totalH } = layout;
  const layoutRef = useRef(layout); layoutRef.current = layout;

  /* ── Mounted set — once mounted, stays mounted ── */
  const [mountedSet, setMounted] = useState<Set<string>>(new Set());
  const hasEverOpened = useRef(false);

  useEffect(() => {
    if (!open || hasEverOpened.current) return;
    hasEverOpened.current = true;

    // Sort: current page first, then backwards, then forward
    const currentIdx = Math.max(0, findCardIdx(cards, pathname));
    const sorted: CardDef[] = [cards[currentIdx]];
    for (let i = currentIdx - 1; i >= 0; i--) sorted.push(cards[i]);
    for (let i = currentIdx + 1; i < cards.length; i++) sorted.push(cards[i]);

    // Mount in batches
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < sorted.length; i += BATCH_SIZE) {
      const batch = sorted.slice(i, i + BATCH_SIZE);
      const delay = (i / BATCH_SIZE) * BATCH_DELAY;
      timers.push(setTimeout(() => {
        setMounted(prev => {
          const next = new Set(prev);
          batch.forEach(c => next.add(c.href));
          return next;
        });
      }, delay));
    }

    return () => timers.forEach(clearTimeout);
  }, [open, cards, pathname]);

  /* ── Loaded set — tracks which iframes fired onLoad (persistent) ── */
  const [loadedSet, setLoaded] = useState<Set<string>>(new Set());
  const markLoaded = useCallback((href: string) => {
    setLoaded(prev => {
      if (prev.has(href)) return prev; // no re-render if already marked
      return new Set(prev).add(href);
    });
  }, []);

  /* ── visibility — once true, stays true (iframes live forever in DOM) ── */
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (open && !visible) setVisible(true);
  }, [open, visible]);

  /* ── close on navigation ── */
  const closeRef = useRef(close); closeRef.current = close;
  const mountRef = useRef(false);
  useEffect(() => {
    if (!mountRef.current) { mountRef.current = true; return; }
    closeRef.current();
  }, [pathname]);

  /* ── escape ── */
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, close]);

  /* ── scroll lock ── */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  /* ── canvas state ── */
  const [zoom, setZoom]       = useState(REST_ZOOM);
  const [pan, setPan]         = useState({ x: 0, y: 0 });
  const [animate, setAnimate] = useState(false);
  const [dragging, setDrag]   = useState(false);
  const zoomingRef = useRef(false);
  const drag = useRef<{
    on: boolean; moved: boolean;
    sx: number; sy: number; px: number; py: number;
    href: string | null; cardX: number; cardY: number;
  }>({ on: false, moved: false, sx: 0, sy: 0, px: 0, py: 0, href: null, cardX: 0, cardY: 0 });
  const panRef  = useRef(pan);  panRef.current = pan;
  const pathRef = useRef(pathname); pathRef.current = pathname;

  const panForCard = useCallback(
    (cx: number, cy: number, S: number) => ({
      x: S * (totalW / 2 - cx),
      y: S * (totalH / 2 - cy),
    }),
    [totalW, totalH],
  );

  const fullZoom = useCallback(
    () => Math.max(window.innerWidth / aw, window.innerHeight / ah),
    [aw, ah],
  );

  /* ── OPEN → zoom out ── */
  const prevOpen = useRef(false);
  useEffect(() => {
    const wasOpen = prevOpen.current;
    prevOpen.current = open;
    if (!open || wasOpen) return;

    const { cards: c } = layoutRef.current;
    const idx = findCardIdx(c, pathRef.current);
    if (idx < 0) { setAnimate(false); setZoom(REST_ZOOM); setPan({ x: 0, y: 0 }); return; }

    const card = c[idx];
    const cx = card.x + aw / 2, cy = card.y + ah / 2;
    const S = fullZoom();

    zoomingRef.current = true;
    setAnimate(false);
    setZoom(S);
    setPan(panForCard(cx, cy, S));

    const endPan = panForCard(cx, cy, REST_ZOOM);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnimate(true);
      setZoom(REST_ZOOM);
      setPan(endPan);
      setTimeout(() => { setAnimate(false); zoomingRef.current = false; }, 650);
    }));
  }, [open, aw, ah, panForCard, fullZoom]);

  /* ── Navigate (zoom-in → route change) ── */
  const navigateTo = useCallback(
    (href: string, cardX: number, cardY: number) => {
      if (zoomingRef.current) return;
      const cx = cardX + aw / 2;
      const S = fullZoom();
      const vh = window.innerHeight;

      zoomingRef.current = true;
      setNavigating(true);
      setAnimate(true);
      setZoom(S);
      setPan({
        x: S * (totalW / 2 - cx),
        y: S * (totalH / 2 - cardY) - vh / 2,
      });

      setTimeout(() => {
        router.push(href);
        setTimeout(() => {
          setAnimate(false);
          zoomingRef.current = false;
          closeRef.current();
        }, 200);
      }, 550);
    },
    [router, aw, totalW, totalH, fullZoom, setNavigating],
  );

  /* ── pointer handlers ── */
  const onPD = useCallback((e: React.PointerEvent) => {
    if (zoomingRef.current) return;
    const cardEl = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    drag.current = {
      on: true, moved: false,
      sx: e.clientX, sy: e.clientY,
      px: panRef.current.x, py: panRef.current.y,
      href:  cardEl?.dataset.href ?? null,
      cardX: Number(cardEl?.dataset.cx ?? 0),
      cardY: Number(cardEl?.dataset.cy ?? 0),
    };
    setDrag(true);
  }, []);

  const onPM = useCallback((e: React.PointerEvent) => {
    if (!drag.current.on) return;
    const dx = e.clientX - drag.current.sx, dy = e.clientY - drag.current.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.current.moved = true;
    setPan({ x: drag.current.px + dx, y: drag.current.py + dy });
  }, []);

  const onPU = useCallback(() => {
    const d = drag.current;
    if (!d.moved && d.href) navigateTo(d.href, d.cardX, d.cardY);
    d.on = false;
    setDrag(false);
  }, [navigateTo]);

  /* ── trackpad / wheel ── */
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !open) return;
    const handler = (e: WheelEvent) => {
      if (zoomingRef.current) return;
      e.preventDefault();
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [open, visible]);

  /* ── render gate ── */
  if (isIframe.current || !visible) return null;

  const tx = -(totalW / 2) * zoom + pan.x;
  const ty = -(totalH / 2) * zoom + pan.y;

  return (
    <div
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "#04082E",
        backgroundImage: "radial-gradient(rgba(241,250,255,.18) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        visibility: open ? "visible" : "hidden",
        transition: open
          ? "opacity 0.05s ease, visibility 0s"
          : "opacity 0.3s ease, visibility 0s 0.3s",
        pointerEvents: open ? undefined : "none",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      onPointerDown={onPD}
      onPointerMove={onPM}
      onPointerUp={onPU}
      onPointerCancel={onPU}
    >
      <div
        style={{
          position: "absolute", left: "50%", top: "50%",
          width: totalW, height: totalH,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transition: animate ? "transform 0.6s cubic-bezier(.4,0,.2,1)" : "none",
          willChange: "transform",
        }}
      >
        {cards.map(card => (
          <div
            key={card.href}
            data-card=""
            data-href={card.href}
            data-cx={card.x}
            data-cy={card.y}
            style={{
              position: "absolute",
              left: card.x, top: card.y,
              width: aw, height: ah,
              overflow: "hidden",
              cursor: "pointer",
              background: "#fff",
              boxShadow: "0 2px 16px rgba(0,0,0,.32)",
            }}
          >
            <CardFrame
              href={card.href}
              label={card.label}
              iw={iw}
              ih={ih}
              sc={sc}
              mounted={mountedSet.has(card.href)}
              hasLoaded={loadedSet.has(card.href)}
              onLoaded={() => markLoaded(card.href)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
