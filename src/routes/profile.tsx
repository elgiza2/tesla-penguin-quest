import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowUpRight, Copy } from "lucide-react";
import { useStore } from "@/lib/store";
import avatarArt from "@/assets/mascot-profile.png";
import depositArt from "@/assets/mascot-deposit.png";
import inventoryArt from "@/assets/mascot-inventory.png";
import inviteArt from "@/assets/mascot-invite.png";
import tasksArt from "@/assets/mascot-tasks.png";
import { WalletBalance } from "@/components/WalletBalance";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/profile")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Profile" }, { name: "description", content: "Your Telegram gift profile, deposits, inventory, invites and tasks." },
  { property: "og:title", content: "Tesla — Profile" }, { property: "og:description", content: "Your gift inventory and Telegram profile." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
]}), component: Profile });

function Tile({ to, title, note, img, tone }: { to: "/wallet" | "/inventory" | "/earn"; title: string; note: string; img: string; tone: string }) {
  return <Link to={to} style={{ ["--tone" as any]: tone }} className="tile-art relative block aspect-[4/5] overflow-hidden rounded-3xl p-4 transition active:scale-[0.98]">
    <p className="text-base font-semibold">{title}</p>
    <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
    <img src={img} alt="" width={816} height={816} loading="lazy" className="absolute -bottom-2 left-1/2 size-[82%] -translate-x-1/2 object-contain" />
  </Link>;
}

function Profile() {
  const { data, demo } = useStore();
  if (!data) return null;
  const me = data.me as any, level = Number(me.power_level ?? 1) || 1;
  const link = `https://t.me/Noveaibot?start=ref_${me.id}`;
  const gifts = Number((data as any).gifts?.length ?? 0);
  const invite = () => demo ? toast("Open Tesla in Telegram to invite friends") : window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, "_blank");
  const copy = () => demo ? toast("Open Tesla in Telegram to copy your link") : navigator.clipboard.writeText(link).then(() => toast.success("Link copied")).catch(() => toast.error("Unable to copy"));
  return <div className="space-y-4 pt-3">
    <div className="flex justify-end"><WalletBalance /></div>
    <section className="flex items-center gap-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-card">
        <img src={me.photo_url || avatarArt} alt="Profile avatar" width={80} height={80} className={`size-full ${me.photo_url ? "object-cover" : "object-contain p-1"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold">{me.username || me.first_name}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Level {level}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="brand-fill h-full w-1/3 rounded-full" /></div>
      </div>
    </section>

    <div className="grid grid-cols-2 gap-3">
      <Tile to="/wallet" title="Deposit" note="GRAM & Stars" img={depositArt} tone="var(--box-blue)" />
      <Tile to="/inventory" title="Inventory" note={gifts ? `${gifts} gifts` : "Your gifts"} img={inventoryArt} tone="var(--box-red)" />
    </div>

    <section className="tile-art relative overflow-hidden rounded-3xl p-5 pr-36" style={{ ["--tone" as any]: "var(--primary)" }}>
      <p className="text-lg font-semibold">Invite friends</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{data.referrals.length} joined · earn from their boxes</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={invite} className="h-11 flex-1 rounded-xl">Invite</Button>
        <Button onClick={copy} variant="secondary" size="icon" aria-label="Copy invite link" className="size-11 rounded-xl"><Copy /></Button>
      </div>
      <img src={inviteArt} alt="" width={816} height={816} loading="lazy" className="absolute -right-4 bottom-0 size-40 object-contain" />
    </section>

    <Link to="/earn" style={{ ["--tone" as any]: "var(--game-mint)" }} className="tile-art relative flex min-h-28 items-center overflow-hidden rounded-3xl p-5 pr-36">
      <div><p className="text-lg font-semibold">Tasks</p><p className="mt-0.5 text-sm text-muted-foreground">Complete tasks, get free boxes</p></div>
      <ArrowUpRight className="absolute right-4 top-4 size-5 text-muted-foreground" />
      <img src={tasksArt} alt="" width={816} height={816} loading="lazy" className="absolute -bottom-6 right-6 size-32 object-contain" />
    </Link>
  </div>;
}
