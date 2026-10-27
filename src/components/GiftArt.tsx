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

/** Backdrop-free NFT animation for a collection slug, when available. */
export function nftAnimation(slug: string) {
  return (NFT_TRANSPARENT as Record<string, string>)[slug] ?? null;
}

/** Animated sticker of a regular Telegram gift. */
export const telegramGiftAnimation = (giftId: string) => `/api/public/gift-sticker/${giftId}`;

export function giftAnimationUrl(g: Gift) {
  const slug = g.kind === "nft" ? nftSlug(g) : null;
  const clean = slug ? nftAnimation(slug) : null;
  if (clean) return clean; // NFT animation with its backdrop layers removed
  if (g.animation_url) return g.animation_url;
  if (g.telegram_gift_id) return telegramGiftAnimation(g.telegram_gift_id);
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

/** Plays a Telegram Lottie animation; play/pause never reloads the file. */
export function LottieArt({ src, label, className = "", play = true, onFail }: { src: string; label: string; className?: string; play?: boolean; onFail?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<any>(null);
  const playing = useRef(play);
  playing.current = play;
  useEffect(() => {
    let cancelled = false;
    loadLottie().then((lottie) => {
      if (cancelled || !ref.current) return;
      anim.current = lottie.loadAnimation({ container: ref.current, renderer: "svg", loop: true, autoplay: playing.current, path: src });
      anim.current.addEventListener("data_failed", () => onFail?.());
    }).catch(() => onFail?.());
    return () => { cancelled = true; anim.current?.destroy(); anim.current = null; };
  }, [src]);
  useEffect(() => { if (play) anim.current?.play(); else anim.current?.pause(); }, [play]);
  return <div ref={ref} aria-label={label} role="img" className={className} />;
}

/** Animated Telegram gift (Lottie) with a static image fallback. */
export function GiftArt({ gift, className = "", play = true }: { gift: Gift; className?: string; play?: boolean }) {
  const [failed, setFailed] = useState(false);
  const url = giftAnimationUrl(gift);
  if (!url || failed) return <GiftThumb gift={gift} className={className} />;
  return <LottieArt src={url} label={gift.name} className={className} play={play} onFail={() => setFailed(true)} />;
}
