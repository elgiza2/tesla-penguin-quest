export type TgUser = {
  id: number;
  first_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

const enc = new TextEncoder();
async function hmac(key: ArrayBuffer, data: string) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(data));
}
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

/** Verifies Telegram Mini App initData and returns the user plus start_param. */
export async function verifyInitData(initData: string) {
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Unauthorized");
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = await hmac(enc.encode("WebAppData").buffer as ArrayBuffer, token);
  const sig = hex(await hmac(secret, check));
  if (sig !== hash) throw new Error("Unauthorized");
  const authDate = Number(params.get("auth_date") || 0);
  if (Date.now() / 1000 - authDate > 86400 * 7) throw new Error("Session expired");
  const user = JSON.parse(params.get("user") || "null") as TgUser | null;
  if (!user?.id) throw new Error("Unauthorized");
  return { user, startParam: params.get("start_param") };
}
