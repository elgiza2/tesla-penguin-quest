import { describe, it, expect } from "vitest";
import { REFERRAL_STAGES, referralStageEligible, adsPermitWithdrawal } from "./config";
describe("referral stages and ad requirement", () => {
 it("pays signup portion of five TSLA", () => { expect(REFERRAL_STAGES.signup).toBe(5); });
 it("wallet portion requires ownership verification", () => { expect(REFERRAL_STAGES.wallet).toBe(10); expect(referralStageEligible("wallet", false, 0)).toBe(false); expect(referralStageEligible("wallet", true, 0)).toBe(true); });
 it("mining portion requires two completed claims", () => { expect(REFERRAL_STAGES.mining).toBe(10); expect(referralStageEligible("mining", false, 1)).toBe(false); expect(referralStageEligible("mining", false, 2)).toBe(true); });
 it("requires five confirmed ads", () => { expect(adsPermitWithdrawal(4)).toBe(false); expect(adsPermitWithdrawal(5)).toBe(true); });
});
import { POWER_LEVELS, MINING_HOURS, levelForHoldings, dailyTsla, miningAccrued, holdingsPower, isAdminUsername, referralCommission } from "./config";
describe("Tesla holding and mining rules", () => {
  it("referrers earn an additional 10% without deducting invitee rewards", () => { const reward = 100; expect(referralCommission(reward)).toBe(10); expect(reward).toBe(100); });
  it("caps accumulation at two hours", () => { expect(MINING_HOURS).toBe(2); expect(miningAccrued(0, 10 * 3600_000, 24)).toBe(2); });
  it("starts paid tiers at $0.10, $0.15 and $0.20", () => expect(POWER_LEVELS.slice(1, 4).map(t => t.price)).toEqual([0.1, 0.15, 0.2]));
  it("ends tiers at $10,000", () => expect(POWER_LEVELS.at(-1)?.price).toBe(10000));
  it("combines app and external holdings without deducting coins", () => { const result = holdingsPower(50, 50, 0.1); expect(result.balance).toBe(50); expect(result.holdings).toBe(100); expect(POWER_LEVELS[result.power_level]?.price).toBe(10); });
  it("automatically downgrades when holdings fall", () => expect(levelForHoldings(10, 0.1)).toBeLessThan(levelForHoldings(100, 0.1)));
  it("admin command authorization allows requested admins only", () => { expect(isAdminUsername("eIgiza")).toBe(true); expect(isAdminUsername("Torekr")).toBe(true); expect(isAdminUsername("guest")).toBe(false); });
});

import { withdrawalDebit, WITHDRAW_FEE_TSLA, autoWithdrawAmount, MIN_WITHDRAW } from "./config";
describe("withdrawal fees", () => {
  it("charges one TSLA from the app balance", () => { expect(WITHDRAW_FEE_TSLA).toBe(1); expect(withdrawalDebit(100)).toBe(101); });
  it("keeps enough balance to cover the fee", () => { expect(autoWithdrawAmount(500, 100, 30)).toBeCloseTo(470); });
  it("never withdraws below the minimum or the user's threshold", () => {
    expect(autoWithdrawAmount(120, 100, 30)).toBe(0);
    expect(autoWithdrawAmount(500, 480, 30)).toBe(0);
    expect(MIN_WITHDRAW).toBe(100);
  });
  it("does not sweep without a price", () => { expect(autoWithdrawAmount(500, 100, null)).toBe(0); });
});

import { NFT_TIERS, nftBenefits } from "./config";
describe("NFT tiers", () => {
  it("has 6 tiers with rising price and mining boost", () => {
    expect(NFT_TIERS).toHaveLength(6);
    for (let i = 1; i < 6; i++) { expect(NFT_TIERS[i]!.price).toBeGreaterThan(NFT_TIERS[i - 1]!.price); expect(NFT_TIERS[i]!.mining).toBeGreaterThan(NFT_TIERS[i - 1]!.mining); }
  });
  it("uses the best owned tier, not stacking", () => {
    expect(nftBenefits([])).toEqual({ mining: 1, referralRate: 0.1, tasks: 1 });
    const b = nftBenefits([1, 6]);
    expect(b.mining).toBeCloseTo(3.5); expect(b.referralRate).toBeCloseTo(0.25); expect(b.tasks).toBe(2.5);
  });
});
describe("NFT prices", () => {
  it("start at 10 GRAM and end at 10000", () => { expect(NFT_TIERS[0]!.price).toBe(10); expect(NFT_TIERS.at(-1)!.price).toBe(10000); });
});
describe("daily yield", () => {
  it("$50 holding earns $25 per day", () => { expect(POWER_LEVELS.find(l => l.price === 50)!.perDay).toBe(25); });
});
import { REFERRAL_GOALS } from "./config";
describe("referral friend goals", () => {
  it("20 friends pays 200 TSLA", () => expect(REFERRAL_GOALS[0]).toEqual({ goal: 20, reward: 200 }));
  it("100 friends pays 1500 TSLA", () => expect(REFERRAL_GOALS.at(-1)).toEqual({ goal: 100, reward: 1500 }));
});
