import starter from "@/assets/case-starter.png";
import sweet from "@/assets/case-sweet.png";
import classic from "@/assets/case-classic.png";
import winter from "@/assets/case-winter.png";
import premium from "@/assets/case-premium.png";
import party from "@/assets/case-party.png";
import magic from "@/assets/case-magic.png";
import luxury from "@/assets/case-luxury.png";
import legend from "@/assets/case-legend.png";

const BOX_IMAGES: Record<string, string> = { starter, sweet, classic, winter, premium, party, magic, luxury, legend };

/** Glow colour that matches each box picture. */
export const BOX_GLOW: Record<string, string> = {
  starter: "oklch(0.62 0.2 145)", sweet: "oklch(0.85 0.18 95)", classic: "oklch(0.6 0.18 245)",
  winter: "oklch(0.68 0.22 140)", premium: "oklch(0.66 0.2 45)", party: "oklch(0.62 0.24 350)",
  magic: "oklch(0.55 0.22 300)", luxury: "oklch(0.78 0.14 85)", legend: "oklch(0.6 0.23 30)",
};

/** Box cover: an open gift box full of gifts, no background. */
export function BoxArt({ caseId, className = "" }: { caseId?: string; items?: any[]; className?: string; big?: boolean; bare?: boolean }) {
  const img = (caseId && BOX_IMAGES[caseId]) || starter;
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <img src={img} alt="" loading="lazy" width={1024} height={1024} className="size-[78%] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]" />
    </div>
  );
}
