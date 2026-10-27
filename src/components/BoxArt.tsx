import penguin from "@/assets/tesla-captain.jpg";
import { GiftArt } from "@/components/GiftArt";

/** Box cover: the Tesla penguin surrounded by the box's best animated gifts. */
export function BoxArt({ items, className = "", big = false }: { items: any[]; className?: string; big?: boolean }) {
  const top = [...items].sort((a, b) => b.value_stars - a.value_stars).slice(0, 3);
  const s = big ? "size-24" : "size-14";
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={penguin} alt="" className="penguin-tint absolute inset-0 size-full object-cover object-[50%_60%] scale-125" />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      {top[0] && <GiftArt gift={top[0]} className={`float-a absolute right-[6%] top-[8%] ${s}`} />}
      {top[1] && <GiftArt gift={top[1]} className={`float-b absolute left-[6%] top-[14%] ${big ? "size-20" : "size-11"}`} />}
      {top[2] && <GiftArt gift={top[2]} className={`float-a absolute bottom-[10%] left-[10%] ${big ? "size-16" : "size-9"}`} />}
    </div>
  );
}
