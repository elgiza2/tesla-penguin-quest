/** Gift case economics. Every case must keep at least HOUSE_MIN_MARGIN of its price on average. */
export const HOUSE_MIN_MARGIN = 0.25;
/** Selling a won gift back credits this percent of its Star value to the in-app balance. */
export const SELL_PERCENT = 70;

export type CaseItemOdds = { value_stars: number; weight: number };

export function expectedValue(items: CaseItemOdds[]) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return 0;
  return items.reduce((s, i) => s + i.value_stars * i.weight, 0) / total;
}

/** Share of the price the house keeps on average (1 - EV/price). */
export function houseMargin(price: number, items: CaseItemOdds[]) {
  return 1 - expectedValue(items) / price;
}

export function caseIsProfitable(price: number, items: CaseItemOdds[]) {
  return items.length > 0 && houseMargin(price, items) >= HOUSE_MIN_MARGIN;
}

export function chancePercent(weight: number, items: CaseItemOdds[]) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  return total > 0 ? (weight / total) * 100 : 0;
}

export function sellCredit(value: number) {
  return Math.floor((value * SELL_PERCENT) / 100);
}
