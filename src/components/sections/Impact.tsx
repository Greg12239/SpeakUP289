"use client";

import {
  m,
  useInView,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useRef, useState, useSyncExternalStore } from "react";
import { Container } from "@/components/layout/Container";
import { stats } from "@/content/site";
import { useHydrated } from "@/hooks/useHydrated";
import { useSmoothedScrollProgress } from "@/hooks/useSmoothedScrollProgress";
import { motionTokens } from "@/lib/motion";

const reelStep = 0.86;
const mobileQuery = "(max-width: 48rem)";

// Fixed trajectories: [origin x%, origin y%, travel x, travel y, diameter, angle].
// The spray follows the numeral's silhouette, rather than a viewport centre.
const droplets = [
  [18, 24, -44, -82, 10, -28],
  [34, 8, -16, -108, 12, -8],
  [58, 6, 22, -96, 5, 14],
  [80, 20, 48, -72, 9, 34],
  [82, 58, 68, 24, 7, 72],
  [66, 78, 30, 65, 4, 148],
  [43, 84, -20, 69, 8, 192],
  [17, 65, -48, 54, 4, -112],
] as const;

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function useMobile() {
  return useSyncExternalStore(subscribeMobile, () => window.matchMedia(mobileQuery).matches, () => false);
}

type DigitReelProps = {
  digit: number;
  digitIndex: number;
  statIndex: number;
  running: boolean;
  delay: number;
  onSettled?: () => void;
};

function createReel(digit: number, cycles: number) {
  const sequence: number[] = [];

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (let value = 0; value <= 9; value += 1) sequence.push(value);
  }

  for (let value = 0; value <= digit; value += 1) sequence.push(value);

  const finalIndex = sequence.length - 1;
  sequence.push((digit + 1) % 10);

  return { finalIndex, sequence };
}

function DigitReel({
  digit,
  digitIndex,
  statIndex,
  running,
  delay,
  onSettled,
}: DigitReelProps) {
  const cycles = 2 + statIndex + Math.min(digitIndex, 2);
  const { finalIndex, sequence } = createReel(digit, cycles);
  const fastStop = Math.max(0, finalIndex - 3);
  const slowStop = Math.max(fastStop, finalIndex - 1);
  const target = finalIndex * reelStep;

  return (
    <span className="odometer-window">
      <m.span
        className="odometer-strip"
        initial={false}
        animate={
          running
            ? {
                y: [
                  "0em",
                  `-${fastStop * reelStep}em`,
                  `-${slowStop * reelStep}em`,
                  `-${target + 0.055}em`,
                  `-${target}em`,
                ],
              }
            : { y: "0em" }
        }
        transition={
          running
            ? {
                delay: 0.1 + delay + digitIndex * 0.045,
                duration: 1.48 + statIndex * 0.1 + digitIndex * 0.075,
                times: [0, 0.54, 0.79, 0.94, 1],
                ease: [
                  "linear",
                  motionTokens.ease.standard,
                  motionTokens.ease.enter,
                  motionTokens.ease.enter,
                ],
              }
            : { duration: 0 }
        }
        onAnimationComplete={running ? onSettled : undefined}
      >
        {sequence.map((value, index) => (
          <span className="odometer-glyph" key={`${index}-${value}`}>
            {value}
          </span>
        ))}
      </m.span>
    </span>
  );
}

type OdometerCounterProps = {
  value: string;
  statIndex: number;
  running: boolean;
  enhanced: boolean;
  delay: number;
};

function OdometerCounter({
  value,
  statIndex,
  running,
  enhanced,
  delay,
}: OdometerCounterProps) {
  const [settled, setSettled] = useState(false);
  const match = /^(\d+)(.*)$/.exec(value);
  const digits = (match?.[1] ?? "").split("").map(Number);
  const suffix = match?.[2] ?? "";

  return (
    <strong
      className="impact-odometer"
      data-value={value}
      data-settled={running && settled}
    >
      <span className="sr-only">{value}</span>
      {enhanced ? (
        <span className="odometer-display" aria-hidden="true">
          {digits.map((digit, digitIndex) => (
            <DigitReel
              digit={digit}
              digitIndex={digitIndex}
              statIndex={statIndex}
              running={running}
              delay={delay}
              onSettled={
                digitIndex === digits.length - 1
                  ? () => setSettled(true)
                  : undefined
              }
              key={`${digitIndex}-${digit}`}
            />
          ))}
          <span className="odometer-suffix">{suffix}</span>
        </span>
      ) : (
        <span className="odometer-static" aria-hidden="true">
          {value}
        </span>
      )}
    </strong>
  );
}

