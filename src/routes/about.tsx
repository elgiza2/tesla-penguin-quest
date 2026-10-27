import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { InfoPage } from "@/components/ui-kit";

export const Route = createFileRoute("/about")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — About the project" }, { name: "description", content: "About Tesla, the TSLA token and the TON network." },
  { property: "og:title", content: "About Tesla & TSLA" }, { property: "og:description", content: "About Tesla, the TSLA token and the TON network." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
]}), component: About });

function About() {
  const { x, lang } = useStore();
  const ar = lang === "ar";
  const sections = [
    { h: "What is Tesla?", p: "Tesla is a Telegram Mini App built on the TON network. It lets you mine the TSLA token and manage your balance and wallet in one place, using your Telegram identity with no extra sign-up." },
    { h: "What is TSLA?", p: "TSLA is the project's token on TON. You can mine it inside the app, buy it on STON.fi, or deposit and withdraw it from the wallet page." },
    { h: "How do rewards work?", p: "Mining rewards depend on the value of TSLA you hold. The higher your holdings, the higher your level and daily yield — automatically, without any coins being deducted from you." },
    { h: "Transparency", p: "All payments and withdrawals happen on the TON blockchain and are publicly verifiable. Wallet connection uses the official TON Connect and we never ask for your private keys." },
    { h: "Risks", p: "Cryptocurrency prices are volatile. Rewards and liquidity are not guaranteed, and displayed dollar figures are estimates. Never invest more than you can afford to lose." },
  ];
  return <InfoPage title={x("about")} sections={sections} />;
}
