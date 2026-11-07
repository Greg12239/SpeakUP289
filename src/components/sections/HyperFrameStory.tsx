"use client";

import { useMotionValueEvent, useScroll, type MotionValue } from "motion/react";
import { useCallback, useRef } from "react";
import {
  REDUCED_MOTION_QUERY,
  WIDE_LAYOUT_QUERY,
  useLayoutSync,
} from "@/hooks/useLayoutSync";
import {
  speakupStoryChapters,
  type SpeakupStoryChapter,
} from "@/content/site";
import { setNavThemeOverride, type NavTheme } from "@/lib/nav-theme";
import { clamp01, mix, norm, outCubic, scrub, smooth } from "@/lib/scene-math";

/**
 * THE FRAME — Scene A, and the ink rise that hands over to the conversation.
 *
 * Everything here is scrubbed from scroll position. There is no timeline, no
 * animation queue and no completion state, so the same scroll position always
 * produces the same frame. That is what makes reverse scrolling replay the
 * composition rather than freeze it.
 *
 * The section's scroll allocation lives in CSS media queries rather than here,
 * so the geometry is already correct in the first paint and never shifts when
 * React hydrates.
 *
 * Scene A's scroll range (`pA`, offset start-start -> end-start):
 *   0        .. compose   canvas pinned, the composition builds
 *   inkStart .. riseEnd   canvas STILL pinned, the ink climbs over it
 *   riseEnd  .. 1         canvas releases and leaves, ink over ink
 *
 * `inkStart` sits just inside the composition's own range, so the finished
 * frame hands over to the transition instead of waiting for it. It is one
 * range extended, not a second controller.
 */

type HyperFrameStoryProps = {
  transitionProgress: MotionValue<number>;
};

/** How far inside the composition's range the ink begins to climb. */
const INK_OVERLAP_AT = 0.94;

/** Latch thresholds — scroll positions, never timers. */
const CHAPTERS_WIDE = [0.04, 0.28, 0.52, 0.72] as const;
const CHAPTERS_NARROW = [0.03, 0.27, 0.51, 0.75] as const;

/**
 * A latch clears only once the reader is this far back above its arm point, so
 * hovering exactly on a threshold cannot flicker the reveal.
 */
const LATCH_HYSTERESIS = 0.035;

/** The header band occupies roughly the top 8% of the viewport. */
const NAV_INK_AT = 0.085;

/**
 * Chapter labels and numerals ("01 / WHO ARE WE?"). The content already exists
 * in `site.ts`; rendering it would add newly visible text, so it stays a
 * separate design decision and is off.
 */
const SHOW_CHAPTER_META = false;

/**
 * Widened from the `as const` literal so every chapter is read through the
 * declared shape; the literal type drops `secondary` on the chapters that
 * happen not to carry one.
 */
const CHAPTERS: readonly SpeakupStoryChapter[] = speakupStoryChapters;

type RuleName =
  | "top"
  | "left"
  | "mid-horizontal"
  | "mid-vertical"
  | "right"
  | "bottom"
  | "rail";

const RULE_NAMES: readonly RuleName[] = [
  "top",
  "left",
  "mid-horizontal",
  "mid-vertical",
  "right",
  "bottom",
  "rail",
];

type SceneGeometry = {
  viewportHeight: number;
  narrow: boolean;
  reduced: boolean;
  /** Normalised end of the composition phase. */
  compose: number;
  /** Normalised point at which the ink begins to climb. */
  inkStart: number;
  /** Normalised point at which the canvas releases. */
  riseEnd: number;
  canvasHeight: number;
  /** Laid-out bottom of each chapter, canvas-relative. */
  chapterBottom: number[];
};

type SceneElements = {
  section: HTMLElement;
  canvas: HTMLDivElement;
  ink: HTMLSpanElement;
  entrance: HTMLDivElement;
  inner: HTMLDivElement;
  rules: HTMLDivElement;
  rule: Record<RuleName, HTMLSpanElement>;
  chapters: HTMLElement[];
};

const EMPTY_GEOMETRY: SceneGeometry = {
  viewportHeight: 0,
  narrow: false,
  reduced: false,
  compose: 0,
  inkStart: 0,
  riseEnd: 0,
  canvasHeight: 0,
  chapterBottom: [],
};

/**
 * Laid-out bottom of a chapter relative to the pinned canvas.
 *
 * `offsetTop` resolves against the nearest positioned ancestor, which is the
 * inner container rather than the canvas, so the chain has to be walked or the
 * result is short by the canvas padding. `offsetTop` is layout-based, which
 * keeps it clean of the transforms the renderer applies on top.
 */
function canvasRelativeBottom(chapter: HTMLElement, canvas: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = chapter;

  while (node && node !== canvas) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }

  return top + chapter.offsetHeight;
}

