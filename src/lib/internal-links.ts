/* ════════════════════════════════════════════════════════════════════
   ICHKI HAVOLALAR OQ ROʻYXATI — feedback matnida "/" bilan qoʻshiladigan
   sahifa havolalari FAQAT shu roʻyxatdagi yoʻllarga ruxsat etadi.

   Nega whitelist: matn (feedback body/reply) foydalanuvchi kiritgan xom
   matn, `[Nom](/yoʻl)` sintaksisi bilan saqlanadi. Agar istalgan yoʻlga
   ruxsat berilsa, tashqi manzil (`//evil.com`, `/\evil.com`) ochiq-
   redirect boʻlib qoladi — shu sabab bu yerda qoʻlda kuratsiya qilingan,
   avtomatik route-skan qilinmagan roʻyxat.

   Sidebar bilan mos (`src/components/app-sidebar.tsx`) — yangi sahifa
   qoʻshilsa/oʻzgarsa shu yerni ham yangilang.
   ════════════════════════════════════════════════════════════════════ */

export type InternalLink = {
  /** Popup'da va matnda koʻrinadigan nom. */
  label: string;
  /** Nisbiy yoʻl (query bilan boʻlishi mumkin) — /bilan boshlanadi. */
  href: string;
  /** Qidiruvda mos tushadigan qoʻshimcha kalit soʻzlar. */
  keywords?: string[];
};

export const INTERNAL_LINKS: InternalLink[] = [
  { label: "Bosh sahifa", href: "/dashboard" },
  { label: "Vazifalar", href: "/dashboard/tasks", keywords: ["tasks", "todo"] },
  { label: "Dars jadvali", href: "/dashboard/timetable", keywords: ["jadval", "raspisanie"] },
  { label: "Sinflar", href: "/dashboard/classes", keywords: ["classes"] },
  { label: "Oʻquvchilar", href: "/dashboard/students", keywords: ["students"] },
  { label: "Reja (Planner)", href: "/dashboard/planner", keywords: ["planner", "kalendar"] },
  { label: "Darslar", href: "/dashboard/lessons", keywords: ["lessons"] },
  { label: "Topshiriqlar", href: "/dashboard/assignments", keywords: ["assignments"] },
  { label: "Materiallar kutubxonasi", href: "/dashboard/resources", keywords: ["resources"] },
  { label: "Davomat", href: "/dashboard/attendance", keywords: ["attendance"] },
  { label: "Xulq", href: "/dashboard/behavior", keywords: ["behavior"] },
  { label: "Jurnal (Baholash)", href: "/dashboard/grades", keywords: ["grades", "baho"] },
  { label: "Standartlar", href: "/dashboard/standards", keywords: ["standards"] },
  { label: "Statistika", href: "/dashboard/statistics", keywords: ["statistics"] },
  { label: "Oʻzgarishlar tarixi", href: "/dashboard/changelog", keywords: ["changelog"] },
  { label: "Fikrlar", href: "/dashboard/feedback", keywords: ["feedback"] },
  { label: "Sozlamalar", href: "/dashboard/settings", keywords: ["settings"] },
  { label: "Sozlamalar → Profil", href: "/dashboard/settings?section=profil", keywords: ["profil", "settings"] },
  { label: "Sozlamalar → Kalendar", href: "/dashboard/settings?section=kalendar", keywords: ["kalendar", "oʻquv yili", "calendar"] },
  { label: "Sozlamalar → Davomat", href: "/dashboard/settings?section=davomat", keywords: ["davomat", "settings"] },
  { label: "Sozlamalar → Xulq", href: "/dashboard/settings?section=xulq", keywords: ["xulq", "settings"] },
];

/** Feedback matnidagi `[Nom](/yoʻl)` faqat shu funksiya `true` qaytarsa link boʻlib chiqadi. */
export function isWhitelistedInternalHref(href: string): boolean {
  return INTERNAL_LINKS.some((l) => l.href === href);
}
