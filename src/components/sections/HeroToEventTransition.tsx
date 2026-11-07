"use client";

import { useScroll } from "motion/react";
import { useRef } from "react";
import { Hero } from "@/components/sections/Hero";
import { HyperFrameStory } from "@/components/sections/HyperFrameStory";

/**
 * Owns the single scroll timeline shared by the opening composition and the
 * first content section. The end offset resolves just after the hero leaves
 * the viewport, keeping the effect tied to the visible boundary.
 */
export function HeroToEventTransition() {
  const transitionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: transitionRef,
    offset: ["start start", "50% start"],
  });

  return (
    <div ref={transitionRef} className="hero-event-transition">
      <Hero transitionProgress={scrollYProgress} />
      <HyperFrameStory transitionProgress={scrollYProgress} />
    </div>
  );
}
