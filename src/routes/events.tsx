import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ArrowUpRight } from "lucide-react";
import banner from "@/assets/season-banner.jpg";
import mascot from "@/assets/tesla-mascot.jpg";
import { seasonLeaderboard, listCases } from "@/lib/cases.functions";
import { GiftArt } from "@/components/GiftArt";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { WalletBalance } from "@/components/WalletBalance";
import { CURRENT_SEASON, DEMO_PLAYERS } from "@/lib/presentation-demo";
import { useStore } from "@/lib/store";
export const Route = createFileRoute("/events")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Season 1" }, { name: "description", content: "Season 1 is underway. Explore the gift prizes and player leaderboard." },
  { property: "og:title", content: "Tesla — Season 1" }, { property: "og:description", content: "The first Tesla gift season is underway." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Season });
function Season() {
  const { demo } = useStore();
  const { data: liveRows } = useQuery({ queryKey: ["season"], queryFn: () => seasonLeaderboard(), staleTime: 30_000, enabled: !demo });
  const { data: cases } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const rows = demo ? DEMO_PLAYERS : liveRows ?? [];
  const prizes = (cases ?? []).flatMap((c: any) => c.items).filter((g: any) => g.kind !== "nft").sort((a: any,b: any) => b.value_stars - a.value_stars);
  return <div className="space-y-5 pt-2">
    <header className="flex items-center justify-between"><h1 className="text-xl font-semibold">Season {CURRENT_SEASON.number}</h1><WalletBalance /></header>
    <div className="season-cover relative overflow-hidden rounded-xl"><img src={banner} alt="Season trophy" width={1280} height={720} className="aspect-[16/11] w-full object-cover" /><span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs"><span className="size-1.5 rounded-full bg-success" />Season 1 · Ongoing</span><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent px-4 pb-4 pt-12"><p className="text-2xl font-semibold">The first drop</p><p className="mt-1 text-sm text-foreground/70">Telegram gifts. First season.</p></div></div>
    <div className="flex items-center justify-between border-y border-border py-4"><span className="flex items-center gap-2 text-sm"><Trophy className="size-5 text-primary" />Season status</span><span className="flex items-center gap-1 text-sm text-success">In progress<ArrowUpRight className="size-4" /></span></div>
    <div><div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-medium">Leaderboard</h2>{demo && <span className="text-xs text-muted-foreground">Sample standings</span>}</div>
    {rows.map((r: any,i: number) => <div key={r.id} className="flex items-center gap-3 border-b border-border py-3.5 last:border-0"><span className={`w-6 text-center text-sm ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{i+1}</span><img src={r.photo || mascot} alt="" width={44} height={44} className="size-11 rounded-full object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{r.name}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CurrencyIcon currency="stars" className="size-3.5" />{Number(r.score).toLocaleString()}<span className="ml-2">Level {r.level}</span></p></div>{prizes[i] && <GiftArt gift={prizes[i]} className="size-12" />}</div>)}
    {!demo && rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">The leaderboard is waiting for its first players.</p>}</div>
  </div>;
}
