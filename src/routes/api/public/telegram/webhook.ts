import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const From = z.object({ id: z.number().int(), username: z.string().optional(), first_name: z.string().optional() });
const Update = z.object({
  update_id: z.number().int(),
  pre_checkout_query: z.object({ id: z.string(), from: From, currency: z.string(), total_amount: z.number().int(), invoice_payload: z.string() }).optional(),
  message: z.object({
    text: z.string().optional(),
    chat: z.object({ id: z.number().int(), type: z.string() }),
    from: From.optional(),
    successful_payment: z.object({ currency: z.string(), total_amount: z.number().int(), invoice_payload: z.string(), telegram_payment_charge_id: z.string() }).optional(),
  }).optional(),
});

export const Route = createFileRoute('/api/public/telegram/webhook')({ server: { handlers: { POST: async ({ request }) => {
  const { telegramApi, webhookSecret, APP_URL } = await import('@/lib/telegram-api.server');
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== await webhookSecret()) return new Response('Unauthorized', { status: 401 });
  const parsed = Update.safeParse(await request.json());
  if (!parsed.success) return Response.json({ ok: true });
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as any;

  // Stars checkout: approve only a pending opening that matches user and amount.
  const pq = parsed.data.pre_checkout_query;
  if (pq) {
    const { data: o } = await db.from('tsla_case_openings').select('user_id,price_stars,status,pay_method').eq('id', pq.invoice_payload).maybeSingle();
    const ok = !!o && o.status === 'pending' && o.pay_method === 'stars' && Number(o.user_id) === pq.from.id && o.price_stars === pq.total_amount && pq.currency === 'XTR';
    await telegramApi('answerPreCheckoutQuery', ok ? { pre_checkout_query_id: pq.id, ok: true } : { pre_checkout_query_id: pq.id, ok: false, error_message: 'This box is no longer available, please try again.' });
    return Response.json({ ok: true });
  }

  const msg = parsed.data.message;
  if (!msg?.from) return Response.json({ ok: true });

  const pay = msg.successful_payment;
  if (pay) {
    const { error } = await db.rpc('tsla_settle_stars_opening', { p_opening: pay.invoice_payload, p_user: msg.from.id, p_amount: pay.total_amount, p_charge: pay.telegram_payment_charge_id });
    if (error) {
      console.error('Stars settlement failed', error.message);
      await telegramApi('refundStarPayment', { user_id: msg.from.id, telegram_payment_charge_id: pay.telegram_payment_charge_id });
    }
    return Response.json({ ok: true });
  }

  if (msg.chat.type !== 'private') return Response.json({ ok: true });
  try {
    const { data: existing } = await db.from('tsla_tg_users').select('id').eq('id', msg.from.id).maybeSingle();
    const param = msg.text?.split(' ')[1];
    let ref = param?.startsWith('ref_') ? Number(param.slice(4)) : null;
    if (ref === msg.from.id || !Number.isSafeInteger(ref)) ref = null;
    if (ref) { const { data: owner } = await db.from('tsla_tg_users').select('id').eq('id', ref).maybeSingle(); if (!owner) ref = null; }
    if (!existing) await db.from('tsla_tg_users').insert({ id: msg.from.id, username: msg.from.username ?? null, first_name: msg.from.first_name ?? null, language_code: 'en', referred_by: ref });
    else await db.from('tsla_tg_users').update({ username: msg.from.username ?? null, first_name: msg.from.first_name ?? null }).eq('id', msg.from.id);
  } catch (error) { console.error('User sync failed', error); }

  const command = msg.text?.split(/\s/)[0]?.split('@')[0];
  if (command === '/101') {
    const { isAdminUsername } = await import('@/lib/config');
    if (!isAdminUsername(msg.from.username)) return Response.json({ ok: true });
    const r = await telegramApi('sendMessage', { chat_id: msg.chat.id, text: '<b>Tesla Control Room</b>', parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: 'Open admin panel', web_app: { url: APP_URL + '/101' } }]] } });
    return Response.json({ ok: r.ok });
  }
  if (command !== '/start') return Response.json({ ok: true });
  const caption = '<b>Welcome to Tesla 🎁</b>\n\nOpen gift boxes with Telegram Stars and win real Telegram gifts and NFTs.\nComplete tasks, invite friends and join daily events.';
  const markup = { inline_keyboard: [[{ text: 'Open Tesla', web_app: { url: APP_URL } }]] };
  let r = await telegramApi('sendPhoto', { chat_id: msg.chat.id, photo: APP_URL + '/start-banner.jpg', caption, parse_mode: 'HTML', reply_markup: markup });
  if (!r.ok) r = await telegramApi('sendMessage', { chat_id: msg.chat.id, text: caption, parse_mode: 'HTML', reply_markup: markup });
  return Response.json({ ok: r.ok });
} } } });
