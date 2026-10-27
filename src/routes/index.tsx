import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
import { BoxArt } from "@/components/BoxArt";
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

function Cases() {
  const { data } = useStore();
  const { data: cases, isLoading, error } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const balance = Number((data?.me as any)?.stars_balance ?? 0);
  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-end">
        <Link to="/inventory" className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-sm">
          <Star className="size-4 fill-primary text-primary" /><span className="tabular-nums">{balance}</span>
        </Link>
      </div>
      {isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-card" />)}</div>}
      {error && <p className="text-sm text-destructive">Couldn't load boxes.</p>}
      <div className="grid grid-cols-2 gap-3">
        {cases?.map((c: any) => (
          <Link key={c.id} to="/case/$caseId" params={{ caseId: c.id }}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition active:scale-[0.98]">
            <BoxArt items={c.items} className="aspect-square w-full" />
            <div className="space-y-2 p-3 pt-1">
              <p className="truncate text-sm">{c.name}</p>
              <div className="flex items-center justify-center gap-1 rounded-xl bg-primary py-2 text-sm text-primary-foreground">
                <Star className="size-4 fill-current" />{c.price_stars}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
