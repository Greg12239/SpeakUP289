"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m, useInView, useReducedMotion } from "motion/react";
import { siteConfig } from "@/content/site";
import { publicAsset } from "@/lib/public-asset";
import { useHydrated } from "@/hooks/useHydrated";

type SocialNetwork = "Instagram" | "LinkedIn" | "TikTok" | "Email";
type CardState = "closed" | "preview" | "pinned";
type CopyStatus = "copied" | "failed" | null;
type PopoverPosition = { top: number; left: number; pointerLeft: number; width: number; maxHeight: number; placement: "above" | "below" | "docked" } | null;

const socialCtaAssets = {
  Instagram: { src: publicAsset("/social/SpeakUp_Instagram_CTA.webp"), width: 384, height: 384 },
  LinkedIn: { src: publicAsset("/social/SpeakUp_LinkedIn_CTA.webp"), width: 384, height: 384 },
  TikTok: { src: publicAsset("/social/SpeakUp_TikTok_CTA.webp"), width: 384, height: 384 },
  Email: { src: publicAsset("/social/SpeakUp_Email_CTA.webp"), width: 384, height: 384 },
} as const;

function SocialCtaArtwork({ network }: { network: SocialNetwork }) {
  const asset = socialCtaAssets[network];
  return (
    <span className="footer-social-cta-float">
      <span className="footer-social-cta-shadow">
        <span className="footer-social-cta-interactive">
          <Image alt="" className="footer-social-cta-image" height={asset.height} sizes="(max-width: 22rem) 5.35rem, (max-width: 48rem) 6rem, 7.8rem" src={asset.src} width={asset.width} />
        </span>
      </span>
    </span>
  );
}

function CopyIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><rect height="12" rx="2" width="12" x="8" y="8" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
}

function DetailIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" /></svg>;
}

