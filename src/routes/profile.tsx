import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Star, Plus, UserRound, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { Inventory } from "@/routes/inventory";
import mascot from "@/assets/tesla-mascot.jpg";
import plum from "@/assets/plum.png";
import { Balance } from "@/routes/crash";
import { Vibrate } from "lucide-react";

export const Route = createFileRoute("/profile")({ ssr: false, head: () => ({ meta: [ { title: "Tesla — Profile" }, { name: "description", content: "Your profile, level, referrals and won Telegram gifts." }, { property: "og:title", content: "Tesla Profile" }, { property: "og:description", content: "Your profile, level, referrals and won Telegram gifts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ]}), component: Profile });

function Profile() {
  const { data } = useStore();
  if (!data) return null;
  const me = data.me as any;
  const stars = Number(me.stars_balance ?? 0);
  const level = Number(me.power_level ?? 1) || 1;
  const link = `https://t.me/Noveaibot?start=ref_${me.id}`;
  return <div className="rocket-pattern -mx-5 min-h-dvh space-y-4 px-5">
    <div className="flex items-center justify-between pt-3">
      <div className="flex gap-2.5">
        <button aria-label="Language" className="grid size-10 place-items-center rounded-full bg-muted text-lg">🇺🇸</button>
        <button aria-label="Vibration" className="grid size-10 place-items-center rounded-full bg-muted"><Vibrate className="size-5" /></button>
      </div>
      <Balance value={stars} />
    </div>
    <div className="flex flex-col items-center pt-2 text-center">
      <img src={me.photo_url || mascot} alt="" className="size-[120px] rounded-full object-cover" />
      <h1 className="mt-3 text-[30px] font-bold">{me.username || me.first_name} · {level} level</h1>
      <p className="mt-1 text-lg text-muted-foreground">0 / 10 Stars</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Link to="/" className="flex h-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">Deposit</Link>
      <Link to="/earn" className="flex h-14 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-lg font-bold text-primary">Rewards</Link>
    </div>
    <div className="overflow-hidden rounded-[28px] border border-border bg-card">
      <div className="stars-bg relative overflow-hidden rounded-[28px] p-4">
        <img src={plum} alt="" width={1024} height={1024} className="absolute -right-8 top-1/2 size-40 -translate-y-1/2 object-contain" />
        <div className="relative max-w-[78%]">
          <h2 className="text-[22px] font-bold tracking-[0.18em]">REFERRALS</h2>
          <p className="mt-1 text-[14px] leading-snug">Invite friends and get 10% of your friends' deposits!</p>
          <div className="mt-3 flex gap-1.5 whitespace-nowrap text-[11px]">
            <span className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-1"><Star className="size-3" />Balance: {Number(me.referral_earned ?? 0).toFixed(2)}</span>
            <span className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-1"><UserRound className="size-3" />Referrals: {data.referrals.length}</span>
            <span className="flex items-center gap-1 rounded-full bg-background/70 px-2 py-1"><Info className="size-3" />Terms</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border py-3 text-center text-[17px] text-primary">
        <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, "_blank")}>Invite friends</button>
        <button onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}>Copy link</button>
      </div>
    </div>
    <div className="min-h-56 rounded-[28px] border border-border bg-card/40 p-4"><Inventory /></div>
  </div>;
}
