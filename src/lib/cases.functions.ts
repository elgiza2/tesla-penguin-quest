import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SELL_PERCENT } from "./cases";
import { RECEIVE_WALLET } from "./config";

const initOnly = z.object({ initData: z.string().min(1) });

async function ctx(initData: string) {
  const { verifyInitData } = await import("./tg-auth.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const v = await verifyInitData(initData);
  const db = supabaseAdmin as any;
  const { data: existing } = await db.from("tsla_tg_users").select("id").eq("id", v.user.id).maybeSingle();
  if (!existing) {
    const ref = v.startParam?.startsWith("ref_") ? Number(v.startParam.slice(4)) : null;
    await db.from("tsla_tg_users").insert({
      id: v.user.id, username: v.user.username ?? null, first_name: v.user.first_name ?? null,
      photo_url: v.user.photo_url ?? null, referred_by: ref && ref !== v.user.id ? ref : null,
    });
  }
  return { user: v.user, db };
}

function fail(error: { message?: string } | null) {
  if (error) throw new Error(error.message ?? "Request failed");
}

/** Public catalogue: cases with their items and odds. */
export const listCases = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const [{ data: cases, error: e1 }, { data: items, error: e2 }] = await Promise.all([
    db.from("tsla_cases").select("id,name,price_stars,image_url,sort").eq("active", true).order("sort"),
    db.from("tsla_case_items").select("id,case_id,name,kind,telegram_gift_id,image_url,animation_url,value_stars,weight"),
  ]);
  fail(e1); fail(e2);
  return (cases ?? []).map((c: any) => ({ ...c, items: (items ?? []).filter((i: any) => i.case_id === c.id) }));
});

export const createStarsInvoice = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ caseId: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: c } = await db.from("tsla_cases").select("*").eq("id", data.caseId).eq("active", true).maybeSingle();
    if (!c) throw new Error("Case not available");
    const { data: o, error } = await db.from("tsla_case_openings")
      .insert({ user_id: user.id, case_id: c.id, price_stars: c.price_stars, pay_method: "stars" }).select("id").single();
    fail(error);
    const { telegramApi } = await import("./telegram-api.server");
    const r = await telegramApi("createInvoiceLink", {
      title: c.name, description: `Open the ${c.name} and win a Telegram gift`,
      payload: o.id, currency: "XTR", prices: [{ label: c.name, amount: c.price_stars }],
    });
    if (!r.ok) throw new Error(`Payment unavailable: ${r.description ?? "Telegram error"}`);
    return { openingId: o.id as string, url: r.result as string };
  });

export const openWithBalance = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ caseId: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: id, error } = await db.rpc("tsla_open_with_balance", { p_user: user.id, p_case: data.caseId });
    fail(error);
    return { openingId: id as string };
  });

export const getOpening = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ openingId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: o } = await db.from("tsla_case_openings").select("id,status,gift_id").eq("id", data.openingId).eq("user_id", user.id).maybeSingle();
    if (!o) throw new Error("Not found");
    if (o.status !== "opened") return { status: o.status as string, gift: null };
    const { data: g } = await db.from("tsla_user_gifts").select("*").eq("id", o.gift_id).single();
    return { status: "opened", gift: g };
  });

export const myInventory = createServerFn({ method: "POST" })
  .inputValidator(initOnly)
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const [{ data: me }, { data: gifts }] = await Promise.all([
      db.from("tsla_tg_users").select("stars_balance").eq("id", user.id).single(),
      db.from("tsla_user_gifts").select("*").eq("user_id", user.id).neq("status", "sold").order("created_at", { ascending: false }).limit(100),
    ]);
    return { starsBalance: Number(me?.stars_balance ?? 0), gifts: gifts ?? [], sellPercent: SELL_PERCENT };
  });

export const sellGift = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ giftId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: bal, error } = await db.rpc("tsla_sell_gift", { p_user: user.id, p_gift: data.giftId, p_percent: SELL_PERCENT });
    fail(error);
    return { starsBalance: Number(bal) };
  });

