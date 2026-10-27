export const DEMO_BALANCES = { gram: 24.5, stars: 1250 } as const;
export const CURRENT_SEASON = { number: 1, status: "active" } as const;
export const DEMO_PLAYERS = [
  { id: "sample-1", name: "Alex", score: 18450, level: 12 },
  { id: "sample-2", name: "Mila", score: 16280, level: 10 },
  { id: "sample-3", name: "Gift Hunter", score: 14920, level: 9 },
  { id: "sample-4", name: "Leo", score: 12650, level: 8 },
  { id: "sample-5", name: "Nova", score: 11340, level: 7 },
];
export function displayBalances(demo: boolean, me: { gram_balance?: number; stars_balance?: number } | undefined) {
  return demo ? DEMO_BALANCES : { gram: Number(me?.gram_balance ?? 0), stars: Number(me?.stars_balance ?? 0) };
}
export function canSubmitDemoBet(demo: boolean, amount: number, balance: number) {
  return demo && Number.isFinite(amount) && amount > 0 && amount <= balance;
}export const DEMO_BETTORS: { id: string; name: string; amount: number; currency: "gram" | "stars"; cashout: number }[] = [
  { id: "b1", name: "Alex", amount: 2.5, currency: "gram", cashout: 1.8 },
  { id: "b2", name: "Mila", amount: 150, currency: "stars", cashout: 2.4 },
  { id: "b3", name: "Leo", amount: 1, currency: "gram", cashout: 3.1 },
  { id: "b4", name: "Nova", amount: 50, currency: "stars", cashout: 1.3 },
];
