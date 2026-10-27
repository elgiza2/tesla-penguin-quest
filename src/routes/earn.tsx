import { createFileRoute } from "@tanstack/react-router";
import { TasksPanel } from "@/components/TasksPanel";

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
  return <div className="pt-2"><TasksPanel /></div>;
}
