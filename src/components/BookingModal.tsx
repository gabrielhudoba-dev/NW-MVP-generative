"use client";

import { useEffect, useRef, useCallback } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import type { VariantId } from "@/lib/variants";
import { track } from "@/lib/analytics";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  variant: VariantId;
}

/**
 * Cal.com booking modal — replaces the MVP placeholder form.
 *
 * Uses Cal.com inline embed inside a native <dialog>.
 * Listens to Cal.com embed events and forwards them to PostHog via track().
 *
 * Required env var: NEXT_PUBLIC_CAL_LINK (e.g. "native-works/30min")
 */
export function BookingModal({ open, onClose, variant }: BookingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const calInitialized = useRef(false);

  // Initialize Cal.com event listeners once
  useEffect(() => {
    if (calInitialized.current) return;
    calInitialized.current = true;

    (async () => {
      const cal = await getCalApi();

      // Track when the user navigates to the booking form
      cal("on", {
        action: "linkReady",
        callback: () => {
          track({ name: "nw_booking_started", variant });
        },
      });

      // Track successful booking — this is the key conversion event
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: (e: { detail: { data: Record<string, unknown> } }) => {
          track({ name: "nw_booking_completed", variant });
          // Log full booking data in dev for debugging
          if (process.env.NODE_ENV === "development") {
            console.log("[cal.com] booking data:", e.detail.data);
          }
        },
      });
    })();
  }, [variant]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      track({ name: "nw_booking_opened", variant });
    } else {
      dialog.close();
    }
  }, [open, variant]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Close on Escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = () => {
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  const calLink = process.env.NEXT_PUBLIC_CAL_LINK || "native-works/30min";

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="
        m-auto w-full max-w-xl rounded-2xl border border-neutral-200
        bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm
        open:animate-in
      "
      aria-label="Book a call with Native Works"
    >
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
              Book a call
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              30 minutes. No pitch. Just clarity.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="
              -mr-2 -mt-2 flex h-8 w-8 items-center justify-center rounded-lg
              text-neutral-400 transition-colors hover:bg-neutral-100
              hover:text-neutral-600
            "
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Cal.com inline embed */}
        <div className="min-h-[400px]">
          <Cal
            calLink={calLink}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
            config={{
              theme: "light",
              hideEventTypeDetails: "true",
              layout: "month_view",
            }}
          />
        </div>
      </div>
    </dialog>
  );
}