export function FooterSocialCtas() {
  const emailHref = siteConfig.links.email;
  const emailAddress = emailHref?.replace(/^mailto:/, "") ?? null;
  const popoverId = useId();
  const detailId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const emailTriggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inView = useInView(groupRef, { amount: 0.1 });
  const hydrated = useHydrated();
  const reducedMotion = useReducedMotion();
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cardState, setCardState] = useState<CardState>("closed");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition>(null);
  const isCardOpen = cardState !== "closed";

  const clearTimers = useCallback(() => {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    previewTimerRef.current = null;
    dismissTimerRef.current = null;
  }, []);

  const closeCard = useCallback((restoreFocus = false) => {
    clearTimers();
    setCardState("closed");
    // Keep the exiting card's content and geometry intact until it unmounts.
    if (restoreFocus) emailTriggerRef.current?.focus({ preventScroll: true });
  }, [clearTimers]);

  const schedulePreviewDismissal = useCallback(() => {
    if (cardState !== "preview") return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      if (popoverRef.current?.contains(document.activeElement) || emailTriggerRef.current === document.activeElement) return;
      closeCard();
    }, 190);
  }, [cardState, closeCard]);

  const updatePosition = useCallback(() => {
    const trigger = emailTriggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    // Measure the stationary shell, never the animated card surface.
    const viewport = window.visualViewport;
    const viewportLeft = viewport?.offsetLeft ?? 0;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportRight = Math.min(document.documentElement.clientWidth, viewportLeft + (viewport?.width ?? document.documentElement.clientWidth));
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportMargin = 12;
    const gap = 12;
    const width = Math.min(328, viewportRight - viewportLeft - viewportMargin * 2);
    const preferredLeft = triggerRect.left + triggerRect.width / 2 - width / 2;
    const left = Math.max(viewportLeft + viewportMargin, Math.min(preferredLeft, viewportRight - width - viewportMargin));
    const above = Math.max(0, triggerRect.top - viewportTop - gap - viewportMargin);
    const below = Math.max(0, viewportTop + viewportHeight - triggerRect.bottom - gap - viewportMargin);
    const height = popover.offsetHeight;
    // In a short viewport, use the available screen instead of a tiny scroll slit.
    const placement = Math.max(above, below) < Math.min(height, 220)
      ? "docked" : above >= height || above >= below ? "above" : "below";
    const maxHeight = Math.max(96, Math.min(viewportHeight - viewportMargin * 2, placement === "docked" ? viewportHeight : placement === "above" ? above : below));
    const renderedHeight = Math.min(height, maxHeight);
    const preferredTop = placement === "docked" ? viewportTop + viewportMargin : placement === "above" ? triggerRect.top - renderedHeight - gap : triggerRect.bottom + gap;
    const top = Math.max(viewportTop + viewportMargin, Math.min(preferredTop, viewportTop + viewportHeight - renderedHeight - viewportMargin));
    const next = {
      left,
      top,
      width,
      maxHeight,
      placement,
      pointerLeft: Math.min(width - 24, Math.max(24, triggerRect.left + triggerRect.width / 2 - left)),
    } as const;
    setPosition((previous) => previous && Object.keys(next).every((key) => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
  }, []);

  useLayoutEffect(() => {
    if (!isCardOpen) return;
    updatePosition();
    let frame = 0;
    const schedulePositionUpdate = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; updatePosition(); });
    };
    const observer = new ResizeObserver(schedulePositionUpdate);
    if (popoverRef.current) observer.observe(popoverRef.current);
    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);
    window.visualViewport?.addEventListener("resize", schedulePositionUpdate);
    window.visualViewport?.addEventListener("scroll", schedulePositionUpdate);
    return () => {
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
      window.visualViewport?.removeEventListener("resize", schedulePositionUpdate);
      window.visualViewport?.removeEventListener("scroll", schedulePositionUpdate);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [isCardOpen, isDetailOpen, updatePosition]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (!isCardOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!emailTriggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) closeCard();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCard(true);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeCard, isCardOpen]);

  const beginHoverPreview = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
    if (cardState !== "closed" || previewTimerRef.current) return;
    previewTimerRef.current = setTimeout(() => {
      previewTimerRef.current = null;
      setCopyStatus(null);
      setIsDetailOpen(false);
      setCardState("preview");
    }, 340);
  };

  const copyEmail = async () => {
    if (!emailAddress) return;
    try {
      await navigator.clipboard.writeText(emailAddress);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const togglePinned = () => {
    clearTimers();
    if (cardState === "pinned") return closeCard();
    if (cardState === "closed") {
      setCopyStatus(null);
      setIsDetailOpen(false);
    }
    setCardState("pinned");
  };

  const popoverStyle = position ? ({
    left: position.left,
    top: position.top,
    width: position.width,
    "--footer-email-pointer-left": `${position.pointerLeft}px`,
    "--footer-email-max-height": `${position.maxHeight}px`,
  } as CSSProperties) : undefined;

  const popover = hydrated ? createPortal(
    <AnimatePresence>
    {isCardOpen && <m.div key="email-card" className="footer-email-popover-shell" data-positioned={position ? "true" : "false"} data-placement={position?.placement ?? "above"} ref={popoverRef} style={popoverStyle} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }}>
    <m.div aria-label="SpeakUp email contact" className="footer-email-popover" data-state={cardState} id={popoverId} onPointerEnter={clearTimers} onPointerLeave={schedulePreviewDismissal} onFocus={() => { clearTimers(); if (cardState === "preview") setCardState("pinned"); }} role="dialog" initial={{ y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: reducedMotion ? 0 : 5, scale: reducedMotion ? 1 : 0.98 }} transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}>
      <button type="button" className="footer-email-popover-close" aria-label="Close email contact" onClick={() => closeCard(true)}><svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 5 10 10M15 5 5 15" /></svg></button>
      <div className="footer-email-popover-content">
      {emailAddress ? <>
        <div className="footer-email-popover-header">
          <span aria-hidden="true" className="footer-email-popover-avatar"><Image alt="" height={370} src={publicAsset("/brand/speakup-primary.png")} width={1250} /></span>
          <div><p className="footer-email-popover-label">SpeakUp</p><p className="footer-email-popover-address">{emailAddress}</p></div>
        </div>
        <a className="footer-email-popover-send" href={emailHref ?? undefined}>Send email</a>
        <div className="footer-email-popover-utilities">
          <button aria-label={copyStatus === "copied" ? "Email copied" : "Copy email address"} className="footer-email-popover-copy" onClick={copyEmail} type="button"><CopyIcon /></button>
          <span className="footer-email-popover-copy-status">{copyStatus === "copied" ? "Copied!" : copyStatus === "failed" ? "Copy failed" : "Copy email"}</span>
        </div>
        <button aria-controls={detailId} aria-expanded={isDetailOpen} className="footer-email-popover-detail-toggle" onClick={() => setIsDetailOpen((isOpen) => !isOpen)} type="button"><span>{isDetailOpen ? "Close detailed view" : "Open detailed view"}</span><DetailIcon /></button>
        <div className="footer-email-popover-detail" hidden={!isDetailOpen} id={detailId}><p>Official SpeakUp contact</p><a href={emailHref ?? undefined}>{emailAddress}</a></div>
        <span aria-live="polite" className="sr-only">{copyStatus === "copied" ? "Email copied to clipboard" : copyStatus === "failed" ? "Email could not be copied. Please try again." : ""}</span>
      </> : <><p className="footer-email-popover-label">Email SpeakUp</p><p className="footer-email-popover-message">A verified contact address has not yet been supplied.</p></>}
      </div>
    </m.div>
    </m.div>}
    </AnimatePresence>, document.body,
  ) : null;

  return (
    <div className="footer-social-cta-group" aria-label="SpeakUp social links" ref={groupRef} data-in-view={inView}>
      <a aria-label="Instagram" className="footer-social-cta footer-social-cta--instagram" href={siteConfig.links.instagram ?? undefined} rel="noopener noreferrer" target="_blank"><SocialCtaArtwork network="Instagram" /></a>
      <a aria-label="LinkedIn" className="footer-social-cta footer-social-cta--linkedin" href={siteConfig.links.linkedIn ?? undefined} rel="noopener noreferrer" target="_blank"><SocialCtaArtwork network="LinkedIn" /></a>
      <a aria-label="TikTok" className="footer-social-cta footer-social-cta--tiktok" href={siteConfig.links.tikTok ?? undefined} rel="noopener noreferrer" target="_blank"><SocialCtaArtwork network="TikTok" /></a>
      {hydrated ? <button aria-controls={popoverId} aria-haspopup="dialog" aria-expanded={isCardOpen} aria-label="Email SpeakUp" className="footer-social-cta footer-social-cta--email" data-card-active={isCardOpen} onClick={togglePinned} onPointerEnter={beginHoverPreview} onPointerLeave={() => { if (previewTimerRef.current) { clearTimeout(previewTimerRef.current); previewTimerRef.current = null; } schedulePreviewDismissal(); }} ref={emailTriggerRef} type="button"><SocialCtaArtwork network="Email" /></button> : <a aria-label="Email SpeakUp" className="footer-social-cta footer-social-cta--email" href={emailHref ?? undefined}><SocialCtaArtwork network="Email" /></a>}
      {popover}
    </div>
  );
}
