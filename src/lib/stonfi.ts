import "./buffer-polyfill";
import { Client, dexFactory } from "@ston-fi/sdk";
import { toNano } from "@ton/core";
import { TSLA_JETTON } from "./config";

const PTON = "EQBnGWMCf3-FZZq1W4IWcWiGAc3PHuZ0_H-7sad2oY00o83S";
const TON = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
const SLIPPAGE = "0.05";

/** Quote a real GRAM→TSLA swap on the STON.fi pool. */
export async function quoteBuy(gram: number) {
  const q = new URLSearchParams({ offer_address: TON, ask_address: TSLA_JETTON, units: toNano(gram.toFixed(9)).toString(), slippage_tolerance: SLIPPAGE });
  const r = await fetch(`https://api.ston.fi/v1/swap/simulate?${q}`, { method: "POST" });
  if (!r.ok) throw new Error("Quote unavailable");
  const j = await r.json() as any;
  return { out: Number(j.ask_units) / 1e9, minOut: String(j.min_ask_units), impact: Number(j.price_impact ?? 0), router: j.router_address as string, info: j.router as any };
}

/** Build the TON Connect message for an on-chain swap; it moves the pool price. */
export async function buyTx(wallet: string, gram: number) {
  const q = await quoteBuy(gram);
  const info = q.info ?? (await fetch(`https://api.ston.fi/v1/routers/${q.router}`).then(r => r.json() as Promise<any>)).router;
  const { Router, pTON } = dexFactory({ majorVersion: info.major_version, minorVersion: info.minor_version, routerType: info.router_type } as any);
  const client = new Client({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });
  const router = client.open((Router as any).create(info.address ?? q.router));
  const proxyTon = (pTON as any).create(info.pton_master_address ?? PTON);
  const tx = await (router as any).getSwapTonToJettonTxParams({
    userWalletAddress: wallet, proxyTon, offerAmount: toNano(gram.toFixed(9)), askJettonAddress: TSLA_JETTON, minAskAmount: q.minOut,
  });
  return { quote: q, message: { address: tx.to.toString(), amount: tx.value.toString(), payload: tx.body?.toBoc().toString("base64") } };
}
