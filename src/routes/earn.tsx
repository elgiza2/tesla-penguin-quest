import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TasksPanel } from "@/components/TasksPanel";
import { ReferralsPanel } from "@/components/ReferralsPanel";

export const Route = createFileRoute("/earn")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Tesla — Tasks & Friends" },
      { name: "description", content: "Complete tasks and invite friends to earn rewards in Tesla." },
      { property: "og:title", content: "Tesla — Tasks & Friends" },
      { property: "og:description", content: "Complete tasks and invite friends to earn rewards in Tesla." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Earn,
});

function Earn() {
  const [tab, setTab] = useState<"tasks" | "friends">("tasks");
  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-2xl">Earn</h1>
      <div className="grid grid-cols-2 rounded-2xl bg-card p-1" role="tablist">
        {(["tasks", "friends"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`h-10 rounded-xl text-sm transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t === "tasks" ? "Tasks" : "Friends"}
          </button>
        ))}
      </div>
      {tab === "tasks" ? <TasksPanel /> : <ReferralsPanel />}
    </div>
  );
}
