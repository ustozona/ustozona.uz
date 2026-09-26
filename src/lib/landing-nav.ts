/* ════════════════════════════════════════════════════════════════════
   LANDING NAVIGATSIYASI — yagona manba.

   Header — faqat ISHLAYOTGAN mahsulotlar (`HEADER_NAV`), footer —
   landing boʻlimlari (`FOOTER_PAGE_LINKS`). Ilgari ikkalasi bitta
   roʻyxatdan oʻqirdi va bir boʻlim ikki xil nomlanardi: header
   "Imkoniyatlar", footer "Xususiyatlar".
   ════════════════════════════════════════════════════════════════════ */

/**
 * Header havolalari — faqat bugun ishlayotgan mahsulotlar (2026-09-19).
 * Kirgan odam menyuda nima bor ekanini koʻradi, landing boʻlimlariga
 * langar emas. Doska bu roʻyxatda yoʻq: u roʻyxatsiz ochiladi va
 * header'da alohida rangli tugma boʻlib turadi. «Tez orada»
 * mahsulotlar (Shogird, Boshqaruv) header'ga ishga tushgandagina
 * qoʻshiladi. Yorliq — `Landing.nav.<key>`.
 */
export type HeaderNavItem = {
  key: "jurnal" | "baholash" | "blog";
  href: string;
};

export const HEADER_NAV: HeaderNavItem[] = [
  // Jurnal — asosiy Ustozona; alohida sahifasi yoʻq, landing boʻlimiga
  // olib boradi. `/#jurnal`, `#jurnal` emas: boshqa sahifadan ham ishlasin.
  { key: "jurnal", href: "/#jurnal" },
  { key: "baholash", href: "/baholash" },
  { key: "blog", href: "/blog" },
];

export type NavItem = {
  title: string;
  /** `Landing.nav` ichidagi tarjima kaliti — Header/Footer shundan t() qiladi. */
  key: "top" | "features" | "products" | "pricing" | "faq";
  /** Landing ichidagi langar (`#features`) yoki alohida sahifa. */
  href: string;
};

const SECTIONS: NavItem[] = [
  { title: "Asosiy", key: "top", href: "#top" },
  { title: "Imkoniyatlar", key: "features", href: "#features" },
  { title: "Mahsulotlar", key: "products", href: "#products" },
  { title: "Narxlar", key: "pricing", href: "#pricing" },
  { title: "FAQ", key: "faq", href: "#faq" },
];

/**
 * Boʻlimlar boshqa sahifadan ham ochilishi kerak — langar landing'ga olib
 * boradi: `/#features`. Aks holda `/blog#features` degan mavjud
 * boʻlmagan langarga oʻtadi va hech narsa boʻlmaydi.
 */
const PAGE_NAV: NavItem[] = SECTIONS.map((item) =>
  item.href.startsWith("#") && item.href !== "#top"
    ? { ...item, href: `/${item.href}` }
    : item.href === "#top"
      ? { ...item, href: "/" }
      : item,
);

/** Footer'dagi "Sahifalar" ustuni — "Asosiy"siz (logotip oʻsha vazifani bajaradi). */
export const FOOTER_PAGE_LINKS: NavItem[] = PAGE_NAV.filter(
  (item) => item.href !== "/",
);

/** Yuridik sahifalar. "Ommaviy oferta" YOʻQ — u pullik shartnoma, bizda toʻlov yoʻq. */
export const LEGAL_LINKS: (Omit<NavItem, "key"> & { key: "terms" | "privacy" })[] = [
  { title: "Foydalanish shartlari", key: "terms", href: "/terms" },
  { title: "Maxfiylik siyosati", key: "privacy", href: "/privacy" },
];

export const TELEGRAM_URL = "https://t.me/ustozona_tms";
export const TELEGRAM_HANDLE = "@ustozona_tms";

/* ════════════════════════════════════════════════════════════════════
   OST-LOYIHALAR — Ustozona ustiga quriladigan mahsulotlar
   (docs/ost-loyihalar-arxitektura.md). Asosiy Ustozona bu roʻyxatga
   KIRMAYDI — u "Mahsulotlar" boʻlimida birinchi, alohida karta.
   ════════════════════════════════════════════════════════════════════ */

export type ProductStatus = "live" | "soon";

export type Product = {
  slug: "blog" | "baholash" | "doska" | "shogird" | "boshqaruv";
  name: string;
  tagline: string;
  /** Odatda `/${slug}`, lekin Blog kabi alohida sahifasi bor boʻlsa boshqacha. */
  href: string;
  status: ProductStatus;
  statusLabel: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "blog",
    name: "Ustozona blog",
    tagline: "Oʻqituvchilarning maqolalari — tajriba, uslub va yangiliklar bir joyda.",
    href: "/blog",
    status: "live",
    statusLabel: "Mavjud",
  },
  {
    slug: "baholash",
    name: "Ustozona baholash",
    tagline: "Onlayn test, qogʻoz test skaneri va QR-kartalar — natija jurnalga tushadi.",
    href: "/baholash",
    status: "live",
    statusLabel: "Mavjud",
  },
  {
    slug: "doska",
    name: "Ustozona doska",
    tagline: "Sinf ekrani: taymer, svetofor va jonli taqdimot. Taymer bilan svetofor kirmasdan ham ishlaydi.",
    href: "/doska",
    status: "live",
    statusLabel: "Mavjud",
  },
  {
    slug: "shogird",
    name: "Shogird",
    tagline: "Ota-ona va oʻquvchi uchun Telegram ilovasi.",
    href: "/shogird",
    status: "soon",
    statusLabel: "Tez orada",
  },
  {
    slug: "boshqaruv",
    name: "Ustozona boshqaruv",
    tagline: "Maktab maʼmuriyati uchun panel.",
    href: "/boshqaruv",
    status: "soon",
    statusLabel: "Tez orada",
  },
];

/** Footer "Ostloyihalar" ustuni — "Mahsulotlar" boʻlimi bilan bir manba. */
export const FOOTER_PRODUCT_LINKS = PRODUCTS.map((p) => ({
  key: p.slug,
  href: p.href,
  label: p.name,
}));
