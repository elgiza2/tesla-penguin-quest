import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/referrals")({
  head: () => ({ meta: [{ title: "Tesla — Invite Friends" }, { name: "description", content: "Invite friends to explore Telegram gifts in Tesla." }, { property: "og:title", content: "Tesla — Invite Friends" }, { property: "og:description", content: "Invite friends to explore Telegram gifts in Tesla." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  beforeLoad: () => { throw redirect({ to: "/earn" }); },
});
