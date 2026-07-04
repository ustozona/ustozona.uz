/* ════════════════════════════════════════════════════════════════════
   Toʻliq Apple-emoji toʻplami (1900+ emoji) — reaksiya tanlagichi uchun.

   Manba: `emoji-datasource-apple` (mavjud AppleEmoji CDN renderi bilan bir
   xil sprite). JSON katta (~1MB) boʻlgani uchun DINAMIK import qilinadi —
   faqat picker ochilganda alohida chunk sifatida yuklanadi, asosiy bundle'ni
   shishirmaydi. Natija modul darajasida keshlanadi.
   ════════════════════════════════════════════════════════════════════ */

export type EmojiEntry = {
  /** Haqiqiy unicode belgi (reaksiya kaliti sifatida saqlanadi). */
  char: string;
  /** Apple sprite fayl nomi (mas. "1f525.png"). */
  image: string;
  /** Qidiruv uchun normallashtirilgan matn (nom + short_names + keywords). */
  search: string;
};

export type EmojiGroup = { key: string; label: string; emojis: EmojiEntry[] };

/** Sprite CDN bazasi — AppleEmoji bilan bir xil versiya. */
export const EMOJI_CDN = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/";

/** Kategoriyalar tartibi + oʻzbekcha nomlari (Component = teri ranglari, tashlab yuboriladi). */
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
  return String.fromCodePoint(...unified.split("-").map((h) => parseInt(h, 16)));
}

type RawEmoji = {
  unified: string;
  image: string;
  name: string;
  short_names?: string[];
  keywords?: string[];
  category: string;
  sort_order: number;
  has_img_apple?: boolean;
};

let cache: EmojiGroup[] | null = null;
let pending: Promise<EmojiGroup[]> | null = null;

export function loadEmojiGroups(): Promise<EmojiGroup[]> {
  if (cache) return Promise.resolve(cache);
  if (pending) return pending;

  pending = import("emoji-datasource-apple/emoji.json").then((mod) => {
    const data = ((mod as { default?: RawEmoji[] }).default ?? mod) as unknown as RawEmoji[];
    const byCat = new Map<string, (EmojiEntry & { sort: number })[]>();

    for (const e of data) {
      if (!e.has_img_apple) continue;
      const arr = byCat.get(e.category) ?? [];
      arr.push({
        char: charFromUnified(e.unified),
        image: e.image,
        search: [e.name, ...(e.short_names ?? []), ...(e.keywords ?? [])].join(" ").toLowerCase(),
        sort: e.sort_order,
      });
      byCat.set(e.category, arr);
    }

    cache = CATEGORY_ORDER.filter(([k]) => byCat.has(k)).map(([k, label]) => ({
      key: k,
      label,
      emojis: byCat
        .get(k)!
        .sort((a, b) => a.sort - b.sort)
        .map(({ sort: _sort, ...rest }) => rest),
    }));
    return cache;
  });

  return pending;
}
