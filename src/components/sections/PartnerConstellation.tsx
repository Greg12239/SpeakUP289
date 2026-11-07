"use client";

import Image from "next/image";
import { useInView, useReducedMotion } from "motion/react";
import {
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Partner } from "@/content/site";
import { useHydrated } from "@/hooks/useHydrated";
import { publicAsset } from "@/lib/public-asset";

type PartnerConstellationProps = {
  partners: readonly Partner[];
};

type OrbProfile = {
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  gridOffset: number;
  scale: number;
};

const orbProfiles: readonly OrbProfile[] = [
  { duration: 7.4, delay: -2.1, driftX: 3.25, driftY: 9.5, gridOffset: 0, scale: 0.96 },
  { duration: 8.2, delay: -5.7, driftX: -4.5, driftY: 13, gridOffset: 28, scale: 1.04 },
  { duration: 6.7, delay: -3.4, driftX: 3.25, driftY: 8.25, gridOffset: -14, scale: 0.93 },
  { duration: 7.8, delay: -6.2, driftX: -2.25, driftY: 11.75, gridOffset: 20, scale: 1.01 },
  { duration: 8.8, delay: -1.6, driftX: 4.5, driftY: 10.6, gridOffset: -24, scale: 0.97 },
  { duration: 6.9, delay: -4.8, driftX: -3.25, driftY: 9.5, gridOffset: 18, scale: 1.05 },
  { duration: 8.4, delay: -2.8, driftX: 2.25, driftY: 13, gridOffset: -8, scale: 0.94 },
];

function getOrbStyle(index: number): CSSProperties {
  const profile = orbProfiles[index % orbProfiles.length]!;

  return {
    "--orb-duration": `${profile.duration}s`,
    "--orb-delay": `${profile.delay}s`,
    "--orb-drift-x": `${profile.driftX}px`,
    "--orb-drift-y": `${profile.driftY}px`,
    "--orb-grid-offset": `${profile.gridOffset}px`,
    "--orb-base-scale": `${profile.scale}`,
  } as CSSProperties;
}

function setPointerVariables(target: HTMLElement, event: ReactPointerEvent<HTMLDivElement>) {
  const bounds = target.getBoundingClientRect();
  const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
  const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

  target.style.setProperty("--orb-tilt-x", `${relativeY * -5}deg`);
  target.style.setProperty("--orb-tilt-y", `${relativeX * 5}deg`);
  target.style.setProperty("--orb-glow-x", `${50 + relativeX * 32}%`);
  target.style.setProperty("--orb-glow-y", `${50 + relativeY * 32}%`);
}

function PartnerOrb({ partner, index }: { partner: Partner; index: number }) {
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    setPointerVariables(event.currentTarget, event);
  };

  const resetPointerVariables = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.removeProperty("--orb-tilt-x");
    event.currentTarget.style.removeProperty("--orb-tilt-y");
    event.currentTarget.style.removeProperty("--orb-glow-x");
    event.currentTarget.style.removeProperty("--orb-glow-y");
  };

  const beginTouch = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") event.currentTarget.dataset.pressing = "true";
  };

  const finishTouch = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    event.currentTarget.dataset.pressing = "false";
    event.currentTarget.dataset.tapped = "true";
  };

  return (
    <li
      className="partner-orb"
      data-format={partner.logoFormat}
      data-tone={partner.logoTone}
      style={getOrbStyle(index)}
    >
      <div
        className="partner-orb-hitbox"
        onPointerCancel={finishTouch}
        onPointerDown={beginTouch}
        onPointerLeave={resetPointerVariables}
        onPointerMove={handlePointerMove}
        onPointerUp={finishTouch}
      >
        <div className="partner-orb-float">
          <div className="partner-orb-interactive">
            <div className="partner-orb-glass">
              <span className="partner-orb-rim" aria-hidden="true" />
              <span
                className="partner-orb-gloss"
                aria-hidden="true"
                onAnimationEnd={(event) => {
                  event.currentTarget
                    .closest<HTMLElement>(".partner-orb-hitbox")
                    ?.removeAttribute("data-tapped");
                }}
              />
              <span className="partner-orb-logo">
                <Image
                  src={publicAsset(partner.logoSrc as `/${string}`)}
                  alt={partner.alt}
                  fill
                  sizes="(max-width: 640px) 34vw, (max-width: 1024px) 19vw, 12vw"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function PartnerConstellation({ partners }: PartnerConstellationProps) {
  const constellationRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const inView = useInView(constellationRef, { amount: 0.14 });
  const enhanced = hydrated && !reducedMotion;

  return (
    <div
      ref={constellationRef}
      className="partner-constellation"
      data-animated={enhanced && inView}
      data-enhanced={enhanced}
    >
      <ul className="partner-constellation-grid" role="list">
        {partners.map((partner, index) => (
          <PartnerOrb key={partner.id} partner={partner} index={index} />
        ))}
      </ul>
    </div>
  );
}
