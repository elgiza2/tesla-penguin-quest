import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import art from "@/assets/mascot-season.png";
import { seasonLeaderboard } from "@/lib/cases.functions";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { WalletBalance } from "@/components/WalletBalance";
import { CURRENT_SEASON, DEMO_PLAYERS } from "@/lib/presentation-demo";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/events")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Season 1" }, { name: "description", content: "Season 1 is live. Climb the leaderboard by opening boxes." },
  { property: "og:title", content: "Tesla — Season 1" }, { property: "og:description", content: "The first Tesla gift season is live." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Season });

function Season() {
  const { demo } = useStore();
  const { data: liveRows } = useQuery({ queryKey: ["season"], queryFn: () => seasonLeaderboard(), staleTime: 30_000, enabled: !demo });
  const rows: any[] = demo ? DEMO_PLAYERS : liveRows ?? [];
  return <div className="space-y-6 pt-3">
    <div className="flex justify-end"><WalletBalance /></div>
    <section className="tile-art relative overflow-hidden rounded-3xl p-5 pr-40" style={{ ["--tone" as any]: "var(--primary)" }}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success"><span className="size-1.5 animate-pulse rounded-full bg-success" />Live</span>
      <h1 className="mt-3 text-3xl font-semibold">Season {CURRENT_SEASON.number}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Open boxes, climb the board.</p>
      <img src={art} alt="Mascot holding the season trophy" width={816} height={816} className="absolute -bottom-3 -right-2 size-44 object-contain" />
    </section>
    <section className="surface rounded-3xl px-4 py-2">
      <h2 className="px-1 pb-1 pt-2 text-sm font-medium text-muted-foreground">Leaderboard</h2>
      {rows.map((r, i) => <div key={r.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
        <span className={`w-5 text-center text-sm font-semibold ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>{i + 1}</span>
        {r.photo ? <img src={r.photo} alt="" width={40} height={40} className="size-10 rounded-full object-cover" /> : <span className={`grid size-10 place-items-center rounded-full text-sm font-semibold ${i < 3 ? "brand-fill" : "bg-muted"}`}>{String(r.name)[0]}</span>}
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{r.name}</p>
        <span className="flex items-center gap-1 text-sm tabular-nums"><CurrencyIcon currency="stars" className="size-4" />{Number(r.score).toLocaleString()}</span>
      </div>)}
      {!demo && rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Be the first on the board.</p>}
    </section>
  </div>;
}
