import starter from "@/assets/box-starter.jpg";
import sweet from "@/assets/box-sweet.jpg";
import classic from "@/assets/box-classic.jpg";
import winter from "@/assets/box-winter.jpg";
import premium from "@/assets/box-premium.jpg";
import party from "@/assets/box-party.jpg";
import magic from "@/assets/box-magic.jpg";
import luxury from "@/assets/box-luxury.jpg";
import legend from "@/assets/box-legend.jpg";
import { GiftArt } from "@/components/GiftArt";

const BOX_IMAGES: Record<string, string> = {
  starter,
  sweet,
  classic,
  winter,
  premium,
  party,
  magic,
  luxury,
  legend,
};

/** Box cover: the box's own penguin character with its best animated gifts floating around. */
export function BoxArt({ caseId, items, className = "", big = false, bare = false }: { caseId?: string; items: any[]; className?: string; big?: boolean; bare?: boolean }) {
  const top = [...items].sort((a, b) => b.value_stars - a.value_stars).slice(0, 3);
  const img = (caseId && BOX_IMAGES[caseId]) || starter;
  const s = big ? "size-24" : "size-14";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={img} alt="" loading="lazy" width={1024} height={1024} className={`absolute inset-0 size-full object-cover ${bare ? "rounded-full p-[14%] [mask-image:radial-gradient(circle,black_55%,transparent_72%)]" : ""}`} />
      {!bare && <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />}
      {top[0] && <GiftArt gift={top[0]} className={`float-a absolute right-[6%] top-[8%] ${s}`} />}
      {!bare && top[1] && <GiftArt gift={top[1]} className={`float-b absolute left-[6%] top-[14%] ${big ? "size-20" : "size-11"}`} />}
      {!bare && top[2] && <GiftArt gift={top[2]} className={`float-a absolute bottom-[10%] left-[10%] ${big ? "size-16" : "size-9"}`} />}
    </div>
  );
}
