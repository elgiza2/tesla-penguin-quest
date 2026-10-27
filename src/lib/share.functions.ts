import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const prepareShareMessage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ initData: z.string().min(1) }).parse(i))
  .handler(async ({ data }) => {
    const { verifyInitData } = await import("./tg-auth.server");
    const { telegramApi, APP_URL } = await import("./telegram-api.server");
    const { user } = await verifyInitData(data.initData);
    const link = `https://t.me/sramaibot?start=ref_${user.id}`;
    const r = await telegramApi("savePreparedInlineMessage", {
      user_id: user.id,
      result: {
        type: "photo", id: `share-${user.id}-${Date.now()}`,
        photo_url: `${APP_URL}/start-banner.jpg`, thumbnail_url: `${APP_URL}/start-banner.jpg`,
        caption: "<b>Join my Tesla crew</b>\nMine TSLA, complete tasks and play games together.",
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ style: "primary", text: "Open Tesla", url: link }]] },
      },
      allow_user_chats: true, allow_group_chats: true,
    });
    if (!r.ok || !r.result?.id) throw new Error(r.description || "Unable to prepare message");
    return { id: r.result.id as string, link };
  });
