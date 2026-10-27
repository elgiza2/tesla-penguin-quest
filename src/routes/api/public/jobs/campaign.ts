import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { CAMPAIGN_BATCH } from "@/lib/bot-messages";
import { pickLang } from "@/lib/i18n";

export const Route = createFileRoute("/api/public/jobs/campaign")({ server: { handlers: {
  POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request);
    if (failure) return failure;
    const { telegramApi, APP_URL } = await import("@/lib/telegram-api.server");
    const body = await request.json().catch(() => null);
    if (!body || typeof body.campaignId !== "string") return new Response("Invalid campaign", { status: 400 });
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const lease = crypto.randomUUID();
    const { data: locked, error } = await db.rpc("tesla_campaign_lock", { p_id: body.campaignId, p_token: lease });
    if (error) return Response.json({ ok: false }, { status: 503 });
    if (!locked) return Response.json({ idle: true });
    const { data: campaign } = await db.from("tsla_bot_campaigns").select("*").eq("id", body.campaignId).single();
    if (!campaign) return Response.json({ ok: false }, { status: 404 });
    const { data: users, error: readError } = await db.from("tsla_tg_users").select("id,language_code").gt("id", campaign.last_user_id).lte("id", campaign.max_user_id).order("id").limit(CAMPAIGN_BATCH);
    if (readError) return Response.json({ ok: false }, { status: 503 });
    let sent = campaign.sent, failed = campaign.failed, cursor = campaign.last_user_id;
    const messages = campaign.messages as Record<string, [string, string]>;
    // Sequential delivery preserves a precise cursor. An unknown HTTP outcome pauses
    // rather than re-sending a message that Telegram may already have accepted.
    for (const user of users ?? []) {
      const message = messages["en"];
      if (!message) break;
      let result: { ok?: boolean; error_code?: number; description?: string; parameters?: { retry_after?: number } };
      try {
        result = await telegramApi("sendMessage", { chat_id: user.id, text: `<b>${message[0]}</b>`, parse_mode: "HTML", reply_markup: { inline_keyboard: [[{ style: "primary", text: message[1], web_app: { url: APP_URL } }]] } });
      } catch {
        await db.from("tsla_bot_campaigns").update({ status: "paused", pause_reason: `Unknown delivery outcome after user ${cursor}; manual review required` }).eq("id", campaign.id).eq("lease_token", lease);
        return Response.json({ paused: true });
      }
      if (result.error_code === 429) break;
      if (!result.ok && result.error_code !== 403 && result.error_code !== 400) {
        await db.from("tsla_bot_campaigns").update({ status: "paused", pause_reason: result.description ?? "Telegram unavailable" }).eq("id", campaign.id).eq("lease_token", lease);
        return Response.json({ paused: true });
      }
      if (result.ok) sent++; else failed++;
      cursor = user.id;
      const { error: saveError } = await db.from("tsla_bot_campaigns").update({ last_user_id: cursor, sent, failed }).eq("id", campaign.id).eq("lease_token", lease);
      if (saveError) return Response.json({ ok: false }, { status: 503 });
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    const completed = (users?.length ?? 0) < CAMPAIGN_BATCH && cursor === users?.at(-1)?.id || users?.length === 0;
    await db.from("tsla_bot_campaigns").update({ status: completed ? "completed" : "queued", lease_until: null }).eq("id", campaign.id).eq("lease_token", lease);
    return Response.json({ sent, failed, completed });
  },
} } });