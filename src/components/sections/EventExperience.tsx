"use client";

import type { CSSProperties } from "react";
import { useRef } from "react";
import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Container } from "@/components/layout/Container";

type EventExperienceProps = {
  imageSrc?: string;
};

export function EventExperience({ imageSrc }: EventExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 0.5, 1], [48, 0, -42]);
  const ruleScale = useTransform(scrollYProgress, [0.12, 0.58], [0.12, 1]);
  const outlineY = useTransform(scrollYProgress, [0, 1], [45, -45]);
  const mediaStyle = imageSrc
    ? ({ "--event-image": `url(${imageSrc})` } as CSSProperties)
    : undefined;

  return (
    <section
      ref={sectionRef}
      className="event-experience"
      id="events"
      aria-labelledby="experience-heading"
      data-nav-theme="media"
      data-has-media={Boolean(imageSrc)}
      style={mediaStyle}
    >
      <m.div className="event-depth" aria-hidden="true" style={reduced ? undefined : { y: outlineY }} />
      <Container className="event-inner">
        <m.span className="event-rule" aria-hidden="true" style={reduced ? undefined : { scaleX: ruleScale }} />
        <m.h2 id="experience-heading" style={reduced ? undefined : { y: titleY }}>Learn by doing.</m.h2>
      </Container>
    </section>
  );
}
