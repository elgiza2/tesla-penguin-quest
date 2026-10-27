const TIGER_CASE_API_URL = "https://tiger-gift.app/api/ad/ref-link/free-case-open";

/** Verify a real free-case opening and attribution to this referral link without exposing the API key to clients. */
export async function verifyTigerCaseFreeOpen(
  telegramUserId: number,
  apiKey: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<boolean> {
  if (!apiKey) throw new Error("TASK_VERIFICATION_UNAVAILABLE");

  const url = new URL(TIGER_CASE_API_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("tgUserId", String(telegramUserId));

  let response: Response;
  try {
    response = await fetcher(url, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new Error("TASK_VERIFICATION_UNAVAILABLE");
  }

  if (!response.ok) throw new Error("TASK_VERIFICATION_UNAVAILABLE");

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("TASK_VERIFICATION_UNAVAILABLE");
  }

  if (!result || typeof result !== "object") throw new Error("TASK_VERIFICATION_UNAVAILABLE");
  const payload = result as { ok?: unknown; data?: { done?: unknown; initiallyFromThisLink?: unknown } };
  if (payload.ok !== true || !payload.data || typeof payload.data.done !== "boolean" || typeof payload.data.initiallyFromThisLink !== "boolean") {
    throw new Error("TASK_VERIFICATION_UNAVAILABLE");
  }

  return payload.data.done === true && payload.data.initiallyFromThisLink === true;
}
