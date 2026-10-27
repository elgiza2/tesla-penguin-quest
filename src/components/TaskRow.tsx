import { Ticket } from "lucide-react";
import { CoinIcon, GhostButton, TSLA_ICON } from "@/components/ui-kit";
import { fmt } from "@/lib/ton";
import { CurrencyIcon } from "./CurrencyIcon";

/** One task line: image, name, TSLA + ticket reward, and a single Go/Claim pill. */
export function TaskRow({ image, title, reward, tickets = 2, label = "Go", disabled, onClick }: {
  image?: string | null; title: string; reward: number; tickets?: number; label?: string; disabled?: boolean; onClick: () => void;
}) {
  return (
    <GhostButton onClick={onClick} disabled={disabled} className="flex h-auto w-full items-center gap-3 p-3 text-start">
      <img src={image || TSLA_ICON} alt="" loading="lazy" className="size-12 shrink-0 rounded-2xl object-cover" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground" dir="ltr">
          <span className="flex items-center gap-1"><CurrencyIcon currency="stars" className="size-3.5" />+{fmt(reward)}</span>
          {tickets > 0 && <span className="flex items-center gap-1"><Ticket className="size-3.5" />+{tickets}</span>}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">{label}</span>
    </GhostButton>
  );
}
