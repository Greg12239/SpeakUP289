"use client";

import {
  useScroll,
  useSpring,
  type MotionValue,
  type UseScrollOptions,
} from "motion/react";
import type { RefObject } from "react";

const scrollSpring = {
  stiffness: 120,
  damping: 28,
  mass: 0.3,
  restDelta: 0.0005,
} as const;

type SmoothedScrollProgress = {
  rawProgress: MotionValue<number>;
  progress: MotionValue<number>;
};

export function useSmoothedScrollProgress<T extends HTMLElement>(
  target: RefObject<T | null>,
  options: Pick<UseScrollOptions, "offset"> = {},
): SmoothedScrollProgress {
  const { scrollYProgress } = useScroll({
    target,
    offset: options.offset ?? ["start start", "end end"],
  });
  const progress = useSpring(scrollYProgress, scrollSpring);

  return {
    rawProgress: scrollYProgress,
    progress,
  };
}
