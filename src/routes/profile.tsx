import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Star, Plus, UserRound, Info } from "lucide-react";
import { useStore } from "@/lib/store";
import { Inventory } from "@/routes/inventory";
import mascot from "@/assets/tesla-mascot.jpg";
import crew from "@/assets/referral-crew.jpg";

export const Route = createFileRoute("/profile")({ ssr: false, head: () => ({ meta: [ { title: "Tesla — Profile" }, { name: "description", content: "Your profile, level, referrals and won Telegram gifts." }, { property: "og:title", content: "Tesla Profile" }, { property: "og:description", content: "Your profile, level, referrals and won Telegram gifts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ]}), component: Profile });

function Profile() {
  const { data } = useStore();
  if (!data) return null;
  const me = data.me as any;
  const stars = Number(me.stars_balance ?? 0);
  const level = Number(me.power_level ?? 1) || 1;
  const link = `https://t.me/Noveaibot?start=ref_${me.id}`;
  return <div className="space-y-4">
    <div className="flex justify-end">
      <Link to="/" className="flex items-center gap-2 rounded-full bg-card py-1.5 pl-2 pr-1.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary"><Star className="size-4 fill-current text-primary-foreground" /></span>
        <span className="text-lg tabular-nums">{stars.toFixed(2)}</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-muted"><Plus className="size-4" /></span>
      </Link>
    </div>
    <div className="flex flex-col items-center pt-2 text-center">
      <img src={me.photo_url || mascot} alt="" className="size-32 rounded-full object-cover" />
      <h1 className="mt-4 text-3xl">{me.username || me.first_name} · {level} level</h1>
      <p className="mt-2 text-lg font-medium text-muted-foreground">0 / 10 Stars</p>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Link to="/" className="flex h-14 items-center justify-center rounded-full bg-primary text-lg text-primary-foreground">Deposit</Link>
      <Link to="/earn" className="flex h-14 items-center justify-center rounded-full border-2 border-primary bg-accent text-lg text-primary">Rewards</Link>
    </div>
    <div className="overflow-hidden rounded-3xl bg-card">
      <div className="relative overflow-hidden rounded-3xl bg-muted p-4">
        <img src={crew} alt="" className="absolute inset-y-0 right-0 h-full w-1/3 object-cover opacity-80" />
        <div className="relative max-w-[70%]">
          <h2 className="text-2xl tracking-widest">REFERRALS</h2>
          <p className="mt-1 text-sm font-medium">Invite friends and get 10% of your friends' deposits!</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1"><Star className="size-3" />Balance: {Number(me.referral_earned ?? 0).toFixed(2)}</span>
            <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1"><UserRound className="size-3" />Referrals: {data.referrals.length}</span>
            <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1"><Info className="size-3" />Terms</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-border py-3 text-center text-primary">
        <button onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, "_blank")}>Invite friends</button>
        <button onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copied"))}>Copy link</button>
      </div>
    </div>
    <div className="min-h-48 rounded-3xl border border-border p-4"><Inventory /></div>
  </div>;
}
