import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tesla — Gift Tasks" }, { name: "description", content: "Tasks and invitations for Telegram gift rewards." }, { property: "og:title", content: "Tesla — Gift Tasks" }, { property: "og:description", content: "Tasks and invitations for Telegram gift rewards." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  beforeLoad: () => { throw redirect({ to: "/earn" }); },
});
