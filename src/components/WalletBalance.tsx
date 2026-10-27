import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { displayBalances } from "@/lib/presentation-demo";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "./CurrencyIcon";
export function WalletBalance() {
  const { data, demo } = useStore();
  const balances = displayBalances(demo, data?.me as any);
  return <Button variant="ghost" asChild className="wallet-balance h-11 gap-2 rounded-full border border-border bg-card/80 pl-2 pr-2">
    <Link to="/wallet" aria-label="GRAM balance and deposit"><CurrencyIcon currency="gram" className="size-7" /><span className="min-w-12 text-base font-semibold tabular-nums">{balances.gram.toFixed(2)}</span><span className="grid size-7 place-items-center rounded-full bg-muted"><Plus /></span></Link>
  </Button>;
}