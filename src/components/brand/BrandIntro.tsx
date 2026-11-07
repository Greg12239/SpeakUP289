"use client";

import gsap from "gsap";
import { type ReactNode, useId, useLayoutEffect, useRef } from "react";
import { BRAND_INTRO_DURATION, BRAND_INTRO_HANDOFF, BRAND_INTRO_LABELS } from "@/lib/brand-intro";
import { publicAsset } from "@/lib/public-asset";
import styles from "./BrandIntro.module.css";

const assets = ["wordmark", "arrow", "signature"].map((layer) =>
  publicAsset(`/brand/speakup-intro-${layer}.png`),
);

/**
 * Original-pixel mattes, registered in the original 1250 × 370 coordinate system.
 * Bounds/provenance are reproducible with scripts/derive-intro-assets.mjs.
 * No font substitution, glyph transforms, live blur or per-frame React updates.
 */
export function BrandIntro({ children }: { children: ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let finished = false;
    let handedOff = false;
    let context: gsap.Context | undefined;
    let master: gsap.core.Timeline | undefined;
    let startPlayback: (() => void) | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const qa = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)
      && new URLSearchParams(location.search).get("intro-qa") === "1";

    const handoff = () => {
      if (handedOff) return;
      handedOff = true;
      window.dispatchEvent(new Event(BRAND_INTRO_HANDOFF));
    };
    const release = () => {
      finished = true;
      overlay.hidden = true;
      overlay.dataset.state = "complete";
      content.inert = false;
      clearTimeout(watchdog);
      overlay.removeEventListener("wheel", preventScroll);
      window.removeEventListener("keydown", handleKey);
      reduced.removeEventListener("change", bypass);
      handoff();
    };
    const bypass = () => {
      master?.pause();
      release();
    };
    const preventScroll = (event: WheelEvent) => { event.preventDefault(); };
    const handleKey = (event: KeyboardEvent) => {
      if (finished) return;
      // Keyboard users can enter immediately; do not consume their Tab press.
      if (event.key === "Escape" || event.key === "Tab") bypass();
      else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) event.preventDefault();
    };

    if (reduced.matches || getComputedStyle(overlay).display === "none" || getComputedStyle(overlay).visibility === "hidden") {
      release();
      return;
    }

    content.inert = true;
    // Block scrolling on the overlay without removing the document scrollbar.
    // This preserves the Hero's layout width exactly through the handoff.
    overlay.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("keydown", handleKey);
    reduced.addEventListener("change", bypass);
    // Covers failed decoding, failed initialization and a stalled animation tick.
    // Never extends the normal master timeline or adds a second waiting phase.
    if (!qa) watchdog = setTimeout(bypass, 5000);

    const initialize = async () => {
      try {
        await Promise.all(assets.map(async (src) => {
          const image = new Image();
          image.src = src;
          await image.decode();
        }));
        if (disposed || finished || reduced.matches) return;

        context = gsap.context(() => {
          const select = gsap.utils.selector(overlay);
          master = gsap.timeline({
            id: "speakup-brand-intro",
            paused: true,
            defaults: { ease: "power2.inOut" },
            onComplete: release,
          });
          Object.entries(BRAND_INTRO_LABELS).forEach(([label, time]) => master!.addLabel(label, time));

          master
            .to(select("[data-atmosphere]"), { opacity: 1, duration: 0.38 }, 0.12)
            // Diagonal matte travels from the real arrow's lower-left to upper-right.
            .to(select("[data-arrow-matte]"), { x: 0, y: 0, duration: 0.28, ease: "power2.out" }, 0.15)
            .to(select("[data-signal-falloff]"), { opacity: 0.6, duration: 0.28 }, 0.15)
            // Two halves share a boundary and expose outward from the A. Artwork never moves.
            .to(select("[data-wordmark-left]"), { attr: { x: 0, width: 590 }, duration: 0.56 }, 0.43)
            .to(select("[data-wordmark-right]"), { attr: { width: 660 }, duration: 0.62 }, 0.43)
            .to(select("[data-signal-falloff]"), { opacity: 0.22, duration: 0.32 }, 0.65)
            // A fixed upper-left key and grazing edge share the original exposure mattes.
            .to(select("[data-gloss]"), { opacity: 0.92, duration: 0.32, ease: "power2.out" }, 0.8)
            .to(select("[data-gloss]"), { opacity: 0.62, duration: 0.3 }, 1.35)
            .to(select("[data-key-falloff]"), { opacity: 0.3, duration: 0.24 }, 0.94)
            .to(select("[data-key-falloff]"), { opacity: 0.05, duration: 0.4 }, 1.25)
            // Broader, angled reflection; soft shoulder precedes a restrained specular core.
            .to(select("[data-highlight]"), { opacity: 0.52, duration: 0.1 }, 1.05)
            .to(select("[data-highlight-beam]"), { x: 1580, duration: 0.48, ease: "power1.inOut" }, 1.05)
            .to(select("[data-highlight]"), { opacity: 0, duration: 0.15 }, 1.42)
            // Red bounces only onto the foot of the A; the authentic arrow stays unfiltered.
            .to(select("[data-red-reflection]"), { opacity: 0.12, duration: 0.16 }, 1.05)
            .to(select("[data-red-reflection]"), { opacity: 0.035, duration: 0.24 }, 1.21)
            .to(select("[data-signal-falloff]"), { opacity: 0.5, duration: 0.12 }, 1.05)
            .to(select("[data-signal-falloff]"), { opacity: 0.12, duration: 0.18 }, 1.17)
            .to(select("[data-signature-matte]"), { attr: { y: 300 }, duration: 0.3, ease: "power2.out" }, 1.35)
            .to(select("[data-signature]"), { y: 0, duration: 0.3, ease: "power2.out" }, 1.35)
            // No perpetual motion during the settled 1.65–1.95 signature hold.
            .call(handoff, [], 1.95)
            .to(select("[data-stage]"), { y: -6, opacity: 0, duration: 0.22, ease: "power2.in" }, 1.95)
            .to(overlay, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.25 }, 1.95);

          if (master.duration() !== BRAND_INTRO_DURATION) throw new Error("Brand intro duration must be 2.200s");
          if (qa) {
            overlay.dataset.state = "ready";
            window.__speakupIntro = {
              pause: () => master!.pause(),
              seekFrame: (frame) => {
                const time = gsap.utils.clamp(0, BRAND_INTRO_DURATION, frame / 60);
                overlay.hidden = false;
                overlay.dataset.state = "ready";
                content.inert = true;
                master!.pause().time(time, false);
                // Seeking to the already-completed endpoint need not fire onComplete again.
                if (time === BRAND_INTRO_DURATION) release();
              },
              resume: () => master!.play(),
              state: () => ({
                time: master!.time(),
                duration: master!.duration(),
                labels: { ...master!.labels },
                activeMasters: gsap.globalTimeline.getChildren().filter((animation) => animation.vars.id === "speakup-brand-intro").length,
                complete: overlay.hidden === true,
              }),
            };
          } else {
            // Start on an engine tick so cached parent time cannot shorten the
            // first interval by the time since the previous browser refresh.
            startPlayback = () => {
              if (disposed || finished) return;
              overlay.dataset.state = "ready";
              master!.play(0);
            };
            gsap.ticker.add(startPlayback, true);
          }
        }, overlay);
      } catch (error) {
        if (!disposed) {
          console.warn("SpeakUp intro bypassed:", error);
          bypass();
        }
      }
    };
    void initialize();

    return () => {
      disposed = true;
      clearTimeout(watchdog);
      reduced.removeEventListener("change", bypass);
      overlay.removeEventListener("wheel", preventScroll);
      window.removeEventListener("keydown", handleKey);
      context?.revert();
      if (startPlayback) gsap.ticker.remove(startPlayback);
      content.inert = false;
      delete window.__speakupIntro;
    };
  }, []);

  return (
    <>
      {assets.map((src) => <link key={src} rel="preload" as="image" href={src} />)}
      {/* Header already exposes the brand name. All intro artwork is decorative. */}
      <div ref={overlayRef} className={styles.overlay} data-brand-intro data-state="pending" aria-hidden="true">
        <div className={styles.atmosphere} data-atmosphere />
        <div className={styles.stage} data-stage>
          <span className={styles.signalFalloff} data-signal-falloff />
          <svg className={styles.artwork} viewBox="0 0 1250 370" focusable="false" aria-hidden="true">
            <defs>
              <image id={`${id}-body`} href={assets[0]} x="8" y="9" width="1234" height="255" />
              <clipPath id={`${id}-left`}><rect data-wordmark-left x="590" y="0" width="0" height="280" /></clipPath>
              <clipPath id={`${id}-right`}><rect data-wordmark-right x="590" y="0" width="0" height="280" /></clipPath>
              <clipPath id={`${id}-arrow`}>
                <polygon data-arrow-matte points="490,215.5 592,113.5 694,215.5 592,317.5" style={{ transform: "translate(-105px, 105px)" }} />
              </clipPath>
              <clipPath id={`${id}-signature`}><rect data-signature-matte x="0" y="370" width="1250" height="80" /></clipPath>
              <mask id={`${id}-contours`} maskUnits="userSpaceOnUse" x="0" y="0" width="1250" height="280" style={{ maskType: "alpha" }}>
                <use href={`#${id}-body`} />
              </mask>
              {/* Static, logo-sized filters: no animated blur or full-screen filter surface. */}
              <filter id={`${id}-contact`} filterUnits="userSpaceOnUse" x="-12" y="-12" width="1274" height="300" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#1d1033" floodOpacity="0.24" />
              </filter>
              <filter id={`${id}-upper-edge`} filterUnits="userSpaceOnUse" x="0" y="0" width="1250" height="280">
                <feOffset in="SourceAlpha" dy="1.6" result="lower-contour" />
                <feComposite in="SourceAlpha" in2="lower-contour" operator="out" />
              </filter>
              <mask id={`${id}-edge-contours`} maskUnits="userSpaceOnUse" x="0" y="0" width="1250" height="280" style={{ maskType: "alpha" }}>
                <use href={`#${id}-body`} filter={`url(#${id}-upper-edge)`} />
              </mask>
              <linearGradient id={`${id}-surface-depth`} x1="0" y1="0" x2="0.28" y2="1">
                <stop offset="0.1" stopColor="#2b164c" stopOpacity="0" />
                <stop offset="0.55" stopColor="#2b164c" stopOpacity="0.035" />
                <stop offset="1" stopColor="#2b164c" stopOpacity="0.13" />
              </linearGradient>
              <radialGradient id={`${id}-key`} gradientUnits="userSpaceOnUse" cx="240" cy="25" r="550" gradientTransform="translate(240 25) scale(1 .48) translate(-240 -25)">
                <stop stopColor="white" stopOpacity="0.95" />
                <stop offset="0.32" stopColor="white" stopOpacity="0.64" />
                <stop offset="0.72" stopColor="#f4effa" stopOpacity="0.16" />
                <stop offset="1" stopColor="#f4effa" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`${id}-key-falloff`}>
                <stop stopColor="#f4effa" stopOpacity="0.52" />
                <stop offset="0.25" stopColor="#f4effa" stopOpacity="0.08" />
                <stop offset="1" stopColor="#f4effa" stopOpacity="0" />
              </radialGradient>
              <radialGradient id={`${id}-red-bounce`} gradientUnits="userSpaceOnUse" cx="592" cy="246" r="125" gradientTransform="translate(592 246) scale(1 .34) translate(-592 -246)">
                <stop stopColor="#e0003c" />
                <stop offset="1" stopColor="#e0003c" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="0.34">
                <stop stopColor="#f4effa" stopOpacity="0" />
                <stop offset="0.22" stopColor="#2b164c" stopOpacity="0.12" />
                <stop offset="0.36" stopColor="#f4effa" stopOpacity="0.04" />
                <stop offset="0.52" stopColor="white" stopOpacity="0.66" />
                <stop offset="0.61" stopColor="white" stopOpacity="0.9" />
                <stop offset="0.8" stopColor="#2b164c" stopOpacity="0.05" />
                <stop offset="1" stopColor="#f4effa" stopOpacity="0" />
              </linearGradient>
              <g id={`${id}-surface`}>
                <use href={`#${id}-body`} filter={`url(#${id}-contact)`} />
                <g mask={`url(#${id}-contours)`}>
                  <rect data-surface-depth width="1250" height="280" fill={`url(#${id}-surface-depth)`} />
                  <g className={styles.gloss} data-gloss>
                    <rect width="1250" height="280" fill={`url(#${id}-key)`} />
                    <rect width="1250" height="280" fill={`url(#${id}-key)`} mask={`url(#${id}-edge-contours)`} />
                  </g>
                  <rect className={styles.redReflection} data-red-reflection width="1250" height="280" fill={`url(#${id}-red-bounce)`} />
                </g>
              </g>
            </defs>
            <ellipse className={styles.keyFalloff} data-key-falloff cx="140" cy="16" rx="120" ry="38" fill={`url(#${id}-key-falloff)`} />
            <use href={`#${id}-surface`} clipPath={`url(#${id}-left)`} />
            <use href={`#${id}-surface`} clipPath={`url(#${id}-right)`} />
            <image href={assets[1]} x="542" y="166" width="100" height="99" clipPath={`url(#${id}-arrow)`} />
            <g className={styles.highlight} data-highlight mask={`url(#${id}-contours)`}>
              <rect data-highlight-beam x="-330" y="0" width="310" height="280" fill={`url(#${id}-light)`} />
            </g>
            <g clipPath={`url(#${id}-signature)`}>
              <image className={styles.signature} data-signature href={assets[2]} x="481" y="313" width="282" height="48" />
            </g>
          </svg>
        </div>
      </div>
      <div ref={contentRef} data-intro-content>{children}</div>
    </>
  );
}
