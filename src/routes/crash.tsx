import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Gift, Minus, Plus, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listCases } from "@/lib/cases.functions";
import { GiftArt } from "@/components/GiftArt";
import { useStore } from "@/lib/store";
import { WalletBalance } from "@/components/WalletBalance";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SAMPLE_GIFTS } from "@/components/SampleGifts";
import { canSubmitDemoBet, displayBalances } from "@/lib/presentation-demo";
import wallpaper from "@/assets/crash-glass.jpg";
import crystal from "@/assets/crystal.png";
import { toast } from "sonner";

export const Route = createFileRoute("/crash")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Gift Crash" }, { name: "description", content: "Telegram gift Crash with practice bets in gifts, GRAM and Stars." },
  { property: "og:title", content: "Tesla — Gift Crash" }, { property: "og:description", content: "A full-screen Telegram gift Crash experience." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Crash });
type Phase = "wait" | "fly" | "crash";
type Mode = "gifts" | "gram" | "stars";
function Crash() {
  const { data, demo } = useStore();
  const balances = displayBalances(demo, data?.me as any);
  const [phase, setPhase] = useState<Phase>("wait"), [mult, setMult] = useState(1), [count, setCount] = useState(5);
  const [history, setHistory] = useState([2.48, 1.12, 5.76, 1.84, 3.21, 1.05]);
  const [sheet, setSheet] = useState(false), [mode, setMode] = useState<Mode>("gifts");
  const [auto, setAuto] = useState(true), [target, setTarget] = useState(2), [amount, setAmount] = useState("1");
  const [selected, setSelected] = useState("diamond"), [bet, setBet] = useState<string | null>(null);
  const raf = useRef(0);
  const { data: cases } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const flyer = (cases ?? []).flatMap((c: any) => c.items).filter((g: any) => g.kind !== "nft").sort((a: any,b: any) => b.value_stars - a.value_stars)[0];
  useEffect(() => {
    if (phase === "wait") {
      setCount(5);
      const iv = setInterval(() => setCount(c => c - 1), 1000);
      const t = setTimeout(() => { clearInterval(iv); setPhase("fly"); }, 5000);
      return () => { clearInterval(iv); clearTimeout(t); };
    }
    if (phase === "fly") {
      const crashAt = 1.3 + Math.random() * 3.5, start = performance.now();
      const step = (now: number) => {
        const m = Math.exp((now - start) / 6500);
        if (m >= crashAt) { setMult(crashAt); setPhase("crash"); setHistory(h => [Number(crashAt.toFixed(2)), ...h].slice(0, 8)); return; }
        setMult(m); raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf.current);
    }
    const t = setTimeout(() => { setMult(1); setPhase("wait"); setBet(null); }, 2500);
    return () => clearTimeout(t);
  }, [phase]);
  function submit() {
    if (!demo) { toast("Real-money Crash betting is not available yet."); return; }
    if (mode !== "gifts" && !canSubmitDemoBet(demo, Number(amount), balances[mode])) return;
    const label = mode === "gifts" ? SAMPLE_GIFTS.find(g => g.id === selected)?.name ?? "Gift" : `${amount} ${mode === "gram" ? "GRAM" : "Stars"}`;
    setBet(label); setSheet(false); toast.success("Practice bet placed — no real funds used");
  }
  return <div className="crash-experience">
    <div className="crash-wallpaper"><img src={wallpaper} alt="" width={1024} height={1536} /><div className="crash-wallpaper-shade" /></div>
    <header className="relative z-10 flex items-center justify-between px-5 pt-5"><span className="text-xs font-medium text-foreground/60">PRACTICE ROUND</span><WalletBalance /></header>
    <div className="relative z-10 mt-5 flex gap-2 overflow-hidden px-5" aria-label="Recent multipliers">{history.map((m,i) => <span key={i} className={`history-chip ${m >= 3 ? "text-success" : m >= 2 ? "text-game-sky" : "text-muted-foreground"}`}>{m.toFixed(2)}×</span>)}</div>
    <div className="crash-arena relative z-10 flex flex-1 flex-col items-center justify-center">
      <p className="mb-2 text-xs font-medium uppercase text-foreground/60">{phase === "wait" ? "Next round in" : phase === "crash" ? "Round ended" : "Multiplier"}</p>
      <p className={`crash-number tabular-nums ${phase === "crash" ? "text-destructive" : "text-foreground"}`}>{phase === "wait" ? `0${Math.max(0,count)}` : `${mult.toFixed(2)}×`}</p>
      <div className={`crash-flying-gift ${phase === "fly" ? "rocket-fly" : phase === "crash" ? "rocket-boom" : "float-a"}`}>
        {flyer ? <GiftArt gift={flyer} className="size-full" /> : <img src={crystal} alt="Flying diamond gift" width={1024} height={1024} className="size-full object-contain" />}
      </div>
      {bet && <div role="status" className="mt-4 rounded-full border border-border bg-card/70 px-4 py-2 text-sm">{auto && mult >= target ? `Practice cashout · ${target.toFixed(1)}×` : `Practice bet · ${bet}`}</div>}
    </div>
    <div className="relative z-10 px-5 pb-4"><Button onClick={() => setSheet(true)} className="h-14 w-full rounded-2xl text-base font-semibold"><Gift />Place bet<ArrowUpRight className="ml-auto" /></Button></div>
    <Dialog open={sheet} onOpenChange={setSheet}><DialogContent className="bet-sheet gap-5 rounded-t-3xl px-5 pb-6 pt-7">
      <DialogTitle className="text-center text-xl">Place a bet</DialogTitle><DialogDescription className="text-center text-xs">Practice mode · no real funds</DialogDescription>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">{(["gifts","gram","stars"] as const).map(m => <Button key={m} variant="ghost" onClick={() => { setMode(m); setAmount(m === "stars" ? "25" : "1"); }} className={`h-11 rounded-lg ${mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>{m === "gifts" ? <Gift /> : <CurrencyIcon currency={m} />}{m === "gifts" ? "Gifts" : m === "gram" ? "GRAM" : "Stars"}</Button>)}</div>
      {mode === "gifts" ? demo ? <div className="grid grid-cols-2 gap-3">{SAMPLE_GIFTS.map(g => <Button key={g.id} onClick={() => setSelected(g.id)} variant="ghost" className={`relative h-36 flex-col rounded-lg border bg-background/40 ${selected === g.id ? "border-primary" : "border-border"}`}><img src={g.image} alt="" width={1024} height={1024} className="size-20 object-contain" /><span className="text-xs">{g.name}</span>{selected === g.id && <Check className="absolute right-2 top-2 text-primary" />}</Button>)}</div> : <p className="py-6 text-center text-muted-foreground">Practice gifts appear outside Telegram.</p> : <div>
        <div className="mb-2 flex justify-between text-xs text-muted-foreground"><label htmlFor="bet-amount">Bet amount</label><span>Available {balances[mode].toLocaleString()} {mode === "gram" ? "GRAM" : "Stars"}</span></div>
        <div className="flex h-16 items-center gap-3 rounded-xl border border-border bg-background/60 px-4"><CurrencyIcon currency={mode} className="size-8" /><input id="bet-amount" type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className="w-full min-w-0 bg-transparent text-2xl outline-none" /><Button variant="ghost" size="sm" onClick={() => setAmount(String(balances[mode]))}>Max</Button></div>
        <div className="mt-3 grid grid-cols-4 gap-2">{(mode === "gram" ? [0.5,1,2,5] : [25,50,100,250]).map(n => <Button key={n} variant="ghost" className="bg-muted" onClick={() => setAmount(String(n))}>{n}</Button>)}</div>
      </div>}
      <div className="flex items-center justify-between border-t border-border pt-4"><label htmlFor="auto-cashout" className="text-sm">Auto cashout</label><Switch id="auto-cashout" checked={auto} onCheckedChange={setAuto} /></div>
      <div className="flex items-center justify-between rounded-xl bg-muted p-2"><Button size="icon" variant="ghost" aria-label="Decrease cashout" disabled={!auto} onClick={() => setTarget(v => Math.max(1.1, +(v-.1).toFixed(1)))}><Minus /></Button><span className="text-xl tabular-nums">{target.toFixed(1)}×</span><Button size="icon" variant="ghost" aria-label="Increase cashout" disabled={!auto} onClick={() => setTarget(v => +(v+.1).toFixed(1))}><Plus /></Button></div>
      <Button className="h-13 w-full rounded-xl" disabled={!demo || (mode !== "gifts" && !canSubmitDemoBet(demo,Number(amount),balances[mode]))} onClick={submit}>Place practice bet</Button>
    </DialogContent></Dialog>
  </div>;
}
