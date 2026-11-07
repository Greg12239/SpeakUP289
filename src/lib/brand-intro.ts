/** Shared only at the handoff; the Hero keeps ownership of its own choreography. */
export const BRAND_INTRO_HANDOFF = "speakup:intro-handoff";
export const BRAND_INTRO_DURATION = 2.2;
export const BRAND_INTRO_LABELS = {
  "intro:start": 0,
  "signal:ignite": 0.15,
  "wordmark:reveal": 0.43,
  "light:converge": 1.05,
  "signature:reveal": 1.35,
  "brand:hold": 1.65,
  "hero:handoff": 1.95,
  "intro:complete": BRAND_INTRO_DURATION,
} as const;

export type BrandIntroQA = {
  pause: () => void;
  seekFrame: (frame: number) => void;
  resume: () => void;
  state: () => {
    time: number;
    duration: number;
    labels: Record<string, number>;
    activeMasters: number;
    complete: boolean;
  };
};

declare global {
  interface Window {
    /** Opt-in, localhost-only inspection. Absent during ordinary visits. */
    __speakupIntro?: BrandIntroQA;
  }
}