function ImpactStat({ stat, statIndex, groupVisible, enhanced, mobile }: {
  stat: (typeof stats)[number];
  statIndex: number;
  groupVisible: boolean;
  enhanced: boolean;
  mobile: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.35, margin: "0px 0px -20% 0px", once: true });
  const active = mobile ? visible : groupVisible;
  // Visibility gates each row; CSS and the existing reels share the same
  // spacing when one gesture exposes several mobile rows. No timer queue.
  const delay = statIndex * (mobile ? 0.14 : 0.16);

  return (
    <div ref={ref} className="impact-stat" data-enhanced={enhanced} data-active={active} style={{ "--cascade-delay": `${delay}s` } as React.CSSProperties}>
      <div className="impact-stat-motion">
        <div className="impact-number">
          <div className="impact-number-motion">
            <OdometerCounter value={stat.value} statIndex={statIndex} running={enhanced && active} enhanced={enhanced} delay={delay} />
          </div>
          <span className="impact-droplets" aria-hidden="true">
            {droplets.map(([x, y, dx, dy, size, angle], index) => (
              <span key={index} className="impact-droplet" style={{
                left: `${x}%`, top: `${y}%`,
                "--drop-x": `${dx}px`, "--drop-y": `${dy}px`,
                "--drop-size": `${size}px`, "--drop-angle": `${angle}deg`,
              } as React.CSSProperties} />
            ))}
          </span>
        </div>
        <span className="impact-label">{stat.label}</span>
      </div>
    </div>
  );
}

export function Impact() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const mobile = useMobile();
  const inView = useInView(gridRef, {
    amount: 0.01,
    margin: "0px 0px -25% 0px",
    once: true,
  });
  const { progress } = useSmoothedScrollProgress(sectionRef, {
    offset: ["start end", "end start"],
  });
  const primaryX = useTransform(progress, [0, 1], [-28, 28]);
  const primaryY = useTransform(progress, [0, 1], [-38, 38]);
  const secondaryX = useTransform(progress, [0, 1], [22, -22]);
  const secondaryY = useTransform(progress, [0, 1], [30, -30]);
  const lineX = useTransform(progress, [0, 1], [-48, 48]);
  const lineScale = useTransform(progress, [0.08, 0.48, 1], [0.42, 1, 1]);
  const enhanced = hydrated && !reducedMotion;

  return (
    <section
      ref={sectionRef}
      className="impact-section"
      aria-labelledby="impact-heading"
      data-nav-theme="paper"
      data-enhanced={enhanced}
      data-counting={enhanced && inView}
    >
      <m.div className="impact-atmosphere" aria-hidden="true">
        <m.span
          className="impact-ambient impact-ambient-primary"
          style={enhanced ? { x: primaryX, y: primaryY } : undefined}
        />
        <m.span
          className="impact-ambient impact-ambient-secondary"
          style={enhanced ? { x: secondaryX, y: secondaryY } : undefined}
        />
        <m.span
          className="impact-atmosphere-line"
          style={enhanced ? { x: lineX, scaleX: lineScale } : undefined}
        />
      </m.div>
      <h2 className="sr-only" id="impact-heading">
        Impact
      </h2>
      <Container>
        <div ref={gridRef} className="impact-grid">
          {stats.map((stat, statIndex) => (
            <ImpactStat key={stat.label} stat={stat} statIndex={statIndex} groupVisible={inView} enhanced={enhanced} mobile={mobile} />
          ))}
        </div>
      </Container>
    </section>
  );
}
