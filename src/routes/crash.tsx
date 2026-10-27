import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Gift, Minus, Plus, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { WalletBalance } from "@/components/WalletBalance";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { CrashBackdrop } from "@/components/CrashBackdrop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { SAMPLE_GIFTS } from "@/components/SampleGifts";
import { canSubmitDemoBet, displayBalances, DEMO_BETTORS } from "@/lib/presentation-demo";
import ready from "@/assets/mascot-ready.png";
import flight from "@/assets/mascot-flight.png";
import crashed from "@/assets/mascot-crashed.png";
import { toast } from "sonner";

export const Route = createFileRoute("/crash")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Gift Crash" }, { name: "description", content: "Ride the rocket and cash out before it crashes. Bet Telegram gifts, GRAM or Stars." },
  { property: "og:title", content: "Tesla — Gift Crash" }, { property: "og:description", content: "Ride the rocket and cash out before it crashes." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Crash });

type Phase = "wait" | "fly" | "crash";
type Sheet = null | "gifts" | "coins";
const ART: Record<Phase, string> = { wait: ready, fly: flight, crash: crashed };
const chipColor = (m: number) => m >= 10 ? "var(--game-yellow)" : m >= 3 ? "var(--game-mint)" : m >= 2 ? "var(--game-sky)" : m >= 1.5 ? "var(--game-violet)" : "var(--game-coral)";

