import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, UserRound } from "lucide-react";
import banner from "@/assets/season-banner.jpg";
import mascot from "@/assets/tesla-mascot.jpg";
import { seasonLeaderboard, listCases } from "@/lib/cases.functions";
import { GiftArt } from "@/components/GiftArt";

export const Route = createFileRoute("/events")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Season" },
      { name: "description", content: "Season leaderboard: top Tesla players win Telegram gifts." },
      { property: "og:title", content: "Tesla — Season" },
      { property: "og:description", content: "Season leaderboard: top Tesla players win Telegram gifts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Season,
});

const MEDALS = ["🥇", "🥈", "🥉"];

function Season() {
  const { data: rows, isLoading } = useQuery({ queryKey: ["season"], queryFn: () => seasonLeaderboard(), staleTime: 30_000 });
  const { data: cases } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const prizes = (cases ?? []).flatMap((c: any) => c.items).sort((a: any, b: any) => b.value_stars - a.value_stars);
  return (
    <div className="space-y-4 pt-3">
      <div className="relative overflow-hidden rounded-[32px]">
        <img src={banner} alt="Season trophy" width={1280} height={720} className="aspect-[16/10] w-full object-cover" />
        <span className="absolute right-5 top-4 font-mono text-xl font-bold text-primary-foreground drop-shadow">completed</span>
      </div>
      <div className="pattern-btn grid h-14 w-full place-items-center rounded-full text-lg font-bold">Waiting for restart</div>

      <div className="rounded-[28px] bg-card px-4 py-2">
        {isLoading && [0, 1, 2].map((i) => <div key={i} className="my-3 h-16 animate-pulse rounded-2xl bg-muted" />)}
        {rows?.length === 0 && <p className="py-12 text-center text-muted-foreground">No players yet</p>}
        {rows?.map((r: any, i: number) => (
          <div key={r.id} className="flex items-center gap-3 border-b border-border py-4 last:border-0">
            <span className="w-9 shrink-0 text-center text-2xl text-muted-foreground">{MEDALS[i] ?? `#${i + 1}`}</span>
            <img src={r.photo || mascot} alt="" className="size-11 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate">{r.name}</p>
              <p className="flex items-center gap-1.5 text-sm">
                <Star className="size-3.5 fill-primary text-primary" />{r.score}
                <span className="text-muted-foreground">|</span>
                <UserRound className="size-3.5 text-primary" />{r.level} level
              </p>
            </div>
            {prizes[i] && <GiftArt gift={prizes[i]} className="size-12 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
