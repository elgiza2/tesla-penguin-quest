import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getGiftCatalog } from "@/lib/gift-catalog.functions";
import { GiftArt } from "@/components/GiftArt";
import { CurrencyIcon } from "@/components/CurrencyIcon";
export const Route = createFileRoute("/gift-catalog")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Telegram Gift Prices" }, { name: "description", content: "Current regular Telegram gift prices from Telegram, sorted highest to lowest. Collectible market prices are separate." },
  { property: "og:title", content: "Tesla — Telegram Gift Prices" }, { property: "og:description", content: "Verified regular gift prices from Telegram." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Catalog });
function Catalog() {
  const { data, isLoading, error } = useQuery({ queryKey: ["gift-catalog"], queryFn: () => getGiftCatalog(), staleTime: 300_000 });
  return <div className="space-y-4 pt-2"><h1 className="text-xl font-semibold">Telegram gift prices</h1><p className="text-sm text-muted-foreground">Regular gifts · Telegram sale price · highest first</p><p className="text-xs text-muted-foreground">Collectible resale prices are not included.</p>
    {isLoading && <p className="py-8 text-center text-muted-foreground">Checking Telegram…</p>}
    {(error || data?.unavailable) && <p className="py-8 text-sm text-muted-foreground">Telegram prices are currently unavailable. No estimated prices are shown.</p>}
    {data && !data.unavailable && <><p className="text-xs text-muted-foreground">{data.gifts.length} available gifts · checked {new Date(data.checkedAt).toLocaleString()}</p>{data.gifts.map(g => <div key={g.id} className="flex items-center gap-3 border-b border-border py-3"><GiftArt gift={{ name: `Gift ${g.id}`, kind: "regular", telegram_gift_id: g.id }} className="size-14" /><div className="min-w-0 flex-1"><p className="truncate text-sm">Gift #{g.id.slice(-6)}</p>{g.remaining !== null && <p className="text-xs text-muted-foreground">{g.remaining.toLocaleString()} remaining</p>}</div><span className="flex items-center gap-1 font-medium"><CurrencyIcon currency="stars" />{g.stars}</span></div>)}</>}
  </div>;
}