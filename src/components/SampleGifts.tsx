import crystal from "@/assets/crystal.png";
import plum from "@/assets/plum.png";
import { CurrencyIcon } from "./CurrencyIcon";
export const SAMPLE_GIFTS = [{ id: "diamond", name: "Precious diamond", image: crystal, stars: 100 }, { id: "plum", name: "Plush plum", image: plum, stars: 50 }];
export function SampleGifts() {
  return <div className="grid grid-cols-2 gap-3">{SAMPLE_GIFTS.map(g => <div key={g.id} className="rounded-lg border border-border bg-card p-3"><img src={g.image} alt={g.name} width={1024} height={1024} loading="lazy" className="mx-auto size-24 object-contain" /><p className="truncate text-sm">{g.name}</p><p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><CurrencyIcon currency="stars" className="size-4" />{g.stars}<span className="ml-auto text-xs">Sample</span></p></div>)}</div>;
}