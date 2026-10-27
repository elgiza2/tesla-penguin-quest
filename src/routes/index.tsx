import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listCases } from "@/lib/cases.functions";
import { BoxArt, BOX_GLOW } from "@/components/BoxArt";
import mascot from "@/assets/mascot-invite.png";
import { GiftArt } from "@/components/GiftArt";
import { WalletBalance } from "@/components/WalletBalance";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const { data: cases, isLoading, error } = useQuery({ queryKey: ["cases"], queryFn: () => listCases(), staleTime: 60_000 });
  const ribbon = (cases ?? []).flatMap((c: any) => c.items).filter((g: any) => g.kind !== "nft").sort((a: any, b: any) => b.value_stars - a.value_stars).slice(0, 10);
  return (
    <div className="space-y-4 pt-3">
      <div className="flex justify-end"><WalletBalance /></div>

      <Button variant="ghost" onClick={() => toast("Community link coming soon")} className="relative flex h-auto min-h-[92px] w-full items-center justify-start surface overflow-hidden rounded-3xl py-4 pl-5 pr-28 hover:bg-card text-left whitespace-normal">
        <div>
          <p className="text-[17px] font-semibold">Join our community</p>
          <p className="mt-0.5 text-sm font-normal leading-snug text-muted-foreground">Gift drops, news & exclusive rewards</p>
        </div>
        <img src={mascot} alt="" width={816} height={816} className="absolute -right-3 top-1/2 size-32 -translate-y-1/2 object-contain" />
      </Button>

      {ribbon.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {ribbon.map((g: any, i: number) => (
            <div key={g.id + i} className="surface grid size-[60px] shrink-0 place-items-center rounded-2xl"><GiftArt gift={g} className="size-11" /></div>
          ))}
        </div>
      )}

      {isLoading && <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-card" />)}</div>}
      {error && <p className="text-sm text-destructive">Couldn't load boxes.</p>}
      <div className="grid grid-cols-2 gap-3">
        {cases?.map((c: any, i: number) => (
          <Link key={c.id} to="/case/$caseId" params={{ caseId: c.id }}
            style={{ ["--glow" as any]: BOX_GLOW[c.id] ?? (i % 2 ? "var(--box-red)" : "var(--box-blue)") }}
            className="box-card relative aspect-square overflow-hidden rounded-3xl transition active:scale-[0.97]">
            <div className="absolute inset-0 pb-6 pt-7"><BoxArt caseId={c.id} index={i} className="size-full" /></div>
            <div className="absolute left-2.5 top-2.5 flex gap-1">
              <span className="flex items-center gap-1 rounded-full bg-background/75 py-0.5 pl-1 pr-2.5 text-sm font-semibold backdrop-blur">
                <CurrencyIcon currency="stars" className="size-4" />{c.price_stars}
              </span>
              {Number(c.price_gram) > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-background/75 py-0.5 pl-0.5 pr-2.5 text-sm font-semibold backdrop-blur">
                  <CurrencyIcon currency="gram" className="size-4" />{Number(c.price_gram)}
                </span>
              )}
            </div>
            <span className="absolute inset-x-3 bottom-2.5 text-sm font-medium">{c.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
