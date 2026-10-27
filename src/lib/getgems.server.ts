import { NFT_COLLECTION_ADDRESS, NFT_TIERS } from "./config";
const BASE = `https://api.getgems.io/public-api/minting/${NFT_COLLECTION_ADDRESS}`;
const IMAGE_BASE = "https://tesla.vercel.app/nft";
function headers() {
  const key = process.env["GETGEMS_API_KEY"];
  if (!key) throw new Error("Getgems minting is not configured");
  return { accept: "application/json", "Content-Type": "application/json", authorization: key };
}
/** Queues an NFT mint through Getgems. Idempotent per requestId (safe to retry). */
export async function getgemsMint(requestId: string, owner: string, tierNo: number) {
  const tier = NFT_TIERS.find(t => t.tier === tierNo);
  if (!tier) throw new Error("Invalid NFT tier");
  const r = await fetch(BASE, { method: "POST", headers: headers(), body: JSON.stringify({
    requestId, ownerAddress: owner, name: tier.name, description: `Tesla NFT · Tier ${tier.tier}`,
    image: `${IMAGE_BASE}/tier${tier.tier}.jpg`,
    attributes: [{ trait_type: "Tier", value: String(tier.tier) }, { trait_type: "Mining boost", value: `+${Math.round(tier.mining * 100)}%` }],
  }) });
  const j = await r.json().catch(() => null) as any;
  if (!r.ok || !j?.success) throw new Error(j?.errors?.[0]?.message ?? `Getgems mint failed [${r.status}]`);
  return j.response as { status: string; address: string; url: string };
}
export async function getgemsBalance() {
  const r = await fetch(`${BASE}/wallet-balance`, { headers: headers() });
  const j = await r.json().catch(() => null) as any;
  return Number(j?.response?.balance ?? 0) / 1e9;
}
