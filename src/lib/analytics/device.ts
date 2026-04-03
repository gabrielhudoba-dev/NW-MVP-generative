/**
 * Device and viewport context detection.
 *
 * Device type uses navigator.userAgentData (modern browsers) with
 * touch + screen size fallback. Breakpoint bucket uses viewport width.
 */

export type BreakpointBucket = "mobile" | "tablet" | "desktop" | "wide";
export type DeviceType = "mobile" | "tablet" | "desktop";

export interface DeviceContext {
  device_type: DeviceType;
  viewport_w: number;
  viewport_h: number;
  breakpoint_bucket: BreakpointBucket;
}

function getBreakpointBucket(w: number): BreakpointBucket {
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  if (w < 1440) return "desktop";
  return "wide";
}

interface NavigatorUAData {
  mobile?: boolean;
  platform?: string;
}

function getRealDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";

  // Modern API — direct answer from the browser
  const uaData = (navigator as unknown as { userAgentData?: NavigatorUAData }).userAgentData;
  if (uaData) {
    if (uaData.mobile) return "mobile";
    return "desktop";
  }

  // Fallback: touch + UA string heuristics
  const hasTouch = navigator.maxTouchPoints > 0;
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|android.*mobile|windows phone/.test(ua)) return "mobile";
  if (/ipad|android(?!.*mobile)|tablet/.test(ua)) return "tablet";
  if (hasTouch && window.innerWidth < 1024) return "tablet";

  return "desktop";
}

export function detectDevice(): DeviceContext {
  if (typeof window === "undefined") {
    return { device_type: "desktop", viewport_w: 0, viewport_h: 0, breakpoint_bucket: "desktop" };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    device_type: getRealDeviceType(),
    viewport_w: w,
    viewport_h: h,
    breakpoint_bucket: getBreakpointBucket(w),
  };
}
