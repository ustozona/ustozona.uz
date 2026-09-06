import { cn } from "@/lib/utils";

export {
  DashboardColumns,
  DashboardColumn,
  useDashboardColumns,
  type DashboardColumnMobile,
} from "@/components/DashboardColumns";

/* ⚠️ Balandlik siyosati (2026-09-06, mobil moslashuv):
   `lg+` da sahifa qobigʻi ekran balandligiga mixlanadi (`h-full min-h-0`) va
   scroll panellar ICHIDA qoladi — bu desktop maketining asosi.
   `< lg` da esa panellar ustma-ust tushadi va ular sigʻmaydi: qobiq TABIIY
   balandlik oladi, vertikal scroll `dashboard/layout.tsx` dagi kontent
   oʻramiga (`max-lg:overflow-y-auto`) oʻtadi. Shu sabab quyidagi qobiq
   klasslarida `h-full`/`overflow-hidden` `lg:` prefiksi bilan yozilgan. */

/** Sahifa padding — shadcn p-6 (24px) scale, responsive.
    `gap-6` — TourDemoBanner kabi qoʻshimcha farzandlar asosiy kontentga
    yopishib qolmasligi uchun (boshqa sahifa qobiqlari — masalan
    withSidebarPageClass — bu gapʼni allaqachon oʻzida beradi). */
export const dashboardPageClass =
  "flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-lg:min-h-full lg:h-full lg:min-h-0";

/** Card/panel orasidagi masofa — shadcn Card gap-6 bilan mos */
export const dashboardCardGapClass = "gap-6";

/** Kichik card grid (sinf kartochkalari) — zichroq */
export const dashboardDenseGridGapClass = "gap-4";

/** Vertikal card stack */
export const dashboardStackClass = "flex flex-col gap-6";

/** Asosiy card grid */
export const dashboardGridClass = "grid gap-6 auto-rows-min";

/** Ikki ustunli card layout */
export const dashboardSplitGridClass = "grid flex-1 min-h-0 gap-6";

/** SharedClassSidebar bilan sahifalar (ustun) */
export const withSidebarPageClass =
  "stagger-children flex flex-col gap-6 p-4 md:p-6 lg:pl-0 max-lg:min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden";

/** SharedClassSidebar bilan sahifalar (qator — 2+ card yonma-yon).
    Mobilда qator ustunga aylanadi (yonma-yon panellar telefonga sigʻmaydi). */
export const withSidebarRowPageClass =
  "stagger-children flex max-lg:flex-col gap-6 p-4 md:p-6 lg:pl-0 max-lg:min-h-full lg:h-full lg:min-h-0 lg:overflow-hidden";

/**
 * Toʻliq balandlikdagi panel Card — Ustozona panel tili v1: `border`, soya YOʻQ
 * (bazaviy Card'ning `shadow-sm`i shu yerda oʻchiriladi).
 */
export const panelCardClass =
  "flex flex-col overflow-hidden gap-0 py-0 h-full min-h-0 shadow-none border border-border";

/**
 * Kontent balandligidagi panel Card — ustunda BIR NECHTA panel yonma-yon
 * turganda ishlatiladi.
 *
 * ⚠️ `panelCardClass` ni bunday joyda ishlatib boʻlmaydi: undagi `h-full`
 * har bir panelni ustun balandligiga tortadi, ustun esa hammasini
 * siqadi va `overflow-hidden` kontentni jimgina kesib tashlaydi —
 * sarlavhalarning yarmi qirqilgan panellar chiqadi. `shrink-0` shu
 * yerda, chunki bu panellar hech qachon siqilmasligi kerak: ular
 * kontentiga qarab boʻy oladi, qolgan joyni esa ustundagi asosiy panel
 * (`panelCardClass` bilan) egallaydi.
 */
export const panelCardAutoClass =
  "flex shrink-0 flex-col overflow-hidden gap-0 py-0 shadow-none border border-border";

/** CardHeader — yagona oʻlchov: px-5 py-4, min-h-16 (68px), border-b. */
export const panelCardHeaderClass =
  "flex flex-row items-center shrink-0 space-y-0 border-b border-border min-h-16 px-5 py-4";

export const panelCardContentClass =
  "flex-1 min-h-0 scrollbar-hover overflow-y-auto p-0";

/** CardFooter — modal footeri bilan bir xil: px-5 py-4, bg-muted/20. */
export const panelCardFooterClass =
  "border-t border-border shrink-0 px-5 py-4 bg-muted/20";

/** ScrollArea ichidagi kontent padding — panel gutter (px-5) bilan mos. */
export const panelScrollInnerClass = "px-5 py-5";

/** Custom panel (Card ishlatilmagan) header — standart px-5 py-4, min-h-16 (≈68px). */
export const panelHeaderClass =
  "flex shrink-0 border-b border-border min-h-16 px-5 py-4";

type DashboardPageProps = {
  children: React.ReactNode;
  className?: string;
};

export default function DashboardPage({ children, className }: DashboardPageProps) {
  return <div className={cn(dashboardPageClass, className)}>{children}</div>;
}

/* `DashboardColumns` / `DashboardColumn` / `useDashboardColumns` —
   `@/components/DashboardColumns` da (mobil Sheet bosqichi hooklar talab
   qiladi, shu bois alohida `"use client"` modul). Import yoʻli oʻzgarmasin
   deb fayl boshida re-eksport qilingan. */
