import "@/lib/buffer-polyfill";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { toNano } from "@ton/core";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { useStore } from "@/lib/store";
import { verifyHoldings, buyNft, myNfts } from "@/lib/api.functions";
import { POWER_LEVELS, SWAP_URL, NFT_TIERS, NFT_COLLECTION_URL, RECEIVE_WALLET } from "@/lib/config";
import nft1 from "@/assets/nft/display1.jpg";
import nft2 from "@/assets/nft/display2.jpg";
import nft3 from "@/assets/nft/display3.jpg";
import nft4 from "@/assets/nft/display4.jpg";
import nft5 from "@/assets/nft/display5.jpg";
import nft6 from "@/assets/nft/display6.jpg";
import nft7 from "@/assets/nft/display7.jpg";
import nft8 from "@/assets/nft/display8.jpg";
import nft9 from "@/assets/nft/display9.jpg";
import nft10 from "@/assets/nft/display10.jpg";
import { ArrowUpRight } from "lucide-react";
import investBanner from "@/assets/nft-invest-banner.jpg";
import { openLink, haptic } from "@/lib/telegram";
import { fmt, commentPayload } from "@/lib/ton";
import { Card, CoinIcon, GhostButton, GRAM_ICON, PrimaryButton, Segmented } from "@/components/ui-kit";

const NFT_IMAGES = [nft1, nft2, nft3, nft4, nft5, nft6, nft7, nft8, nft9, nft10];
const NFT_DESCRIPTIONS = [
  ["رفيقك الأول في عالم Tesla.", "Your first companion in Tesla."],
  ["الكشّاف المستعد لرحلة جديدة.", "A scout ready for a new journey."],
  ["مستكشف بروح المغامرة.", "An explorer with an adventurous spirit."],
  ["رائد بلمسة من المستقبل.", "A pioneer with a futuristic edge."],
  ["حارس المجموعة بدرعه الفضي.", "The collection guardian in silver armor."],
  ["قائد بإطلالة مميزة.", "A commander with a signature look."],
  ["شخصية ساحرة بتفاصيل مضيئة.", "A magical character with luminous details."],
  ["بطل ذهبي برداء ملكي.", "A golden champion in a royal cape."],
  ["شخصية أسطورية بفرو متلألئ.", "A legendary character with iridescent fur."],
  ["ملك المجموعة بتاجه البلوري.", "The collection king with a crystal crown."],
];

export function NftTab() {
  const { data, t, initData, demo, lang } = useStore();
  const ar = lang === "ar";
  const address = useTonAddress();
  const [tc] = useTonConnectUI();
  const [owned, setOwned] = useState<any[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const load = () => { if (!demo) myNfts({ data: { initData } }).then((r) => setOwned(r.nfts)).catch(() => {}); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps
  const ownedTiers = owned.map((n) => n.tier);
  async function buy(tier: (typeof NFT_TIERS)[number]) {
    if (!data) return;
    const me = data.me;
    if (demo) { toast(t("openInTelegram")); return; }
    if (!address) { tc.openModal(); return; }
    setBusy(tier.tier);
    try {
      await tc.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{ address: RECEIVE_WALLET, amount: toNano(tier.price.toString()).toString(), payload: commentPayload(`nft:${me.id}:${tier.tier}`) }],
      });
      toast(t("pending"));
      await new Promise((r) => setTimeout(r, 12000));
      await buyNft({ data: { initData, tier: tier.tier } });
      haptic("success");
      toast.success(t("done"));
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  }
  return (
    <div className="space-y-5">
      <GhostButton className="flex w-full items-center justify-between rounded-lg" onClick={() => openLink(NFT_COLLECTION_URL)}><span>Tesla · Getgems</span><ArrowUpRight className="size-4" /></GhostButton>
      <div className="grid grid-cols-2 gap-3">
        {NFT_TIERS.map((n) => (
          <div key={n.tier} className={`glass overflow-hidden rounded-3xl text-start ${ownedTiers.includes(n.tier) ? "ring-2 ring-primary" : ""}`}>
            <div className="relative"><img src={NFT_IMAGES[n.tier - 1]} alt={n.name} loading="lazy" className="aspect-square w-full object-cover" />{ownedTiers.includes(n.tier) && <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">Owned</span>}</div>
            <div className="space-y-2 p-3">
              <h2 className="truncate text-sm font-bold">{n.name}</h2>
              <p className="text-[11px] text-muted-foreground tabular-nums" dir="ltr">+{Math.round(n.mining * 100)}% mining · +{Math.round(n.referral * 100)}% referral</p>
              <PrimaryButton className="flex h-9 items-center justify-center gap-1 rounded-full text-xs" onClick={() => buy(n)} disabled={busy !== null}>
                {busy === n.tier ? t("pending") : <><CoinIcon src={GRAM_ICON} className="size-3.5" />{n.price}</>}
              </PrimaryButton>
            </div>
          </div>
        ))}
      </div>
      <img src={investBanner} alt="Resell anytime, delivered to your wallet instantly" loading="lazy" className="w-full rounded-3xl" />
    </div>
  );
}

export function PowerSection() { return <NftTab />; }
