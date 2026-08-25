/* ════════════════════════════════════════════════════════════════════
   YORDAM MARKAZI — kontent sxemasi.

   Yagona manba: kategoriyalar (`HELP_CATEGORIES`, sidebar navigatsiyasi
   uchun) va maqolalar (`HELP_ARTICLES`, slug boʻyicha). Markdown ISHLATILMAYDI
   (loyihada parser yoʻq) — [[../app/dashboard/(with-sidebar)/grades/help/page.tsx]]
   bilan bir xil naqsh: struktura JS obyekti, matn oddiy satrlar (paragraphs).

   Icon nomlari string sifatida saqlanadi (`HelpIconName`) — komponentga
   emas, dataga JSX kiritmaslik uchun (Gemini/boshqa manbadan matn sifatida
   toʻldirish osonroq boʻlsin). Xaritalash `HELP_ICON_MAP`da.
   ════════════════════════════════════════════════════════════════════ */

export type HelpIconName =
  | "calendar" | "layoutGrid" | "users" | "bookOpen" | "fileText"
  | "clipboardList" | "library" | "clipboardCheck" | "award" | "barChart2"
  | "target" | "trendingUp" | "settings" | "rocket" | "compass";

export type HelpArticleSection = {
  id: string;
  short: string; // TOC uchun qisqa yorliq
  icon: HelpIconName;
  title: string;
  paragraphs: string[];
  /** Ixtiyoriy — Notion/Obsidian uslubidagi eslatma quti, boʻlim oxirida chiqadi. */
  callout?: { type: "note" | "tip" | "info" | "warning"; title?: string; text: string };
};

export type HelpArticle = {
  slug: string;
  categorySlug: string;
  title: string;
  metaTitle: string;
  intro: string;
  sections: HelpArticleSection[];
};

export type HelpCategory = {
  slug: string;
  label: string;
  icon: HelpIconName;
  articles: { slug: string; title: string }[];
};

/* Tartib QASDAN app-sidebar.tsx dagi navGroups bilan bir xil — "Boshlash"
   birinchi, keyin sidebar ketma-ketligi (oʻquv yili → sinf → jadval →
   ...). [[../components/app-sidebar.tsx]] */
export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: "boshlash",
    label: "Boshlash",
    icon: "rocket",
    articles: [
      { slug: "oquv-yilini-sozlash", title: "Oʻquv yilini sozlash" },
      { slug: "birinchi-sinf", title: "Birinchi sinfni yaratish" },
      { slug: "dars-jadvalini-sozlash", title: "Dars jadvalini sozlash" },
      { slug: "birinchi-reja", title: "Birinchi mavzuni rejalashtirish" },
      { slug: "ilovada-yonalish", title: "Ilovada yoʻnalish topish" },
    ],
  },
  {
    slug: "jadval",
    label: "Dars jadvali",
    icon: "calendar",
    articles: [{ slug: "jadval-asoslari", title: "Dars jadvali asoslari" }],
  },
  {
    slug: "sinflar",
    label: "Sinflar",
    icon: "layoutGrid",
    articles: [{ slug: "sinf-boshqaruvi", title: "Sinfni boshqarish" }],
  },
  {
    slug: "oquvchilar",
    label: "Oʻquvchilar",
    icon: "users",
    articles: [{ slug: "oquvchi-profili", title: "Oʻquvchi profili" }],
  },
  {
    slug: "reja",
    label: "Reja",
    icon: "bookOpen",
    articles: [{ slug: "reja-asoslari", title: "Mavzularni rejalashtirish" }],
  },
  {
    slug: "darslar",
    label: "Darslar",
    icon: "fileText",
    articles: [{ slug: "dars-muharriri", title: "Dars muharriridan foydalanish" }],
  },
  {
    slug: "topshiriqlar",
    label: "Topshiriqlar",
    icon: "clipboardList",
    articles: [{ slug: "topshiriq-yaratish", title: "Topshiriq yaratish" }],
  },
  {
    slug: "materiallar",
    label: "Materiallar",
    icon: "library",
    articles: [{ slug: "materiallar-kutubxonasi", title: "Materiallar kutubxonasi" }],
  },
  {
    slug: "davomat",
    label: "Davomat",
    icon: "clipboardCheck",
    articles: [{ slug: "davomat-belgilash", title: "Davomatni belgilash" }],
  },
  {
    slug: "xulq",
    label: "Xulq",
    icon: "award",
    articles: [{ slug: "xulq-ballari", title: "Xulq-atvor ballari" }],
  },
  {
    slug: "jurnal",
    label: "Jurnal",
    icon: "barChart2",
    articles: [{ slug: "jurnal-asoslari", title: "Jurnalga baho qoʻyish" }],
  },
  {
    slug: "standartlar",
    label: "Standartlar",
    icon: "target",
    articles: [{ slug: "standartlar-kuzatuvi", title: "Standartlar kuzatuvi" }],
  },
  {
    slug: "statistika",
    label: "Statistika",
    icon: "trendingUp",
    articles: [{ slug: "statistika-tahlili", title: "Statistikani oʻqish" }],
  },
  {
    slug: "sozlamalar",
    label: "Sozlamalar",
    icon: "settings",
    articles: [{ slug: "hisob-sozlamalari", title: "Hisob sozlamalari" }],
  },
];

/* Har maqola alohida faylda ({slug}.ts) — bu fayl faqat registrga
   yigʻadi. Sabab: bitta 2000+ qatorli fayl oʻrniga, har kontent muallifi
   (Gemini orqali toʻldirilganda ham) bitta faylni almashtiradi. */
import { ARTICLE_OQUV_YILINI_SOZLASH } from "./help-articles/oquv-yilini-sozlash";
import { ARTICLE_BIRINCHI_SINF } from "./help-articles/birinchi-sinf";
import { ARTICLE_DARS_JADVALINI_SOZLASH } from "./help-articles/dars-jadvalini-sozlash";

const ALL_ARTICLES: HelpArticle[] = [
  ARTICLE_OQUV_YILINI_SOZLASH,
  ARTICLE_BIRINCHI_SINF,
  ARTICLE_DARS_JADVALINI_SOZLASH,
];

export const HELP_ARTICLES: Record<string, HelpArticle> = Object.fromEntries(
  ALL_ARTICLES.map((a) => [a.slug, a])
);

export function getHelpArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES[slug];
}

export function getFirstArticleHref(categorySlug: string): string {
  const cat = HELP_CATEGORIES.find((c) => c.slug === categorySlug);
  const first = cat?.articles[0];
  return first ? `/help/${first.slug}` : "/help";
}

export function getArticleCategory(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.articles.some((a) => a.slug === slug));
}

/** Ketma-ket oʻqish uchun — kategoriyalar tartibida flatten, keyingi maqola.
    Oxirgi maqolada keyingi kategoriyaning birinchisiga oʻtadi. */
export function getNextArticle(slug: string): { slug: string; title: string } | undefined {
  const flat = HELP_CATEGORIES.flatMap((c) => c.articles);
  const i = flat.findIndex((a) => a.slug === slug);
  if (i === -1 || i === flat.length - 1) return undefined;
  return flat[i + 1];
}