/** The 2x2 editorial frame: chapter 01 settles, the rules draw it in. */
function renderWide(
  elements: SceneElements,
  geometry: SceneGeometry,
  a: number,
) {
  // Chapter 01 opens centred in the canvas and settles into its quadrant. The
  // offset is exactly half a quadrant on each axis, so it is a pure percentage
  // with nothing to measure and nothing to go stale on resize.
  const settle = smooth(norm(a, 0.02, 0.22));
  const offset = ((1 - settle) * 50).toFixed(2);
  const scale = mix(1.14, 1, settle).toFixed(4);

  elements.chapters[0]!.style.transform = `translate(${offset}%, ${offset}%) scale(${scale})`;

  // Each rule draws in step with the chapter it frames, and the closing pair
  // runs all the way to 0.92 so the frame is still being built right up to the
  // handover.
  const draw = (from: number, to: number) =>
    outCubic(norm(a, from, to)).toFixed(3);

  elements.rule.top.style.transform = `scaleX(${draw(0.04, 0.24)})`;
  elements.rule.left.style.transform = `scaleY(${draw(0.04, 0.24)})`;
  elements.rule["mid-horizontal"].style.transform = `scaleX(${draw(0.26, 0.5)})`;
  elements.rule["mid-vertical"].style.transform = `scaleY(${draw(0.5, 0.72)})`;
  elements.rule.right.style.transform = `scaleY(${draw(0.7, 0.92)})`;
  elements.rule.bottom.style.transform = `scaleX(${draw(0.7, 0.92)})`;

  // Two-plane depth: the rule layer and the text layer travel at slightly
  // different rates. A few pixels — enough to separate them, not enough to
  // read as parallax decoration.
  const depth = scrub(a, 0, 1, 0, geometry.viewportHeight * 0.012);
  elements.rules.style.transform = `translate3d(0,${(-depth).toFixed(1)}px,0)`;

  // This renderer owns every property the narrow renderer also writes, so a
  // breakpoint crossing can never leave a stale value behind.
  elements.chapters.forEach((chapter, index) => {
    if (index > 0) {
      chapter.style.transform = "";
    }

    chapter.style.opacity = "";
    chapter.style.visibility = "";
  });

  elements.rule.rail.style.transform = "";
}

/**
 * One cell, cross-faded. Every chapter stays in flow in the same grid cell, so
 * the cell is sized by the tallest chapter and the document height never moves.
 */
function renderNarrow(
  elements: SceneElements,
  geometry: SceneGeometry,
  a: number,
  inkEdgeY: number,
) {
  // How far ahead of the ink edge a chapter has to be gone.
  const lead = Math.max(96, geometry.viewportHeight * 0.15);

  for (let index = 0; index < elements.chapters.length; index += 1) {
    const chapter = elements.chapters[index]!;
    const enterAt = CHAPTERS_NARROW[index]!;
    const leaveAt = index < CHAPTERS_NARROW.length - 1 ? CHAPTERS_NARROW[index + 1]! : 1;

    const on = smooth(norm(a, enterAt, enterAt + 0.085));
    const off =
      index < CHAPTERS_NARROW.length - 1
        ? smooth(norm(a, leaveAt - 0.075, leaveAt))
        : 0;

    // A slow, continuous drift across the whole slot — about 32px — so the
    // screen is never motionless while the section is pinned, and slow enough
    // that the text stays comfortably readable throughout.
    const through = norm(a, enterAt, leaveAt);
    const y = mix(16, -16, through) + mix(14, 0, on) - off * 22;

    // The chapter clears out ahead of the ink edge, so no glyph is ever
    // sliced. The cached layout bottom is offset by this frame's drift,
    // because the edge must clear where the glyphs actually are rather than
    // where they were laid out. Derived from scroll, so it stays reversible
    // and is never a timed fade.
    const bottom = (geometry.chapterBottom[index] ?? 0) + y;
    const clearance = 1 - smooth(norm(inkEdgeY, bottom + lead, bottom));

    const opacity = clamp01(Math.min(on - off, clearance));

    chapter.style.opacity = opacity.toFixed(3);
    chapter.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    chapter.style.visibility = opacity < 0.004 ? "hidden" : "";
  }

  // The rail tracks the whole composition rather than finishing early, so it
  // carries continuous, meaningful progress through the scene.
  elements.rule.rail.style.transform = `scaleY(${outCubic(
    norm(a, 0.02, 0.92),
  ).toFixed(3)})`;

  RULE_NAMES.forEach((name) => {
    if (name !== "rail") {
      elements.rule[name].style.transform = "";
    }
  });

  elements.rules.style.transform = "";
}

