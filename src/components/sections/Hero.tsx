"use client";

import gsap from "gsap";
import { type MotionValue } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import { Container } from "@/components/layout/Container";
import { BlueprintLayer } from "@/components/sections/BlueprintLayer";
import { HeroImageReveal } from "@/components/sections/HeroImageReveal";
import { Button } from "@/components/ui/Button";
import { ScrollCue } from "@/components/ui/ScrollCue";
import { joinFormUrl } from "@/content/site";
import { BRAND_INTRO_HANDOFF } from "@/lib/brand-intro";

type HeroProps = {
  transitionProgress: MotionValue<number>;
};

export function Hero({ transitionProgress }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      hero.dataset.intro = "complete";
      return;
    }

    let hasCompletedIntro = false;
    let isHeroInView = true;
    let observer: IntersectionObserver | undefined;
    let syncReelPlayback = () => {};
    let startIntro = () => {};
    const brandIntro = document.querySelector<HTMLElement>("[data-brand-intro]");
    const waitForBrand = Boolean(brandIntro && !brandIntro.hidden
      && getComputedStyle(brandIntro).display !== "none");

    const context = gsap.context(() => {
      const drums = gsap.utils.toArray<HTMLElement>(".hero-reel-drum", hero);
      const reels = drums.map((drum, lineIndex) => {
        const reel = gsap.timeline({ paused: true, repeat: -1 });
        const lineDelay = lineIndex;

        gsap.set(drum, {
          rotationX: 0,
          transformOrigin: "50% 50%",
          force3D: true,
        });

        reel
          .to(
            drum,
            {
              rotationX: -180,
              duration: 0.9,
              ease: "power3.inOut",
              force3D: true,
            },
            1.5 + lineDelay,
          )
          .to(
            drum,
            {
              rotationX: -360,
              duration: 0.9,
              ease: "power3.inOut",
              force3D: true,
            },
            5.5 + lineDelay,
          )
          // -360deg and 0deg render identically. Resetting only while the
          // front face is fully settled prevents cumulative transform drift.
          .set(drum, { rotationX: 0 }, 7.98)
          .to({}, { duration: 0.02 }, 7.98);

        return reel;
      });

      syncReelPlayback = () => {
        const shouldPlay = hasCompletedIntro && isHeroInView && !document.hidden;
        hero.dataset.reelActive = String(shouldPlay);

        reels.forEach((reel) => {
          if (shouldPlay) reel.play();
          else reel.pause();
        });
      };

      observer = new IntersectionObserver(
        ([entry]) => {
          isHeroInView = Boolean(entry && entry.intersectionRatio >= 0.35);
          syncReelPlayback();
        },
        { threshold: [0, 0.35, 1] },
      );
      observer.observe(hero);
      document.addEventListener("visibilitychange", syncReelPlayback);

      const timeline = gsap.timeline({
        paused: waitForBrand,
        defaults: { ease: "power3.out" },
        onComplete: () => {
          hero.dataset.intro = "complete";
          hasCompletedIntro = true;
          syncReelPlayback();
          gsap.set(
            ".hero-title-line, .hero-support, .scroll-cue",
            { clearProps: "opacity,transform" },
          );
        },
      });

      timeline
        .set(".hero-title-line", { yPercent: 108 })
        .set(".hero-support, .scroll-cue", { y: 16 })
        .to(".bp-grid", { opacity: 0.46, duration: 0.28 })
        .to(".bp-axis", { opacity: 0.72, scaleX: 1, duration: 0.38, stagger: 0.08 }, 0.08)
        .to(".bp-registration", { opacity: 0.8, scale: 1, duration: 0.22, stagger: 0.06 }, 0.23)
        .to(".bp-title-guide", { opacity: 0.72, scaleX: 1, duration: 0.42, stagger: 0.1 }, 0.32)
        .to(".bp-title-ghost", { opacity: 0.32, duration: 0.3 }, 0.44)
        .to(".hero-title-line", { opacity: 1, yPercent: 0, duration: 0.62, stagger: 0.1 }, 0.58)
        .to(".bp-frame, .bp-measure", { opacity: 0.74, scale: 1, duration: 0.4, stagger: 0.04 }, 0.68)
        .to(".bp-annotation", { opacity: 0.64, y: 0, duration: 0.28, stagger: 0.06 }, 0.82)
        .to(".hero-image-reality", { clipPath: "inset(0 0% 0 0)", duration: 0.82, ease: "power2.inOut" }, 0.92)
        .to(".hero-image-draft", { opacity: 0, duration: 0.52 }, 1.14)
        .to(".hero-support, .scroll-cue", { opacity: 1, y: 0, duration: 0.42, stagger: 0.08 }, 1.62)
        .to(".bp-secondary", { opacity: 0, duration: 0.34 }, 1.84)
        .to(".bp-annotation, .bp-registration", { opacity: 0, duration: 0.28, stagger: 0.03 }, 1.92)
        .to(".bp-title-ghost", { opacity: 0, duration: 0.24 }, 1.94)
        .to(".bp-primary", { opacity: 0.16, duration: 0.44 }, 2.02);
      startIntro = () => { timeline.play(); };
      if (waitForBrand) window.addEventListener(BRAND_INTRO_HANDOFF, startIntro, { once: true });
    }, hero);

    return () => {
      observer?.disconnect();
      window.removeEventListener(BRAND_INTRO_HANDOFF, startIntro);
      document.removeEventListener("visibilitychange", syncReelPlayback);
      context.revert();
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="hero"
      id="home"
      aria-labelledby="hero-title"
      data-nav-theme="media"
      data-intro="running"
    >
      <span data-header-sentinel aria-hidden="true" />
      <BlueprintLayer />
      <HeroImageReveal
        transitionProgress={transitionProgress}
      />
      <span className="hero-image-overlay" aria-hidden="true" />
      <Container className="hero-inner">
        <div className="hero-copy">
          <h1 className="hero-title hero-title--reel" id="hero-title">
            <span className="sr-only">
              Learn to sell. Speak with impact. Learn to lead. Lead with purpose.
            </span>
            <span className="hero-title-line" aria-hidden="true">
              <span className="hero-reel-window">
                <span className="hero-reel-drum">
                  <span className="hero-reel-face hero-reel-face--front">
                    Learn to<span className="hero-mobile-break"><br /></span><span className="hero-desktop-space"> </span>sell.
                  </span>
                  <span className="hero-reel-face hero-reel-face--back">
                    Speak with<span className="hero-mobile-break"><br /></span><span className="hero-desktop-space"> </span>impact.
                  </span>
                </span>
              </span>
            </span>
            <span className="hero-title-line" aria-hidden="true">
              <span className="hero-reel-window">
                <span className="hero-reel-drum">
                  <span className="hero-reel-face hero-reel-face--front">
                    Learn to<span className="hero-mobile-break"><br /></span><span className="hero-desktop-space"> </span>lead.
                  </span>
                  <span className="hero-reel-face hero-reel-face--back">
                    Lead with<span className="hero-mobile-break"><br /></span><span className="hero-desktop-space"> </span>purpose.
                  </span>
                </span>
              </span>
            </span>
          </h1>
          <div className="hero-support">
            <p>
              The student community for sales,
              <br />
              communication and leadership.
            </p>
            <Button
              href={joinFormUrl}
              rel="noopener noreferrer"
              target="_blank"
              variant="paper"
            >
              Join Us
            </Button>
          </div>
        </div>
        <ScrollCue href="#speakup-story" />
      </Container>
      <noscript>
        <style>{`.hero[data-intro="running"] .hero-title-line,.hero[data-intro="running"] .hero-support,.hero[data-intro="running"] .scroll-cue{opacity:1!important;transform:none!important}.hero[data-intro="running"] .hero-image-reality{clip-path:inset(0)!important}.hero[data-intro="running"] .hero-image-draft{opacity:0!important}`}</style>
      </noscript>
    </section>
  );
}
