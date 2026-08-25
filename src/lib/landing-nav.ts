/* ════════════════════════════════════════════════════════════════════
   LANDING NAVIGATSIYASI — yagona manba.

   Header ham, footer ham shu roʻyxatdan oʻqiydi. Ilgari ular alohida
   yozilgan edi va bir boʻlim ikki xil nomlanardi: header "Imkoniyatlar",
   footer "Xususiyatlar" — ikkalasi ham `#features` ga olib borardi.
   ════════════════════════════════════════════════════════════════════ */

export type NavItem = {
  title: string;
  /** `Landing.nav` ichidagi tarjima kaliti — Header/Footer shundan t() qiladi. */
  key: "top" | "features" | "products" | "pricing" | "faq" | "blog";
  /** Landing ichidagi langar (`#features`) yoki alohida sahifa (`/blog`). */
  href: string;
};

const SECTIONS: NavItem[] = [
  { title: "Asosiy", key: "top", href: "#top" },
  { title: "Imkoniyatlar", key: "features", href: "#features" },
  { title: "Mahsulotlar", key: "products", href: "#products" },
  { title: "Narxlar", key: "pricing", href: "#pricing" },
  { title: "FAQ", key: "faq", href: "#faq" },
  { title: "Blog", key: "blog", href: "/blog" },
];

/**
 * Landing sahifasining oʻzida — langarlar nisbiy (`#features`).
 * Header scroll-spy shularni kuzatadi.
 */
export const LANDING_NAV: NavItem[] = SECTIONS;

/**
 * Boshqa sahifalarda (blog, yuridik sahifalar) — langar landing'ga olib
 * borishi kerak: `/#features`. Aks holda `/blog#features` degan mavjud
 * boʻlmagan langarga oʻtadi va hech narsa boʻlmaydi.
 */
export const PAGE_NAV: NavItem[] = SECTIONS.map((item) =>
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
  slug: "baholash" | "doska" | "shogird" | "boshqaruv";
  name: string;
  tagline: string;
  status: ProductStatus;
  statusLabel: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "baholash",
    name: "Ustozona baholash",
    tagline: "Bitta oʻlchov, besh xil yigʻish usuli — testdan qogʻoz OMR gacha.",
    status: "soon",
    statusLabel: "Tez orada",
  },
  {
    slug: "doska",
    name: "Ustozona doska",
    tagline: "Sinf ekrani: taymer, svetofor, tasodifiy ism, guruhlarga boʻlish.",
    status: "soon",
    statusLabel: "Tez orada",
  },
  {
    slug: "shogird",
    name: "Ustozona shogird",
    tagline: "Ota-ona va oʻquvchi uchun Telegram ilovasi.",
    status: "soon",
    statusLabel: "Tez orada",
  },
  {
    slug: "boshqaruv",
    name: "Ustozona boshqaruv",
    tagline: "Maktab maʼmuriyati uchun panel.",
    status: "soon",
    statusLabel: "Tez orada",
  },
];
