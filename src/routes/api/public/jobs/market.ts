import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
export const Route = createFileRoute("/api/public/jobs/market")({ server: { handlers: { POST: async ({ request }) => {
  const failure = await authenticateCronRequest(request);
  if (failure) return failure;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { marketSnapshot } = await import("@/lib/market.server");
  const market = await marketSnapshot(supabaseAdmin, true);
  return Response.json({ ok: !market.stale, updatedAt: market.updatedAt });
} } } });