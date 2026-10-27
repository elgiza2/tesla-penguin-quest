import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateCronRequest } from "./cron-auth";

const request = (token?: string) =>
  new Request("https://app.example/api/public/jobs/payouts", {
    method: "POST",
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

describe("authenticateCronRequest", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", "current-secret");
    vi.stubEnv("CRON_SECRET_PREVIOUS", "previous-secret");
    vi.stubEnv("LOVABLE_CRON_SECRET", "legacy-secret");
    vi.stubEnv("LOVABLE_CRON_SECRET_PREVIOUS", "legacy-previous-secret");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("accepts the Vercel CRON_SECRET", async () => {
    expect(await authenticateCronRequest(request("current-secret"))).toBeNull();
  });

  it("accepts a previous secret during rotation", async () => {
    expect(await authenticateCronRequest(request("previous-secret"))).toBeNull();
  });

  it("continues accepting the legacy Lovable secret during migration", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(await authenticateCronRequest(request("legacy-secret"))).toBeNull();
  });

  it("returns 500 when no current secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("LOVABLE_CRON_SECRET", "");
    expect((await authenticateCronRequest(request("current-secret")))?.status).toBe(500);
  });

  it("rejects missing and incorrect bearer tokens", async () => {
    expect((await authenticateCronRequest(request()))?.status).toBe(401);
    expect((await authenticateCronRequest(request("wrong-secret")))?.status).toBe(401);
  });
});
