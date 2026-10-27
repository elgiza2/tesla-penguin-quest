import { Address, beginCell, internal, SendMode, toNano, TonClient, WalletContractV5R1, external, storeMessage } from "@ton/ton";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { TSLA_JETTON, PAYOUT_WALLET } from "./config";

const client = new TonClient({ endpoint: "https://toncenter.com/api/v2/jsonRPC" });

async function payoutWallet() {
  const words = process.env["PAYOUT_WALLET_MNEMONIC"];
  if (!words) throw new Error("Payout wallet not configured");
  const key = await mnemonicToPrivateKey(words.trim().split(/\s+/));
  const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: key.publicKey });
  if (!wallet.address.equals(Address.parse(PAYOUT_WALLET))) throw new Error("Payout wallet configuration mismatch");
  return { key, contract: client.open(wallet) };
}

async function tslaJettonWallet(owner: string) {
  let r = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(owner)}&jetton_address=${TSLA_JETTON}&limit=1`);
  for (let attempt = 0; r.status === 429 && attempt < 3; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
    r = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(owner)}&jetton_address=${TSLA_JETTON}&limit=1`);
  }
  if (!r.ok) throw new Error(`Blockchain lookup failed [${r.status}]`);
  const j = (await r.json()) as { jetton_wallets?: { address: string }[] };
  const addr = j.jetton_wallets?.[0]?.address;
  if (!addr) throw new Error("Payout wallet has no TSLA jetton wallet");
  return addr;
}

/** Sends TSLA from the payout wallet to a user address. */
export async function payoutPreflight(amount: number, needGas = true) {
  const { contract } = await payoutWallet();
  const response = await fetch(`https://toncenter.com/api/v3/account?address=${encodeURIComponent(PAYOUT_WALLET)}`);
  if (!response.ok) throw new Error(`Payout balance check unavailable [${response.status}]`);
  const account = await response.json() as { balance?: string };
  if (typeof account.balance !== "string") throw new Error("Payout balance check unavailable");
  const balance = BigInt(account.balance);
  if (needGas && balance < toNano("0.07")) throw new Error("Payout wallet needs network fees");
  const r = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${PAYOUT_WALLET}&jetton_address=${TSLA_JETTON}&limit=1`);
  if (!r.ok) throw new Error("Payout balance check unavailable");
  const j = await r.json() as any;
  if (BigInt(j.jetton_wallets?.[0]?.balance ?? "0") < toNano(amount.toFixed(9))) throw new Error("Payout wallet needs TSLA");
}

export async function prepareTsla(to: string, amount: number, queryId: string) {
  const { key, contract } = await payoutWallet();
  const jettonWallet = await tslaJettonWallet(PAYOUT_WALLET);
  const body = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(BigInt(queryId), 64)
    .storeCoins(toNano(amount.toFixed(9)))
    .storeAddress(Address.parse(to))
    .storeAddress(Address.parse(PAYOUT_WALLET))
    .storeBit(0)
    .storeCoins(toNano("0.01"))
    .storeBit(0)
    .endCell();
  const stateResponse = await fetch(`https://toncenter.com/api/v3/walletStates?address=${PAYOUT_WALLET}`);
  if (!stateResponse.ok) throw new Error(`Wallet state unavailable [${stateResponse.status}]`);
  const state = await stateResponse.json() as any;
  const seqno = state.wallets?.[0]?.seqno;
  if (typeof seqno !== "number") throw new Error("Payout wallet is not active");
  const transfer = contract.createTransfer({ seqno, secretKey: key.secretKey, sendMode: SendMode.PAY_GAS_SEPARATELY, messages: [internal({ to: jettonWallet, value: toNano("0.05"), body })] });
  const boc = beginCell().store(storeMessage(external({ to: contract.address, body: transfer }))).endCell().toBoc().toString("base64");
  return { seqno, queryId, boc };
}

export async function broadcastTsla(boc: string) {
  const response = await fetch("https://toncenter.com/api/v3/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boc }) });
  if (!response.ok) throw new Error(`Broadcast failed [${response.status}]: ${await response.text()}`);
  return { ok: true };
}

/** Mints the next item of the owner's NFT collection straight to the buyer's wallet. */
export async function mintNft(collection: string, itemIndex: number, owner: string) {
  const { key, contract } = await payoutWallet();
  const info = await fetch(`https://toncenter.com/api/v3/nft/collections?collection_address=${encodeURIComponent(collection)}`).then(r => r.json() as Promise<any>);
  const ownerRaw = info?.nft_collections?.[0]?.owner_address;
  if (!ownerRaw || !Address.parse(ownerRaw).equals(contract.address)) throw new Error("Collection owner is not the payout wallet; mint queued");
  const content = beginCell()
    .storeAddress(Address.parse(owner))
    .storeRef(beginCell().storeUint(0, 8).endCell())
    .endCell();
  const body = beginCell()
    .storeUint(1, 32)
    .storeUint(Date.now(), 64)
    .storeUint(itemIndex, 64)
    .storeCoins(toNano("0.05"))
    .storeRef(content)
    .endCell();
  await new Promise(resolve => setTimeout(resolve, 1500));
  const seqno = await contract.getSeqno();
  await contract.sendTransfer({
    seqno,
    secretKey: key.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    messages: [internal({ to: collection, value: toNano("0.08"), body })],
  });
  return { seqno, itemIndex };
}
