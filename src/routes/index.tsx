import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star, Plus, Megaphone, Users } from "lucide-react";
import { listCases } from "@/lib/cases.functions";
import { BoxArt, BOX_GLOW } from "@/components/BoxArt";
import crystal from "@/assets/crystal.png";
import { GiftArt } from "@/components/GiftArt";
import { useStore } from "@/lib/store";
import { Balance } from "./crash";

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
  const ribbon = (cases ?? []).flatMap((c: any) => c.items).filter((g: any) => g.kind !== "nft").sort((a: any, b: any) => b.value_stars - a.value_stars).slice(0, 10);
  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center justify-between">
        <Link to="/earn" className="flex items-center gap-1.5 rounded-full bg-success/20 px-4 py-2 text-base font-semibold text-success">
          <Users className="size-4 fill-current" />{refs}
        </Link>
        <Balance value={balance} />
      </div>

      <Link to="/earn" className="relative flex min-h-[88px] items-center overflow-hidden rounded-[28px] bg-card py-3.5 pl-5 pr-28">
        <div>
          <p className="flex items-center gap-2 text-[17px] font-bold"><Megaphone className="size-4 text-muted-foreground" />Join our channel</p>
          <p className="text-[14px] font-normal leading-snug text-foreground/80">News, gift drops and promo codes for free boxes in our channel</p>
        </div>
        <img src={crystal} alt="" width={1024} height={1024} className="absolute -right-4 top-1/2 size-32 -translate-y-1/2 object-contain" />
      </Link>

      {ribbon.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <div className="flex h-[60px] w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-[20px] bg-card">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="text-[10px] font-bold text-success [writing-mode:vertical-rl] rotate-180">Live</span>
          </div>
          {ribbon.map((g: any, i: number) => (
            <div key={g.id + i} className="grid size-[60px] shrink-0 place-items-center rounded-[20px] bg-card"><GiftArt gift={g} className="size-11" /></div>
          ))}
        </div>
      )}

      <div className="flex gap-4 pt-1 text-[28px] font-bold">
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
                style={{ ["--glow" as any]: BOX_GLOW[c.id] ?? GLOWS[i % GLOWS.length] }}
                className="box-card relative aspect-square overflow-hidden rounded-[30px] transition active:scale-[0.97]">
                <div className="absolute inset-0 pt-6"><BoxArt caseId={c.id} className="size-full" /></div>
                <div className="absolute left-2.5 top-2.5 flex gap-1">
                  {c.price_gram != null && (
                    <span className="flex items-center gap-1 rounded-full bg-background/60 py-0.5 pl-0.5 pr-2.5 text-[15px] font-medium backdrop-blur">
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-black text-primary-foreground">G</span>{Number(c.price_gram)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 rounded-full bg-background/60 py-0.5 pl-1 pr-2.5 text-[15px] font-medium backdrop-blur">
                    <Star className="size-5 fill-[oklch(0.85_0.17_85)] text-[oklch(0.85_0.17_85)]" />{c.price_stars}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
