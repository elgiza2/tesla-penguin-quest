import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { adProgress, beginAd } from "@/lib/ads.functions";
import { REQUIRED_AD_VIEWS } from "@/lib/config";
import { loadSdk } from "@/components/AdTask";
import { GhostButton } from "@/components/ui-kit";

export function WithdrawalAds({ onProgress }: { onProgress: (count: number) => void }) {
  const { initData, demo, refresh } = useStore();
  const progressFn = useServerFn(adProgress), beginFn = useServerFn(beginAd);
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false), [checking, setChecking] = useState(false);
  const check = useCallback(async () => {
    if (demo) { setCount(0); onProgress(0); return 0; }
    const result = await progressFn({ data: { initData } });
    setCount(result.count); onProgress(result.count); return result.count;
  }, [demo, initData, progressFn, onProgress]);
  useEffect(() => { void check().catch(() => setCount(null)); }, [check]);
  async function watch() {
    if (demo) { toast("Open Tesla in Telegram to watch ads."); return; }
    setBusy(true);
    try {
      const show = await loadSdk();
      const { id } = await beginFn({ data: { initData } });
      await show({ ymid: id });
      const previous = count ?? 0;
      let next = await check();
      for (let attempt = 0; next <= previous && attempt < 4; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        next = await check();
      }
      if (next > previous) { toast.success("Ad confirmed · +1 ticket"); await refresh(); }
      else toast("Ad finished. Confirmation has not arrived yet.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to show ad"); }
    finally { setBusy(false); }
  }
  async function recheck() {
    setChecking(true);
    try { await check(); } catch { toast.error("Unable to refresh ad progress"); }
    finally { setChecking(false); }
  }
  const ready = count !== null && count >= REQUIRED_AD_VIEWS;
  return <div className="space-y-3 border-y border-border py-3">
    <div className="flex items-center justify-between text-sm"><span>Confirmed ad views</span><span className="flex items-center gap-1 tabular-nums">{ready && <Check className="size-4" />}{count === null ? "—" : Math.min(count, REQUIRED_AD_VIEWS)} / {REQUIRED_AD_VIEWS}</span></div>
    <div className="flex gap-2"><GhostButton onClick={watch} disabled={busy || ready} className="flex flex-1 items-center justify-center gap-2"><Play className="size-4" />{busy ? "Waiting for confirmation…" : ready ? "Ads completed" : "Agree & watch an ad"}</GhostButton><GhostButton aria-label="Refresh ad progress" title="Refresh ad progress" onClick={recheck} disabled={checking || busy} className="px-3"><RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} /></GhostButton></div>
  </div>;
}