"use client";

import { useEffect, useRef } from "react";
import { getCalApi } from "@calcom/embed-react";
import { track, trackOnce, NW_EVENTS } from "@/lib/analytics";

/**
 * Headless Cal.com initializer — sets up popup trigger + event tracking.
 * The actual popup is triggered by data-cal-* attributes on the CTA button.
 */
export function CalEmbed() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      const cal = await getCalApi({ namespace: "15min" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });

      cal("on", {
        action: "linkReady",
        callback: () => {
          trackOnce(NW_EVENTS.BOOKING_STARTED, { booking_surface: "cal_embed" });
        },
      });

      cal("on", {
        action: "bookingSuccessfulV2",
        callback: () => {
          track(NW_EVENTS.BOOKING_COMPLETED, { booking_surface: "cal_embed" });
        },
      });
    })();
  }, []);

  return null;
}
