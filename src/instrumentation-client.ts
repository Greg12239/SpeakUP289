export {};

const navigationEntry = performance.getEntriesByType("navigation")[0] as
  | PerformanceNavigationTiming
  | undefined;
const isReload = navigationEntry
  ? navigationEntry.type === "reload"
  : performance.navigation.type === performance.navigation.TYPE_RELOAD;

if (isReload) {
  history.scrollRestoration = "manual";

  const resetScroll = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  resetScroll();
  document.addEventListener("DOMContentLoaded", resetScroll, { once: true });
  window.addEventListener(
    "load",
    () => {
      history.scrollRestoration = "auto";
      requestAnimationFrame(resetScroll);
    },
    { once: true },
  );
}
