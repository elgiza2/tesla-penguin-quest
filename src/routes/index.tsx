import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
import { GiftThumb } from "@/components/GiftArt";
import { useStore } from "@/lib/store";

export const casesQuery = { queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 };

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Gift Boxes" },
      { name: "description", content: "Open gift boxes with Telegram Stars and win Telegram gifts and NFTs." },
      { property: "og:title", content: "Tesla — Gift Boxes" },
      { property: "og:description", content: "Open gift boxes with Telegram Stars and win Telegram gifts and NFTs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cases,
});

function Cases() {
  const { data } = useStore();
  const { data: cases, isLoading, error } = useQuery(casesQuery);
  const balance = Number((data?.me as any)?.stars_balance ?? 0);
  return (
    <div className="space-y-6 pt-2">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Tesla</p>
          <h1 className="text-2xl">Gift Boxes</h1>
        </div>
        <Link to="/inventory" className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-sm">
          <Star className="size-4 fill-primary text-primary" />
          <span className="tabular-nums">{balance}</span>
        </Link>
      </header>
      {isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-card" />)}</div>}
      {error && <p className="text-sm text-destructive">Couldn't load boxes. Pull to refresh.</p>}
      <div className="grid grid-cols-2 gap-3">
        {cases?.map((c) => {
          const top = [...c.items].sort((a: any, b: any) => b.value_stars - a.value_stars).slice(0, 3);
          return (
            <Link key={c.id} to="/case/$caseId" params={{ caseId: c.id }}
              className="group relative flex aspect-[3/4] flex-col overflow-hidden rounded-2xl border border-border bg-card p-3 transition active:scale-[0.98]">
              <div className="relative flex flex-1 items-center justify-center">
                <div className="absolute size-24 rounded-full bg-primary/15 blur-2xl" />
                <GiftThumb gift={top[0]} className="relative size-20 drop-shadow-lg" />
                {top[1] && <GiftThumb gift={top[1]} className="absolute bottom-2 left-1 size-10 -rotate-12 opacity-80" />}
                {top[2] && <GiftThumb gift={top[2]} className="absolute right-1 top-2 size-10 rotate-12 opacity-80" />}
              </div>
              <p className="truncate text-sm">{c.name}</p>
              <div className="mt-2 flex items-center justify-center gap-1 rounded-xl bg-primary py-2 text-sm text-primary-foreground">
                <Star className="size-4 fill-current" />{c.price_stars}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
