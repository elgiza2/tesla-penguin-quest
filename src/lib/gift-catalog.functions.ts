import { createServerFn } from "@tanstack/react-start";
/** Public Telegram sale prices, not NFT market valuations. */
export const getGiftCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { telegramApi } = await import("./telegram-api.server");
  const response = await telegramApi("getAvailableGifts", {});
  if (!response.ok) return { gifts: [], checkedAt: new Date().toISOString(), unavailable: true };
  const result = response.result as { gifts?: Array<{ id: string; star_count: number; total_count?: number; remaining_count?: number; upgrade_star_count?: number }> } | undefined;
  return {
    checkedAt: new Date().toISOString(), unavailable: false,
    gifts: (result?.gifts ?? []).map(g => ({ id: g.id, stars: g.star_count, remaining: g.remaining_count ?? null, upgradeStars: g.upgrade_star_count ?? null })).sort((a,b) => b.stars - a.stars),
  };
});