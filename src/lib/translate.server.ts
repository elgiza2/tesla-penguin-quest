import { generateResponse } from "@lovable.dev/ai-gateway";
const LANGS = "ar (Arabic), ru, es, fr, tr, fa, id, pt, de, zh (Simplified), hi, uk";
/** Translates a short task title into all supported app languages. Returns {} on failure. */
export async function translateTitle(title: string): Promise<Record<string, string>> {
  try {
    const r = await generateResponse({ model: "openai/gpt-6-astra", input: `Translate this short Telegram app task title into these languages: ${LANGS}. Keep brand names (Tesla, TSLA, GRAM, STON.fi, Telegram) unchanged. Return ONLY a JSON object mapping language code to translation.\n\nTitle: ${title}` });
    const text = (r.output ?? []).flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(json)) if (typeof v === "string" && k.length <= 3) out[k] = v.slice(0, 160);
    return out;
  } catch (e) { console.error("Task translation failed", e); return {}; }
}
