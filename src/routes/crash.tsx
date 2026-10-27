import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Settings, Plus, Minus, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listCases } from "@/lib/cases.functions";
import { GiftArt } from "@/components/GiftArt";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/crash")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Crash" },
      { name: "description", content: "Watch the rocket fly and cash out before it crashes." },
      { property: "og:title", content: "Tesla — Crash" },
      { property: "og:description", content: "Watch the rocket fly and cash out before it crashes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Crash,
});

type Phase = "wait" | "fly" | "crash";
const tone = (m: number) => m >= 3 ? "border-success text-success" : m >= 1.5 ? "border-rarity-epic text-rarity-epic" : "border-primary/60 text-primary";

function Crash() {
  const { data } = useStore();
  const balance = Number((data?.me as any)?.stars_balance ?? 0);
  const [phase, setPhase] = useState<Phase>("wait");
  const [mult, setMult] = useState(1);
  const [count, setCount] = useState(5);
  const [history, setHistory] = useState([1.23, 3.56, 3.08, 1.0, 1.52, 1.0, 2.14]);
  const [sheet, setSheet] = useState(false);
  const [mode, setMode] = useState<"gifts" | "stars">("gifts");
  const [auto, setAuto] = useState(false);
  const [target, setTarget] = useState(2);
  const raf = useRef(0);
  const { data: cases } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const flyer = (cases ?? []).flatMap((c: any) => c.items).filter((g: any) => g.kind !== "nft").sort((a: any, b: any) => b.value_stars - a.value_stars)[0];

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (phase === "wait") {
      setCount(5);
      const iv = setInterval(() => setCount((c) => c - 1), 1000);
      t = setTimeout(() => { clearInterval(iv); setPhase("fly"); }, 5000);
      return () => { clearInterval(iv); clearTimeout(t); };
    }
    if (phase === "fly") {
      const crashAt = Math.max(1, 0.97 / (1 - Math.random()));
      const start = performance.now();
      const step = (now: number) => {
        const m = Math.exp((now - start) / 6000);
        if (m >= crashAt) { setMult(crashAt); setPhase("crash"); setHistory((h) => [Number(crashAt.toFixed(2)), ...h].slice(0, 12)); return; }
        setMult(m); raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf.current);
    }
    t = setTimeout(() => { setMult(1); setPhase("wait"); }, 2500);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Link to="/profile" className="flex items-center gap-1.5 rounded-full bg-success/20 px-4 py-2 text-base font-semibold text-success"><Users className="size-4 fill-current" />{(data as any)?.referrals?.length ?? 0}</Link>
          <button aria-label="Settings" className="grid size-10 place-items-center rounded-full bg-card"><Settings className="size-5" /></button>
        </div>
        <Balance value={balance} />
      </div>

      <div className="ios-wall relative -mx-5 h-72 overflow-hidden"><span className="ios-blob ios-blob-a" /><span className="ios-blob ios-blob-b" /><span className="ios-blob ios-blob-c" />
        {phase === "wait" ? (
          <div className="absolute inset-0 grid place-items-center text-center">
            <div><p className="text-7xl font-black text-foreground/90 tabular-nums">{Math.max(count, 0)}</p><p className="text-sm text-muted-foreground">Next round</p></div>
          </div>
        ) : (
          <>
            <div className={`absolute inset-0 m-auto mt-20 size-40 ${phase === "fly" ? "rocket-fly" : "rocket-boom"}`}>
              {flyer && <GiftArt gift={flyer} className="size-full" />}
            </div>
            <p className={`absolute inset-x-0 top-3 text-center text-4xl font-black tabular-nums ${phase === "crash" ? "text-destructive" : ""}`}>x{mult.toFixed(2)}</p>
          </>
        )}
      </div>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
        <span className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground tabular-nums">x{(phase === "wait" ? (history[0] ?? 1) : mult).toFixed(2)}</span>
        {history.map((m, i) => <span key={i} className={`shrink-0 rounded-full border-2 px-4 py-1 text-sm font-semibold tabular-nums ${tone(m)}`}>{m.toFixed(2)}</span>)}
      </div>

      <button onClick={() => setSheet(true)} className="pattern-btn h-14 w-full rounded-full text-lg font-bold">Place bet</button>

      <div className="min-h-64 rounded-[28px] bg-card p-4">
        <p className="py-16 text-center text-muted-foreground">No bets in this round yet</p>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-md" onClick={() => setSheet(false)}>
          <div className="w-full max-w-md px-2 pb-4" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4 rounded-[32px] border border-border bg-card p-5">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-muted" />
              <span className="inline-block rounded-full bg-muted px-5 py-2 text-lg">Place bet</span>
              <div className="grid grid-cols-2 rounded-full bg-muted p-1">
                {(["gifts", "stars"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-full py-2.5 text-lg ${mode === m ? "bg-primary text-primary-foreground" : ""}`}>{m === "gifts" ? "Gifts" : "Stars"}</button>
                ))}
              </div>
              {mode === "gifts" ? (
                <div className="rounded-3xl bg-muted p-4">
                  <p className="font-bold">You have no gifts</p>
                  <p className="text-sm text-muted-foreground">Win gifts from cases, then bet them here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between px-3 text-lg"><span className="text-muted-foreground">Amount</span><span className="text-primary">balance: {balance} ⭐</span></div>
                  <input inputMode="numeric" defaultValue={0} className="h-14 w-full rounded-full bg-muted px-5 text-lg outline-none" />
                </div>
              )}
              <div className="grid grid-cols-[1.4fr_1fr] gap-3">
                <button onClick={() => setAuto(!auto)} className="flex items-center justify-between rounded-full bg-muted py-2 pl-5 pr-2 text-lg">
                  Auto cashout
                  <span className={`flex h-9 w-16 items-center rounded-full p-1 ${auto ? "justify-end bg-primary" : "bg-background"}`}><span className="size-7 rounded-full bg-foreground" /></span>
                </button>
                <div className="flex items-center justify-between rounded-full bg-muted p-1.5">
                  <button aria-label="Less" onClick={() => setTarget((v) => Math.max(1.1, +(v - 0.1).toFixed(1)))} className="grid size-9 place-items-center rounded-full bg-background"><Minus className="size-4" /></button>
                  <span className="text-lg tabular-nums">x{target.toFixed(1)}</span>
                  <button aria-label="More" onClick={() => setTarget((v) => +(v + 0.1).toFixed(1))} className="grid size-9 place-items-center rounded-full bg-background"><Plus className="size-4" /></button>
                </div>
              </div>
            </div>
            <Link to="/" className="mt-3 block h-14 w-full rounded-full bg-primary text-center text-lg font-bold leading-[3.5rem] text-primary-foreground">Deposit</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Balance({ value }: { value: number }) {
  return (
    <Link to="/profile" className="flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-1.5">
      <span className="grid size-8 place-items-center rounded-full bg-primary"><Star className="size-4 fill-primary-foreground text-primary-foreground" /></span>
      <span className="px-1 text-lg font-bold tabular-nums">{value.toFixed(2)}</span>
      <span className="grid size-8 place-items-center rounded-full bg-muted"><Plus className="size-5" /></span>
    </Link>
  );
}
