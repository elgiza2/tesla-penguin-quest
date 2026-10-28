import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/ads/monetag")({server:{handlers:{GET:async({request})=>{
 const params = new URL(request.url).searchParams;
 const secret = process.env["MONETAG_POSTBACK_SECRET"];
 if(!secret || params.get("secret") !== secret) return new Response("Unauthorized",{status:401});
 if(!["11951290","12137490"].includes(params.get("zone_id") ?? "") || params.get("event_type") !== "impression" || params.get("reward_event_type") !== "valued") return new Response("Ignored");
 const id = params.get("ymid");
 if(!id || !/^[0-9a-f-]{36}$/i.test(id)) return new Response("Invalid event",{status:400});
 const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
 const {error} = await db.from("tsla_ad_views").update({confirmed_at:new Date().toISOString()}).eq("id",id).eq("zone_id",params.get("zone_id")!).is("confirmed_at",null);
 return new Response(error ? "Retry" : "OK",{status:error ? 503 : 200});
}}}});
