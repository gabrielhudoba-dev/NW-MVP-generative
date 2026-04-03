"use client";

import { useEffect, useRef, useCallback } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import type { VariantId } from "@/lib/variants";
import { track, trackOnce, getTimeSinceHeroMount, NW_EVENTS } from "@/lib/analytics";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  variant: VariantId;
}

const ABANDON_TIMEOUT_MS = 60_000; // 60s inactivity = abandoned

/**
 * Cal.com booking modal with full conversion tracking.
 *
 * Tracks:
 * - nw_booking_opened: modal shown
 * - nw_booking_started: Cal.com form ready (user sees calendar)
 * - nw_booking_completed: Cal.com confirms booking (key conversion)
 * - nw_booking_modal_closed: user closes modal (X, escape, backdrop)
 * - nw_booking_abandoned: user opened but didn't complete within timeout
 */
export function BookingModal({ open, onClose, variant }: BookingModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const calInitialized = useRef(false);
  const bookingCompleted = useRef(false);
  const abandonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedAt = useRef<number | null>(null);

  const clearAbandonTimer = useCallback(() => {
    if (abandonTimer.current) {
      clearTimeout(abandonTimer.current);
      abandonTimer.current = null;
    }
  }, []);

  // Initialize Cal.com event listeners once
  useEffect(() => {
    if (calInitialized.current) return;
    calInitialized.current = true;

    (async () => {
      const cal = await getCalApi();

      cal("on", {
        action: "linkReady",
        callback: () => {
          trackOnce(NW_EVENTS.BOOKING_STARTED, { booking_surface: "cal_embed" });
        },
      });

      cal("on", {
        action: "bookingSuccessfulV2",
        callback: (e: { detail: { data: Record<string, unknown> } }) => {
          bookingCompleted.current = true;
          clearAbandonTimer();
          track(NW_EVENTS.BOOKING_COMPLETED, {
            booking_surface: "cal_embed",
            booking_data: process.env.NODE_ENV === "development" ? e.detail.data : undefined,
          });
        },
      });
    })();
  }, [variant, clearAbandonTimer]);

  // Open/close dialog + tracking
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
      bookingCompleted.current = false;
      openedAt.current = Date.now();

      track(NW_EVENTS.BOOKING_OPENED, {
        booking_surface: "cal_embed",
        time_to_booking_open_ms: getTimeSinceHeroMount(),
      });

      // Start abandon timer
      clearAbandonTimer();
      abandonTimer.current = setTimeout(() => {
        if (!bookingCompleted.current && open) {
          track(NW_EVENTS.BOOKING_ABANDONED, {
            booking_surface: "cal_embed",
            time_in_modal_ms: openedAt.current ? Date.now() - openedAt.current : null,
          });
        }
      }, ABANDON_TIMEOUT_MS);
    } else {
      dialog.close();
    }

    return () => clearAbandonTimer();
  }, [open, variant, clearAbandonTimer]);

  const handleClose = useCallback(() => {
    clearAbandonTimer();
    const timeInModal = openedAt.current ? Date.now() - openedAt.current : null;

    if (!bookingCompleted.current) {
      track(NW_EVENTS.BOOKING_MODAL_CLOSED, {
        booking_surface: "cal_embed",
        completed: false,
        time_in_modal_ms: timeInModal,
      });
    }

    dialogRef.current?.close();
    onClose();
  }, [onClose, clearAbandonTimer]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const onCancel = () => {
      handleClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [handleClose]);

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
