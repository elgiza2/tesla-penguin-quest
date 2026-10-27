import { useEffect, useRef, useState } from "react";
import NFT_TRANSPARENT from "@/lib/nft-transparent.json";

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

/** NFT slug from a Fragment media URL, e.g. ".../gift/lolpop-1.webp" → "lolpop". */
function nftSlug(g: Gift) {
  const m = (g.animation_url || g.image_url || "").match(/fragment\.com\/gift\/([a-z0-9]+)-\d+/i);
  return m ? m[1]!.toLowerCase() : null;
}

export function giftAnimationUrl(g: Gift) {
  const slug = g.kind === "nft" ? nftSlug(g) : null;
  const clean = slug ? (NFT_TRANSPARENT as Record<string, string>)[slug] : undefined;
  if (clean) return clean; // NFT animation with its backdrop layers removed
  if (g.animation_url) return g.animation_url;
  if (g.telegram_gift_id) return `/api/public/gift-sticker/${g.telegram_gift_id}`;
  return null;
}

export function giftImageUrl(g: Gift) {
  if (g.image_url) return g.image_url;
  if (g.telegram_gift_id) return `/api/public/gift-sticker/${g.telegram_gift_id}?thumb=1`;
  return null;
}

/** Static gift picture, cheap enough for long spin strips. */
export function GiftThumb({ gift, className = "" }: { gift: Gift; className?: string }) {
  const src = giftImageUrl(gift);
  return src ? <img src={src} alt={gift.name} className={`object-contain ${className}`} loading="lazy" draggable={false} /> : <div className={className}>🎁</div>;
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
  if (!url || failed) return <GiftThumb gift={gift} className={className} />;
  return <div ref={ref} aria-label={gift.name} role="img" className={className} />;
}
