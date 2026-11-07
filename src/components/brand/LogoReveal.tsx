"use client";

import { m, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type LogoRevealProps = {
  children: ReactNode;
  className?: string;
};

export function LogoReveal({ children, className = "" }: LogoRevealProps) {
  const reducedMotion = useReducedMotion();

  return (
    <span className={`logo-reveal ${className}`.trim()}>
      <m.span
        className="logo-reveal-motion"
        initial={reducedMotion ? false : { opacity: 0, y: "110%" }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
      >
        {children}
      </m.span>
    </span>
  );
}
