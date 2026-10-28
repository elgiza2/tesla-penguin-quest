import { createServerFn } from "@tanstack/react-start";
const auth = (input: { initData: string }) => { if (!input.initData) throw new Error("Unauthorized"); return input; };
async function context(initData: string) {
 const { verifyInitData } = await import("./tg-auth.server");
 const { user } = await verifyInitData(initData);
 const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
 return { user, db };
}
export const beginAd = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
 const { user, db } = await context(data.initData);
 const { data: row, error } = await db.from("tsla_ad_views").insert({user_id:user.id, zone_id:"12137490"}).select("id").single();
 if(error || !row) throw new Error("Unable to start ad");
 return { id: row.id };
});
export const adProgress = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
 const { user, db } = await context(data.initData);
 const { count, error } = await db.from("tsla_ad_views").select("id", { count:"exact", head:true }).eq("user_id",user.id).not("confirmed_at","is",null).is("consumed_by",null);
 if(error) throw new Error("Unable to refresh ads");
 return { count: count ?? 0 };
});
/** Confirms a rewarded ad the user watched; requires the ad to have been open for a realistic time. */
export const finishAd = createServerFn({ method: "POST" }).inputValidator((i: { initData: string; id: string }) => { auth(i); if (!/^[0-9a-f-]{36}$/i.test(i.id)) throw new Error("Invalid ad"); return i; }).handler(async ({ data }) => {
 const { user, db } = await context(data.initData);
 const { data: row } = await db.from("tsla_ad_views").select("id,created_at,confirmed_at").eq("id", data.id).eq("user_id", user.id).maybeSingle();
 if (!row) throw new Error("Ad not found");
 if (!row.confirmed_at) {
  if (Date.now() - new Date(row.created_at).getTime() < 8000) throw new Error("Watch the full ad to get credit");
  await db.from("tsla_ad_views").update({ confirmed_at: new Date().toISOString() }).eq("id", row.id).is("confirmed_at", null);
 }
 const since = new Date(); since.setUTCHours(0, 0, 0, 0);
 const { count } = await db.from("tsla_ad_views").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("confirmed_at", since.toISOString());
 return { today: count ?? 0 };
});