function Crash() {
  const { data, demo } = useStore();
  const balances = displayBalances(demo, data?.me as any);
  const [phase, setPhase] = useState<Phase>("wait"), [mult, setMult] = useState(1), [count, setCount] = useState(5);
  const [history, setHistory] = useState([2.48, 1.12, 5.76, 1.84, 12.3, 1.05, 3.21, 1.47]);
  const [sheet, setSheet] = useState<Sheet>(null), [coin, setCoin] = useState<"gram" | "stars">("gram");
  const [auto, setAuto] = useState(true), [target, setTarget] = useState(2), [amount, setAmount] = useState("1");
  const [selected, setSelected] = useState("diamond"), [bet, setBet] = useState<string | null>(null);
  const raf = useRef(0);

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
        if (m >= crashAt) { setMult(crashAt); setPhase("crash"); setHistory(h => [Number(crashAt.toFixed(2)), ...h].slice(0, 12)); return; }
        setMult(m); raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf.current);
    }
    const t = setTimeout(() => { setMult(1); setPhase("wait"); setBet(null); }, 2800);
    return () => clearTimeout(t);
  }, [phase]);

  const open = (s: Exclude<Sheet, null>) => { setSheet(s); if (s === "coins") setAmount(coin === "stars" ? "25" : "1"); };
  function submit() {
    if (!demo) { toast("Crash betting opens soon."); return; }
    if (sheet === "coins" && !canSubmitDemoBet(demo, Number(amount), balances[coin])) return;
    const label = sheet === "gifts" ? SAMPLE_GIFTS.find(g => g.id === selected)?.name ?? "Gift" : `${amount} ${coin === "gram" ? "GRAM" : "Stars"}`;
    setBet(label); setSheet(null); toast.success(`Bet placed · ${label}`);
  }
  const bettors = demo ? DEMO_BETTORS : [];
  const coinsOk = sheet !== "coins" || canSubmitDemoBet(demo, Number(amount), balances[coin]);

  return <div className="crash-experience">
    <CrashBackdrop />
    <header className="relative z-10 flex justify-end px-5 pt-5"><WalletBalance /></header>

    <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground/70">{phase === "wait" ? "Launch in" : phase === "crash" ? "Crashed at" : "Flying"}</p>
      <p className={`crash-number tabular-nums ${phase === "crash" ? "text-destructive" : "text-foreground"}`}>{phase === "wait" ? `${Math.max(0, count)}s` : `${mult.toFixed(2)}×`}</p>
      <div key={phase} className={`crash-mascot mascot-${phase === "wait" ? "ready" : phase === "fly" ? "flight" : "crashed"}`}>
        <img src={ART[phase]} alt={phase === "crash" ? "Rocket exploded, pilot parachuting" : "Pilot on a rocket"} width={816} height={816} />
      </div>
      {bet && <div role="status" className="mt-2 rounded-full bg-background/60 px-4 py-1.5 text-xs backdrop-blur">{auto && phase === "fly" && mult >= target ? `Cashed out · ${target.toFixed(1)}×` : `Your bet · ${bet}`}</div>}
    </div>

    <div className="crash-panel relative z-10 space-y-3 px-5 pb-3 pt-3">
      <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none]" aria-label="Recent rounds">
        {history.map((m, i) => <span key={i} className="mult-chip" style={{ ["--chip" as any]: chipColor(m) }}>{m.toFixed(2)}×</span>)}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Button onClick={() => open("gifts")} className="h-13 rounded-2xl text-base font-semibold"><Gift />Bet gifts</Button>
        <Button onClick={() => open("coins")} variant="secondary" className="h-13 rounded-2xl text-base font-semibold"><span className="flex -space-x-1.5"><CurrencyIcon currency="gram" className="size-5" /><CurrencyIcon currency="stars" className="size-5" /></span>Bet GRAM</Button>
      </div>
      <div className="max-h-[22dvh] overflow-y-auto rounded-2xl bg-card/70" aria-label="Players in this round">
        <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"><span>Players</span><span>Bet</span></div>
        {bettors.length === 0 && <p className="px-4 pb-4 pt-2 text-sm text-muted-foreground">No bets in this round yet.</p>}
        {bettors.map(b => <div key={b.id} className="bettor-row flex items-center gap-3 px-4 py-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold">{b.name[0]}</span>
          <span className="min-w-0 flex-1 truncate text-sm">{b.name}</span>
          {phase !== "wait" && b.cashout <= mult ? <span className="text-xs font-semibold text-success">{b.cashout.toFixed(2)}×</span> : null}
          <span className="flex items-center gap-1 text-sm tabular-nums"><CurrencyIcon currency={b.currency} className="size-4" />{b.amount}</span>
        </div>)}
      </div>
    </div>

    <Dialog open={sheet !== null} onOpenChange={o => !o && setSheet(null)}><DialogContent className="bet-sheet gap-5 rounded-t-3xl px-5 pb-6 pt-7">
      <DialogTitle className="text-center text-xl">{sheet === "gifts" ? "Bet a gift" : "Bet coins"}</DialogTitle>
      <DialogDescription className="sr-only">Choose your stake and auto cashout.</DialogDescription>
      {sheet === "gifts" ? (
        demo ? <div className="grid grid-cols-2 gap-3">{SAMPLE_GIFTS.map(g => <Button key={g.id} onClick={() => setSelected(g.id)} variant="ghost" className={`relative h-36 flex-col rounded-2xl border bg-background/40 ${selected === g.id ? "border-primary" : "border-border"}`}><img src={g.image} alt="" width={1024} height={1024} className="size-20 object-contain" /><span className="text-xs">{g.name}</span>{selected === g.id && <Check className="absolute right-2 top-2 text-primary" />}</Button>)}</div>
          : <p className="py-6 text-center text-sm text-muted-foreground">Your gifts will appear here.</p>
      ) : <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">{(["gram", "stars"] as const).map(m => <Button key={m} variant="ghost" onClick={() => { setCoin(m); setAmount(m === "stars" ? "25" : "1"); }} className={`h-11 rounded-xl ${coin === m ? "bg-card text-foreground" : "text-muted-foreground"}`}><CurrencyIcon currency={m} />{m === "gram" ? "GRAM" : "Stars"}</Button>)}</div>
        <div className="flex h-16 items-center gap-3 rounded-2xl bg-muted px-4"><CurrencyIcon currency={coin} className="size-8" /><input aria-label="Bet amount" type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className="w-full min-w-0 bg-transparent text-2xl font-semibold outline-none" /><span className="text-xs text-muted-foreground">/ {balances[coin].toLocaleString()}</span></div>
        <div className="grid grid-cols-4 gap-2">{(coin === "gram" ? [0.5, 1, 2, 5] : [25, 50, 100, 250]).map(n => <Button key={n} variant="ghost" className="rounded-xl bg-muted" onClick={() => setAmount(String(n))}>{n}</Button>)}</div>
      </div>}
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-2 pl-4">
        <label htmlFor="auto-cashout" className="flex-1 text-sm">Auto cashout</label>
        <Button size="icon" variant="ghost" aria-label="Decrease cashout" disabled={!auto} onClick={() => setTarget(v => Math.max(1.1, +(v - .1).toFixed(1)))}><Minus /></Button>
        <span className="w-12 text-center text-base font-semibold tabular-nums">{target.toFixed(1)}×</span>
        <Button size="icon" variant="ghost" aria-label="Increase cashout" disabled={!auto} onClick={() => setTarget(v => +(v + .1).toFixed(1))}><Plus /></Button>
        <Switch id="auto-cashout" checked={auto} onCheckedChange={setAuto} />
      </div>
      <Button className="h-13 w-full rounded-2xl text-base font-semibold" disabled={!demo || !coinsOk} onClick={submit}>Place bet</Button>
    </DialogContent></Dialog>
  </div>;
}
