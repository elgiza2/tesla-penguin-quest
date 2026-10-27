import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Plus, Megaphone, Users } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
import { BoxArt } from "@/components/BoxArt";
import { GiftArt } from "@/components/GiftArt";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Gift Boxes" },
      { name: "description", content: "Open gift boxes with Telegram Stars or GRAM and win Telegram gifts and NFTs." },
      { property: "og:title", content: "Tesla — Gift Boxes" },
      { property: "og:description", content: "Open gift boxes with Telegram Stars or GRAM and win Telegram gifts and NFTs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cases,
});

const GLOWS = ["var(--success)", "var(--primary)", "var(--rarity-rare)", "var(--game-mint)", "var(--game-coral)", "var(--rarity-epic)", "var(--game-sky)", "var(--game-pink)", "var(--secondary)"];

function Cases() {
  const { data } = useStore();
  const [tab, setTab] = useState<"paid" | "free">("paid");
  const { data: cases, isLoading, error } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const balance = Number((data?.me as any)?.stars_balance ?? 0);
  const refs = Number((data as any)?.referrals?.length ?? (data?.me as any)?.referrals_count ?? 0);
  const ribbon = (cases ?? []).flatMap((c: any) => c.items).sort((a: any, b: any) => b.value_stars - a.value_stars).slice(0, 10);
  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between">
        <Link to="/earn" className="flex items-center gap-1.5 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
          <Users className="size-4" />{refs}
        </Link>
        <Link to="/inventory" className="flex items-center gap-2 rounded-full bg-card py-1.5 pl-2 pr-1.5">
          <span className="grid size-7 place-items-center rounded-full bg-primary"><Star className="size-4 fill-primary-foreground text-primary-foreground" /></span>
          <span className="text-base font-semibold tabular-nums">{balance}</span>
          <span className="grid size-7 place-items-center rounded-full bg-muted"><Plus className="size-4" /></span>
        </Link>
      </div>

      <Link to="/events" className="relative flex items-center gap-3 overflow-hidden rounded-3xl bg-card p-4">
        <Megaphone className="size-5 shrink-0 text-primary" />
        <div className="min-w-0 pr-16">
          <p className="font-bold">Join our channel</p>
          <p className="text-xs text-muted-foreground">News, gift drops and promo codes for free boxes.</p>
        </div>
        {ribbon[0] && <GiftArt gift={ribbon[0]} className="absolute -right-2 top-1/2 size-20 -translate-y-1/2" />}
      </Link>

      {ribbon.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <div className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-card">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="text-[10px] font-bold text-success [writing-mode:vertical-rl] rotate-180">Live</span>
          </div>
          {ribbon.map((g: any, i: number) => (
            <div key={g.id + i} className="grid size-16 shrink-0 place-items-center rounded-2xl bg-card"><GiftArt gift={g} className="size-11" /></div>
          ))}
        </div>
      )}

      <div className="flex gap-5 text-2xl font-bold">
        <button onClick={() => setTab("paid")} className={tab === "paid" ? "" : "text-muted-foreground"}>Paid</button>
        <button onClick={() => setTab("free")} className={tab === "free" ? "" : "text-muted-foreground"}>Free</button>
      </div>

      {tab === "free" ? (
        <Link to="/earn" className="block rounded-3xl bg-card p-6 text-center text-sm text-muted-foreground">
          Complete tasks and invite friends to earn free boxes →
        </Link>
      ) : (
        <>
          {isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-3xl bg-card" />)}</div>}
          {error && <p className="text-sm text-destructive">Couldn't load boxes.</p>}
          <div className="grid grid-cols-2 gap-3">
            {cases?.map((c: any, i: number) => (
              <Link key={c.id} to="/case/$caseId" params={{ caseId: c.id }}
                style={{ ["--glow" as any]: GLOWS[i % GLOWS.length] }}
                className="box-card relative aspect-square overflow-hidden rounded-3xl transition active:scale-[0.97]">
                <div className="absolute inset-0"><BoxArt caseId={c.id} items={c.items} bare className="size-full" /></div>
                <div className="absolute left-2.5 top-2.5 flex gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-1 text-xs font-semibold backdrop-blur">
                    <Star className="size-3.5 fill-primary text-primary" />{c.price_stars}
                  </span>
                  {c.price_gram != null && (
                    <span className="rounded-full bg-background/70 px-2 py-1 text-xs font-semibold backdrop-blur">{Number(c.price_gram)} GRAM</span>
                  )}
                </div>
                <span className="absolute inset-x-0 bottom-2 text-center text-xs font-semibold">{c.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
