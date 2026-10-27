import { describe, expect, it } from "vitest";
import { CURRENT_SEASON, displayBalances, canSubmitDemoBet } from "./presentation-demo";
describe("presentation demo boundaries", () => {
  it("keeps Season 1 active", () => { expect(CURRENT_SEASON).toEqual({ number: 1, status: "active" }); });
  it("never replaces real balances with samples", () => { expect(displayBalances(false, { gram_balance: 3, stars_balance: 42 })).toEqual({ gram: 3, stars: 42 }); });
  it("never submits a presentation bet for a real account", () => { expect(canSubmitDemoBet(false, 1, 42)).toBe(false); });
  it("rejects a sample bet over the available sample balance", () => { expect(canSubmitDemoBet(true, 25, 24.5)).toBe(false); });
  it("allows a funded positive practice bet", () => { expect(canSubmitDemoBet(true, 2, 24.5)).toBe(true); });
});