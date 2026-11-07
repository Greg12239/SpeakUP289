"use client";

import {
  m,
  type MotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useSmoothedScrollProgress } from "@/hooks/useSmoothedScrollProgress";
import { getStageKeyframes } from "@/lib/motion";

export type StoryStage = {
  input: number[];
  opacity: number[];
  y: Array<number | string>;
  scale?: number[];
};

type IntroLineStage = {
  start: number;
  end: number;
};

type StickyStoryProps = {
  statements: readonly string[];
  className?: string;
  statementClassName?: string;
  progress?: MotionValue<number>;
  stages?: readonly StoryStage[];
  showProgress?: boolean;
  introReveal?: {
    lines: readonly string[];
    lineStages: readonly IntroLineStage[];
  };
};

type StoryFrameProps = {
  progress: MotionValue<number>;
  statement: string;
  index: number;
  count: number;
  className: string;
  stage?: StoryStage;
};

function StoryFrame({
  progress,
  statement,
  index,
  count,
  className,
  stage,
}: StoryFrameProps) {
  const keyframes = stage ?? getStageKeyframes(index, count);
  const opacity = useTransform(progress, keyframes.input, keyframes.opacity);
  const y = useTransform(progress, keyframes.input, keyframes.y);
  const scale = useTransform(
    progress,
    keyframes.input,
    keyframes.scale ?? keyframes.input.map(() => 1),
  );

  return (
    <m.p
      aria-hidden="true"
      className={`sticky-statement ${className}`.trim()}
      style={keyframes.scale ? { opacity, y, scale } : { opacity, y }}
    >
      {statement}
    </m.p>
  );
}

function IntroLine({
  line,
  progress,
  stage,
}: {
  line: string;
  progress: MotionValue<number>;
  stage: IntroLineStage | undefined;
}) {
  const input = [stage?.start ?? 0, stage?.end ?? 0];
  const opacity = useTransform(progress, input, [0, 1]);
  const y = useTransform(progress, input, ["100%", "0%"]);

  return (
    <span className="conversation-intro-line-mask">
      <m.span className="conversation-intro-line" style={{ opacity, y }}>
        {line}
      </m.span>
    </span>
  );
}

function IntroStoryFrame({
  progress,
  lines,
  lineStages,
  count,
  className,
  stage,
}: {
  progress: MotionValue<number>;
  lines: readonly string[];
  lineStages: readonly IntroLineStage[];
  count: number;
  className: string;
  stage?: StoryStage;
}) {
  const keyframes = stage ?? getStageKeyframes(0, count);
  const opacity = useTransform(progress, keyframes.input, keyframes.opacity);

  return (
    <m.p
      aria-hidden="true"
      className={`sticky-statement ${className} conversation-intro-statement`.trim()}
      style={{ opacity }}
    >
      {lines.map((line, index) => (
        <IntroLine
          key={line}
          line={line}
          progress={progress}
          stage={lineStages[index]}
        />
      ))}
    </m.p>
  );
}

type StickyStoryCanvasProps = Omit<StickyStoryProps, "progress"> & {
  progress: MotionValue<number>;
  rootRef: React.RefObject<HTMLDivElement | null>;
  shouldEnhance: boolean;
};

function StickyStoryCanvas({
  statements,
  className = "",
  statementClassName = "",
  stages,
  showProgress = true,
  introReveal,
  progress,
  rootRef,
  shouldEnhance,
}: StickyStoryCanvasProps) {
  return (
    <div
      ref={rootRef}
      className={`sticky-story ${className}`.trim()}
      data-enhanced={shouldEnhance}
    >
      {shouldEnhance ? (
        <div className="sticky-canvas">
          <div className="sr-only">
            {statements.map((statement) => (
              <p key={statement}>{statement}</p>
            ))}
          </div>
          <div className="sticky-stage" aria-hidden="true">
            {statements.map((statement, index) => (
              index === 0 && introReveal ? (
                <IntroStoryFrame
                  className={statementClassName}
                  count={statements.length}
                  key={statement}
                  lineStages={introReveal.lineStages}
                  lines={introReveal.lines}
                  progress={progress}
                  stage={stages?.[index]}
                />
              ) : (
                <StoryFrame
                  className={statementClassName}
                  count={statements.length}
                  index={index}
                  key={statement}
                  progress={progress}
                  stage={stages?.[index]}
                  statement={statement}
                />
              )
            ))}
          </div>
          {showProgress ? (
            <m.span
              aria-hidden="true"
              className="story-progress"
              style={{ scaleX: progress }}
            />
          ) : null}
        </div>
      ) : (
        <div className="sticky-static">
          {statements.map((statement) => (
            <p className={statementClassName} key={statement}>
              {statement}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function SmoothedStickyStory(
  props: Omit<StickyStoryProps, "progress"> & { shouldEnhance: boolean },
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { progress } = useSmoothedScrollProgress(rootRef);

  return <StickyStoryCanvas {...props} progress={progress} rootRef={rootRef} />;
}

function DirectStickyStory({
  progress,
  ...props
}: StickyStoryProps & { progress: MotionValue<number>; shouldEnhance: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);

  return <StickyStoryCanvas {...props} progress={progress} rootRef={rootRef} />;
}

export function StickyStory({ progress: externalProgress, ...props }: StickyStoryProps) {
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const shouldEnhance = hydrated && !reducedMotion;

  return externalProgress ? (
    <DirectStickyStory
      {...props}
      progress={externalProgress}
      shouldEnhance={shouldEnhance}
    />
  ) : (
    <SmoothedStickyStory {...props} shouldEnhance={shouldEnhance} />
  );
}
