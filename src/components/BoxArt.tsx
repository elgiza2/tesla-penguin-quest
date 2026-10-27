import starter from "@/assets/new-case-starter.png";
import sweet from "@/assets/new-case-sweet.png";
import classic from "@/assets/new-case-classic.png";
import winter from "@/assets/new-case-winter.png";
import premium from "@/assets/new-case-premium.png";
import party from "@/assets/new-case-party.png";
import magic from "@/assets/new-case-magic.png";
import luxury from "@/assets/new-case-luxury.png";
import legend from "@/assets/new-case-legend.png";

const BOX_IMAGES: Record<string, string> = { starter, sweet, classic, winter, premium, party, magic, luxury, legend };

/** Glow colour that matches each box picture. */
export const BOX_GLOW: Record<string, string> = {
  starter: "var(--success)", sweet: "var(--game-pink)", classic: "var(--primary)",
  winter: "var(--game-sky)", premium: "var(--game-yellow)", party: "var(--game-violet)",
  magic: "var(--rarity-epic)", luxury: "var(--muted-foreground)", legend: "var(--game-coral)",
};

/** Box cover: an open gift box full of gifts, no background. */
export function BoxArt({ caseId, className = "" }: { caseId?: string; items?: any[]; className?: string; big?: boolean; bare?: boolean }) {
  const img = (caseId && BOX_IMAGES[caseId]) || starter;
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <img src={img} alt={`${caseId ?? "starter"} gift case`} loading="lazy" width={816} height={816} className="box-product size-[88%] object-contain" />
    </div>
  );
}
