import { beforeEach, describe, expect, it, vi } from "vitest";
const payout = vi.hoisted(() => ({ broadcast: vi.fn(), preflight: vi.fn(), prepare: vi.fn() }));
vi.mock("./payout.server", () => ({ broadcastTsla: payout.broadcast, payoutPreflight: payout.preflight, prepareTsla: payout.prepare }));
import { processPayouts } from "./payout-queue.server";

function database({ submitted = false, saveFails = false } = {}) {
  const events: string[] = [];
  return { events, rpc: vi.fn(async () => ({ data: true, error: null })), from(table: string) {
    let operation = "select", status = "", payload: any;
    const q: any = {
      select() { return q; }, in() { return q; }, order() { return q; }, limit() { return q; }, is() { return q; },
      eq(key: string, value: unknown) { if (key === "status") status = String(value); return q; },
      update(value: unknown) { operation = "update"; payload = value; return q; },
      then(resolve: (value: unknown) => void) {
        if (operation === "update") {
          if (payload.status === "submitted") events.push("save-signed-message");
          resolve({ error: payload.status === "submitted" && saveFails ? new Error("save failed") : null });
        } else if (table === "tsla_withdrawals" && status === "submitted") resolve({ data: submitted ? [{ id: "ambiguous" }] : [] });
        else if (table === "tsla_withdrawals" && status === "pending") resolve({ data: [{ id: "12345678-1234-1234-1234-123456789abc", amount: 100, to_address: "recipient" }] });
        else resolve({ data: [], error: null });
      },
    };
    return q;
  }};
}
beforeEach(() => { vi.clearAllMocks(); payout.preflight.mockResolvedValue(undefined); payout.prepare.mockResolvedValue({ boc: "test-boc", seqno: 1 }); });
describe("automatic payout safety", () => {
  it("never broadcasts when persisting the signed message fails", async () => {
    const db = database({ saveFails: true });
    await expect(processPayouts(db)).rejects.toThrow("save failed");
    expect(db.events).toEqual(["save-signed-message"]);
    expect(payout.broadcast).not.toHaveBeenCalled();
  });
  it("does not sign or resend while an earlier submission is ambiguous", async () => {
    expect(await processPayouts(database({ submitted: true }))).toEqual({ waiting: true });
    expect(payout.prepare).not.toHaveBeenCalled(); expect(payout.broadcast).not.toHaveBeenCalled();
  });
  it("saves the signed message before broadcasting the payout", async () => {
    const db = database();
    payout.broadcast.mockImplementation(async () => { db.events.push("broadcast"); });
    await processPayouts(db);
    expect(db.events).toEqual(["save-signed-message", "broadcast"]);
  });
});