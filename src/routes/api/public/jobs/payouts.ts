import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/jobs/payouts")({ server: { handlers: {
  POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request);
    if (failure) return failure;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { processPayouts } = await import("@/lib/payout-queue.server");
    try { return Response.json(await processPayouts(supabaseAdmin)); }
    catch (e) { console.error("Payout processing deferred", e); return Response.json({ ok: false }, { status: 503 }); }
  },
} } });