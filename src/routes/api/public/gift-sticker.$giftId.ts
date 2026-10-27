import { createFileRoute } from '@tanstack/react-router';

/** Serves the animated sticker (Lottie JSON) of a regular Telegram gift. Public, non-sensitive. */
export const Route = createFileRoute('/api/public/gift-sticker/$giftId')({ server: { handlers: { GET: async ({ params, request }) => {
  const thumb = new URL(request.url).searchParams.has('thumb');
  if (!/^\d{5,25}$/.test(params.giftId)) return new Response('Bad id', { status: 400 });
  const token = process.env['TELEGRAM_BOT_TOKEN'];
  if (!token) return new Response('Not configured', { status: 503 });
  const { telegramApi } = await import('@/lib/telegram-api.server');
  const gifts = await telegramApi('getAvailableGifts', {});
  const gift = (gifts.result as any)?.gifts?.find((g: any) => g.id === params.giftId);
  if (!gift) return new Response('Not found', { status: 404 });
  const f = await telegramApi('getFile', { file_id: thumb ? (gift.sticker.thumbnail?.file_id ?? gift.sticker.file_id) : gift.sticker.file_id });
  const path = (f.result as any)?.file_path;
  if (!path) return new Response('Not found', { status: 404 });
  const res = await fetch(`https://api.telegram.org/file/bot${token}/${path}`);
  if (!res.ok || !res.body) return new Response('Upstream error', { status: 502 });
  if (thumb) return new Response(res.body, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=86400' } });
  const json = res.body.pipeThrough(new DecompressionStream('gzip'));
  return new Response(json, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' } });
} } } });
