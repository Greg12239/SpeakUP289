"use client";

import { useLayoutEffect } from "react";

/**
 * The breakpoint that separates the two cinematic compositions. Declared here
 * and consumed by CSS at the same value (70rem) so the renderer and the layout
 * can never disagree about which composition is on screen.
 */
export const WIDE_LAYOUT_QUERY = "(min-width: 70rem)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type LayoutSyncReason =
  | "mount"
  | "resize"
  | "breakpoint"
  | "fonts"
  | "motion-preference";

/**
 * One path for every event that can invalidate cached scene geometry.
 *
 * A scene caches its geometry so that nothing reads layout per frame. That
 * cache has several independent ways to go stale, and a bug in any earlier
 * iteration of this work came from one route skipping the cleanup another
 * route performed. So every route — a resize, a breakpoint crossing, web
 * fonts resolving, the reader changing their motion preference — is funnelled
 * through a single callback that re-measures and re-renders.
 *
 * `onSync` must be referentially stable (wrap it in `useCallback`); the
 * subscription is torn down and rebuilt whenever it changes.
 */
export function useLayoutSync(onSync: (reason: LayoutSyncReason) => void) {
  useLayoutEffect(() => {
    let cancelled = false;
    let resizeTimer: number | undefined;
    let observerFrame = 0;

    const sync = (reason: LayoutSyncReason) => {
      if (!cancelled) {
        onSync(reason);
      }
    };

    // Measure before the first paint the reader sees.
    sync("mount");

    const wide = window.matchMedia(WIDE_LAYOUT_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    const onBreakpoint = () => sync("breakpoint");
    const onMotionPreference = () => sync("motion-preference");

    wide.addEventListener("change", onBreakpoint);
    reduced.addEventListener("change", onMotionPreference);

    // Debounced: a drag-resize fires continuously, and re-measuring on every
    // event would read layout far more often than the reader can perceive.
    const onViewportChange = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => sync("resize"), 90);
    };

    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("orientationchange", onViewportChange, {
      passive: true,
    });

    // Catches layout changes no viewport event reports — a lazy image
    // resolving above the scene, for instance. Coalesced to one per frame.
    const observer = new ResizeObserver(() => {
      if (observerFrame) {
        return;
      }

      observerFrame = window.requestAnimationFrame(() => {
        observerFrame = 0;
        sync("resize");
      });
    });

    observer.observe(document.body);

    // Web fonts land after first paint, and the scene caches text geometry.
    // Without this the cache holds fallback metrics.
    void document.fonts?.ready.then(() => sync("fonts"));

    return () => {
      cancelled = true;
      wide.removeEventListener("change", onBreakpoint);
      reduced.removeEventListener("change", onMotionPreference);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
      observer.disconnect();
      window.clearTimeout(resizeTimer);

      if (observerFrame) {
        window.cancelAnimationFrame(observerFrame);
      }
    };
  }, [onSync]);
}
