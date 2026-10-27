import { describe, expect, it } from "vitest";
import { campaignPageAfter } from "./bot-messages";

describe("all-recipient campaign pagination", () => {
  it("continues beyond 200,000 recipients without a 2,000-user cap", () => {
    expect(campaignPageAfter(200000, 200005, [200006, 200005, 200004, 200003, 200002, 200001, 199999])).toEqual([200001, 200002, 200003, 200004, 200005]);
  });
  it("never includes recipients already processed", () => {
    expect(campaignPageAfter(80, 100, [79, 80, 81])).toEqual([81]);
  });
});