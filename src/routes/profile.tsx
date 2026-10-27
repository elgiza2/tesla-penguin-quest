import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, ArrowUpRight, Gift, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import mascot from "@/assets/tesla-mascot.jpg";
import plum from "@/assets/plum.png";
import { WalletBalance } from "@/components/WalletBalance";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/profile")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Profile" }, { name: "description", content: "Your Telegram gift profile, referrals, deposits and inventory." },
  { property: "og:title", content: "Tesla — Profile" }, { property: "og:description", content: "Your gift inventory and Telegram profile." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Profile });
function Profile() {
  const { data, demo } = useStore();
  if (!data) return null;
  const me = data.me as any, level = Number(me.power_level ?? 1) || 1;
  const link = `https://t.me/Noveaibot?start=ref_${me.id}`;
  return <div className="space-y-6 pt-2">
    <header className="flex items-center justify-between"><h1 className="text-xl font-semibold">Profile</h1><WalletBalance /></header>
    <div className="flex flex-col items-center pt-3 text-center"><img src={me.photo_url || mascot} alt="Profile avatar" width={112} height={112} className="size-28 rounded-full border-4 border-card object-cover" /><h2 className="mt-4 text-2xl font-semibold">{me.username || me.first_name}</h2><p className="mt-1 text-sm text-muted-foreground">Level {level}</p><div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-muted"><div className="h-full w-1/3 bg-primary" /></div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><CurrencyIcon currency="stars" className="size-3.5" />{demo ? "35 / 100" : "0 / 100"}</p></div>
    <div className="grid grid-cols-2 gap-3"><Button asChild className="h-13 rounded-xl"><Link to="/wallet"><Wallet />Deposit</Link></Button><Button asChild variant="outline" className="h-13 rounded-xl"><Link to="/inventory"><Gift />Inventory</Link></Button></div>
    <section className="border-y border-border py-5"><div className="relative min-h-32 pr-28"><img src={plum} alt="" width={1024} height={1024} loading="lazy" className="absolute right-0 top-0 size-28 object-contain" /><p className="text-xs font-medium text-muted-foreground">YOUR CIRCLE</p><h2 className="mt-1 text-xl font-semibold">Invite your friends</h2><p className="mt-2 text-sm text-muted-foreground">{data.referrals.length} friends joined</p></div><div className="mt-3 grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => demo ? toast("Sample invitation — open in Telegram to invite friends") : window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, "_blank")} className="h-11 rounded-xl">Invite<ArrowUpRight /></Button><Button variant="outline" onClick={() => demo ? toast("Sample referral profile") : navigator.clipboard.writeText(link).then(() => toast.success("Link copied")).catch(() => toast.error("Unable to copy"))} className="h-11 rounded-xl"><Copy />Copy link</Button></div></section>
    <Button asChild variant="ghost" className="h-14 w-full justify-between rounded-xl border border-border"><Link to="/earn"><span>Tasks & rewards</span><ArrowUpRight /></Link></Button>
  </div>;
}
