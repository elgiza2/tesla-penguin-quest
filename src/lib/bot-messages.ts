export const BUY_MESSAGES: Record<string, [string, string]> = {
  en: ["Explore TSLA with Tesla. Buy TSLA on STON.fi and hold it in your verified wallet to increase eligible mining power. Check the price and fees before buying; crypto prices can change and profits are not guaranteed.", "Open app"],
  ar: ["اكتشف TSLA مع Tesla. اشترِ TSLA من STON.fi واحتفظ بها في محفظتك الموثّقة لزيادة قوة التعدين المؤهلة. راجع السعر والرسوم قبل الشراء؛ أسعار العملات تتغير والأرباح غير مضمونة.", "افتح التطبيق"],
  ru: ["Откройте TSLA с Tesla. Купите TSLA на STON.fi и храните в подтверждённом кошельке, чтобы повысить мощность майнинга. Проверьте цену и комиссии: цены криптовалют меняются, прибыль не гарантирована.", "Открыть"],
  es: ["Descubre TSLA con Tesla. Compra TSLA en STON.fi y mantenlo en tu billetera verificada para aumentar tu potencia de minería. Revisa el precio y las comisiones: los precios cambian y las ganancias no están garantizadas.", "Abrir app"],
  fr: ["Découvrez TSLA avec Tesla. Achetez TSLA sur STON.fi et conservez-le dans votre portefeuille vérifié pour augmenter votre puissance de minage. Vérifiez le prix et les frais : les prix varient et les gains ne sont pas garantis.", "Ouvrir"],
  tr: ["Tesla ile TSLA'yi keşfet. STON.fi üzerinden TSLA al ve madencilik gücünü artırmak için doğrulanmış cüzdanında tut. Fiyat ve ücretleri kontrol et; kripto fiyatları değişir ve kazanç garantisi yoktur.", "Uygulamayı aç"],
  fa: ["TSLA را با Tesla کشف کنید. از STON.fi خرید کنید و برای افزایش قدرت استخراج در کیف پول تأییدشده نگه دارید. قیمت و کارمزد را بررسی کنید؛ قیمت‌ها تغییر می‌کنند و سود تضمین‌شده نیست.", "باز کردن"],
  de: ["Entdecke TSLA mit Tesla. Kaufe TSLA auf STON.fi und halte es in deiner verifizierten Wallet, um deine Mining-Leistung zu erhöhen. Prüfe Preis und Gebühren: Kryptopreise schwanken und Gewinne sind nicht garantiert.", "App öffnen"],
  pt: ["Conheça TSLA com Tesla. Compre TSLA na STON.fi e mantenha na carteira verificada para aumentar sua potência de mineração. Confira preço e taxas: os preços variam e os lucros não são garantidos.", "Abrir app"],
  hi: ["Tesla के साथ TSLA जानें। STON.fi पर TSLA खरीदें और माइनिंग शक्ति बढ़ाने के लिए सत्यापित वॉलेट में रखें। खरीदने से पहले कीमत और शुल्क देखें; कीमतें बदल सकती हैं और लाभ की गारंटी नहीं है।", "ऐप खोलें"],
  id: ["Jelajahi TSLA bersama Tesla. Beli TSLA di STON.fi dan simpan di dompet terverifikasi untuk meningkatkan daya mining. Periksa harga dan biaya; harga kripto berubah dan keuntungan tidak dijamin.", "Buka aplikasi"],
  zh: ["与 Tesla 一起了解 TSLA。在 STON.fi 购买 TSLA 并存放于已验证的钱包，以提升符合条件的挖矿算力。购买前请查看价格和费用；加密货币价格会波动，收益不保证。", "打开应用"],
  ko: ["Tesla와 함께 TSLA를 알아보세요. STON.fi에서 TSLA를 구매하고 인증된 지갑에 보유하여 채굴 능력을 높이세요. 가격과 수수료를 확인하세요. 암호화폐 가격은 변동하며 수익은 보장되지 않습니다.", "앱 열기"],
};

export const CAMPAIGN_BATCH = 60;
export function campaignPageAfter(cursor: number, maximum: number, ids: number[]) {
  return ids.filter(id => id > cursor && id <= maximum).sort((a, b) => a - b).slice(0, CAMPAIGN_BATCH);
}