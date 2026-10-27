import { createFileRoute, redirect } from "@tanstack/react-router";
import { SWAP_URL } from "@/lib/config";

export const Route = createFileRoute("/swap")({
  ssr: false,
  beforeLoad: () => { throw redirect({ to: "/profile", statusCode: 301 }); },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Tesla — Swap" },
      { name: "description", content: "Buy TSLA with GRAM on STON.fi." },
      { property: "og:title", content: "Swap GRAM to TSLA" },
      { property: "og:description", content: "Buy TSLA with GRAM on STON.fi." },
    ],
  }),
  component: () => (
    <div className="glass -mx-1 flex-1 overflow-hidden rounded-3xl">
      <iframe src={SWAP_URL} title="STON.fi" className="h-[calc(100dvh-180px)] w-full border-0" allow="clipboard-write" />
    </div>
  ),
});
