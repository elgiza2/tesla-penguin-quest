import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Send, Coins } from "lucide-react";
import { myInventory, sellGift, claimGift } from "@/lib/cases.functions";
import { sellCredit } from "@/lib/cases";
import { GiftArt } from "@/components/GiftArt";
import { useStore } from "@/lib/store";
import { SampleGifts } from "@/components/SampleGifts";

export const Route = createFileRoute("/inventory")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — My Gifts" },
      { name: "description", content: "Your won Telegram gifts: receive them in Telegram or sell for Stars." },
      { property: "og:title", content: "Tesla — My Gifts" },
      { property: "og:description", content: "Your won Telegram gifts: receive them in Telegram or sell for Stars." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inventory,
});

const statusLabel: Record<string, string> = { sending: "Sending…", sent: "Sent to Telegram", pending_manual: "Delivery queued", failed: "Delivery failed" };

export function Inventory() {
  const { initData, demo, refresh } = useStore();
  const qc = useQueryClient();
  const invFn = useServerFn(myInventory), sellFn = useServerFn(sellGift), claimFn = useServerFn(claimGift);
  const { data, isLoading } = useQuery({ queryKey: ["inventory"], enabled: !demo && !!initData, queryFn: () => invFn({ data: { initData } }) });
  const [busy, setBusy] = useState<string | null>(null);
  const act = async (id: string, kind: "sell" | "claim") => {
    setBusy(id);
    try {
      if (kind === "sell") { const r = await sellFn({ data: { initData, giftId: id } }); toast.success(`Balance: ${r.starsBalance} ⭐`); }
      else { const r = await claimFn({ data: { initData, giftId: id } }); toast.success(r.status === "sent" ? "Gift sent to your Telegram profile" : "NFT delivery queued — we'll transfer it soon"); }
      await qc.invalidateQueries({ queryKey: ["inventory"] }); refresh();
    } catch (e: any) { toast.error(e?.message ?? "Failed"); await qc.invalidateQueries({ queryKey: ["inventory"] }); }
    finally { setBusy(null); }
  };
  if (demo) return <SampleGifts />;
  return (
    <div className="space-y-5 pt-2">
      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-card" />}
      {data && data.gifts.length === 0 && (
        <p className="py-20 text-center text-lg text-muted-foreground">Inventory is empty</p>
      )}
      <div className="space-y-2">
        {data?.gifts.map((g: any) => {
          const open = g.status === "owned" || g.status === "failed";
          return (
            <div key={g.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
              <GiftArt gift={g} className="size-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{g.name}{g.kind === "nft" && <span className="ml-2 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">NFT</span>}</p>
                <p className="text-xs text-muted-foreground">{statusLabel[g.status] ?? `${g.value_stars} ⭐`}</p>
              </div>
              {open && (
                <div className="flex gap-1.5">
                  <button disabled={busy === g.id} onClick={() => act(g.id, "sell")} aria-label="Sell" className="flex h-10 items-center gap-1 rounded-xl bg-muted px-3 text-xs disabled:opacity-50"><Coins className="size-3.5" />{sellCredit(g.value_stars)}</button>
                  <button disabled={busy === g.id} onClick={() => act(g.id, "claim")} aria-label="Receive in Telegram" className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4" /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
