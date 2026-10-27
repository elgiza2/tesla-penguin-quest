import { TSLA_JETTON, GRAM_ADDRESS, MARKET_MAX_AGE } from "./config";
export async function marketSnapshot(db: any, force = false) {
  const { data: cached } = await db.from("tsla_market_snapshots").select("*").eq("id", "tsla").maybeSingle();
  if (!force && cached && Date.now() - new Date(cached.updated_at).getTime() < MARKET_MAX_AGE) return cached.data;
  const get = async (addr: string) => {
    const response = await fetch(`https://api.ston.fi/v1/assets/${addr}`);
    if (!response.ok) throw new Error(`STON price unavailable [${response.status}]`);
    const json = await response.json() as any;
    const asset = json.asset ?? {};
    return { symbol: asset.symbol ?? "", name: asset.display_name ?? "", image: asset.image_url ?? "", priceUsd: Number(asset.dex_price_usd || asset.third_party_price_usd || 0) };
  };
  // STON has no TSLA liquidity yet; fall back to the on-chain DEX price from GeckoTerminal.
  const gecko = async (addr: string) => {
    const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/ton/tokens/${addr}`, { headers: { Accept: "application/json" } });
    if (!response.ok) return 0;
    const json = await response.json() as any;
    return Number(json?.data?.attributes?.price_usd || 0);
  };
  const withFallback = async (addr: string, geckoAddr: string) => {
    const asset = await get(addr).catch(() => ({ symbol: "", name: "", image: "", priceUsd: 0 }));
    if (!(asset.priceUsd > 0)) asset.priceUsd = await gecko(geckoAddr).catch(() => 0);
    return asset;
  };
  try {
    const [tsla, gram] = await Promise.all([withFallback(TSLA_JETTON, TSLA_JETTON), withFallback(GRAM_ADDRESS, "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")]);
    if (!Number.isFinite(tsla.priceUsd) || tsla.priceUsd <= 0) throw new Error("TSLA price unavailable");
    const result = { tsla: { ...tsla, symbol: "TSLA", name: tsla.name || "Tesla" }, gram: { ...gram, symbol: "GRAM", name: "Gram" }, updatedAt: new Date().toISOString(), stale: false };
    const { error } = await db.from("tsla_market_snapshots").upsert({ id: "tsla", data: result, updated_at: result.updatedAt });
    if (error) throw new Error(error.message);
    return result;
  } catch (error) {
    console.error("Market refresh failed", error);
    if (cached) return { ...cached.data, stale: true };
    return { tsla: { symbol: "TSLA", name: "Tesla", image: "", priceUsd: 0 }, gram: { symbol: "GRAM", name: "Gram", image: "", priceUsd: 0 }, updatedAt: null, stale: true };
  }
}
