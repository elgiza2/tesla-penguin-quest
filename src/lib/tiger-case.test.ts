import { describe, expect, it, vi } from "vitest";
import { verifyTigerCaseFreeOpen } from "./tiger-case.server";

const makeResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("Tiger Case free-case verification", () => {
  it("accepts only a verified free-case opening attributed to this referral link", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => makeResponse({ ok: true, data: { done: true, initiallyFromThisLink: true } }));
    await expect(verifyTigerCaseFreeOpen(123456789, "test-secret", fetcher)).resolves.toBe(true);

    const [request] = fetcher.mock.calls[0]!;
    const url = new URL(String(request));
    expect(url.origin).toBe("https://tiger-gift.app");
    expect(url.pathname).toBe("/api/ad/ref-link/free-case-open");
    expect(url.searchParams.get("tgUserId")).toBe("123456789");
    expect(url.searchParams.get("key")).toBe("test-secret");
  });

  it("does not accept a case opened without attribution to this task link", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => makeResponse({ ok: true, data: { done: true, initiallyFromThisLink: false } }));
    await expect(verifyTigerCaseFreeOpen(7, "test-secret", fetcher)).resolves.toBe(false);
  });

  it("does not accept a user who has not opened a free case", async () => {
    const fetcher = vi.fn<typeof fetch>(async () => makeResponse({ ok: true, data: { done: false, initiallyFromThisLink: true } }));
    await expect(verifyTigerCaseFreeOpen(7, "test-secret", fetcher)).resolves.toBe(false);
  });

  it("fails closed when the secret is missing or the partner API is unavailable", async () => {
    await expect(verifyTigerCaseFreeOpen(7, undefined, vi.fn())).rejects.toThrow("TASK_VERIFICATION_UNAVAILABLE");
    const fetcher = vi.fn<typeof fetch>(async () => makeResponse({ ok: false }, 401));
    await expect(verifyTigerCaseFreeOpen(7, "bad-secret", fetcher)).rejects.toThrow("TASK_VERIFICATION_UNAVAILABLE");
  });
});
