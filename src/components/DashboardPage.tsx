import { cn } from "@/lib/utils";

/** Sahifa padding — shadcn p-6 (24px) scale, responsive */
export const dashboardPageClass =
  "flex flex-col h-full min-h-0 p-4 md:p-6 lg:p-8";

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
  "flex flex-col h-full min-h-0 gap-6 p-4 md:p-6 lg:pl-0 overflow-hidden";

/** SharedClassSidebar bilan sahifalar (qator — 2+ card yonma-yon) */
export const withSidebarRowPageClass =
  "flex h-full min-h-0 gap-6 p-4 md:p-6 lg:pl-0 overflow-hidden";

/** Toʻliq balandlikdagi panel Card */
export const panelCardClass =
  "flex flex-col overflow-hidden gap-0 py-0 h-full min-h-0";

/** CardHeader — default px-6 + border-b pb-6; py-0 panel uchun pt-6 */
export const panelCardHeaderClass =
  "flex flex-row items-center shrink-0 space-y-0 border-b border-border pt-6";

export const panelCardContentClass =
  "flex-1 min-h-0 overflow-y-auto p-0";

/** CardFooter — default px-6 + border-t pt-6; py-0 panel uchun pb-6 */
export const panelCardFooterClass =
  "border-t border-border shrink-0 py-6";

/** ScrollArea ichidagi kontent padding */
export const panelScrollInnerClass = "px-6 py-6";

/** Custom panel (Card ishlatilmagan) header — standart px-5 py-5 (+consumer min-h-[4.5rem] ≈ 76px). */
export const panelHeaderClass =
  "flex shrink-0 border-b border-border px-5 py-5";

type DashboardPageProps = {
  children: React.ReactNode;
  className?: string;
};

export default function DashboardPage({ children, className }: DashboardPageProps) {
  return <div className={cn(dashboardPageClass, className)}>{children}</div>;
}
