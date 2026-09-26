/* ════════════════════════════════════════════════════════════════════
   SLAYD MAKETLARI — yagona registr (docs/taqdimot-spec.md, R281).

   Maket — slayd maydonlarining JOYLASHUVI, mazmun emas. Maydonlar hamma
   maketda bir xil nomda saqlanadi (`title`, `body`, `imageUrl`,
   `videoUrl`), shuning uchun maket almashtirilganda hech narsa
   yoʻqolmaydi — faqat koʻrsatilmay qolishi mumkin.

   React'ga bogʻlanmagan: server (zod sxema) ham shu roʻyxatni oʻqiydi.
   ════════════════════════════════════════════════════════════════════ */

export const SLIDE_LAYOUTS = ["title", "text", "list", "classic", "media", "quote"] as const;

export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export const DEFAULT_SLIDE_LAYOUT: SlideLayout = "text";

export type SlideLayoutMeta = {
  label: string;
  /** Maket qaysi maydonlarni koʻrsatadi. */
  fields: { title: boolean; body: boolean; image: boolean; video: boolean };
  /** Muharrirdagi boʻsh maydon ishorasi. */
  titlePlaceholder: string;
  bodyPlaceholder: string;
};

export const SLIDE_LAYOUT_META: Record<SlideLayout, SlideLayoutMeta> = {
  title: {
    label: "Sarlavha",
    fields: { title: true, body: true, image: false, video: false },
    titlePlaceholder: "Mavzu nomi",
    bodyPlaceholder: "Qisqa izoh (ixtiyoriy)",
  },
  text: {
    label: "Sarlavha + matn",
    fields: { title: true, body: true, image: false, video: false },
    titlePlaceholder: "Sarlavha",
    bodyPlaceholder: "Tushuntirish, qoida, misol…",
  },
  list: {
    label: "Roʻyxat",
    fields: { title: true, body: true, image: true, video: false },
    titlePlaceholder: "Sarlavha",
    bodyPlaceholder: "Har qator — alohida band",
  },
  classic: {
    label: "Rasm + matn",
    fields: { title: true, body: true, image: true, video: false },
    titlePlaceholder: "Sarlavha",
    bodyPlaceholder: "Rasm ostidagi qisqa matn",
  },
  media: {
    label: "Katta media",
    fields: { title: true, body: false, image: true, video: true },
    titlePlaceholder: "Izoh (ixtiyoriy)",
    bodyPlaceholder: "",
  },
  quote: {
    label: "Iqtibos",
    fields: { title: true, body: true, image: false, video: false },
    titlePlaceholder: "Muallif",
    bodyPlaceholder: "Iqtibos matni",
  },
};

/** Saqlangan qiymatdan xavfsiz maket — notanish/eski qiymat standartga tushadi. */
export function slideLayoutOf(value: unknown): SlideLayout {
  return (SLIDE_LAYOUTS as readonly string[]).includes(value as string)
    ? (value as SlideLayout)
    : DEFAULT_SLIDE_LAYOUT;
}

/** Roʻyxat maketidagi bandlar — `body` ning boʻsh boʻlmagan qatorlari. */
export function slideBullets(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}
