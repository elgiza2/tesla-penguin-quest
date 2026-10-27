const token = () => process.env["TELEGRAM_BOT_TOKEN"];

export async function telegramApi(method: string, body: object) {
  const botToken = token();
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as {
    ok: boolean;
    result?: unknown;
    error_code?: number;
    description?: string;
    parameters?: { retry_after?: number };
  };
  if (!response.ok) {
    console.error("Telegram request failed", response.status, result.description);
  }
  return result;
}

export async function webhookSecret() {
  const botToken = token();
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`telegram-webhook:${botToken}`),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const APP_URL = process.env["APP_URL"] || "https://tesla.vercel.app";
export const APP_BUTTON_EMOJI = "5875465628285931233";
export const STAR_EMOJI = "5958376256788502078";
