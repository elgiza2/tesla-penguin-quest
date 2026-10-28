import { AdTask } from "@/components/AdTask";
import { ShareTasks } from "@/components/ShareTasks";
import { TaskRow } from "@/components/TaskRow";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Ticket } from "lucide-react";
import { useStore } from "@/lib/store";
import { claimReferralGoal, completeTask } from "@/lib/api.functions";
import { REFERRAL_GOALS } from "@/lib/config";
import { pendingTasks } from "@/lib/task-visibility";
import { openLink, haptic } from "@/lib/telegram";
import { fmt } from "@/lib/ton";
import team from "@/assets/mascot-invite.png";
import { CoinIcon, GhostButton, TSLA_ICON, Segmented } from "@/components/ui-kit";



const BUILT_IN = ["story", "share"];

export function TasksPanel() {
  const { data, t, x, initData, demo, setData, lang, refresh } = useStore();
  const [app, setApp] = useState<string | null>(null);
  const [cat, setCat] = useState<"ours" | "partners" | "others">("ours");
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [busyGoal, setBusyGoal] = useState<number | null>(null);
  const waiting = useRef<any>(null);
  useEffect(() => {
    const onFocus = () => { const task = waiting.current; if (task) { waiting.current = null; void claim(task, true); } };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  });
  if (!data) return null;
  const pending = pendingTasks(data.tasks, data.done).filter((task: any) => (task.app_name || !BUILT_IN.includes(task.kind)) && (task.app_category || "ours") === cat);
  const apps = new Map<string, { name: string; image: string | null; tasks: any[] }>();
  for (const task of pending) if (task.app_name) {
    const a = apps.get(task.app_name) ?? { name: task.app_name, image: task.app_image || task.image_url, tasks: [] as any[] };
    a.tasks.push(task); apps.set(task.app_name, a);
  }
  const pinned = pending.filter((task: any) => !task.app_name && Number(task.sort) < 0);
  const shown = pending.filter((task: any) => !task.app_name && Number(task.sort) >= 0);
  const refCount = Number((data as any).referralCount ?? data.referrals.length);
  const claimedGoals: number[] = (data as any).claimedGoals ?? [];
  const goals = REFERRAL_GOALS.filter((g) => !claimedGoals.includes(g.goal));

  async function claim(task: any, silent = false) {
    if (demo) { toast(t("openInTelegram")); return; }
    try {
      const r = await completeTask({ data: { initData, taskId: task.id } });
      setData((d) => d && { ...d, me: { ...d.me, balance: r.balance, power_level: r.power_level }, done: [...new Set([...d.done, task.id])] });
      haptic("success");
      if (r.previewVerified) toast.success("Tiger Case verification passed in Preview; no TSLA was credited.");
      else toast.success(`+${fmt(task.reward)} TSLA · +2 tickets`);
    } catch (e: any) {
      if (!silent) toast.error(e?.message === "TASK_NOT_VERIFIED" ? x("taskNotVerified") : e.message);
    }
  }
  function onTask(task: any) {
    if (demo) { toast("Sample task — no rewards credited"); return; }
    if (!opened[task.id]) {
      openLink(task.link);
      setOpened((o) => ({ ...o, [task.id]: true }));
      waiting.current = task;
      return;
    }
    void claim(task);
  }
  async function claimGoal(goal: number) {
    if (demo) { toast(t("openInTelegram")); return; }
    setBusyGoal(goal);
    try { const r = await claimReferralGoal({ data: { initData, goal } }); toast.success(`+${r.reward} TSLA`); await refresh(); }
    catch (e: any) { toast.error(e?.message || "Unable to claim"); } finally { setBusyGoal(null); }
  }
  const title = (task: any) => task.title_i18n?.[lang] || task.title;
  const total = (list: any[]) => list.reduce((s, task) => s + Number(task.reward || 0), 0);
  const empty = pending.length === 0 && !(cat === "others" && goals.length);
  return (
    <div>
      <div className="mb-3"><Segmented value={cat} onChange={(v) => { setCat(v); setApp(null); }} options={[
        { key: "ours", label: "Our tasks" },
        { key: "partners", label: "Partners" },
        { key: "others", label: "Others" },
      ]} /></div>
      <div className="space-y-3">
        {cat === "others" && <AdTask />}
        {cat === "others" && goals.map((g) => {
          const ready = refCount >= g.goal;
          return <TaskRow key={g.goal} title={`Invite ${g.goal} friends (${Math.min(refCount, g.goal)}/${g.goal})`} reward={g.reward} tickets={0}
            label={busyGoal === g.goal ? "…" : ready ? "Claim" : "Go"} disabled={busyGoal === g.goal}
            onClick={() => ready ? void claimGoal(g.goal) : toast(`Invite ${g.goal - refCount} more friends from the Friends page`)} />;
        })}
        {cat === "ours" && <TaskRow title={`Invite friends · ${refCount} joined`} reward={25} tickets={6} label="Invite"
          onClick={() => { const link = `https://t.me/Noveaibot?start=ref_${data.me.id}`; openLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Open gift boxes and win Telegram gifts with me on Tesla 🎁")}`); }} />}
        {pinned.map((task: any) => <TaskRow key={task.id} image={task.image_url} title={title(task)} reward={Number(task.reward)}
          label={opened[task.id] ? t("claim") : "Go"} onClick={() => onTask(task)} />)}
        {[...apps.values()].map((a) => (
          <div key={a.name}>
            <GhostButton aria-expanded={app === a.name} onClick={() => setApp(app === a.name ? null : a.name)} className="flex h-auto min-h-20 w-full items-center gap-3 p-3 text-start">
              <CoinIcon src={a.image || TSLA_ICON} className="size-12" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{a.name}</span>
                <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground" dir="ltr">
                  <span className="flex items-center gap-1"><CoinIcon src={TSLA_ICON} className="size-3.5" />+{fmt(total(a.tasks))}</span>
                  <span className="flex items-center gap-1"><Ticket className="size-3.5" />+{a.tasks.length * 2}</span>
                </span>
              </span>
              <ChevronDown aria-hidden="true" className={`size-5 shrink-0 transition-transform duration-300 ${app === a.name ? "rotate-180" : ""}`} />
            </GhostButton>
            {app === a.name && <div className="mt-2 space-y-2">
              {a.tasks.some((task: any) => BUILT_IN.includes(task.kind)) && <ShareTasks onClaim={(task) => claim(task)} />}
              {a.tasks.filter((task: any) => !BUILT_IN.includes(task.kind)).map((task: any) => <TaskRow key={task.id} image={a.image} title={title(task)} reward={Number(task.reward)}
                label={opened[task.id] ? t("claim") : "Go"} onClick={() => onTask(task)} />)}
            </div>}
          </div>
        ))}
        {shown.map((task: any) => <TaskRow key={task.id} image={task.image_url} title={title(task)} reward={Number(task.reward)}
          label={opened[task.id] ? t("claim") : "Go"} onClick={() => onTask(task)} />)}
        {empty && <div className="surface rounded-3xl py-12 text-center text-sm font-bold text-muted-foreground">{x("allDone")}</div>}
      </div>
    </div>
  );
}
