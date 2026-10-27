import "./buffer-polyfill";
import { Address, beginCell, toNano } from "@ton/core";
import { TSLA_JETTON } from "./config";

const toB64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));

export function commentPayload(text: string) {
  return toB64(beginCell().storeUint(0, 32).storeStringTail(text).endCell().toBoc());
}

/** Build a TON Connect message that transfers TSLA from the user's jetton wallet. */
export async function tslaTransferMessage(owner: string, to: string, amount: number, comment: string) {
  const r = await fetch(
    `https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(owner)}&jetton_address=${TSLA_JETTON}&limit=1`,
  );
  const j = await r.json();
  const jw = j.jetton_wallets?.[0]?.address;
  if (!jw) throw new Error("No TSLA in this wallet");
  const fwd = beginCell().storeUint(0, 32).storeStringTail(comment).endCell();
  const body = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(Date.now(), 64)
    .storeCoins(toNano(amount.toString()))
    .storeAddress(Address.parse(to))
    .storeAddress(Address.parse(owner))
    .storeBit(0)
    .storeCoins(toNano("0.01"))
    .storeBit(1)
    .storeRef(fwd)
    .endCell();
  return {
    address: Address.parse(jw).toString({ bounceable: true }),
    amount: toNano("0.06").toString(),
    payload: toB64(body.toBoc()),
  };
}

export function sameTonAddress(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  try { return Address.parse(a).equals(Address.parse(b)); } catch { return a === b; }
}
export const short = (a?: string | null) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");
export const fmt = (n: number, d = 2) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });

/** NFT collection change_owner (op 3) payload. */
export function changeOwnerPayload(newOwner: string) {
  return toB64(beginCell().storeUint(3, 32).storeUint(Date.now(), 64).storeAddress(Address.parse(newOwner)).endCell().toBoc());
}
