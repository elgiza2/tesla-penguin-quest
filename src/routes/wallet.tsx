import "@/lib/buffer-polyfill";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { toNano, Address } from "@ton/core";
import banner from "@/assets/wallet-crew.jpg";
import { WithdrawalAds } from "@/components/WithdrawalAds";
const sameAddr = (a?: string | null, b?: string | null) => { if (!a || !b) return false; try { return Address.parse(a).equals(Address.parse(b)); } catch { return a === b; } };
import { useStore } from "@/lib/store";
import { getMarket, walletBalances, setWallet, requestWithdraw, checkWithdrawal, walletChallenge, proveWallet } from "@/lib/api.functions";
import { MIN_WITHDRAW, RECEIVE_WALLET, WITHDRAW_FEE_TSLA, REQUIRED_AD_VIEWS, withdrawalDebit } from "@/lib/config";
import { commentPayload, fmt, tslaTransferMessage } from "@/lib/ton";
import { CoinIcon, GhostButton, GRAM_ICON, TSLA_ICON, PrimaryButton } from "@/components/ui-kit";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
export const Route = createFileRoute("/wallet")({ ssr: false, head: () => ({ meta: [
 { title: "Tesla — Wallet" }, { name: "description", content: "Your TSLA balance, TON wallet, deposits and withdrawals." }, { property: "og:title", content: "Tesla Wallet" }, { property: "og:description", content: "Your TSLA balance, TON wallet, deposits and withdrawals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
]}), component: WalletPage });
function WalletPage() {
 const { data, t, x, initData, demo, patchMe, refresh } = useStore();
 const address = useTonAddress(), wallet = useTonWallet(), [tc] = useTonConnectUI();
 const [market, setMarket] = useState<Awaited<ReturnType<typeof getMarket>> | null>(null), [chain, setChain] = useState<{tsla: number; gram: number} | null>(null);
 const [mode, setMode] = useState<"deposit" | "withdraw" | null>(null), [coin, setCoin] = useState<"GRAM" | "TSLA">("TSLA"), [amount, setAmount] = useState(""), [busy, setBusy] = useState(false);
 const [adCount, setAdCount] = useState<number | null>(null);
 const triedProof = useRef<string | null>(null);
 useEffect(() => { if (!demo) getMarket({ data: { initData } }).then(setMarket).catch(() => {}); }, [demo, initData]);
 useEffect(() => {
   setChain(null);
   if (!address || demo) return;
   let active = true;
   const loadBalances = () => walletBalances({ data: { initData, address } }).then(c => { if (active) setChain(c); }).catch(() => {});
   void loadBalances();
   const interval = window.setInterval(loadBalances, 30000);
   window.addEventListener("focus", loadBalances);
   const proof = wallet?.connectItems?.tonProof;
   if (proof && "proof" in proof && triedProof.current !== proof.proof.signature) {
     triedProof.current = proof.proof.signature;
     proveWallet({ data: { initData, address, proof: proof.proof } }).then(r => { if (active) { patchMe(r); void refresh(); } }).catch((e: any) => toast.error(e.message));
   } else if (!proof && !sameAddr(address, data?.me.wallet_address)) {
     setWallet({ data: { initData, address } }).then(() => { if (active) patchMe({ wallet_address: address, wallet_verified: false }); }).catch(() => {});
   }
   return () => { active = false; window.clearInterval(interval); window.removeEventListener("focus", loadBalances); };
 }, [address, demo, initData, wallet?.connectItems?.tonProof]);
 if (!data) return null;
 const me = data.me;
 async function connect() {
   if (demo) { toast(t("openInTelegram")); return; }
   try { if (tc.connected) await tc.disconnect(); const { nonce } = await walletChallenge({ data: { initData } }); tc.setConnectRequestParameters({ state: "ready", value: { tonProof: nonce } }); await tc.openModal(); } catch (e: any) { toast.error(e.message); }
 }
 async function submit() {
   if (demo) { toast(t("openInTelegram")); return; }
   const n = Number(amount);
   if (!Number.isFinite(n) || n <= 0) return;
   if (!address) { await connect(); return; }
   if (mode === "withdraw" && (n < MIN_WITHDRAW || withdrawalDebit(n) > Number(me.balance))) { toast.error(n < MIN_WITHDRAW ? `${t("minWithdraw")}: ${MIN_WITHDRAW} TSLA` : t("insufficient")); return; }
   setBusy(true);
   try {
     if (mode === "deposit") {
       const msg = coin === "GRAM" ? { address: RECEIVE_WALLET, amount: toNano(amount).toString(), payload: commentPayload(`dep:${me.id}`) } : await tslaTransferMessage(address, RECEIVE_WALLET, n, `dep:${me.id}`);
       await tc.sendTransaction({ validUntil: Math.floor(Date.now() / 1000) + 600, messages: [msg] }); toast(t("pending"));
     } else {
       if (!me.wallet_verified || !sameAddr(address, me.wallet_address)) { await connect(); return; }
       await checkWithdrawal({ data: { initData, amount: n } });
       toast(t("pending")); const result = await requestWithdraw({ data: { initData, amount: n } }); patchMe({ balance: result.balance }); await refresh(); walletBalances({ data: { initData, address } }).then(setChain).catch(() => {}); toast(t("pending"));
     }
     setAmount(""); setMode(null);
   } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
 }
 const linked = !!address;
 const usd = market?.tsla.priceUsd ? Number(me.balance) * market.tsla.priceUsd : null;
 const assets = [{ s: "TSLA", name: market?.tsla.name || "Tesla", icon: TSLA_ICON, price: market?.tsla.priceUsd, balance: Number(me.balance) }];
 return <div className="space-y-5">
     <div className="relative overflow-hidden rounded-3xl bg-card text-wallet-art-foreground">
     <img src={banner} alt="" width={1376} height={768} className="absolute inset-0 h-full w-full object-cover object-right" />
     <div className="relative flex min-h-52 max-w-[52%] flex-col justify-center p-5" dir="ltr">
       <div className="text-xs font-bold opacity-90">{t("balance")}</div>
       <div className="mt-2 flex items-center gap-2"><CoinIcon src={TSLA_ICON} className="size-7 ring-2 ring-border" /><span className="text-2xl font-bold tabular-nums">{fmt(Number(me.balance), 2)}</span></div>
       <div className="mt-1 text-sm font-bold opacity-90">TSLA{usd !== null ? ` · $${fmt(usd, 2)}` : ""}</div>
     </div>
   </div>
   {!linked ? <PrimaryButton onClick={connect}>{t("connectWallet")}</PrimaryButton> : <div className="grid grid-cols-2 gap-3"><PrimaryButton className="h-12" onClick={() => { setCoin("TSLA"); setAdCount(null); setMode("withdraw"); }}>{t("withdraw")}</PrimaryButton><GhostButton className="h-12 font-bold" onClick={() => setMode("deposit")}>{t("deposit")}</GhostButton></div>}
   <div>
     <h2 className="mb-2 px-1 text-xs font-bold text-muted-foreground">App balance</h2>
     <div className="overflow-hidden rounded-2xl bg-card">{assets.map((c, i) => <div key={c.s} className={`flex items-center gap-3 px-4 py-3.5 ${i ? "border-t border-muted" : ""}`}><CoinIcon src={c.icon} className="size-10" /><div className="min-w-0 flex-1"><div className="font-bold">{c.name}</div><div className="mt-0.5 text-xs text-muted-foreground" dir="ltr">{c.price ? `$${fmt(c.price, c.price < 0.01 ? 10 : 4)}` : "—"}</div></div><div className="text-end" dir="ltr"><div className="font-bold tabular-nums">{c.balance === undefined ? "—" : fmt(c.balance, 4)}</div><div className="mt-0.5 text-xs text-muted-foreground">{c.s}</div></div></div>)}</div>
   </div>
   {data.withdrawals.length > 0 && <div><h2 className="mb-2 px-1 text-xs font-bold text-muted-foreground">{t("withdrawals")}</h2><div className="overflow-hidden rounded-2xl bg-card">{data.withdrawals.map((w: any, i: number) => <div key={w.id} className={`flex justify-between px-4 py-3 text-sm ${i ? "border-t border-muted" : ""}`}><span className="font-bold" dir="ltr">{fmt(w.amount)} TSLA</span><span className={w.status === "sent" ? "font-bold text-primary" : "text-muted-foreground"}>{w.status === "sent" ? t("sent") : t("pending")}</span></div>)}</div></div>}
   <Dialog open={mode !== null} onOpenChange={open => { if (!open && !busy) setMode(null); }}><DialogContent><DialogTitle>{mode === "deposit" ? t("deposit") : t("withdraw")}</DialogTitle><DialogDescription>{mode === "withdraw" ? `${t("minWithdraw")}: ${MIN_WITHDRAW} TSLA · ${t("fee")}: ${WITHDRAW_FEE_TSLA} TSLA` : t("amount")}</DialogDescription>{mode === "withdraw" && <div className="space-y-3"><p className="text-sm text-muted-foreground">Connect and verify your wallet. The amount and 1 TSLA fee are deducted from your app balance. Complete 5 confirmed ad views for each withdrawal. Clicking an ad is not required.</p><WithdrawalAds onProgress={setAdCount} /></div>}{mode === "deposit" && <div className="grid grid-cols-2 gap-2">{(["TSLA", "GRAM"] as const).map(c => <GhostButton key={c} onClick={() => setCoin(c)} className={coin === c ? "ring-2 ring-primary" : ""}>{c}</GhostButton>)}</div>}<input aria-label={t("amount")} inputMode="decimal" placeholder={`0.00 ${mode === "withdraw" ? "TSLA" : coin}`} value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} className="h-16 w-full rounded-xl bg-muted px-4 text-2xl outline-none" /><PrimaryButton onClick={submit} disabled={busy || !(Number(amount) > 0) || (mode === "withdraw" && (adCount === null || adCount < REQUIRED_AD_VIEWS))}>{busy ? t("pending") : mode === "deposit" ? t("deposit") : t("withdraw")}</PrimaryButton></DialogContent></Dialog>
 </div>;
}
