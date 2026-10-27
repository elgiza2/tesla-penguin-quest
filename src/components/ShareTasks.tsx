import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import storyImg from "@/assets/task-story.jpg";
import msgImg from "@/assets/task-message.jpg";
import { useStore } from "@/lib/store";
import { getWebApp } from "@/lib/telegram";
import { prepareShareMessage } from "@/lib/share.functions";
import { TaskRow } from "@/components/TaskRow";
import { pendingTasks } from "@/lib/task-visibility";

const APP = "https://tesla.vercel.app";

export function ShareTasks({ onClaim }: { onClaim: (task: any) => Promise<void> }) {
  const { data, initData, demo } = useStore();
  const prepare = useServerFn(prepareShareMessage);
  if (!data) return null;
  const link = `https://t.me/sramaibot?start=ref_${data.me.id}`;
  const wa = getWebApp();
  const find = (kind: string) => pendingTasks(data.tasks, data.done).find((t: any) => t.kind === kind);
  const storyTask = find("story"), shareTask = find("share");

  function story() {
    if (demo || !wa?.shareToStory) { toast("Open Tesla in Telegram to share a story."); return; }
    wa.shareToStory(`${APP}/start-banner.jpg`, {
      text: `Mining TSLA on Tesla. Join my crew: ${link}`,
      widget_link: { url: link, name: "Open Tesla" },
    });
    if (storyTask) setTimeout(() => void onClaim(storyTask), 1500);
  }
  async function message() {
    if (demo || !wa?.shareMessage) { toast("Open Tesla in Telegram to share."); return; }
    try {
      const r = await prepare({ data: { initData } });
      wa.shareMessage(r.id, (sent: boolean) => { if (sent && shareTask) void onClaim(shareTask); });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Please try again"); }
  }
  return <>
    {storyTask && <TaskRow image={storyImg} title="Share Tesla to your story" reward={Number(storyTask.reward)} onClick={story} />}
    {shareTask && <TaskRow image={msgImg} title="Send Tesla to 3 friends" reward={Number(shareTask.reward)} onClick={message} />}
  </>;
}
