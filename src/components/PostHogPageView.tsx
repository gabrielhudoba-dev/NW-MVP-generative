"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

/**
 * Tracks nw_page_view on every route change (SPA navigation).
 * Must be rendered inside <PostHogProvider> and <Suspense>.
 */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      const params = searchParams.toString();
      if (params) {
        url = url + "?" + params;
      }
      posthog.capture("nw_page_view", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}
