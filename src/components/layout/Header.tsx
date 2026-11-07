"use client";

import { useEffect, useRef, useState } from "react";
import { AdaptiveWordmark } from "@/components/brand/AdaptiveWordmark";
import { Button } from "@/components/ui/Button";
import { joinFormUrl, siteConfig } from "@/content/site";
import { subscribeNavThemeOverride, type NavTheme } from "@/lib/nav-theme";

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="menu-icon" aria-hidden="true" data-open={open}>
      <span />
      <span />
    </span>
  );
}

export function Header() {
  const [theme, setTheme] = useState<NavTheme>("paper");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  /**
   * A scene can own the ground under the header for part of its own scroll
   * range — the ink rise climbing over the paper composition is one. While an
   * override is set, the observer below must not argue with it.
   */
  const overrideRef = useRef<NavTheme | null>(null);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-nav-theme]"),
    );
    const sentinel = document.querySelector<HTMLElement>(
      "[data-header-sentinel]",
    );

    const resolveThemeAtActivationLine = () => {
      if (overrideRef.current) {
        return;
      }

      const activationLine = window.innerHeight * 0.17;
      const active = sections.find((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top <= activationLine && bounds.bottom >= activationLine;
      });
      const nextTheme = active?.dataset.navTheme;

      if (
        nextTheme === "paper" ||
        nextTheme === "ink" ||
        nextTheme === "media"
      ) {
        setTheme((current) => (current === nextTheme ? current : nextTheme));
      }
    };

    const activeEntries = new Map<Element, IntersectionObserverEntry>();
    const themeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeEntries.set(entry.target, entry);
          } else {
            activeEntries.delete(entry.target);
          }
        });

        // Keep tracking which sections are on screen, but let the override
        // speak for the header while one is set.
        if (overrideRef.current) {
          return;
        }

        const active = Array.from(activeEntries.values()).sort(
          (a, b) =>
            Math.abs(a.boundingClientRect.top) -
            Math.abs(b.boundingClientRect.top),
        )[0]?.target as HTMLElement | undefined;
        const nextTheme = active?.dataset.navTheme;
        if (
          nextTheme === "paper" ||
          nextTheme === "ink" ||
          nextTheme === "media"
        ) {
          setTheme((current) => (current === nextTheme ? current : nextTheme));
        }
      },
      { rootMargin: "-17% 0px -82% 0px", threshold: 0 },
    );

    sections.forEach((section) => themeObserver.observe(section));

    const sentinelObserver = new IntersectionObserver(([entry]) => {
      const nextScrolled = !(entry?.isIntersecting ?? true);
      setScrolled((current) =>
        current === nextScrolled ? current : nextScrolled,
      );
    });

    if (sentinel) sentinelObserver.observe(sentinel);

    const initialFrame = window.requestAnimationFrame(resolveThemeAtActivationLine);
    const resolveAfterHashNavigation = () => {
      window.requestAnimationFrame(resolveThemeAtActivationLine);
    };
    window.addEventListener("hashchange", resolveAfterHashNavigation);

    // Deterministic, rather than hoping the observer notices: a scene that
    // changes its own ground mid-section states the theme directly, and
    // clearing the override re-resolves from live geometry on the spot.
    const unsubscribeOverride = subscribeNavThemeOverride((override) => {
      overrideRef.current = override;

      if (override) {
        setTheme((current) => (current === override ? current : override));
      } else {
        resolveThemeAtActivationLine();
      }
    });

    return () => {
      themeObserver.disconnect();
      sentinelObserver.disconnect();
      unsubscribeOverride();
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("hashchange", resolveAfterHashNavigation);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const headerTheme = menuOpen ? "ink" : theme;

  return (
    <header
      className="site-header"
      data-theme={headerTheme}
      data-scrolled={scrolled}
      data-menu-open={menuOpen}
    >
      <nav className="header-inner" aria-label="Primary navigation">
        <a
          className="header-wordmark"
          href="#home"
          aria-label="SpeakUp home"
          onClick={closeMenu}
        >
          <AdaptiveWordmark priority theme={headerTheme} />
        </a>

        <div className="desktop-nav">
          {siteConfig.nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <Button
            href={joinFormUrl}
            rel="noopener noreferrer"
            target="_blank"
            variant="nav"
          >
            Join Us
          </Button>
        </div>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </nav>

      <div
        className="mobile-navigation"
        id="mobile-navigation"
        aria-hidden={!menuOpen}
      >
        <div className="mobile-nav-links">
          {siteConfig.nav.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              <span aria-hidden="true">0{index + 1}</span>
              {item.label}
            </a>
          ))}
          <a
            href={joinFormUrl}
            onClick={closeMenu}
            rel="noopener noreferrer"
            tabIndex={menuOpen ? 0 : -1}
            target="_blank"
          >
            <span aria-hidden="true">04</span>
            Join Us
          </a>
        </div>
      </div>
    </header>
  );
}
