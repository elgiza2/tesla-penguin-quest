export const TSLA_JETTON = "EQCY5dx1kTGT-r1RPXA-LTRyv73_LtfcaTl0g1E_WBlRdUyI";
export const GRAM_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
export const RECEIVE_WALLET = "UQAp1QxnLJ2z44IooUovvtVShw7hJBEdxCRV3RlbCYC3D8qj";
export const PAYOUT_WALLET = "UQA5k2qscmlDz0tYaNMlmhCW5czvc6zMJpB78T4y4GDz9Q5a";
export const CHANNEL_ID = "-1002616088306";
export const SWAP_URL = `https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=${TSLA_JETTON}`;
export const MINING_HOURS = 2;
export const DAILY_YIELD = 0.5;
export const BASE_TSLA_PER_DAY = 0.1;
export const REFERRAL_BONUS = 25;
export const REFERRAL_STAGES = { signup: 5, wallet: 10, mining: 10 } as const;
export const REFERRAL_GOALS = [{ goal: 20, reward: 200 }, { goal: 40, reward: 400 }, { goal: 60, reward: 700 }, { goal: 80, reward: 1000 }, { goal: 100, reward: 1500 }] as const;
export const REQUIRED_AD_VIEWS = 5;
export function referralStageEligible(stage: keyof typeof REFERRAL_STAGES, verified: boolean, claims: number) {
  return stage === "signup" || (stage === "wallet" ? verified : claims >= 2);
}
export function adsPermitWithdrawal(confirmed: number) { return confirmed >= REQUIRED_AD_VIEWS; }
export const REFERRAL_COMMISSION = 0.10;
export function referralCommission(reward: number) { return reward * REFERRAL_COMMISSION; }
export const MIN_WITHDRAW = 100;
export const DECIMALS = 9;
export const WITHDRAW_FEE_GRAM = 0.15;
export const WITHDRAW_FEE_TSLA = 1;
export const ADMIN_USERNAMES = ["eigiza", "torekr"];
export const NFT_COLLECTION_ADDRESS = "EQAUV6nlIAxPqWMy-vpuuTXu14bGyYJjeK7wgiqs0COnbv2X";
export const NFT_COLLECTION_URL = "https://getgems.io/teslaai";
/** Ten NFT tiers paid in GRAM: higher price → bigger mining, referral and task boosts. */
export const NFT_TIERS = [
  { tier: 1, name: "Tesla Rookie", price: 10, mining: 0.05, referral: 0.01, tasks: 1.10 },
  { tier: 2, name: "Tesla Scout", price: 50, mining: 0.15, referral: 0.03, tasks: 1.25 },
  { tier: 3, name: "Tesla Explorer", price: 200, mining: 0.35, referral: 0.05, tasks: 1.45 },
  { tier: 4, name: "Tesla Pioneer", price: 1000, mining: 0.70, referral: 0.08, tasks: 1.70 },
  { tier: 5, name: "Tesla Guardian", price: 4000, mining: 1.30, referral: 0.11, tasks: 2.00 },
  { tier: 6, name: "Tesla Champion", price: 10000, mining: 2.50, referral: 0.15, tasks: 2.50 },
];
/** Benefits come from the best owned tier (not stacked). */
export function nftBenefits(tiers: number[]) {
  const best = NFT_TIERS.filter(t => tiers.includes(t.tier)).sort((a, b) => b.tier - a.tier)[0];
  return { mining: 1 + (best?.mining ?? 0), referralRate: REFERRAL_COMMISSION + (best?.referral ?? 0), tasks: best?.tasks ?? 1 };
}
export const NFT_PRICE_GRAM = NFT_TIERS[0]!.price;
export const SUPPORTER_URL = "https://megsyai.com";
export const MARKET_MAX_AGE = 3600_000;
const thresholds: number[] = [];
for (const [start, end, step] of ([[10, 100, 5], [125, 1000, 25], [1250, 10000, 250], [12500, 100000, 2500], [125000, 1000000, 25000]] as [number, number, number][])) {
  for (let cents = start; cents <= end; cents += step) thresholds.push(cents / 100);
}
export const POWER_LEVELS = [{ level: 0, price: 0, perDay: 0 }, ...thresholds.map((price, index) => ({ level: index + 1, price, perDay: price * DAILY_YIELD }))];
export function levelForHoldings(holdings: number, priceUsd = 1) {
  const usd = Math.max(0, holdings) * Math.max(0, priceUsd);
  let level = 0;
  for (const tier of POWER_LEVELS) if (tier.price <= usd + 1e-10) level = tier.level;
  return level;
}
export function dailyTsla(level: number, priceUsd: number) {
  const tier = POWER_LEVELS[level];
  return tier && tier.level > 0 && priceUsd > 0 ? tier.perDay / priceUsd : BASE_TSLA_PER_DAY;
}
export function sessionReward(level: number, priceUsd = 1) { return dailyTsla(level, priceUsd) * MINING_HOURS / 24; }
export function miningAccrued(started: number, now: number, rateDaily: number) {
  return Math.max(0, Math.min(now - started, MINING_HOURS * 3600_000)) / 86400_000 * rateDaily;
}
export function holdingsPower(appTsla: number, externalTsla: number, priceUsd: number) {
  return { balance: appTsla, holdings: Math.max(0, appTsla) + Math.max(0, externalTsla), power_level: levelForHoldings(appTsla + externalTsla, priceUsd) };
}
export function isAdminUsername(username?: string) { return ADMIN_USERNAMES.includes((username ?? "").toLowerCase()); }
export function withdrawalDebit(amount: number) { return amount + WITHDRAW_FEE_TSLA; }
/** Largest payout that still covers its own fee and respects the user's own threshold. */
export function autoWithdrawAmount(balance: number, threshold: number, feeTsla: number | null) {
  if (feeTsla === null || feeTsla <= 0) return 0;
  const amount = Math.floor((balance - feeTsla) * 1e6) / 1e6;
  if (!(amount >= MIN_WITHDRAW) || !(amount >= threshold)) return 0;
  return amount;
}
