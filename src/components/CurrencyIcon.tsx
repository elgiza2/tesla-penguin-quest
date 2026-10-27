import gram from "@/assets/gram-official.svg.asset.json";
import stars from "@/assets/telegram-stars.png.asset.json";
export function CurrencyIcon({ currency, className = "size-5" }: { currency: "gram" | "stars"; className?: string }) {
  return <img src={currency === "gram" ? gram.url : stars.url} alt={currency === "gram" ? "GRAM" : "Telegram Stars"} width={32} height={32} className={`shrink-0 object-contain ${className}`} />;
}