export type NavTheme = "paper" | "ink" | "media";

const OVERRIDE_EVENT = "speakup:nav-theme-override";

type OverrideDetail = { theme: NavTheme | null };

/**
 * A scene that changes the ground under the header mid-section announces it
 * here.
 *
 * The header normally resolves its theme from an IntersectionObserver over
 * `[data-nav-theme]` sections. That observer only reports *intersection*
 * changes, so a section whose own ground changes while it stays on screen —
 * the ink rise climbing over the paper composition — would never be noticed.
 * This channel makes the update deterministic: the scene owns the statement,
 * the header applies it immediately, and clearing the override hands control
 * straight back to the observer.
 */
export function setNavThemeOverride(theme: NavTheme | null) {
  window.dispatchEvent(
    new CustomEvent<OverrideDetail>(OVERRIDE_EVENT, { detail: { theme } }),
  );
}

export function subscribeNavThemeOverride(
  listener: (theme: NavTheme | null) => void,
) {
  const handler = (event: Event) => {
    listener((event as CustomEvent<OverrideDetail>).detail?.theme ?? null);
  };

  window.addEventListener(OVERRIDE_EVENT, handler);
  return () => window.removeEventListener(OVERRIDE_EVENT, handler);
}
