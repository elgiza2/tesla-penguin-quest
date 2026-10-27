import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { InfoPage } from "@/components/ui-kit";

export const Route = createFileRoute("/whitepaper")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — White paper" }, { name: "description", content: "Tesla white paper draft: mining model, holding rewards and tokenomics." },
  { property: "og:title", content: "Tesla White Paper" }, { property: "og:description", content: "Tesla white paper draft: mining model, holding rewards and tokenomics." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
]}), component: Whitepaper });

function Whitepaper() {
  const { x, lang } = useStore();
  const ar = lang === "ar";
  const sections = [
    { h: "Draft", p: "This is a preliminary draft of the white paper, not a final version. Funding, total supply, sustainability, audit and legal terms have not yet been approved by the project owner." },
    { h: "Identity & access", p: "Tesla uses Telegram identity for sign-in — no passwords, no registration. Wallets connect via the official TON Connect, and the app never asks for private keys." },
    { h: "Mining model", p: "Mining runs continuously after pressing start, with a two-hour accumulation cap. After claiming, accumulation restarts automatically. The daily rate depends on the holding level." },
    { h: "Holding rewards", p: "The current model targets a daily yield of 50% of the selected holding tier value, paid in TSLA. Tiers range from $0.10 to $10,000 and update automatically, up and down, as your holdings and the market price change." },
    { h: "Referrals & tasks", p: "The referral bonus is 25 TSLA per friend, plus an ongoing 10% commission on invited users' mining rewards. Tasks grant fixed rewards after verified completion." },
    { h: "Fees & withdrawals", p: "Withdrawals are in TSLA only, with a 100 TSLA minimum and a flat 1 TSLA fee per withdrawal, used to cover on-chain operating costs." },
    { h: "Disclaimer", p: "This document is not an investment offer or a guarantee of returns. Cryptocurrency prices are volatile and may lose value." },
  ];
  return <InfoPage title={x("whitepaper")} sections={sections} />;
}
