import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { InfoPage } from "@/components/ui-kit";

export const Route = createFileRoute("/guide")({ ssr: false, head: () => ({ meta: [
  { title: "Tesla — How to earn" }, { name: "description", content: "How mining, tasks, referrals and holding rewards work in Tesla." },
  { property: "og:title", content: "Tesla — How to earn" }, { property: "og:description", content: "How mining, tasks, referrals and holding rewards work in Tesla." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }
]}), component: Guide });

function Guide() {
  const { x, lang } = useStore();
  const ar = lang === "ar";
  const sections = [
    { h: "Mining", p: "Press start mining once. Mining then runs automatically forever, accumulating TSLA rewards up to the two-hour cap. When the ring around your photo is full, tap claim to collect and the cycle restarts automatically." },
    { h: "Tasks", p: "Open the tasks page and complete available tasks such as joining channels. Completion is verified automatically and the reward is added to your balance instantly. Completed tasks disappear from the list." },
    { h: "Referrals", p: "Share your invitation link. You earn 25 TSLA for every friend who joins, plus an ongoing 10% of the mining rewards of everyone you invited." },
    { h: "Holding power", p: "The more TSLA value you hold — in the app or in your linked wallet — the higher your level and daily reward, automatically. Levels run from $0.10 up to $10,000 with a daily yield of 50% of the tier value, paid in TSLA. Your coins are never deducted; you only buy and hold." },
    { h: "Withdrawals", p: "Withdrawals are in TSLA only, with a 100 TSLA minimum and a 1 TSLA fee. Connect your wallet on the wallet page and the amount is sent straight to it." },
    { h: "Important note", p: "Dollar figures are estimates based on the hourly market price, not guaranteed cash returns. Token prices fluctuate." },
  ];
  return <InfoPage title={x("guide")} sections={sections} />;
}
