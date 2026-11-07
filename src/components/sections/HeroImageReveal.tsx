"use client";

import Image from "next/image";
import {
  m,
  type MotionValue,
  type MotionStyle,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { publicAsset } from "@/lib/public-asset";

type HeroImageRevealProps = {
  transitionProgress: MotionValue<number>;
};

export function HeroImageReveal({
  transitionProgress,
}: HeroImageRevealProps) {
  const hydrated = useHydrated();
  const mediaRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useTransform(
    transitionProgress,
    [0, 0.2, 0.5, 1],
    [0, 0, 0.5, 1],
  );
  const dissolveOpacity = useTransform(
    transitionProgress,
    [0, 0.2, 0.3, 0.75, 1],
    [0, 0, 0.08, 0.76, 1],
  );
  const shouldEnhanceScroll = hydrated;

  return (
    <m.div
      aria-hidden="true"
      className="hero-media"
    >
      <m.div
        ref={mediaRef}
        className="hero-media-surface"
        data-scroll-enhanced={shouldEnhanceScroll}
        style={
          shouldEnhanceScroll
            ? ({ "--hero-scroll-progress": scrollProgress } as unknown as MotionStyle)
            : undefined
        }
      >
        <Image
          className="hero-media-image hero-image-draft"
          src={publicAsset("/events/speakup-rooftop-event.jpeg")}
          alt=""
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          draggable={false}
        />
        <div className="hero-image-reality">
          <Image
            className="hero-media-image"
            src={publicAsset("/events/speakup-rooftop-event.jpeg")}
            alt=""
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
            draggable={false}
          />
        </div>
      </m.div>
      <m.span
        className="hero-media-dissolve"
        style={shouldEnhanceScroll ? { opacity: dissolveOpacity } : undefined}
      />
    </m.div>
  );
}
