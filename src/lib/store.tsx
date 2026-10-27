import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { bootstrap } from "./api.functions";
import { initTelegram } from "./telegram";
import { pickLang, translator, RTL, extraTranslator, type ExtraKey, type TKey } from "./i18n";

type Data = Awaited<ReturnType<typeof bootstrap>>;

type Store = {
  initData: string;
  demo: boolean;
  data: Data | null;
  error: string | null;
  lang: string;
  x: (k: ExtraKey) => string;
  t: (k: TKey) => string;
  refresh: () => Promise<void>;
  patchMe: (p: Partial<Data["me"]>) => void;
  setData: React.Dispatch<React.SetStateAction<Data | null>>;
};

const Ctx = createContext<Store | null>(null);

const demoData = (lang: string): Data => ({
  me: {
    id: 0, username: "guest", first_name: "Guest", photo_url: null, language_code: lang,
    balance: 0, power_level: 0, mining_started_at: null, wallet_address: null, referred_by: null,
    subscribed_until: null, created_at: new Date().toISOString(),
  } as any,
  isAdmin: false,
  tasks: [], done: [], referrals: [], withdrawals: [], referralCount: 0, claimedGoals: [],
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [initData, setInitData] = useState("");
  const [lang, setLang] = useState("en");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async (init: string) => {
    try {
      setData(await bootstrap({ data: { initData: init } }));
    } catch (e: any) {
      setError(e?.message ?? "Error");
    }
  }, []);

  useEffect(() => {
    const wa = initTelegram();
    const l = "en";
    setLang(l);
    document.documentElement.lang = l;
    document.documentElement.dir = RTL.has(l) ? "rtl" : "ltr";
    const init = wa?.initData ?? "";
    setInitData(init);
    if (!init) {
      setDemo(true);
      setData(demoData(l));
    } else load(init);
    const onFocus = () => { if (init) load(init); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const value = useMemo<Store>(() => ({
    initData, demo, data, error, lang, t: translator(lang), x: extraTranslator(lang), setData,
    refresh: () => (initData ? load(initData) : Promise.resolve()),
    patchMe: (p) => setData((d) => (d ? { ...d, me: { ...d.me, ...p } } : d)),
  }), [initData, demo, data, error, lang, load]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