/** Sends a regular gift automatically from the bot's Star balance; NFT gifts are queued for the admins. */
export const claimGift = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ giftId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: g, error } = await db.rpc("tsla_reserve_gift_send", { p_user: user.id, p_gift: data.giftId });
    fail(error);
    const { telegramApi } = await import("./telegram-api.server");
    if (g.kind === "nft") {
      const { ADMIN_USERNAMES } = await import("./config");
      const { data: admins } = await db.from("tsla_tg_users").select("id,username").in("username", ADMIN_USERNAMES);
      for (const a of admins ?? []) {
        await telegramApi("sendMessage", { chat_id: a.id, parse_mode: "HTML",
          text: `<b>NFT gift to deliver</b>\n${g.name} → ${user.username ? "@" + user.username : user.id}\nGift ID: <code>${g.id}</code>` });
      }
      return { status: "pending_manual" };
    }
    const r = await telegramApi("sendGift", { user_id: user.id, gift_id: g.telegram_gift_id, text: "Won in Tesla 🎁" });
    if (!r.ok) {
      await db.from("tsla_user_gifts").update({ status: "failed", error: r.description ?? "Send failed", updated_at: new Date().toISOString() }).eq("id", g.id);
      throw new Error("Delivery is temporarily unavailable. Try again later or sell the gift.");
    }
    await db.from("tsla_user_gifts").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", g.id);
    return { status: "sent" };
  });

/* ---------------- Events ---------------- */

export const listEvents = createServerFn({ method: "POST" })
  .inputValidator(initOnly)
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const now = new Date().toISOString();
    const [{ data: events }, { data: mine }] = await Promise.all([
      db.from("tsla_events").select("*").eq("active", true).gt("ends_at", now).order("ends_at"),
      db.from("tsla_event_entries").select("event_id,status").eq("user_id", user.id),
    ]);
    const ids = (events ?? []).map((e: any) => e.id);
    const { data: entries } = ids.length ? await db.from("tsla_event_entries").select("event_id").in("event_id", ids).eq("status", "verified") : { data: [] };
    return {
      receiveWallet: RECEIVE_WALLET,
      events: (events ?? []).map((e: any) => ({
        ...e,
        entries: (entries ?? []).filter((x: any) => x.event_id === e.id).length,
        joined: (mine ?? []).find((m: any) => m.event_id === e.id)?.status ?? null,
      })),
    };
  });

export const joinSubscribeEvent = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: e } = await db.from("tsla_events").select("*").eq("id", data.eventId).eq("active", true).maybeSingle();
    if (!e || e.kind !== "subscribe" || new Date(e.ends_at) < new Date()) throw new Error("Event not available");
    if (!e.chat_id) throw new Error("Event is not configured");
    const { telegramApi } = await import("./telegram-api.server");
    const r = await telegramApi("getChatMember", { chat_id: e.chat_id, user_id: user.id });
    const status = (r.result as any)?.status;
    if (!r.ok || !["member", "administrator", "creator", "restricted"].includes(status)) throw new Error("Join the channel first, then try again");
    const { error } = await db.from("tsla_event_entries").upsert({ event_id: e.id, user_id: user.id, status: "verified" }, { onConflict: "event_id,user_id" });
    fail(error);
    return { ok: true };
  });

/** Checks the receive wallet for a TON (GRAM) transfer carrying this user's entry comment. */
export const verifyGramEntry = createServerFn({ method: "POST" })
  .inputValidator(initOnly.extend({ eventId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { user, db } = await ctx(data.initData);
    const { data: e } = await db.from("tsla_events").select("*").eq("id", data.eventId).eq("active", true).maybeSingle();
    if (!e || e.kind !== "gram") throw new Error("Event not available");
    const comment = `evt:${e.id.slice(0, 8)}:${user.id}`;
    const r = await fetch(`https://toncenter.com/api/v3/transactions?account=${RECEIVE_WALLET}&limit=100&sort=desc`);
    if (!r.ok) throw new Error("Could not reach the TON network, try again");
    const j: any = await r.json();
    const need = BigInt(Math.round(Number(e.entry_gram) * 1e9));
    const tx = (j.transactions ?? []).find((t: any) =>
      t.in_msg?.message_content?.decoded?.comment === comment && BigInt(t.in_msg?.value ?? 0) >= need);
    if (!tx) throw new Error("Payment not found yet — wait a minute and check again");
    const { error } = await db.from("tsla_event_entries").upsert({ event_id: e.id, user_id: user.id, status: "verified", tx_hash: tx.hash }, { onConflict: "event_id,user_id" });
    fail(error);
    return { ok: true };
  });
