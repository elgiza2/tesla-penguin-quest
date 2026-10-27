import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { SWAP_URL } from "@/lib/config";
import { openLink } from "@/lib/telegram";
import { fmt } from "@/lib/ton";
import { CoinIcon, TSLA_ICON } from "@/components/ui-kit";
import mascot from "@/assets/tesla-mascot.jpg";

export const Route = createFileRoute("/profile")({ ssr: false, head: () => ({ meta: [ { title: "Tesla — Your profile" }, { name: "description", content: "Your Telegram profile, TSLA holdings, Premium and project information." }, { property: "og:title", content: "Tesla Profile" }, { property: "og:description", content: "Your Telegram profile, TSLA holdings, Premium and project information." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" } ]}), component: Profile });

const row = "flex h-14 w-full items-center justify-between px-4 text-start font-bold";

function Profile() {
  const { data, x, t } = useStore();
  if (!data) return null;
  const me = data.me;
  const groups = [
    [{ to: "/guide", label: x("guide") }, { to: "/premium", label: x("premium") }],
    [{ to: "/about", label: x("about") }, { to: "/whitepaper", label: x("whitepaper") }, { to: "/roadmap", label: x("roadmap") }, { to: "/supporter", label: x("supporter") }],
  ] as const;
  return <div className="space-y-5">
    <div className="rounded-3xl bg-primary p-5 text-primary-foreground">
      <div className="flex items-center gap-4">
        <img src={me.photo_url || mascot} alt="" className="size-16 rounded-full object-cover ring-2 ring-primary-foreground/40" />
        <div className="min-w-0"><h2 className="truncate text-xl font-bold">{me.first_name || me.username}</h2><div className="mt-0.5 text-sm font-bold opacity-80" dir="ltr">{me.username ? `@${me.username}` : ""}</div></div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-primary-foreground/15 py-3"><div className="flex items-center justify-center gap-1 text-base font-bold tabular-nums" dir="ltr"><CoinIcon src={TSLA_ICON} className="size-4" />{fmt(Number(me.balance), 2)}</div><div className="mt-1 text-xs opacity-80">TSLA</div></div>
        <div className="rounded-2xl bg-primary-foreground/15 py-3"><div className="text-base font-bold tabular-nums">{me.power_level ?? 0}</div><div className="mt-1 text-xs opacity-80">{t("level")}</div></div>
        <div className="rounded-2xl bg-primary-foreground/15 py-3"><div className="text-base font-bold tabular-nums">{data.referrals.length}</div><div className="mt-1 text-xs opacity-80">{t("friends")}</div></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <Link to="/" className="rounded-2xl bg-card p-4 font-bold">NFT<div className="mt-1 text-xs font-normal text-muted-foreground">Tesla</div></Link>
      <button onClick={() => openLink(SWAP_URL)} className="rounded-2xl bg-card p-4 text-start font-bold">STON.fi<div className="mt-1 text-xs font-normal text-muted-foreground">{x("buy")}</div></button>
    </div>
    {groups.map((g, gi) => <div key={gi} className="overflow-hidden rounded-2xl bg-card">
      {g.map((p, i) => <Link key={p.to} to={p.to} className={`${row} ${i ? "border-t border-muted" : ""}`}>{p.label}<ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" /></Link>)}
    </div>)}
  </div>;
}
