import { describe, expect, it } from "vitest";
import { caseIsProfitable, expectedValue, houseMargin, sellCredit } from "./cases";

const starter = [
  { value_stars: 15, weight: 400 }, { value_stars: 15, weight: 400 }, { value_stars: 25, weight: 120 },
  { value_stars: 25, weight: 50 }, { value_stars: 50, weight: 25 }, { value_stars: 100, weight: 5 },
];

describe("case economics", () => {
  it("starter box pays back 18 Stars on average for 25", () => {
    expect(expectedValue(starter)).toBeCloseTo(18);
    expect(houseMargin(25, starter)).toBeCloseTo(0.28);
  });
  it("accepts a case keeping at least 25% margin", () => {
    expect(caseIsProfitable(25, starter)).toBe(true);
  });
  it("rejects a case that pays back more than 75% on average", () => {
    expect(caseIsProfitable(25, [{ value_stars: 20, weight: 1 }])).toBe(false);
  });
  it("sell-back credits 70% of the gift value, rounded down", () => {
    expect(sellCredit(15)).toBe(10);
    expect(sellCredit(100)).toBe(70);
  });
});
