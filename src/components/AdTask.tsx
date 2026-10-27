import { useEffect, useState } from "react";
import adImg from "@/assets/task-ads.jpg";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { beginAd, adProgress } from "@/lib/ads.functions";
import { GhostButton, PrimaryButton } from "@/components/ui-kit";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
type AdWindow = Window & { show_11951290?: (options: {ymid:string}) => Promise<unknown> };
export async function loadSdk() {
 const w = window as AdWindow;
 if(w.show_11951290) return w.show_11951290;
 await new Promise<void>((resolve,reject)=>{
 const old = document.getElementById("monetag-sdk"); if(old) old.remove();
 const script = document.createElement("script"); script.id="monetag-sdk"; script.src="https://libtl.com/sdk.js"; script.dataset['zone']="11951290"; script.dataset['sdk']="show_11951290"; script.onload=()=>resolve(); script.onerror=()=>{script.remove();reject(new Error("No ad is available right now"));}; document.head.appendChild(script);
 });
 if(!w.show_11951290) throw new Error("No ad is available right now");
 return w.show_11951290;
}
export function AdTask() {
 const { demo, initData, t } = useStore(); const [count,setCount] = useState(0),[open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!demo) adProgress({data:{initData}}).then(r=>setCount(r.count)).catch(()=>{});},[demo,initData]);
 async function watch() { if(demo){toast(t("openInTelegram"));return;} setBusy(true); try { const show = await loadSdk(); const {id}=await beginAd({data:{initData}}); setOpen(false); await show({ymid:id}); let verified=false; for(let i=0;i<6;i++){ const r=await adProgress({data:{initData}});setCount(r.count); if(r.count>count){verified=true;break;} await new Promise(r=>setTimeout(r,2000)); } toast(verified ? "Ad confirmed · +1 ticket" : "Waiting for Monetag confirmation"); } catch(e){toast.error(e instanceof Error ? e.message : "Unable to show ad");}finally{setBusy(false);} }
 return <section className="flex items-center gap-3 border-b border-border py-4"><img src={adImg} alt="" loading="lazy" className="size-12 shrink-0 rounded-2xl object-cover"/><div className="min-w-0 flex-1"><h2 className="text-sm">Watch a Monetag ad</h2></div><GhostButton onClick={()=>setOpen(true)} disabled={busy}>{busy ? "Checking…" : "Start"}</GhostButton><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogTitle>Watch an ad?</DialogTitle><DialogDescription>A full-screen rewarded ad will open only with your consent. Clicking the advertiser is not required.</DialogDescription><PrimaryButton onClick={watch} disabled={busy}>Agree & watch</PrimaryButton><GhostButton onClick={()=>setOpen(false)}>Cancel</GhostButton></DialogContent></Dialog></section>;
}

export function BetweenRoundsAd({ onDone }: { onDone?: () => void }) {
 const { demo, initData } = useStore(); const [busy,setBusy]=useState(false);
 async function watch(){ if(demo){toast("Open Tesla in Telegram to watch ads.");return;} setBusy(true); try{ const show=await loadSdk(); const {id}=await beginAd({data:{initData}}); await show({ymid:id}); toast("Thanks for watching"); onDone?.(); }catch(e){toast.error(e instanceof Error?e.message:"Unable to show ad");}finally{setBusy(false);} }
 return <GhostButton onClick={watch} disabled={busy} className="flex w-full items-center justify-center gap-2"><img src={adImg} alt="" className="size-6 rounded-lg object-cover"/>{busy?"Loading ad…":"Watch an ad"}</GhostButton>;
}
