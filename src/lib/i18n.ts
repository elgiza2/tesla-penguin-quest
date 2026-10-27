import full from "./i18n-full.json";
const FULL = full as Record<string, Record<string, string>>;
const keys = [
  "home", "tasks", "power", "wallet", "swap",
  "level", "balance", "startMining", "mining", "claim", "remaining",
  "tasksTab", "referralsTab", "start", "done", "inviteFriends", "inviteText", "copyLink", "copied", "friends",
  "miningPower", "perDay", "current", "unlock", "buyOnSton", "verifyHoldings", "needWallet", "insufficient",
  "connectWallet", "deposit", "withdraw", "amount", "send", "address", "pending", "price", "minWithdraw",
  "fee", "sent", "withdrawals", "admin", "users", "addTask", "taskTitle", "taskLink", "taskReward", "save",
  "nft", "buyNft", "nftSoon", "adminsOnly",
  "subscription", "subscribe", "subscribed", "openInTelegram", "demo",
] as const;
export type TKey = (typeof keys)[number];
type Dict = Record<TKey, string>;

const en: Dict = {
  home: "Home", tasks: "Tasks", power: "Power", wallet: "Wallet", swap: "Swap",
  level: "Level", balance: "Balance", startMining: "Start mining", mining: "Mining", claim: "Claim", remaining: "remaining",
  tasksTab: "Tasks", referralsTab: "Referrals", start: "Start", done: "Done", inviteFriends: "Invite friends",
  inviteText: "Earn a bonus for every friend who joins", copyLink: "Copy link", copied: "Copied", friends: "Friends",
  miningPower: "Mining power", perDay: "per day", current: "Current", unlock: "Unlock", buyOnSton: "Buy TSLA on STON.fi",
  verifyHoldings: "Verify my holdings", needWallet: "Connect your wallet first", insufficient: "Not enough TSLA",
  connectWallet: "Connect wallet", deposit: "Deposit", withdraw: "Withdraw", amount: "Amount", send: "Send",
  address: "Address", pending: "Pending", price: "Price", minWithdraw: "Minimum withdrawal",
  fee: "Fee", sent: "Sent", withdrawals: "Withdrawals", admin: "Admin", users: "Users",
  addTask: "Add task", taskTitle: "Task title", taskLink: "Link", taskReward: "Reward (TSLA)", save: "Save",
  nft: "NFT", buyNft: "Buy NFT", nftSoon: "The NFT collection is coming soon", adminsOnly: "Admins only",
  subscription: "Monthly Pro", subscribe: "Subscribe", subscribed: "Active until",
  openInTelegram: "Open this app inside Telegram to save progress", demo: "Preview mode",
};
const ar: Dict = {
  home: "الرئيسية", tasks: "المهام", power: "القوة", wallet: "المحفظة", swap: "تبديل",
  level: "المستوى", balance: "الرصيد", startMining: "بدء التعدين", mining: "جاري التعدين", claim: "استلام", remaining: "متبقي",
  tasksTab: "المهام", referralsTab: "الإحالة", start: "ابدأ", done: "تم", inviteFriends: "ادعُ أصدقاءك",
  inviteText: "احصل على مكافأة عن كل صديق ينضم", copyLink: "نسخ الرابط", copied: "تم النسخ", friends: "الأصدقاء",
  miningPower: "قوة التعدين", perDay: "في اليوم", current: "الحالي", unlock: "فتح", buyOnSton: "اشترِ TSLA من STON.fi",
  verifyHoldings: "تحقق من رصيدي", needWallet: "اربط محفظتك أولاً", insufficient: "رصيد TSLA غير كافٍ",
  connectWallet: "ربط المحفظة", deposit: "إيداع", withdraw: "سحب", amount: "المبلغ", send: "إرسال",
  address: "العنوان", pending: "قيد المعالجة", price: "السعر", minWithdraw: "الحد الأدنى للسحب",
  fee: "الرسوم", sent: "تم الإرسال", withdrawals: "السحوبات", admin: "الإدارة", users: "المستخدمون",
  addTask: "إضافة مهمة", taskTitle: "عنوان المهمة", taskLink: "الرابط", taskReward: "المكافأة (TSLA)", save: "حفظ",
  nft: "NFT", buyNft: "شراء NFT", nftSoon: "مجموعة الـ NFT قادمة قريبًا", adminsOnly: "للمشرفين فقط",
  subscription: "الاشتراك الشهري", subscribe: "اشترك", subscribed: "فعال حتى",
  openInTelegram: "افتح التطبيق داخل تليجرام لحفظ تقدمك", demo: "وضع المعاينة",
};
const ru: Dict = {
  home: "Главная", tasks: "Задания", power: "Мощность", wallet: "Кошелёк", swap: "Обмен",
  level: "Уровень", balance: "Баланс", startMining: "Начать майнинг", mining: "Майнинг", claim: "Забрать", remaining: "осталось",
  tasksTab: "Задания", referralsTab: "Рефералы", start: "Начать", done: "Готово", inviteFriends: "Пригласить друзей",
  inviteText: "Бонус за каждого приглашённого друга", copyLink: "Копировать", copied: "Скопировано", friends: "Друзья",
  miningPower: "Мощность майнинга", perDay: "в день", current: "Текущий", unlock: "Открыть", buyOnSton: "Купить TSLA на STON.fi",
  verifyHoldings: "Проверить баланс", needWallet: "Сначала подключите кошелёк", insufficient: "Недостаточно TSLA",
  connectWallet: "Подключить кошелёк", deposit: "Пополнить", withdraw: "Вывести", amount: "Сумма", send: "Отправить",
  address: "Адрес", pending: "В обработке", price: "Цена", minWithdraw: "Минимальный вывод",
  fee: "Комиссия", sent: "Отправлено", withdrawals: "Выводы", admin: "Админ", users: "Пользователи",
  addTask: "Добавить задание", taskTitle: "Название задания", taskLink: "Ссылка", taskReward: "Награда (TSLA)", save: "Сохранить",
  nft: "NFT", buyNft: "Купить NFT", nftSoon: "Коллекция NFT скоро появится", adminsOnly: "Только для админов",
  subscription: "Подписка Pro", subscribe: "Подписаться", subscribed: "Активна до",
  openInTelegram: "Откройте приложение в Telegram", demo: "Демо",
};
const es: Dict = {
  home: "Inicio", tasks: "Tareas", power: "Poder", wallet: "Billetera", swap: "Cambiar",
  level: "Nivel", balance: "Saldo", startMining: "Empezar a minar", mining: "Minando", claim: "Reclamar", remaining: "restante",
  tasksTab: "Tareas", referralsTab: "Referidos", start: "Empezar", done: "Hecho", inviteFriends: "Invitar amigos",
  inviteText: "Gana un bono por cada amigo", copyLink: "Copiar enlace", copied: "Copiado", friends: "Amigos",
  miningPower: "Poder de minería", perDay: "por día", current: "Actual", unlock: "Desbloquear", buyOnSton: "Comprar TSLA en STON.fi",
  verifyHoldings: "Verificar mis fondos", needWallet: "Conecta tu billetera", insufficient: "TSLA insuficiente",
  connectWallet: "Conectar billetera", deposit: "Depositar", withdraw: "Retirar", amount: "Cantidad", send: "Enviar",
  address: "Dirección", pending: "Pendiente", price: "Precio", minWithdraw: "Retiro mínimo",
  fee: "Comisión", sent: "Enviado", withdrawals: "Retiros", admin: "Admin", users: "Usuarios",
  addTask: "Añadir tarea", taskTitle: "Título de la tarea", taskLink: "Enlace", taskReward: "Recompensa (TSLA)", save: "Guardar",
  nft: "NFT", buyNft: "Comprar NFT", nftSoon: "La colección NFT llegará pronto", adminsOnly: "Solo administradores",
  subscription: "Pro mensual", subscribe: "Suscribirse", subscribed: "Activo hasta",
  openInTelegram: "Abre la app en Telegram", demo: "Vista previa",
};
const fr: Dict = { ...en,
  home: "Accueil", tasks: "Tâches", power: "Puissance", wallet: "Portefeuille", swap: "Échange",
  level: "Niveau", balance: "Solde", startMining: "Commencer le minage", mining: "Minage", claim: "Récupérer", remaining: "restant",
  tasksTab: "Tâches", referralsTab: "Parrainage", start: "Démarrer", done: "Fait", inviteFriends: "Inviter des amis",
  copyLink: "Copier le lien", copied: "Copié", friends: "Amis", miningPower: "Puissance de minage", perDay: "par jour",
  connectWallet: "Connecter le portefeuille", deposit: "Dépôt", withdraw: "Retrait", amount: "Montant", send: "Envoyer",
  subscribe: "S'abonner", openInTelegram: "Ouvrez l'app dans Telegram",
};
const tr: Dict = { ...en,
  home: "Ana sayfa", tasks: "Görevler", power: "Güç", wallet: "Cüzdan", swap: "Takas",
  level: "Seviye", balance: "Bakiye", startMining: "Madenciliğe başla", mining: "Madencilik", claim: "Topla", remaining: "kaldı",
  tasksTab: "Görevler", referralsTab: "Davetler", start: "Başla", done: "Tamam", inviteFriends: "Arkadaş davet et",
  copyLink: "Bağlantıyı kopyala", copied: "Kopyalandı", friends: "Arkadaşlar", miningPower: "Madencilik gücü", perDay: "günlük",
  connectWallet: "Cüzdan bağla", deposit: "Yatır", withdraw: "Çek", amount: "Miktar", send: "Gönder",
  subscribe: "Abone ol", openInTelegram: "Uygulamayı Telegram'da aç",
};
const fa: Dict = { ...ar,
  home: "خانه", tasks: "وظایف", power: "قدرت", wallet: "کیف پول", swap: "تبادل",
  level: "سطح", balance: "موجودی", startMining: "شروع استخراج", mining: "در حال استخراج", claim: "دریافت",
  connectWallet: "اتصال کیف پول", deposit: "واریز", withdraw: "برداشت", inviteFriends: "دعوت دوستان",
};
const id: Dict = { ...en,
  home: "Beranda", tasks: "Tugas", power: "Daya", wallet: "Dompet", swap: "Tukar",
  balance: "Saldo", startMining: "Mulai menambang", mining: "Menambang", claim: "Klaim",
  connectWallet: "Hubungkan dompet", deposit: "Setor", withdraw: "Tarik", inviteFriends: "Undang teman",
};
const pt: Dict = { ...es,
  home: "Início", tasks: "Tarefas", wallet: "Carteira", balance: "Saldo", startMining: "Começar a minerar",
  mining: "Minerando", claim: "Resgatar", connectWallet: "Conectar carteira", withdraw: "Sacar", inviteFriends: "Convidar amigos",
};
const de: Dict = { ...en,
  home: "Start", tasks: "Aufgaben", power: "Leistung", wallet: "Wallet", swap: "Tauschen",
  balance: "Guthaben", startMining: "Mining starten", mining: "Mining läuft", claim: "Abholen",
  connectWallet: "Wallet verbinden", deposit: "Einzahlen", withdraw: "Auszahlen", inviteFriends: "Freunde einladen",
};
const zh: Dict = { ...en,
  home: "首页", tasks: "任务", power: "算力", wallet: "钱包", swap: "兑换",
  level: "等级", balance: "余额", startMining: "开始挖矿", mining: "挖矿中", claim: "领取",
  connectWallet: "连接钱包", deposit: "充值", withdraw: "提现", inviteFriends: "邀请好友",
};
const hi: Dict = { ...en,
  home: "होम", tasks: "कार्य", power: "पावर", wallet: "वॉलेट", swap: "स्वैप",
  balance: "बैलेंस", startMining: "माइनिंग शुरू करें", mining: "माइनिंग जारी", claim: "क्लेम",
  connectWallet: "वॉलेट जोड़ें", deposit: "जमा", withdraw: "निकासी", inviteFriends: "दोस्तों को बुलाएं",
};
const uk: Dict = { ...ru,
  home: "Головна", tasks: "Завдання", wallet: "Гаманець", startMining: "Почати майнінг",
  connectWallet: "Підключити гаманець", withdraw: "Вивести", inviteFriends: "Запросити друзів",
};

