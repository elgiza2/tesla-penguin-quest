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
 const { data: row, error } = await db.from("tsla_ad_views").insert({user_id:user.id}).select("id").single();
 if(error || !row) throw new Error("Unable to start ad");
 return { id: row.id };
});
export const adProgress = createServerFn({ method: "POST" }).inputValidator(auth).handler(async ({ data }) => {
 const { user, db } = await context(data.initData);
 const { count, error } = await db.from("tsla_ad_views").select("id", { count:"exact", head:true }).eq("user_id",user.id).not("confirmed_at","is",null).is("consumed_by",null);
 if(error) throw new Error("Unable to refresh ads");
 return { count: count ?? 0 };
});
