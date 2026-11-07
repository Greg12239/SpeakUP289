"use client";

import { useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { joinFormUrl } from "@/content/site";
import { useHydrated } from "@/hooks/useHydrated";

export function FinalCTA() {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const boundaryVisible = useInView(boundaryRef, { once: true, amount: 0.01 });
  const contentVisible = useInView(contentRef, { once: true, amount: 0.15, margin: "0px 0px -8% 0px" });
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();

  return (
    <section className="final-cta" id="join" aria-labelledby="final-cta-heading" data-nav-theme="ink" data-enhanced={hydrated && !reducedMotion}>
      <div ref={boundaryRef} className="final-handoff" data-visible={boundaryVisible} aria-hidden="true"><span /></div>
      <Container className="final-cta-inner">
        <div ref={contentRef} className="final-cta-content" data-visible={contentVisible}>
          <h2 id="final-cta-heading">
            <span className="final-line-mask"><span className="final-line">Ready to stand out?</span></span>
            <span className="final-line-mask"><span className="final-line">Join SpeakUp<span className="final-period">.</span></span></span>
          </h2>
          <div className="final-cta-resolution">
            <div className="final-action-reveal">
              <Button href={joinFormUrl} variant="paper" className="final-join-button">Join Us</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