export function HyperFrameStory({ transitionProgress }: HyperFrameStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLSpanElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const ruleRefs = useRef<Partial<Record<RuleName, HTMLSpanElement | null>>>({});
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  const geometryRef = useRef<SceneGeometry>(EMPTY_GEOMETRY);
  const latchedRef = useRef(CHAPTERS.map(() => false));
  const navThemeRef = useRef<NavTheme | null | undefined>(undefined);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const resolveElements = useCallback((): SceneElements | null => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ink = inkRef.current;
    const entrance = entranceRef.current;
    const inner = innerRef.current;
    const rules = rulesRef.current;
    const chapters = chapterRefs.current.filter(
      (chapter): chapter is HTMLElement => chapter !== null,
    );

    if (
      !section ||
      !canvas ||
      !ink ||
      !entrance ||
      !inner ||
      !rules ||
      chapters.length !== CHAPTERS.length
    ) {
      return null;
    }

    const rule = {} as Record<RuleName, HTMLSpanElement>;

    for (const name of RULE_NAMES) {
      const element = ruleRefs.current[name];

      if (!element) {
        return null;
      }

      rule[name] = element;
    }

    return { section, canvas, ink, entrance, inner, rules, rule, chapters };
  }, []);

  const clearInlineStyles = useCallback((elements: SceneElements) => {
    elements.canvas.style.transform = "";
    elements.entrance.style.cssText = "";
    elements.inner.style.transform = "";
    elements.rules.style.transform = "";
    elements.ink.style.transform = "";
    elements.ink.style.visibility = "";

    RULE_NAMES.forEach((name) => {
      elements.rule[name].style.transform = "";
    });

    elements.chapters.forEach((chapter) => {
      chapter.style.cssText = "";
    });
  }, []);

  const setNavTheme = useCallback((theme: NavTheme | null) => {
    if (navThemeRef.current === theme) {
      return;
    }

    navThemeRef.current = theme;
    setNavThemeOverride(theme);
  }, []);

  const render = useCallback(() => {
    const elements = resolveElements();
    const geometry = geometryRef.current;

    if (!elements || geometry.reduced) {
      return;
    }

    const pA = clamp01(scrollYProgress.get());
    const a = geometry.compose > 0 ? clamp01(pA / geometry.compose) : 0;
    const rise = smooth(norm(pA, geometry.inkStart, geometry.riseEnd));

    // Scope the compositor hints to the scene that is actually on screen.
    const live = pA > 0 && pA < 1;
    elements.section.dataset.active = live ? "true" : "false";

    // --- latched typography ------------------------------------------------
    // CSS transitions do the tweening, so an interrupted reveal always
    // animates from its current computed value: a frozen half-state is
    // structurally impossible.
    const thresholds = geometry.narrow ? CHAPTERS_NARROW : CHAPTERS_WIDE;
    const latched = latchedRef.current;

    for (let index = 0; index < latched.length; index += 1) {
      const threshold = thresholds[index]!;

      if (!latched[index] && a >= threshold) {
        latched[index] = true;
        elements.chapters[index]!.dataset.set = "true";
      } else if (latched[index] && a < threshold - LATCH_HYSTERESIS) {
        latched[index] = false;
        elements.chapters[index]!.dataset.set = "false";
      }
    }

    // --- the ink rise ------------------------------------------------------
    // One plane, one edge, one owner. It lives inside the scene that owns the
    // transition and is clipped by that scene's still-pinned canvas.
    const inkTop = 1 - rise;
    // Canvas-relative edge position, derived rather than measured. Parked well
    // below the canvas while the ink is inactive, so clearance can never dim a
    // chapter before the transition has begun.
    const inkEdgeY =
      rise > 0 ? inkTop * geometry.canvasHeight : geometry.canvasHeight * 4;

    if (geometry.narrow) {
      renderNarrow(elements, geometry, a, inkEdgeY);
    } else {
      renderWide(elements, geometry, a);
    }

    elements.ink.style.transform = `translate3d(0,${(inkTop * 100).toFixed(2)}%,0)`;
    elements.ink.style.visibility = rise <= 0 ? "hidden" : "";

    // The composition recedes a little as it is absorbed, which reads as depth
    // rather than as a second animation. It begins BEFORE the ink appears, on
    // one range spanning the handover: easeOutCubic's tail goes nearly flat
    // well before its range ends, so without this the closing rules stop
    // reading as motion early and the junction goes dead.
    const recede =
      smooth(norm(pA, geometry.compose * 0.88, geometry.riseEnd)) *
      geometry.viewportHeight *
      0.1;

    elements.inner.style.transform = recede
      ? `translate3d(0,${(-recede).toFixed(1)}px,0)`
      : "";

    // --- the entrance handed over by the hero ------------------------------
    const entrance = norm(clamp01(transitionProgress.get()), 0, 0.46);
    elements.entrance.style.opacity = mix(0.88, 1, entrance).toFixed(3);
    elements.entrance.style.transform = `translate3d(0,${mix(20, 0, entrance).toFixed(1)}px,0)`;

    // --- the ground under the header ---------------------------------------
    // Paper only while Scene A is on screen and the ink has not yet climbed
    // past the header band.
    setNavTheme(live ? (inkTop > NAV_INK_AT ? "paper" : "ink") : null);
  }, [resolveElements, scrollYProgress, setNavTheme, transitionProgress]);

  const syncLayout = useCallback(() => {
    const elements = resolveElements();

    if (!elements) {
      return;
    }

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const narrow = !window.matchMedia(WIDE_LAYOUT_QUERY).matches;
    const previous = geometryRef.current;

    if (reduced) {
      // Hand the section back to normal flow and plain readable text. CSS
      // already drops the pinning, so this only has to remove what the
      // renderer wrote while motion was still enabled.
      geometryRef.current = { ...EMPTY_GEOMETRY, reduced: true, narrow };
      clearInlineStyles(elements);
      latchedRef.current.fill(false);
      elements.chapters.forEach((chapter) => {
        chapter.dataset.set = "true";
      });
      elements.section.dataset.active = "false";
      setNavTheme(null);
      return;
    }

    // A breakpoint crossing swaps renderers, and each renderer writes a
    // different set of properties. Clear everything and re-arm the latches so
    // the incoming renderer starts from a known state.
    if (previous.reduced || previous.narrow !== narrow) {
      clearInlineStyles(elements);
      latchedRef.current.fill(false);
      elements.chapters.forEach((chapter) => {
        chapter.dataset.set = "false";
      });
    }

    const viewportHeight = window.innerHeight;
    const sectionHeight = elements.section.offsetHeight;
    const compose =
      sectionHeight > 0
        ? clamp01((sectionHeight - 2 * viewportHeight) / sectionHeight)
        : 0;
    const riseEnd =
      sectionHeight > 0
        ? clamp01((sectionHeight - viewportHeight) / sectionHeight)
        : 0;

    geometryRef.current = {
      viewportHeight,
      narrow,
      reduced: false,
      compose,
      riseEnd,
      inkStart: compose * INK_OVERLAP_AT,
      canvasHeight: elements.canvas.clientHeight || viewportHeight,
      chapterBottom: elements.chapters.map((chapter) =>
        canvasRelativeBottom(chapter, elements.canvas),
      ),
    };

    render();
  }, [clearInlineStyles, render, resolveElements, setNavTheme]);

  useLayoutSync(syncLayout);
  useMotionValueEvent(scrollYProgress, "change", render);
  useMotionValueEvent(transitionProgress, "change", render);

  return (
    <section
      ref={sectionRef}
      className="hyperframe-story"
      id="speakup-story"
      aria-labelledby="speakup-story-heading"
      data-nav-theme="paper"
    >
      <h2 className="sr-only" id="speakup-story-heading">
        SpeakUp: who we are, workshops, speaker events, and networking events
      </h2>
      <div ref={canvasRef} className="hyperframe-story-canvas">
        <span ref={inkRef} aria-hidden="true" className="hyperframe-ink" />
        <div ref={entranceRef} className="hyperframe-story-entrance">
          <div ref={innerRef} className="container hyperframe-story-inner">
            <div className="hyperframe-grid">
              <div
                ref={rulesRef}
                aria-hidden="true"
                className="hyperframe-structural-lines"
              >
                {RULE_NAMES.map((name) => (
                  <span
                    key={name}
                    ref={(element) => {
                      ruleRefs.current[name] = element;
                    }}
                    className={`hyperframe-structural-line hyperframe-structural-line--${name}`}
                  />
                ))}
              </div>
              {CHAPTERS.map((chapter, index) => (
                <article
                  key={chapter.index}
                  ref={(element) => {
                    chapterRefs.current[index] = element;
                  }}
                  className={`hyperframe-chapter hyperframe-chapter--${chapter.index}`}
                >
                  {SHOW_CHAPTER_META ? (
                    <p className="hyperframe-chapter-meta">
                      <span className="hyperframe-chapter-number">
                        {chapter.index}
                      </span>
                      <span className="hyperframe-chapter-label">
                        {chapter.label}
                      </span>
                    </p>
                  ) : null}
                  <div className="hyperframe-heading-mask">
                    <h3>{chapter.headline}</h3>
                  </div>
                  {chapter.secondary ? (
                    <p className="hyperframe-secondary">{chapter.secondary}</p>
                  ) : null}
                  {chapter.body.map((paragraph) => (
                    <p className="hyperframe-body" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
