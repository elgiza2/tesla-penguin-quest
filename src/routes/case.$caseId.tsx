import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Star, Wallet } from "lucide-react";
import { listCases, createStarsInvoice, openWithBalance, getOpening } from "@/lib/cases.functions";
import { chancePercent, pickWeighted, rarityOf, sellCredit } from "@/lib/cases";
import { GiftArt, GiftThumb } from "@/components/GiftArt";
import { useStore } from "@/lib/store";
import { getWebApp, haptic } from "@/lib/telegram";

export const Route = createFileRoute("/case/$caseId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Open a Box" },
      { name: "description", content: "Spin the box and see which Telegram gift you win." },
      { property: "og:title", content: "Tesla — Open a Box" },
      { property: "og:description", content: "Spin the box and see which Telegram gift you win." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaseView,
});

const ITEM = 104; // card width + gap
const WIN_INDEX = 34;
const rarityRing: Record<string, string> = {
  common: "border-rarity-common/40", rare: "border-rarity-rare", epic: "border-rarity-epic", legend: "border-rarity-legend",
};

function CaseView() {
  const { caseId } = Route.useParams();
  const { initData, demo, refresh, data } = useStore();
  const { data: cases } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const c = cases?.find((x: any) => x.id === caseId);
  const invoiceFn = useServerFn(createStarsInvoice), balanceFn = useServerFn(openWithBalance), openingFn = useServerFn(getOpening);
  const [strip, setStrip] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<any | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const balance = Number((data?.me as any)?.stars_balance ?? 0);

  const idle = useMemo(() => (c ? Array.from({ length: 12 }, () => pickWeighted(c.items)) : []), [c]);
  if (!cases) return <div className="h-60 animate-pulse rounded-2xl bg-card" />;
  if (!c) return <p className="py-10 text-center text-muted-foreground">Box not found. <Link to="/" className="text-primary">Back</Link></p>;

  const spinTo = (gift: any) => {
    const items = Array.from({ length: WIN_INDEX + 6 }, () => pickWeighted(c.items));
    items[WIN_INDEX] = gift;
    setWon(null); setOffset(0); setStrip(items);
    const w = viewport.current?.clientWidth ?? 360;
    const jitter = Math.floor(Math.random() * 60) - 30;
    requestAnimationFrame(() => requestAnimationFrame(() => setOffset(-(WIN_INDEX * ITEM) + w / 2 - 68 + jitter)));
    setTimeout(() => { setWon(gift); setSpinning(false); haptic("success"); refresh(); }, 5400);
  };

  const waitForResult = async (openingId: string) => {
    for (let i = 0; i < 30; i++) {
      const r = await openingFn({ data: { initData, openingId } });
      if (r.status === "opened" && r.gift) return r.gift;
      await new Promise((res) => setTimeout(res, 1000));
    }
    throw new Error("Payment received — your gift will appear in your inventory shortly.");
  };

  const payStars = async () => {
    if (demo) { setSpinning(true); spinTo(pickWeighted(c.items)); toast("Demo spin — open in Telegram to win for real"); return; }
    setSpinning(true);
    try {
      const { openingId, url } = await invoiceFn({ data: { initData, caseId: c.id } });
      const wa = getWebApp();
      wa.openInvoice(url, async (status: string) => {
        if (status !== "paid") { setSpinning(false); if (status === "failed") toast.error("Payment failed"); return; }
        try { spinTo(await waitForResult(openingId)); } catch (e: any) { setSpinning(false); toast(e.message); }
      });
    } catch (e: any) { setSpinning(false); toast.error(e?.message ?? "Unable to open"); }
  };

  const payBalance = async () => {
    setSpinning(true);
    try {
      const { openingId } = await balanceFn({ data: { initData, caseId: c.id } });
      spinTo(await waitForResult(openingId));
    } catch (e: any) { setSpinning(false); toast.error(e?.message ?? "Unable to open"); }
  };

  const shown = strip.length ? strip : idle;
  const sorted = [...c.items].sort((a: any, b: any) => b.value_stars - a.value_stars);

  return (
    <div className="space-y-6 pt-2">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl">{c.name}</h1>
        <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-sm"><Star className="size-4 fill-primary text-primary" />{c.price_stars}</span>
      </header>

      <div ref={viewport} className="relative -mx-5 overflow-hidden py-4">
        <div className="spin-marker absolute inset-y-1 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
        <div className={`flex gap-2 px-5 ${strip.length ? "spin-strip" : ""}`} style={{ transform: `translateX(${offset}px)` }}>
          {shown.map((g, i) => (
            <div key={i} className={`flex h-28 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border-2 bg-card p-2 ${rarityRing[rarityOf(g.value_stars)]}`}>
              <GiftThumb gift={g} className="size-14" />
              <span className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground"><Star className="size-3 fill-primary text-primary" />{g.value_stars}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      </div>

      {won ? (
        <div className="flex flex-col items-center rounded-2xl border border-primary/40 bg-card p-5 text-center">
          <GiftArt gift={won} className="size-36" />
          <p className="mt-2 text-xl">{won.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">Worth {won.value_stars} ⭐ · sell for {sellCredit(won.value_stars)} ⭐</p>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Link to="/inventory" className="rounded-xl bg-primary py-3 text-sm text-primary-foreground">Claim in inventory</Link>
            <button onClick={() => { setWon(null); setStrip([]); setOffset(0); }} className="rounded-xl bg-muted py-3 text-sm">Spin again</button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button disabled={spinning} onClick={payStars} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base text-primary-foreground transition active:scale-[0.98] disabled:opacity-50">
            {spinning ? "Spinning…" : <>Open for <Star className="size-5 fill-current" />{c.price_stars}</>}
          </button>
          {!demo && balance >= c.price_stars && (
            <button disabled={spinning} onClick={payBalance} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-muted text-sm disabled:opacity-50">
              <Wallet className="size-4" />Use balance ({balance} ⭐)
            </button>
          )}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-widest text-muted-foreground">Inside this box</h2>
        <div className="grid grid-cols-3 gap-2">
          {sorted.map((g: any) => (
            <div key={g.id} className={`flex flex-col items-center rounded-2xl border bg-card p-2 ${rarityRing[rarityOf(g.value_stars)]}`}>
              <GiftThumb gift={g} className="size-12" />
              <p className="mt-1 w-full truncate text-center text-xs">{g.name}</p>
              <p className="text-[10px] text-muted-foreground">{chancePercent(g.weight, c.items).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
