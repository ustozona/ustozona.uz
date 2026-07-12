/* ════════════════════════════════════════════════════════════════════
   Apple-emoji toʻplami (1900+ emoji, `emoji-datasource-apple`dan) —
   yagona manba: xulq-atvor formalari + fikr-mulohaza reaksiyalari shu
   yerdan oʻqiydi. `has_img_apple`siz yozuvlar chiqarib tashlanadi — shu
   sababli picker'da koʻrsatilgan HAR bir emoji uchun sprite kafolatlanadi
   (Fayl katta boʻlgani uchun DINAMIK import qilinadi, faqat picker
   ochilganda alohida chunk sifatida yuklanadi). ════════════════════════ */

export type EmojiEntry = {
  /** Sprite fayl nomi / barqaror kalit (mas. "1f525"). */
  code: string;
  /** Haqiqiy unicode belgi — qidiruv natijasi tanlanganda shu qaytariladi. */
  char: string;
  /** Qidiruv uchun normallashtirilgan matn (nom + short_names + keywords). */
  search: string;
};

export type EmojiCategory = {
  key: string;
  label: string;
  /** Turkum tugmasi uchun vakillik qiluvchi birinchi emojining kodi. */
  icon: string;
  emojis: EmojiEntry[];
};

/** Pride/LGBT belgilari, bir jinsli juftlik (qoʻl ushlashish/boʻsa/yurak)
 *  va homilador erkak/emizdirayotgan variantlari — talab boʻyicha
 *  roʻyxatdan chiqarib tashlanadi (oddiy tabiat "rainbow" 1f308,
 *  "pregnant_woman" 1f930 va aralash-jins juftliklari bunga kirmaydi). */
const EXCLUDED_CODES = new Set([
  "1f3f3-fe0f-200d-1f308", // rainbow flag
  "1f3f3-fe0f-200d-26a7-fe0f", // transgender flag
  "26a7-fe0f", // transgender symbol
  "1fac3", // pregnant man
  "1fac4", // pregnant person
  "1f931", // breast-feeding
  "1f46c", // two men holding hands
  "1f46d", // two women holding hands
  "1f468-200d-2764-fe0f-200d-1f468", // couple with heart: man, man
  "1f469-200d-2764-fe0f-200d-1f469", // couple with heart: woman, woman
  "1f468-200d-2764-fe0f-200d-1f48b-200d-1f468", // kiss: man, man
  "1f469-200d-2764-fe0f-200d-1f48b-200d-1f469", // kiss: woman, woman
  "1f459", // bikini
  "1fa71", // one-piece swimsuit
  "1fa72", // briefs
]);

const CATEGORY_ORDER: [string, string][] = [
  ["Smileys & Emotion", "Kulgichlar"],
  ["People & Body", "Odamlar"],
  ["Animals & Nature", "Tabiat"],
  ["Food & Drink", "Taom"],
  ["Activities", "Faoliyat"],
  ["Travel & Places", "Sayohat"],
  ["Objects", "Buyumlar"],
  ["Symbols", "Belgilar"],
  ["Flags", "Bayroqlar"],
];

function charFromUnified(unified: string): string {
  return String.fromCodePoint(...unified.split("-").map((h) => Number.parseInt(h, 16)));
}

type RawEmoji = {
  unified: string;
  name: string;
  short_names?: string[];
  keywords?: string[];
  category: string;
  sort_order: number;
  has_img_apple?: boolean;
};

let cache: EmojiCategory[] | null = null;
let pending: Promise<EmojiCategory[]> | null = null;

export function loadEmojiCategories(): Promise<EmojiCategory[]> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  pending = import("emoji-datasource-apple/emoji.json").then((mod) => {
    const data = ((mod as { default?: RawEmoji[] }).default ?? mod) as unknown as RawEmoji[];
    const byCat = new Map<string, (EmojiEntry & { sort: number })[]>();

    for (const e of data) {
      if (!e.has_img_apple) continue;
      const code = e.unified.toLowerCase();
      if (EXCLUDED_CODES.has(code)) continue;
      const arr = byCat.get(e.category) ?? [];
      arr.push({
        code,
        char: charFromUnified(e.unified),
        search: [e.name, ...(e.short_names ?? []), ...(e.keywords ?? [])].join(" ").toLowerCase(),
        sort: e.sort_order,
      });
      byCat.set(e.category, arr);
    }

    cache = CATEGORY_ORDER.filter(([k]) => byCat.has(k)).map(([k, label]) => {
      const emojis = byCat
        .get(k)!
        .sort((a, b) => a.sort - b.sort)
        .map(({ sort: _sort, ...rest }) => rest);
      return { key: k, label, icon: emojis[0]?.code ?? "1f642", emojis };
    });
    return cache;
  });

  return pending;
}
