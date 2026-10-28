import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { beginAd, finishAd } from "@/lib/ads.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const AD_ZONE = "12137490";
type AdFn = (options?: { ymid?: string }) => Promise<unknown>;

/** Loads the Monetag SDK only when the user agrees to watch an ad. */
export async function loadSdk(): Promise<AdFn> {
  const w = window as unknown as Record<string, AdFn | undefined>;
  const key = `show_${AD_ZONE}`;
  if (w[key]) return w[key]!;
  await new Promise<void>((resolve, reject) => {
    document.getElementById("monetag-sdk")?.remove();
    const script = document.createElement("script");
    script.id = "monetag-sdk"; script.src = "https://libtl.com/sdk.js";
    script.dataset["zone"] = AD_ZONE; script.dataset["sdk"] = key;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error("No ad is available right now")); };
    document.head.appendChild(script);
  });
  if (!w[key]) throw new Error("No ad is available right now");
  return w[key]!;
}

/** Asks for consent, plays one rewarded interstitial and confirms it on the server. Returns today's confirmed count. */
export function useRewardedAd() {
  const { initData, demo } = useStore();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [resolver, setResolver] = useState<((n: number | null) => void) | null>(null);

  const request = () => new Promise<number | null>((resolve) => {
    if (demo) { toast("Open Tesla in Telegram to watch ads"); resolve(null); return; }
    setResolver(() => resolve); setAsking(true);
  });

  const watch = async () => {
    setAsking(false); setBusy(true);
    try {
      const show = await loadSdk();
      const { id } = await beginAd({ data: { initData } });
      await show({ ymid: id });
      const r = await finishAd({ data: { initData, id } });
      toast.success("Ad counted");
      resolver?.(r.today);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to show ad");
      resolver?.(null);
    } finally { setBusy(false); setResolver(null); }
  };

  const cancel = () => { setAsking(false); resolver?.(null); setResolver(null); };

  const dialog = (
    <Dialog open={asking} onOpenChange={(o) => !o && cancel()}>
      <DialogContent className="gap-4 rounded-3xl">
        <DialogTitle>Watch an ad?</DialogTitle>
        <DialogDescription>A full-screen ad will play. Watch it to the end to have it counted.</DialogDescription>
        <Button onClick={watch} className="h-12 rounded-2xl">Watch ad</Button>
        <Button variant="ghost" onClick={cancel} className="h-11 rounded-2xl">Not now</Button>
      </DialogContent>
    </Dialog>
  );
  return { request, busy, dialog };
}