export const dictionaries: Record<string, Dict> = { en, ar, ru, es, fr, tr, fa, id, pt, de, zh, hi, uk };
export const RTL = new Set(["ar", "fa", "he", "ur"]);

export function pickLang(code?: string | null): string {
  const c = (code || "en").toLowerCase().split("-")[0] ?? "en";
  return dictionaries[c] ? c : "en";
}
export function translator(lang: string) {
  const d = dictionaries[lang] ?? en;
  const f = FULL[lang];
  return (k: TKey) => f?.[k] ?? d[k] ?? en[k];
}

const extraEn = {
 profile: "Profile", holdings: "Your holdings", dailyReward: "Daily reward", requiredHoldings: "Holdings value", priceUnavailable: "Price temporarily unavailable", updated: "Price updated", searchLevels: "Find a level ($)", loadMore: "More levels", guide: "How to earn", about: "About Tesla & TSLA", premium: "Premium", supporter: "Our supporter", whitepaper: "White paper", roadmap: "Roadmap", notifications: "Notifications", dailyNotice: "Your TSLA is waiting. Claim your mining rewards and explore today's tasks.", capNotice: "Two-hour limit reached", close: "Close", disconnect: "Disconnect wallet", buyAmount: "TSLA to buy", copyAmount: "Copy amount & open STON.fi", estimate: "Estimated, not a guaranteed dollar return", checking: "Checking holdings…", walletUnverified: "Verify wallet ownership to include external TSLA", verifyWallet: "Verify wallet", comingSoon: "Details awaiting approval", guideBody: "Start mining once. Rewards accumulate for up to two hours. Claim after two hours to collect TSLA and automatically restart. Tasks and referrals add TSLA. Holding more TSLA increases your level; reducing your holdings lowers it. Dollar figures are estimates from the hourly price, not guaranteed cash returns. Withdrawals are TSLA only with a 0.15 GRAM fee. Network fees may also apply.", aboutBody: "Tesla is a Telegram Mini App on TON. TSLA is the project's token. Mining rewards depend on your eligible TSLA holdings. Token prices fluctuate; rewards and liquidity are not guaranteed.", supporterBody: "Megsy AI describes itself as an AI platform for chat and generating images, videos, websites and code. Visit its website for current features, pricing and terms. Sponsorship does not guarantee token value or earnings.", whitepaperBody: "Draft: Tesla uses Telegram identity, TON wallets and TSLA holding-based rewards. The current model targets 50% of the selected holding tier per day, paid in TSLA, with a two-hour claim cap. Funding, supply, sustainability, audit and legal terms have not yet been supplied by the project owner. This is not a finalized white paper or a guarantee of returns.", roadmapBody: "Available: Telegram app, mining, tasks, referrals and wallet connection. Next: confirm the NFT collection, metadata, purchase price and minting contract; test purchases and withdrawals on-chain; finalize the white paper and reward funding. Dates are not yet committed.", premiumBody: "2× mining · 5 GRAM / 30 days", openWebsite: "Open website", appHoldings: "In app", externalHoldings: "Connected wallet", buy: "Buy TSLA", proofFailed: "Wallet verification failed", day: "Daily update", taskNotVerified: "Join the channel or group first, then claim", allDone: "All tasks completed — new tasks coming soon", gramAmount: "Amount in GRAM", payWithGram: "Copy GRAM amount & open STON.fi"
};
const extraAr: typeof extraEn = {
 profile: "الملف الشخصي", holdings: "العملات المحتفظ بها", dailyReward: "العائد اليومي", requiredHoldings: "قيمة العملات", priceUnavailable: "السعر غير متاح مؤقتًا", updated: "تحديث السعر", searchLevels: "ابحث عن مستوى ($)", loadMore: "مستويات أخرى", guide: "كيفية الربح", about: "عن Tesla وعملة TSLA", premium: "بريميوم", supporter: "الداعم", whitepaper: "الورقة البيضاء", roadmap: "خارطة الطريق", notifications: "الإشعارات", dailyNotice: "عملات TSLA في انتظارك. استلم مكافآت التعدين وتابع مهام اليوم.", capNotice: "وصلت لحد الساعتين", close: "إغلاق", disconnect: "فصل المحفظة", buyAmount: "كمية TSLA للشراء", copyAmount: "نسخ الكمية وفتح STON.fi", estimate: "تقديري وليس عائدًا دولاريًا مضمونًا", checking: "جاري فحص الرصيد…", walletUnverified: "أكّد ملكية المحفظة لاحتساب TSLA خارج التطبيق", verifyWallet: "تأكيد المحفظة", comingSoon: "التفاصيل بانتظار الاعتماد", guideBody: "ابدأ التعدين مرة واحدة. تتراكم المكافآت لمدة ساعتين كحد أقصى. بعد ساعتين اضغط استلام لتحصل على TSLA ويبدأ التراكم مجددًا تلقائيًا. المهام والإحالات تزيد رصيدك. الاحتفاظ بعملات أكثر يزيد المستوى، ونقصها يخفضه. أرقام الدولار تقديرية بالسعر المحدث كل ساعة وليست أرباحًا نقدية مضمونة. السحب بعملة TSLA فقط وبرسوم 0.15 GRAM، وقد تضاف رسوم الشبكة.", aboutBody: "Tesla تطبيق مصغّر داخل تليجرام على شبكة TON، وعملة المشروع هي TSLA. مكافآت التعدين تعتمد على العملات المؤهلة التي تحتفظ بها. سعر العملة متغير والمكافآت والسيولة غير مضمونة.", supporterBody: "يعرّف Megsy AI نفسه بأنه منصة ذكاء اصطناعي للدردشة وتوليد الصور والفيديو وإنشاء المواقع والشفرة. راجع موقعه لمعرفة المزايا والأسعار والشروط الحالية. الدعم لا يضمن قيمة العملة أو الأرباح.", whitepaperBody: "مسودة: يستخدم Tesla هوية تليجرام ومحافظ TON ومكافآت مرتبطة بالاحتفاظ بعملة TSLA. النموذج الحالي يستهدف 50% من قيمة المستوى يوميًا بعملة TSLA مع سقف استلام كل ساعتين. لم يقدّم صاحب المشروع بعد تفاصيل التمويل والمعروض والاستدامة والتدقيق والشروط القانونية. هذه ليست ورقة بيضاء نهائية ولا ضمانًا للعوائد.", roadmapBody: "المتاح: تطبيق تليجرام والتعدين والمهام والإحالات وربط المحفظة. التالي: اعتماد مجموعة NFT وبياناتها وسعرها وعقد الإنشاء، اختبار الشراء والسحب على الشبكة، واعتماد الورقة البيضاء وتمويل المكافآت. لا توجد مواعيد معتمدة بعد.", premiumBody: "تعدين ×2 · 5 GRAM / 30 يومًا", openWebsite: "فتح الموقع", appHoldings: "داخل التطبيق", externalHoldings: "المحفظة المتصلة", buy: "شراء TSLA", proofFailed: "تعذّر تأكيد المحفظة", day: "تحديث اليوم", taskNotVerified: "انضم للقناة أو المجموعة أولاً ثم اضغط استلام", allDone: "كل المهام مكتملة — مهام جديدة قريبًا", gramAmount: "المبلغ بعملة GRAM", payWithGram: "نسخ مبلغ GRAM وفتح STON.fi"
};
export type ExtraKey = keyof typeof extraEn;
const notices: Record<string, string> = {
 ru: "Ваш TSLA ждёт. Заберите награды за майнинг и проверьте задания на сегодня.", es: "Tu TSLA te espera. Reclama tus recompensas y revisa las tareas de hoy.", fr: "Vos TSLA vous attendent. Récupérez vos récompenses et consultez les tâches du jour.", tr: "TSLA sizi bekliyor. Madencilik ödüllerinizi alın ve bugünün görevlerine bakın.", fa: "TSLA شما منتظر است. پاداش استخراج را دریافت کنید و وظایف امروز را ببینید.", id: "TSLA Anda menunggu. Klaim hadiah penambangan dan lihat tugas hari ini.", pt: "Seu TSLA está esperando. Resgate as recompensas e veja as tarefas de hoje.", de: "Deine TSLA warten. Hole deine Mining-Belohnungen ab und sieh dir die heutigen Aufgaben an.", zh: "您的 TSLA 正在等待。领取挖矿奖励并查看今日任务。", hi: "आपका TSLA इंतज़ार कर रहा है। माइनिंग पुरस्कार लें और आज के कार्य देखें।", uk: "Ваш TSLA чекає. Отримайте нагороди за майнінг і перегляньте завдання на сьогодні."
};
export function extraTranslator(lang: string) { const f = FULL[lang]; return (key: ExtraKey) => (lang === "ar" ? extraAr[key] : f?.[key]) ?? (key === "dailyNotice" ? notices[lang] : undefined) ?? extraEn[key]; }
