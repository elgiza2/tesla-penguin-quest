import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { InfoPage } from "@/components/ui-kit";

export const Route = createFileRoute("/roadmap")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — Roadmap" }, { name: "description", content: "Tesla project roadmap: what is live and what comes next." },
  { property: "og:title", content: "Tesla Roadmap" }, { property: "og:description", content: "Tesla project roadmap: what is live and what comes next." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
]}), component: Roadmap });

function Roadmap() {
  const { x, lang } = useStore();
  const ar = lang === "ar";
  const sections = [
    { h: "Live now", p: "The full Telegram app: continuous mining with a two-hour cap, tasks with real verification, a referral system with 10% commission, TON wallet connection with automatic ownership verification, and on-chain TSLA withdrawals." },
    { h: "In progress", p: "Finalizing the NFT collection: address, price, metadata and minting contract, then testing purchase and instant minting on-chain before enabling it for everyone." },
    { h: "Next", p: "Completing full user-signed withdrawal testing, and enabling automatic deposits that credit incoming payments to your in-app balance after on-chain verification." },
    { h: "Later", p: "Approving the final white paper with funding and supply details, expanding the admin panel, and launching daily channel posts after the project owner's approval." },
    { h: "Note", p: "Dates are not committed yet; items ship in order of readiness and testing." },
  ];
  return <InfoPage title={x("roadmap")} sections={sections} />;
}
