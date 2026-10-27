import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/power")({
  head: () => ({ meta: [
    { title: "Tesla — Mining power" },
    { name: "description", content: "Mining power and NFT now live on the mining page." },
    { property: "og:title", content: "Tesla — Mining power" },
    { property: "og:description", content: "Mining power and NFT now live on the mining page." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: () => { throw redirect({ to: "/" }); },
});
