/* ════════════════════════════════════════════════════════════════════
   LANDING NAVIGATSIYASI — yagona manba.

   Header ham, footer ham shu roʻyxatdan oʻqiydi. Ilgari ular alohida
   yozilgan edi va bir boʻlim ikki xil nomlanardi: header "Imkoniyatlar",
   footer "Xususiyatlar" — ikkalasi ham `#features` ga olib borardi.
   ════════════════════════════════════════════════════════════════════ */

export type NavItem = {
  title: string;
  /** Landing ichidagi langar (`#features`) yoki alohida sahifa (`/blog`). */
  href: string;
};

const SECTIONS: NavItem[] = [
  { title: "Asosiy", href: "#top" },
  { title: "Imkoniyatlar", href: "#features" },
  { title: "Narxlar", href: "#pricing" },
  { title: "FAQ", href: "#faq" },
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
export const LEGAL_LINKS: NavItem[] = [
  { title: "Foydalanish shartlari", href: "/terms" },
  { title: "Maxfiylik siyosati", href: "/privacy" },
];

export const TELEGRAM_URL = "https://t.me/ustozona_tms";
export const TELEGRAM_HANDLE = "@ustozona_tms";
