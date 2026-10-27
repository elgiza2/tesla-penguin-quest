import { describe, expect, it } from "vitest";
import { TICKET_REWARDS, GAME_COST, dailyTicketsAvailable, higherWins, memoryMatches, crashValue } from "./arcade-rules";
describe("ticket rewards", () => {
 it("gives five free tickets every 24 hours", () => { expect(TICKET_REWARDS.daily).toBe(5); expect(dailyTicketsAvailable(new Date(0).toISOString(), 86399999)).toBe(false); expect(dailyTicketsAvailable(new Date(0).toISOString(), 86400000)).toBe(true); });
 it("gives two tickets per completed task", () => expect(TICKET_REWARDS.task).toBe(2));
 it("gives one ticket only per confirmed ad", () => expect(TICKET_REWARDS.ad).toBe(1));
 it("splits referral tickets over three milestones", () => expect([TICKET_REWARDS.signup,TICKET_REWARDS.wallet,TICKET_REWARDS.mining]).toEqual([1,2,3]));
 it("costs one ticket per new round", () => expect(GAME_COST).toBe(1));
});
describe("arcade outcomes", () => {
 it("higher/lower treats equal as a miss", () => { expect(higherWins(4,7,1)).toBe(true); expect(higherWins(4,4,1)).toBe(false); expect(higherWins(4,2,-1)).toBe(true); });
 it("memory rejects incorrect sequences", () => { expect(memoryMatches([1,2],[1,3])).toBe(false); expect(memoryMatches([1,2],[1,2])).toBe(true); });
 it("crash grows with server elapsed time", () => { expect(crashValue(0)).toBe(1); expect(crashValue(7000)).toBeCloseTo(Math.E); });
});