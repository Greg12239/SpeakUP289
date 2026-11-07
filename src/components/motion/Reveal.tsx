"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

export function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const canObserve =
    typeof window !== "undefined" && "IntersectionObserver" in window;
  const enhanced = hydrated && !reducedMotion && canObserve;

  useEffect(() => {
    const node = ref.current;
    if (!node || !enhanced) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.unobserve(node);
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enhanced]);

  return (
    <div
      ref={ref}
      className={`reveal ${className}`.trim()}
      data-enhanced={enhanced}
      data-visible={visible}
    >
      {children}
    </div>
  );
}
