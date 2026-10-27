import { PowerSection } from "@/components/PowerSection";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { startMining, claimMining } from "@/lib/api.functions";
import { MINING_HOURS } from "@/lib/config";
import { fmt } from "@/lib/ton";
import { haptic } from "@/lib/telegram";
import { CoinIcon, TSLA_ICON, PrimaryButton, GhostButton } from "@/components/ui-kit";
import mascot from "@/assets/tesla-captain.jpg";

export const Route = createFileRoute("/")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Mining" }, { name: "description", content: "Mine TSLA continuously and claim every two hours." },
  { property: "og:title", content: "Tesla Mining" }, { property: "og:description", content: "Mine TSLA continuously and claim every two hours." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
]}), component: Home });

function MiningRing({ progress, children }: { progress: number; children: ReactNode }) {
  const size = 180, stroke = 6, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-1000"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function Home() {
  const { data, t, initData, demo, patchMe } = useStore();
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [collectibles, setCollectibles] = useState(false);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  if (!data) return null;
  const me = data.me;
  const started = me.mining_started_at ? new Date(me.mining_started_at).getTime() : null;
  const total = MINING_HOURS * 3600_000;
  const elapsed = started === null ? 0 : Math.max(0, Math.min(now - started, total));
  const done = started !== null && elapsed >= total;
  const settled = me.mining_settled_at ? new Date(me.mining_settled_at).getTime() : started;
  const mined = started !== null && settled !== null ? Number(me.mining_pending ?? 0) + Math.max(0, Math.min(now, started + total) - settled) / 86400_000 * Number(me.mining_rate_daily ?? 0.1) : 0;
  const left = Math.max(0, total - elapsed);
  const clock = [Math.floor(left / 3600_000), Math.floor(left % 3600_000 / 60000), Math.floor(left % 60000 / 1000)].map(v => String(v).padStart(2, "0")).join(":");
  async function act() {
    if (demo) { toast(t("openInTelegram")); return; }
    setBusy(true);
    try { const result = done ? await claimMining({ data: { initData } }) : await startMining({ data: { initData } }); patchMe(result); haptic("success"); }
    catch (error: any) { toast.error(error.message); } finally { setBusy(false); }
  }
  return <div className="flex flex-col items-center pt-5 text-center">

    <MiningRing progress={started === null ? 0 : elapsed / total}>
      <img src={me.photo_url || (typeof window!=="undefined"?(window as any).Telegram?.WebApp?.initDataUnsafe?.user?.photo_url:"") || mascot} alt="" className="size-40 rounded-full object-cover" />
    </MiningRing>
    {started !== null && !done && <div className="mt-3 text-sm tabular-nums text-muted-foreground">{clock}</div>}
    <div className="mt-5 text-sm text-muted-foreground">{t("balance")}</div>
    <div className="mt-2 flex max-w-full items-center justify-center gap-2 break-all text-3xl tabular-nums"><CoinIcon src={TSLA_ICON} className="size-8" />{fmt(Number(me.balance), 2)}</div>
    <span className="mt-1 text-sm text-muted-foreground">TSLA</span>
    <div className="mt-5 w-full">
      {started === null || done ? <PrimaryButton onClick={act} disabled={busy}>{done ? `${t("claim")} +${fmt(mined, 4)} TSLA` : t("startMining")}</PrimaryButton> : <div className="rounded-2xl bg-accent py-4 text-primary">+{fmt(mined, 4)} TSLA</div>}
    </div>
    <div className="mt-7 w-full border-t border-border pt-5 text-start"><GhostButton className="flex w-full items-center justify-between" aria-expanded={collectibles} onClick={()=>setCollectibles(v=>!v)}><span>Tesla collectibles</span><span>{collectibles ? "−" : "+"}</span></GhostButton>{collectibles && <div className="mt-4"><PowerSection /></div>}</div>
  </div>;
}
