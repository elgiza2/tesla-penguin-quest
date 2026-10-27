import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/nft")({
  head: () => ({ meta: [
    { title: "Tesla — NFT collection" },
    { name: "description", content: "Explore Tesla collectible characters and their mining, referral and task benefits." },
    { property: "og:title", content: "Tesla — NFT collection" },
    { property: "og:description", content: "Explore Tesla collectible characters and their mining, referral and task benefits." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
