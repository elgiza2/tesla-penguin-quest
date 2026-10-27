import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getGiftCatalog } from "@/lib/gift-catalog.functions";
import { GiftArt } from "@/components/GiftArt";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import market from "@/lib/nft-market-snapshot.json";
export const Route = createFileRoute("/gift-catalog")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Telegram Gifts & NFT Prices" }, { name: "description", content: "Telegram regular gift prices and dated Getgems collectible listing prices, sorted highest first." },
  { property: "og:title", content: "Tesla — Telegram Gift Prices" }, { property: "og:description", content: "Verified regular gift prices from Telegram." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Catalog });
function Catalog() {
  const [tab, setTab] = useState<"nft" | "regular">("nft");
  const { data, isLoading, error } = useQuery({ queryKey: ["gift-catalog"], queryFn: () => getGiftCatalog(), staleTime: 300_000 });
  return <div className="space-y-4 pt-2"><h1 className="text-xl font-semibold">Gifts & NFT prices</h1><div className="flex gap-2"><Button variant={tab === "nft" ? "default" : "secondary"} onClick={() => setTab("nft")}>NFT collectibles</Button><Button variant={tab === "regular" ? "default" : "secondary"} onClick={() => setTab("regular")}>Regular gifts</Button></div>
  {tab === "nft" ? <><p className="text-sm text-muted-foreground">Getgems · asking prices · highest first</p><p className="text-xs text-muted-foreground">10 listings observed {new Date(market.checkedAt).toLocaleString()}. A partial snapshot, not all collections or collection floors. Prices can change; sales and purchase costs are not guaranteed.</p>{market.listings.map(g => <div key={g.url} className="flex items-center gap-3 border-b border-border py-3"><img src={g.image} alt={g.name} className="size-16 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="text-sm">{g.name}</p><Button variant="link" asChild className="h-auto px-0 py-1 text-xs"><a href={g.url} target="_blank" rel="noreferrer">View listing ↗</a></Button></div><span className="flex items-center gap-1 font-medium"><CurrencyIcon currency="gram" />{g.price}</span></div>)}<Button variant="outline" asChild className="w-full"><a href={market.source} target="_blank" rel="noreferrer">All Getgems collections ↗</a></Button></> : <><p className="text-sm text-muted-foreground">Regular gifts · Telegram sale price · highest first</p>
    {isLoading && <p className="py-8 text-center text-muted-foreground">Checking Telegram…</p>}
    {(error || data?.unavailable) && <p className="py-8 text-sm text-muted-foreground">Telegram prices are currently unavailable. No estimated prices are shown.</p>}
    {data && !data.unavailable && <><p className="text-xs text-muted-foreground">{data.gifts.length} available gifts · checked {new Date(data.checkedAt).toLocaleString()}</p>{data.gifts.map(g => <div key={g.id} className="flex items-center gap-3 border-b border-border py-3"><GiftArt gift={{ name: `Gift ${g.id}`, kind: "regular", telegram_gift_id: g.id }} className="size-14" /><div className="min-w-0 flex-1"><p className="truncate text-sm">Gift #{g.id.slice(-6)}</p>{g.remaining !== null && <p className="text-xs text-muted-foreground">{g.remaining.toLocaleString()} remaining</p>}</div><span className="flex items-center gap-1 font-medium"><CurrencyIcon currency="stars" />{g.stars}</span></div>)}</>}
  </>}</div>;
}