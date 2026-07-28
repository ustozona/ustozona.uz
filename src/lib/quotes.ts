/* ════════════════════════════════════════════════════════════════════
   IQTIBOSLAR — bosh sahifa hero'si uchun kuratsiya qilingan seed.

   Foydalanuvchi useQuotesStore orqali oʻzinikini qoʻshadi/oʻchiradi;
   bu roʻyxat faqat boshlangʻich toʻplam.

   Koʻrsatish — MOUNT-random: seed hero mount'ida bir marta olinadi,
   shuning uchun boshqa sahifaga oʻtib qaytganda (yoki sahifa qayta
   yuklanganda) yangi iqtibos chiqadi, render davomida esa barqaror.
   ════════════════════════════════════════════════════════════════════ */

export type Quote = {
  id: string;
  /** Formatsiz matn — a11y, qidiruv va `html` boʻlmaganda render manbai. */
  text: string;
  /**
   * Foydalanuvchi formatlagan variant (bold/italic/underline/highlight).
   * Faqat qoʻlda qoʻshilgan iqtiboslarda boʻladi; seed'da yoʻq.
   * Render'dan OLDIN sanitizeQuoteHtml() bilan tozalanadi.
   */
  html?: string;
  author?: string;
};

export const QUOTES_SEED: Quote[] = [
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

  // ── Stiven Kovi, „Muvaffaqiyatli insonlarning 7 koʻnikmasi“ ──
  {
    id: "seed-kovi-muvaffaqiyat",
    text: "Muvaffaqiyatni oʻzingiz bilan olib yurmasangiz, boshqalar bilan hech qachon muvaffaqiyatga erisha olmaysiz.",
    author: "Stiven Kovi",
  },
  {
    id: "seed-kovi-tartibsizlik",
    text: "Oʻqituvchi sifatida shunday xulosaga keldim: yaxshi darslarning aksariyati tartibsizlik chegarasida turadi.",
    author: "Stiven Kovi",
  },

  // ── Jeyms Klir, „Atom odatlar“ ──
  {
    id: "seed-klir-tizim",
    text: "Siz maqsadlaringiz darajasigacha koʻtarilmaysiz, balki tizimingiz darajasiga tushasiz.",
    author: "Jeyms Klir",
  },
  {
    id: "seed-klir-nimauchun",
    text: "„Nima uchun?“ savoliga javobimiz boʻlsa, „qanday qilib?“ degan istalgan muammoni hal qila olamiz.",
    author: "Jeyms Klir",
  },

  // ── Hadis / salaf soʻzlari ──
  {
    id: "seed-ibn-abbos",
    text: "Insonlarga yaxshilikni oʻrgatuvchi muallim haqqiga barcha narsalar, hatto dengizdagi baliqlar ham istigʻfor aytadi.",
    author: "Abdulloh ibn Abbos",
  },

  // ── Wikiquote „Teachers“ toʻplamidan tarjimalar ──
  {
    id: "seed-dana",
    text: "Oʻrgatishga jurʼat etgan odam oʻrganishni hech qachon toʻxtatmasligi kerak.",
    author: "Jon Kotton Dana",
  },
  {
    id: "seed-konroy",
    text: "Yomon oʻqituvchilar menga tegmaydi; buyuklari esa hech qachon meni tark etmaydi.",
    author: "Pat Konroy",
  },
  {
    id: "seed-trenfor",
    text: "Eng yaxshi oʻqituvchilar qayerga qarashni koʻrsatadi, lekin nimani koʻrishni aytmaydi.",
    author: "Aleksandra Trenfor",
  },
  {
    id: "seed-sallivan",
    text: "Oʻrgatish — qalbga tegib, uni harakatga undashdir.",
    author: "Luis Sallivan",
  },
  {
    id: "seed-nill",
    text: "Yaxshi oʻqituvchi tortib olmaydi — beradi; bergani esa mehrdir.",
    author: "Aleksandr Nill",
  },
  {
    id: "seed-fraud",
    text: "Xatolarning oʻzi koʻpincha eng yaxshi oʻqituvchidir.",
    author: "Jeyms Entoni Fraud",
  },
  {
    id: "seed-opi",
    text: "Oʻqituvchilik menga bergan eng katta narsa — u meni yaxshi tinglovchi boʻlishga oʻrgatdi.",
    author: "Ketrin Opi",
  },
  {
    id: "seed-erazm",
    text: "Muallim boʻlish — podshoh boʻlishdan keyingi oʻrinda turadi.",
    author: "Rotterdamlik Erazm",
  },
  {
    id: "seed-frans",
    text: "Oʻqitish sanʼati — butunlay yosh ongdagi tabiiy qiziquvchanlikni uygʻotish sanʼatidir.",
    author: "Anatol Frans",
  },
  {
    id: "seed-diesterweg",
    text: "Yomon oʻqituvchi haqiqatni oʻrgatadi, yaxshi oʻqituvchi esa haqiqatni topishni oʻrgatadi.",
    author: "Adolf Disterveg",
  },
];

/** Yangi seed — hero mount'ida bir marta olinadi. */
export function newQuoteSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

/**
 * Seed boʻyicha iqtibos tanlash (boʻsh roʻyxatda null).
 *
 * Modul qoldigʻi ishlatilgani uchun roʻyxat uzunligi oʻzgarsa ham (foydalanuvchi
 * iqtibos qoʻshdi/oʻchirdi) tanlov haqiqiy indeksda qoladi — seed'ni yangilash
 * shart emas, demak dialog yopilganda karta sakramaydi.
 */
export function pickQuote(quotes: readonly Quote[], seed: number): Quote | null {
  if (quotes.length === 0) return null;
  return quotes[seed % quotes.length];
}
