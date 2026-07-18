/* ════════════════════════════════════════════════════════════════════
   IQTIBOSLAR — "kun yopildi" kartasi uchun kuratsiya qilingan seed.

   Foydalanuvchi useQuotesStore orqali oʻzinikini qoʻshadi/oʻchiradi;
   bu roʻyxat faqat boshlangʻich toʻplam. Koʻrsatish — kunlik-random:
   sana-hash bilan tanlov (kun ichida barqaror, har kuni yangi).
   ════════════════════════════════════════════════════════════════════ */

export type Quote = {
  id: string;
  text: string;
  author?: string;
};

export const QUOTES_SEED: Quote[] = [
  {
    id: "seed-navoiy",
    text: "Bilmaganni soʻrab oʻrgangan — olim, orlanib soʻramagan — oʻziga zolim.",
    author: "Alisher Navoiy",
  },
  {
    id: "seed-maqol-daryo",
    text: "Oz-oz oʻrganib dono boʻlur, qatra-qatra yigʻilib daryo boʻlur.",
    author: "Xalq maqoli",
  },
  {
    id: "seed-mandela",
    text: "Taʼlim — dunyoni oʻzgartirish uchun qoʻllash mumkin boʻlgan eng kuchli qurol.",
    author: "Nelson Mandela",
  },
  {
    id: "seed-malala",
    text: "Bir bola, bir oʻqituvchi, bir kitob va bir qalam dunyoni oʻzgartira oladi.",
    author: "Malala Yusufzay",
  },
  {
    id: "seed-adams",
    text: "Oʻqituvchi abadiyatga taʼsir qiladi: taʼsiri qayerda tugashini hech kim bilmaydi.",
    author: "Genri Adams",
  },
  {
    id: "seed-arastu",
    text: "Taʼlimning ildizlari achchiq, mevalari esa shirin.",
    author: "Arastu",
  },
  {
    id: "seed-xitoy",
    text: "Oʻqituvchi eshikni ochadi, ichkariga esa oʻzing kirasan.",
    author: "Xitoy maqoli",
  },
  {
    id: "seed-genri",
    text: "Yaxshi oʻqituvchi umid uygʻotadi, tasavvurni yondiradi va oʻrganishga mehr singdiradi.",
    author: "Bred Genri",
  },
  {
    id: "seed-yeyts",
    text: "Taʼlim — chelak toʻldirish emas, olov yoqishdir.",
    author: "Uilyam Batler Yeyts",
  },
  {
    id: "seed-konfutsiy",
    text: "Bilganingni bilsang va bilmaganingni tan olsang — bu chinakam bilimdir.",
    author: "Konfutsiy",
  },
];

/** Kunlik iqtibos — sana-hash bilan deterministik tanlov (boʻsh roʻyxatda null). */
export function dailyQuote(quotes: readonly Quote[], dateKey: string): Quote | null {
  if (quotes.length === 0) return null;
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) h = (h * 31 + dateKey.charCodeAt(i)) >>> 0;
  return quotes[h % quotes.length];
}
