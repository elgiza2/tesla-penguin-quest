import cobalt from "@/assets/case-cobalt.png";
import ruby from "@/assets/case-ruby.png";
import sapphire from "@/assets/case-sapphire.png";
import crimson from "@/assets/case-crimson.png";
import ice from "@/assets/case-ice.png";
import scarlet from "@/assets/case-scarlet.png";
import midnight from "@/assets/case-midnight.png";
import legendArt from "@/assets/case-legend-mascot.png";

const BOX_IMAGES: Record<string, string> = {
  starter: ice, sweet: scarlet, classic: cobalt, winter: sapphire, premium: crimson,
  party: ruby, magic: midnight, luxury: crimson, legend: legendArt,
};

/** Blue / red glow that matches each box picture. */
export const BOX_GLOW: Record<string, string> = {
  starter: "var(--box-blue)", sweet: "var(--box-red)", classic: "var(--box-blue)", winter: "var(--box-blue)",
  premium: "var(--box-red)", party: "var(--box-red)", magic: "var(--box-blue)", luxury: "var(--box-red)", legend: "var(--box-red)",
};
const FALLBACK = [ice, scarlet, cobalt, crimson, sapphire, ruby, midnight];

/** Box cover: an open gift box, no background. */
export function BoxArt({ caseId, index = 0, className = "" }: { caseId?: string; index?: number; className?: string }) {
  const img = (caseId && BOX_IMAGES[caseId]) || FALLBACK[index % FALLBACK.length];
  return (
    <div className={`relative grid place-items-center ${className}`}>
      <img src={img} alt={`${caseId ?? "gift"} case`} loading="lazy" width={816} height={816} className="box-product size-[88%] object-contain" />
    </div>
  );
}
