import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Star, Wallet, Gem } from "lucide-react";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { listCases, createStarsInvoice, openWithBalance, getOpening, createGramOpening, verifyGramOpening } from "@/lib/cases.functions";
import { chancePercent, pickWeighted, rarityOf, sellCredit } from "@/lib/cases";
import { GiftArt } from "@/components/GiftArt";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
import { BoxArt } from "@/components/BoxArt";
import { commentPayload } from "@/lib/ton";
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
const WIN_INDEX = 28;
const SPIN_MS = 5200;
const rarityTone: Record<string, string> = {
  common: "var(--box-blue)", rare: "var(--game-sky)", epic: "var(--rarity-epic)", legend: "var(--box-red)",
};

function CaseView() {
  const { caseId } = Route.useParams();
  const { initData, demo, refresh, data } = useStore();
  const { data: cases } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const c: any = cases?.find((x: any) => x.id === caseId);
  const invoiceFn = useServerFn(createStarsInvoice), balanceFn = useServerFn(openWithBalance), openingFn = useServerFn(getOpening);
  const gramFn = useServerFn(createGramOpening), gramVerifyFn = useServerFn(verifyGramOpening);
  const [tc] = useTonConnectUI();
  const address = useTonAddress();
  const [strip, setStrip] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [won, setWon] = useState<any | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const balance = Number((data?.me as any)?.stars_balance ?? 0);
  const idle = useMemo(() => (c ? Array.from({ length: 8 }, () => pickWeighted(c.items)) : []), [c]);

  if (!cases) return <div className="h-60 animate-pulse rounded-2xl bg-card" />;
  if (!c) return <p className="py-10 text-center text-muted-foreground">Box not found. <Link to="/" className="text-primary">Back</Link></p>;

  const tick = () => {
    // haptic ticks that slow down like a real roulette
    let t = 0, gap = 60;
    const step = () => { haptic("light"); t += gap; gap *= 1.12; if (t < SPIN_MS - 300) setTimeout(step, gap); };
    step();
  };

  const spinTo = (gift: any) => {
    const items = Array.from({ length: WIN_INDEX + 5 }, () => pickWeighted(c.items));
    items[WIN_INDEX] = gift;
    setStatus(null); setWon(null); setRolling(false); setOffset(0); setStrip(items);
    const w = viewport.current?.clientWidth ?? 360;
    const jitter = Math.floor(Math.random() * 60) - 30;
    requestAnimationFrame(() => requestAnimationFrame(() => { setRolling(true); setOffset(-(WIN_INDEX * ITEM) + w / 2 - 68 + jitter); tick(); }));
    setTimeout(() => { setWon(gift); setSpinning(false); haptic("success"); refresh(); }, SPIN_MS + 200);
  };

  const waitForResult = async (openingId: string) => {
    for (let i = 0; i < 30; i++) {
      const r = await openingFn({ data: { initData, openingId } });
      if (r.status === "opened" && r.gift) return r.gift;
      await new Promise((res) => setTimeout(res, 1000));
    }
    throw new Error("Payment received — your gift will appear in My Gifts shortly.");
  };

  const fail = (e: any) => { setSpinning(false); setStatus(null); toast.error(e?.message ?? "Unable to open"); };

  const payStars = async () => {
    if (demo) { setSpinning(true); spinTo(pickWeighted(c.items)); toast("Demo spin — open in Telegram to win for real"); return; }
    setSpinning(true); setStatus("Opening payment…");
    try {
      const { openingId, url } = await invoiceFn({ data: { initData, caseId: c.id } });
      getWebApp().openInvoice(url, async (s: string) => {
        if (s !== "paid") { setSpinning(false); setStatus(null); if (s === "failed") toast.error("Payment failed"); return; }
        try { setStatus("Unboxing…"); spinTo(await waitForResult(openingId)); } catch (e) { fail(e); }
      });
    } catch (e) { fail(e); }
  };

  const payGram = async () => {
    if (demo) { toast("Open Tesla in Telegram to pay with GRAM"); return; }
    if (!address) { await tc.openModal(); return; }
    setSpinning(true); setStatus("Confirm in your wallet…");
    try {
      const o = await gramFn({ data: { initData, caseId: c.id } });
      await tc.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: o.to, amount: o.nano, payload: commentPayload(o.comment) }] });
      setStatus("Waiting for the TON network…");
      for (let i = 0; i < 40; i++) {
        await new Promise((res) => setTimeout(res, 4000));
        const v = await gramVerifyFn({ data: { initData, openingId: o.openingId } });
        if (v.paid) { setStatus("Unboxing…"); spinTo(await waitForResult(o.openingId)); return; }
      }
      throw new Error("Payment not confirmed yet — it will open automatically in My Gifts once confirmed.");
    } catch (e) { fail(e); }
  };

  const payBalance = async () => {
    setSpinning(true);
    try { const { openingId } = await balanceFn({ data: { initData, caseId: c.id } }); spinTo(await waitForResult(openingId)); }
    catch (e) { fail(e); }
  };

  const shown = strip.length ? strip : idle;
  const sorted = [...c.items].sort((a: any, b: any) => b.value_stars - a.value_stars);

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{c.name}</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">{c.items.length} gifts inside</p>
      </div>

      <div ref={viewport} className="relative -mx-5 overflow-hidden py-2">
        <div className="spin-marker absolute inset-y-0 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-primary" />
        <div className={`flex gap-2 px-5 ${strip.length ? "spin-strip" : ""} ${rolling ? "spinning" : ""}`} style={{ transform: `translateX(${offset}px)` }}>
          {shown.map((g, i) => (
            <div key={i} className="spin-gift flex shrink-0 flex-col items-center justify-center">
              <GiftArt gift={g} className="size-20" play={!rolling} />
              <span className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground"><CurrencyIcon currency="stars" className="size-3" />{g.value_stars}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>

      {won ? (
        <div className="win-pop flex flex-col items-center rounded-3xl bg-card p-5 text-center">
          <GiftArt gift={won} className="size-32" />
          <p className="mt-2 text-xl font-semibold">{won.name}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><CurrencyIcon currency="stars" className="size-4" />{won.value_stars} · sell for {sellCredit(won.value_stars)}</p>
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Button asChild className="h-12 rounded-2xl"><Link to="/inventory">My gifts</Link></Button>
            <Button variant="secondary" onClick={() => { setWon(null); setStrip([]); setOffset(0); setRolling(false); }} className="h-12 rounded-2xl">Spin again</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={spinning} onClick={payStars} className="h-14 rounded-2xl text-base font-semibold">
              Spin<CurrencyIcon currency="stars" className="size-5" />{c.price_stars}
            </Button>
            <Button variant="secondary" disabled={spinning || !(Number(c.price_gram) > 0)} onClick={payGram} className="h-14 rounded-2xl text-base font-semibold">
              Spin<CurrencyIcon currency="gram" className="size-5" />{Number(c.price_gram)}
            </Button>
          </div>
          {status && <p className="text-center text-xs text-muted-foreground">{status}</p>}
          {!demo && balance >= c.price_stars && (
            <Button variant="ghost" disabled={spinning} onClick={payBalance} className="h-11 w-full rounded-2xl text-sm">
              <Wallet className="size-4" />Use balance · {balance}<CurrencyIcon currency="stars" className="size-4" />
            </Button>
          )}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Gifts in this box</h2>
        {sorted.map((g: any) => {
          const pct = chancePercent(g.weight, c.items);
          return (
            <div key={g.id} style={{ ["--tone" as any]: rarityTone[rarityOf(g.value_stars)] }} className="prize-row flex items-center gap-3 rounded-2xl p-2.5 pr-4">
              <GiftArt gift={g} className="size-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><CurrencyIcon currency="stars" className="size-3.5" />{g.value_stars}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums">{pct < 0.01 ? "<0.01" : pct.toFixed(2)}%</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
