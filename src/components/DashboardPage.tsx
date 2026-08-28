import { cn } from "@/lib/utils";

/** Sahifa padding — shadcn p-6 (24px) scale, responsive.
    `gap-6` — TourDemoBanner kabi qoʻshimcha farzandlar asosiy kontentga
    yopishib qolmasligi uchun (boshqa sahifa qobiqlari — masalan
    withSidebarPageClass — bu gapʼni allaqachon oʻzida beradi). */
export const dashboardPageClass =
  "flex flex-col h-full min-h-0 gap-6 p-4 md:p-6 lg:p-8";

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
  "stagger-children flex flex-col h-full min-h-0 gap-6 p-4 md:p-6 lg:pl-0 overflow-hidden";

/** SharedClassSidebar bilan sahifalar (qator — 2+ card yonma-yon) */
export const withSidebarRowPageClass =
  "stagger-children flex h-full min-h-0 gap-6 p-4 md:p-6 lg:pl-0 overflow-hidden";

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

/**
 * Koʻp-ustunli dashboard qobigʻi (kanonik). CSS Grid asosida — `min-w-0` grid
 * track (`minmax(0,1fr)`) orqali avtomatik, inline `flexGrow/flexBasis` kerak emas.
 *
 * `template` — `lg+` `grid-template-columns` (mas.
 * `"minmax(0,2fr) minmax(0,3fr) minmax(0,1fr)"`). Dinamik nisbat sahifada hisoblanadi.
 * `xlTemplate` — ixtiyoriy: agar biror ustun faqat `xl+` da chiqsa (mas. detal panel),
 * `xl` da track soni oshadi; shu holatda alohida template beriladi.
 * `< lg` da bitta ustun (`grid-cols-1`) — yashirilgan ustunlar boʻsh track qoldirmaydi.
 *
 * MUHIM (grid invariant): har breakpoint'da koʻrinadigan ustunlar soni = shu
 * breakpoint template'idagi track soni. Ustunlar `hideBelow`/shartли render bilan
 * yashirilsa, mos template'ni ham yangilang.
 */
type DashboardColumnsProps = React.ComponentPropsWithoutRef<"div"> & {
  template: string;
  xlTemplate?: string;
};

export function DashboardColumns({
  template,
  xlTemplate,
  className,
  style,
  children,
  ...rest
}: DashboardColumnsProps) {
  return (
    <div
      className={cn(
        "stagger-children grid flex-1 min-w-0 min-h-0 gap-6 grid-cols-1 lg:grid-cols-[var(--dash-cols)]",
        // Ustun nisbati oʻzgarganda (sinf/detal tanlovi) silliq kengayish-torayish.
        // Track soni oʻzgarsa (2→3 ustun) brauzer interpolyatsiyasiz almashtiradi — bu normal.
        "transition-[grid-template-columns] duration-base ease-standard motion-reduce:transition-none",
        xlTemplate && "xl:grid-cols-[var(--dash-cols-xl)]",
        className,
      )}
      style={
        {
          "--dash-cols": template,
          ...(xlTemplate ? { "--dash-cols-xl": xlTemplate } : {}),
          ...style,
        } as React.CSSProperties
      }
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * `DashboardColumns` ustuni. `min-w-0 min-h-0 h-full` majburiy (15px collapse
 * himoyasi). `hideBelow` — breakpoint siyosati: chap panel `lg`, oʻng detal `xl`.
 */
type DashboardColumnProps = React.ComponentPropsWithoutRef<"div"> & {
  hideBelow?: "lg" | "xl";
};

export function DashboardColumn({ hideBelow, className, children, ...rest }: DashboardColumnProps) {
  return (
    <div
      className={cn(
        "min-w-0 min-h-0 h-full",
        hideBelow === "lg" && "hidden lg:block",
        hideBelow === "xl" && "hidden xl:block",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
