export const motionTokens = {
  duration: {
    fast: 0.16,
    normal: 0.32,
    slow: 0.5,
    cinematic: 0.72,
  },
  ease: {
    standard: [0.2, 0, 0, 1] as const,
    enter: [0.16, 1, 0.3, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
    emphasized: [0.16, 1, 0.3, 1] as const,
  },
} as const;

type StageKeyframes = {
  input: number[];
  opacity: number[];
  y: number[];
  scale: number[];
};

export function getStageKeyframes(
  index: number,
  count: number,
): StageKeyframes {
  const segment = 1 / count;
  const start = index * segment;
  const holdEnd = Math.min(1, start + segment * 0.66);
  const end = Math.min(1, (index + 1) * segment);
  const enter = Math.max(0, start - segment * 0.22);

  if (index === 0) {
    return {
      input: [0, holdEnd, end],
      opacity: [1, 1, 0],
      y: [0, 0, -28],
      scale: [1, 1, 0.985],
    };
  }

  if (index === count - 1) {
    return {
      input: [enter, start, 1],
      opacity: [0, 1, 1],
      y: [28, 0, 0],
      scale: [0.985, 1, 1],
    };
  }

  return {
    input: [enter, start, holdEnd, end],
    opacity: [0, 1, 1, 0],
    y: [28, 0, 0, -28],
    scale: [0.985, 1, 1, 0.985],
  };
}
