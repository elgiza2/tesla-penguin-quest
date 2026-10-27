import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { displayBalances } from "@/lib/presentation-demo";
import { Button } from "@/components/ui/button";
import { CurrencyIcon } from "./CurrencyIcon";
export function WalletBalance() {
  const { data, demo } = useStore();
  const balances = displayBalances(demo, data?.me as any);
  return <Button variant="ghost" asChild className="wallet-balance h-11 gap-2.5 rounded-full border border-border bg-background/80 pl-2.5 pr-3 backdrop-blur-xl">
    <Link to="/wallet" aria-label="GRAM balance and deposit"><CurrencyIcon currency="gram" className="size-6" /><span className="min-w-12 text-base font-semibold tabular-nums">{balances.gram.toFixed(2)}</span><span className="ml-1 border-l border-border pl-2 text-primary"><Plus className="size-4" /></span></Link>
  </Button>;
}