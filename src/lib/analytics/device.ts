/**
 * Device and viewport context detection.
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

function getDeviceType(w: number): DeviceType {
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function detectDevice(): DeviceContext {
  if (typeof window === "undefined") {
    return { device_type: "desktop", viewport_w: 0, viewport_h: 0, breakpoint_bucket: "desktop" };
  }
  const w = window.innerWidth;
  const h = window.innerHeight;
  return {
    device_type: getDeviceType(w),
    viewport_w: w,
    viewport_h: h,
    breakpoint_bucket: getBreakpointBucket(w),
  };
}
