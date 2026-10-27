import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { displayBalances } from "@/lib/presentation-demo";
import { CurrencyIcon } from "./CurrencyIcon";

/** Glass GRAM balance pill with a gradient deposit button. */
export function WalletBalance() {
  const { data, demo } = useStore();
  const balances = displayBalances(demo, data?.me as any);
  return <Link to="/wallet" aria-label="GRAM balance and deposit" className="glass inline-flex h-11 items-center gap-2 rounded-full py-1 pl-1.5 pr-1 transition-transform active:scale-[0.97]">
    <CurrencyIcon currency="gram" className="size-8" />
    <span className="min-w-10 text-[15px] font-semibold tabular-nums">{balances.gram.toFixed(2)}</span>
    <span className="brand-fill grid size-8 place-items-center rounded-full"><Plus className="size-4" strokeWidth={2.6} /></span>
  </Link>;
}
