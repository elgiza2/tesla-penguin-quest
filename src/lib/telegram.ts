/* Thin wrapper over window.Telegram.WebApp (loaded via script tag in __root). */
export type WebApp = any;

export function getWebApp(): WebApp | null {
  if (typeof window === "undefined") return null;
  return (window as any).Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const wa = getWebApp();
  if (!wa) return null;
  try {
    wa.ready();
    wa.expand();
    if (wa.isVersionAtLeast?.("8.0")) {
      wa.requestFullscreen?.();
      wa.disableVerticalSwipes?.();
    }
    const background = getComputedStyle(document.documentElement).backgroundColor;
    wa.setHeaderColor?.("bg_color");
    wa.setBackgroundColor?.(background);
  } catch {}
  const applyInsets = () => {
    const s = wa.safeAreaInset ?? {};
    const c = wa.contentSafeAreaInset ?? {};
    const root = document.documentElement.style;
    root.setProperty("--tg-safe-top", `${s.top ?? 0}px`);
    root.setProperty("--tg-content-top", `${Math.max(c.top ?? 0, wa.isFullscreen ? 56 : 0)}px`);
  };
  applyInsets();
  wa.onEvent?.("safeAreaChanged", applyInsets);
  wa.onEvent?.("contentSafeAreaChanged", applyInsets);
  wa.onEvent?.("fullscreenChanged", applyInsets);
  return wa;
}

export function haptic(type: "light" | "medium" | "success" | "error" = "light") {
  const h = getWebApp()?.HapticFeedback;
  if (!h) return;
  if (type === "success" || type === "error") h.notificationOccurred(type);
  else h.impactOccurred(type);
}

export function openLink(url: string) {
  const wa = getWebApp();
  if (url.startsWith("https://t.me/") && wa?.openTelegramLink) wa.openTelegramLink(url);
  else if (wa?.openLink) wa.openLink(url);
  else window.open(url, "_blank");
}
