import { useEffect, useRef, useState } from "react";

type Gift = { kind: string; telegram_gift_id?: string | null; image_url?: string | null; animation_url?: string | null; name: string };

let lottieLoader: Promise<any> | null = null;
function loadLottie() {
  if (!lottieLoader) lottieLoader = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.lottie) return resolve(w.lottie);
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js";
    s.onload = () => resolve(w.lottie);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return lottieLoader;
}

export function giftAnimationUrl(g: Gift) {
  if (g.animation_url) return g.animation_url;
  if (g.telegram_gift_id) return `/api/public/gift-sticker/${g.telegram_gift_id}`;
  return null;
}

/** Animated Telegram gift (Lottie) with a static image fallback. */
export function GiftArt({ gift, className = "", play = true }: { gift: Gift; className?: string; play?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const url = giftAnimationUrl(gift);
  useEffect(() => {
    if (!url || !ref.current) return;
    let anim: any; let cancelled = false;
    loadLottie().then((lottie) => {
      if (cancelled || !ref.current) return;
      anim = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: true, autoplay: play, path: url });
      anim.addEventListener("data_failed", () => setFailed(true));
    }).catch(() => setFailed(true));
    return () => { cancelled = true; anim?.destroy(); };
  }, [url, play]);
  if ((!url || failed) && gift.image_url) return <img src={gift.image_url} alt={gift.name} className={`object-contain ${className}`} loading="lazy" />;
  if (!url || failed) return <div className={`flex items-center justify-center text-3xl ${className}`}>🎁</div>;
  return <div ref={ref} aria-label={gift.name} role="img" className={className} />;
}
