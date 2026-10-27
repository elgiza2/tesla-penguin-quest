import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { crashValue, higherWins, memoryMatches, type ArcadeGame } from "./arcade-rules";
const auth = z.object({ initData: z.string().min(1) });
type Round = { id: string; game: string; status: string; score: number; state: Record<string, any>; created_at: string; updated_at: string };
function random(max: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return (a[0] ?? 0) % max; }
function visible(r: Round) {
 const s = r.state;
 return { id:r.id, game:r.game as ArcadeGame, status:r.status, score:r.score, startedAt:r.created_at,
  card: Number(s['card'] ?? 1), opened: (s['opened'] ?? []) as number[], sequence: r.game === "memory" ? s['sequence'] as number[] : [],
  multiplier: Number(s['multiplier'] ?? 1), mines: r.status !== "playing" ? (s['mines'] ?? []) as number[] : [], };
}
export const arcadeStatus = createServerFn({ method:"POST" }).inputValidator((i: unknown)=>auth.parse(i)).handler(async({data})=>{
 const { verifyInitData } = await import("./tg-auth.server"); const {user}=await verifyInitData(data.initData);
 const {supabaseAdmin:db}=await import("@/integrations/supabase/client.server");
 const {data:me,error}=await db.from("tsla_tg_users").select("tickets,tickets_daily_at").eq("id",user.id).single();
 if(error || !me) throw new Error("Unable to load tickets");
 const {data:round}=await db.from("tsla_arcade_rounds").select("*").eq("user_id",user.id).eq("status","playing").gt("created_at",new Date(Date.now()-600000).toISOString()).maybeSingle();
 const {data:recent}=await db.from("tsla_arcade_rounds").select("game,score,status,created_at").eq("user_id",user.id).neq("status","playing").order("created_at",{ascending:false}).limit(5);
 return {tickets:me.tickets,lastDaily:me.tickets_daily_at,round:round ? visible(round as Round) : null,recent:recent ?? []};
});
export const claimTickets = createServerFn({method:"POST"}).inputValidator((i:unknown)=>auth.parse(i)).handler(async({data})=>{
 const {verifyInitData}=await import("./tg-auth.server"); const {user}=await verifyInitData(data.initData); const {supabaseAdmin:db}=await import("@/integrations/supabase/client.server");
 const {data:tickets,error}=await db.rpc("tsla_daily_tickets",{p_user:user.id}); if(error) throw new Error("Daily gift already claimed. Come back in 24 hours."); return {tickets:Number(tickets)};
});
export const startArcade = createServerFn({method:"POST"}).inputValidator((i:unknown)=>auth.extend({game:z.enum(["crash","mines","higher","memory"])}).parse(i)).handler(async({data})=>{
 const {verifyInitData}=await import("./tg-auth.server"); const {user}=await verifyInitData(data.initData); const {supabaseAdmin:db}=await import("@/integrations/supabase/client.server");
 const mines:number[]=[]; while(mines.length<3){const n=random(16);if(!mines.includes(n))mines.push(n);}
 const state = data.game==="crash" ? {limit:1.15+random(600)/100,multiplier:1} : data.game==="mines" ? {mines,opened:[]} : data.game==="higher" ? {card:1+random(13)} : {sequence:Array.from({length:3},()=>random(4)),picks:[]};
 const {data:round,error}=await db.rpc("tsla_arcade_start",{p_user:user.id,p_game:data.game,p_state:state}); if(error || !round)throw new Error("You need a ticket. Claim your daily gift."); return visible(round as Round);
});
export const arcadeMove = createServerFn({method:"POST"}).inputValidator((i:unknown)=>auth.extend({id:z.string().uuid(),choice:z.number().int().min(-2).max(15)}).parse(i)).handler(async({data})=>{
 const {verifyInitData}=await import("./tg-auth.server"); const {user}=await verifyInitData(data.initData); const {supabaseAdmin:db}=await import("@/integrations/supabase/client.server");
 const {data:row,error}=await db.from("tsla_arcade_rounds").select("*").eq("id",data.id).eq("user_id",user.id).single(); if(error || !row)throw new Error("Round not found");
 const r=row as Round; if(r.status!=="playing")return visible(r);
 const s={...r.state}; let status="playing", score=r.score;
 if(data.choice===-2 || Date.now()-Date.parse(r.created_at)>600000)status="ended";
 else if(r.game==="crash") { const value=crashValue(Date.now()-Date.parse(r.created_at));s['multiplier']=Math.min(value,Number(s['limit'])); if(value>=Number(s['limit']))status="lost"; else if(data.choice===-1){status="won";score=Math.floor(value*100);} }
 else if(r.game==="mines") { if(data.choice===-1){status="won";}else{if(s['opened'].includes(data.choice))return visible(r);s['opened']=[...s['opened'],data.choice]; if(s['mines'].includes(data.choice))status="lost";else{score+=100;if(s['opened'].length===13)status="won";}} }
 else if(r.game==="higher") { if(data.choice===-1 || data.choice===1){const next=1+random(13);const won=higherWins(s['card'],next,data.choice);s['card']=next;if(won){score+=100;if(score>=1000)status="won";}else status="lost";}else throw new Error("Choose higher or lower"); }
 else { if(data.choice>3 || data.choice<0)throw new Error("Invalid tile");s['picks']=[...s['picks'],data.choice];if(!memoryMatches(s['sequence'],s['picks']))status="lost";else if(s['picks'].length===s['sequence'].length){score+=100;if(s['sequence'].length>=10)status="won";else{s['sequence']=[...s['sequence'],random(4)];s['picks']=[];}} }
 const {data:updated,error:writeError}=await db.rpc("tsla_arcade_update",{p_user:user.id,p_id:r.id,p_version:r.updated_at,p_state:s,p_score:score,p_status:status}); if(writeError || !updated)throw new Error("Round updated. Please try again.");return visible(updated as Round);
});export const gameBoard = createServerFn({method:"POST"}).inputValidator((i:unknown)=>auth.extend({game:z.enum(["crash","mines","higher","memory"])}).parse(i)).handler(async({data})=>{
 const {verifyInitData}=await import("./tg-auth.server"); const {user}=await verifyInitData(data.initData); const {supabaseAdmin:db}=await import("@/integrations/supabase/client.server");
 const [top,mine]=await Promise.all([(db as any).rpc("tsla_arcade_leaderboard",{p_game:data.game}), db.from("tsla_arcade_rounds").select("score,status,created_at").eq("user_id",user.id).eq("game",data.game).neq("status","playing").order("created_at",{ascending:false}).limit(10)]);
 if(top.error) throw new Error("Unable to load leaderboard");
 return { top:(top.data??[]) as {user_id:number;first_name:string|null;username:string|null;photo_url:string|null;best:number}[], history:(mine.data??[]) as {score:number;status:string;created_at:string}[] };
});
