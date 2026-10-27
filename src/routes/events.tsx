import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { Trophy, Users, Clock, Check } from "lucide-react";
import { listEvents, joinSubscribeEvent, verifyGramEntry } from "@/lib/cases.functions";
import { commentPayload } from "@/lib/ton";
import { openLink } from "@/lib/telegram";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/events")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Daily Events" },
      { name: "description", content: "Join daily contests in Tesla and win Telegram gifts." },
      { property: "og:title", content: "Tesla — Daily Events" },
      { property: "og:description", content: "Join daily contests in Tesla and win Telegram gifts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Events,
});

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m left` : `${Math.max(m, 0)}m left`;
}

function Events() {
  const { initData, demo, data: store } = useStore();
  const qc = useQueryClient();
  const listFn = useServerFn(listEvents), subFn = useServerFn(joinSubscribeEvent), gramFn = useServerFn(verifyGramEntry);
  const { data, isLoading } = useQuery({ queryKey: ["events"], enabled: !demo && !!initData, queryFn: () => listFn({ data: { initData } }) });
  const [tc] = useTonConnectUI();
  const address = useTonAddress();
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try { await fn(); toast.success(ok); await qc.invalidateQueries({ queryKey: ["events"] }); }
    catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(null); }
  };
  const payGram = async (e: any) => {
    if (!address) { await tc.openModal(); return; }
    const comment = `evt:${e.id.slice(0, 8)}:${store?.me.id}`;
    await tc.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [{ address: data!.receiveWallet, amount: String(Math.round(Number(e.entry_gram) * 1e9)), payload: commentPayload(comment) }] });
    toast("Payment sent — tap Verify in a minute");
  };

  if (demo) return <p className="py-16 text-center text-muted-foreground">Open Tesla inside Telegram to join events.</p>;
  return (
    <div className="space-y-5 pt-2">
      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-card" />}
      {data && data.events.length === 0 && <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground">New contests are coming soon. Check back daily.</div>}
      {data?.events.map((e: any) => (
        <article key={e.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base">{e.title}</p>
              {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-1 text-[10px] uppercase text-primary">{e.kind === "gram" ? `${e.entry_gram} GRAM` : "Free"}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Trophy className="size-3.5 text-primary" />{e.prize}</span>
            <span className="flex items-center gap-1"><Users className="size-3.5" />{e.entries}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{timeLeft(e.ends_at)}</span>
          </div>
          {e.joined === "verified" ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-muted py-3 text-sm"><Check className="size-4 text-success" />You're in</p>
          ) : e.kind === "subscribe" ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => e.link && openLink(e.link)} className="rounded-xl bg-muted py-3 text-sm">Join channel</button>
              <button disabled={busy === e.id} onClick={() => run(e.id, () => subFn({ data: { initData, eventId: e.id } }), "Verified — you're in!")} className="rounded-xl bg-primary py-3 text-sm text-primary-foreground disabled:opacity-50">Verify</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => payGram(e).catch((err) => toast.error(err?.message ?? "Payment cancelled"))} className="rounded-xl bg-primary py-3 text-sm text-primary-foreground">{address ? `Pay ${e.entry_gram} GRAM` : "Connect wallet"}</button>
              <button disabled={busy === e.id} onClick={() => run(e.id, () => gramFn({ data: { initData, eventId: e.id } }), "Payment verified — you're in!")} className="rounded-xl bg-muted py-3 text-sm disabled:opacity-50">Verify</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
