import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { completeTask } from "@/lib/api.functions";
import { claimStarReward, freeStatus } from "@/lib/cases.functions";
import { pendingTasks } from "@/lib/task-visibility";
import { openLink, haptic } from "@/lib/telegram";
import { shareInvite } from "@/lib/invite";
import { TaskRow } from "@/components/TaskRow";
import { useRewardedAd } from "@/components/AdTask";
import { BoxArt } from "@/components/BoxArt";
import team from "@/assets/mascot-invite.png";
import adsArt from "@/assets/mascot-tasks.png";

export const TASK_REWARD_STARS = 2;

export function TasksPanel() {
  const { data, initData, demo, lang, refresh } = useStore();
  const qc = useQueryClient();
  const ad = useRewardedAd();
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const waiting = useRef<any>(null);
  const { data: free } = useQuery({ queryKey: ["free", initData], enabled: !demo && !!initData, queryFn: () => freeStatus({ data: { initData } }) });

  useEffect(() => {
    const onFocus = () => { const task = waiting.current; if (task) { waiting.current = null; void claim(task, true); } };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  });
  if (!data) return null;
  const tasks = pendingTasks(data.tasks, data.done);
  const reload = async () => { await qc.invalidateQueries({ queryKey: ["free"] }); await refresh(); };

  async function claim(task: any, silent = false) {
    if (demo) { toast("Open Tesla in Telegram to complete tasks"); return; }
    try {
      await completeTask({ data: { initData, taskId: task.id } });
      haptic("success"); toast.success(`+${TASK_REWARD_STARS} Stars`); await reload();
    } catch (e: any) {
      if (!silent) toast.error(e?.message === "TASK_NOT_VERIFIED" ? "Not completed yet — finish the task and try again" : e.message);
    }
  }
  function onTask(task: any) {
    if (demo) { toast("Open Tesla in Telegram to complete tasks"); return; }
    if (!opened[task.id]) { openLink(task.link); setOpened((o) => ({ ...o, [task.id]: true })); waiting.current = task; return; }
    void claim(task);
  }
  async function reward(source: "invite" | "ads") {
    setBusy(source);
    try { await claimStarReward({ data: { initData, source } }); haptic("success"); toast.success("Stars added"); await reload(); }
    catch (e: any) { toast.error(e?.message ?? "Unable to claim"); } finally { setBusy(null); }
  }
  async function watchAd() {
    const n = await ad.request();
    if (n !== null) await qc.invalidateQueries({ queryKey: ["free"] });
  }

  const ads = Math.min(3, free?.ads_today ?? 0), done = Math.min(2, free?.tasks_today ?? 0);
  const refs = free?.refs ?? Number((data as any).referralCount ?? 0);
  const title = (task: any) => task.title_i18n?.[lang] || task.title;

  return (
    <div className="space-y-3">
      <Link to="/case/$caseId" params={{ caseId: "tasks" }} className="surface relative flex items-center gap-3 overflow-hidden rounded-3xl p-4 pr-24">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">Daily Tasks Box</p>
          <p className="mt-1 text-xs text-muted-foreground">{free?.tasks_claimed ? "Opened today · back tomorrow" : `Tasks ${done}/2 · Ads ${ads}/3`}</p>
          <div className="mt-2.5 flex gap-1">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 w-7 rounded-full ${i < done + ads ? "brand-fill" : "bg-muted"}`} />)}</div>
        </div>
        <div className="absolute -right-2 top-1/2 size-24 -translate-y-1/2"><BoxArt caseId="tasks" index={0} className="size-full" /></div>
      </Link>

      <TaskRow art={adsArt} title={free?.ads_claimed ? "Ads watched today" : `Watch 3 ads (${ads}/3)`} reward={TASK_REWARD_STARS} tickets={0}
        label={busy === "ads" || ad.busy ? "…" : free?.ads_claimed ? "Done" : ads >= 3 ? "Claim" : "Watch"} disabled={busy === "ads" || ad.busy || !!free?.ads_claimed}
        onClick={() => ads >= 3 ? void reward("ads") : void watchAd()} />
      <TaskRow art={team} title={`Invite friends · ${refs} joined`} reward={TASK_REWARD_STARS} tickets={0}
        label={busy === "invite" ? "…" : (free?.invite_unclaimed ?? 0) > 0 ? `Claim ${free!.invite_unclaimed * TASK_REWARD_STARS}` : "Invite"} disabled={busy === "invite"}
        onClick={() => (free?.invite_unclaimed ?? 0) > 0 ? void reward("invite") : shareInvite(data.me.id)} />
      {tasks.map((task: any) => <TaskRow key={task.id} image={task.image_url} title={title(task)} reward={TASK_REWARD_STARS} tickets={0}
        label={opened[task.id] ? "Claim" : "Go"} onClick={() => onTask(task)} />)}
      {ad.dialog}
    </div>
  );
}
