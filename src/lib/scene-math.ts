/**
 * Pure scrubbing maths shared by the cinematic scroll scenes.
 *
 * Every value a scene renders is a function of scroll progress alone, so
 * these helpers are deliberately stateless: the same progress always
 * produces the same frame, forwards or backwards.
 */

/** Clamp to the unit interval. */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Normalise `value` into `[from, to]` and clamp.
 *
 * A zero-width range would divide by zero, so it degrades to a step: this
 * keeps a mid-resize frame (where a cached height can briefly be 0) finite
 * instead of painting `NaN`.
 */
export function norm(value: number, from: number, to: number): number {
  if (to === from) {
    return value >= to ? 1 : 0;
  }

  return clamp01((value - from) / (to - from));
}

/** Smoothstep — zero velocity at both ends, the right curve for scrubbing. */
export function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** easeOutCubic — snappier; used for rules drawing themselves on. */
export function outCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Linear interpolation. */
export function mix(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/** Scrub a value across `[p0, p1]` with an easing function. */
export function scrub(
  progress: number,
  p0: number,
  p1: number,
  from: number,
  to: number,
  ease: (t: number) => number = smooth,
): number {
  return mix(from, to, ease(norm(progress, p0, p1)));
}
