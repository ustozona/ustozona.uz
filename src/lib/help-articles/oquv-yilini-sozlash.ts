import type { HelpArticle } from "../help-content";

/* NAMUNA MAQOLA — qolgan maqolalar shu formatda yoziladi (qarang: Gemini
   uchun promt, foydalanuvchiga yuborilgan). */
export const ARTICLE_OQUV_YILINI_SOZLASH: HelpArticle = {
  slug: "oquv-yilini-sozlash",
  categorySlug: "boshlash",
  title: "Oʻquv yilini sozlash",
  metaTitle: "Oʻquv yilini sozlash | Ustozona Yordam",
  intro:
    "Oʻquv yili — Ustozonadagi barcha ishning asosi: sinflar, darslar, jurnal va davomat shu davr ichida yashaydi. Uni sozlash bir necha daqiqa vaqt oladi va butun oʻquv yilingizni tartibli saqlaydi.",
  sections: [
    {
      id: "nima-bu",
      short: "Nima bu?",
      icon: "calendar",
      title: "Oʻquv yili nima?",
      paragraphs: [
        "Ustozonada biror narsa yaratishdan oldin, oʻquv yilini sozlaysiz. Oʻquv yili — sana oraligʻi boʻlib, sinflar, davomat, jurnal va rejalarni bir joyga bogʻlaydi. Uni butun oʻquv davri uchun papka deb tasavvur qiling: davr tugagach, yangi oʻquv yili boshlanadi, oldingi yilning maʼlumotlari esa oʻzgarishsiz saqlanib qoladi.",
        "Oʻquv yili ichida choraklar (yoki boshqa baholash davrlari) belgilanadi — bular jurnaldagi davrlar boʻyicha hisobotlar va Holat ustuni uchun asos boʻladi. Choraklarning borligi baholashni bitta katta yakuniy natija emas, bir necha kichik bosqichga boʻlib koʻrish imkonini beradi: har chorak — oʻquvchi uchun xatosini tuzatib, keyingi bosqichga tayyor holda oʻtish imkoniyati.",
      ],
      callout: {
        type: "tip",
        title: "Misol",
        text: "2026-2027 oʻquv yilini boshlayotgan boʻlsangiz, \"2026-2027\" nomli oʻquv yili yarating, boshlanish/tugash sanalarini maktabingiz kalendariga moslang. Yaratgan barcha sinf va darslaringiz shu oʻquv yili ichida yashaydi.",
      },
    },
    {
      id: "sozlash",
      short: "Sozlash",
      icon: "rocket",
      title: "Oʻquv yilini qanday sozlash mumkin",
      paragraphs: [
        "1. Sozlamalar → Kalendar boʻlimiga oʻting.",
        "2. Oʻquv yilining boshlanish va tugash sanalarini kiriting.",
        "3. Choraklarni (yoki boshqa baholash davrlarini) qoʻshing — har birining oʻz sanasi boʻladi.",
        "4. Agar kerak boʻlsa, bayram/taʼtil kunlarini taqvimdan bosib belgilang — bu kunlar davomat va rejaga taʼsir qilmaydi.",
        "Shundan soʻng sinf yaratishga tayyorsiz.",
      ],
    },
    {
      id: "kop-yillik",
      short: "Koʻp yillik ish",
      icon: "target",
      title: "Bir necha oʻquv yili bilan ishlash",
      paragraphs: [
        "Yangi oʻquv yili boshlanganda, eski maʼlumotlarni oʻchirish shart emas — Ustozona bir nechta oʻquv yilini parallel saqlaydi. Sinf, jurnal va davomat sahifalarida yuqorida yil tanlovchi orqali istalgan davrga oʻtishingiz mumkin.",
        "Bu shunchaki arxiv emas — oʻtgan yillar saqlanib qolgani uchun bir oʻquvchining bir necha yillik oʻzlashtirish dinamikasini yoki bir sinfning qaysi chorakda koʻproq qiynalganini orqaga qaytib solishtirish mumkin boʻladi.",
      ],
    },
  ],
};
