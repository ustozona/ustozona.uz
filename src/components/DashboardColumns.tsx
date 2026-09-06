"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsBelow, type Breakpoint } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/* ════════════════════════════════════════════════════════════════════
   KOʻP-USTUNLI DASHBOARD QOBIGʻI + MOBIL SHEET BOSQICHI

   `lg+` da — CSS Grid, `template` bilan berilgan nisbatlar (oʻzgarmadi).

   `< lg` da — bitta ustun. Yon ustunlar endi YOʻQOLMAYDI; nima boʻlishi
   `mobile` propiga bogʻliq:

     mobile berilmagan  → avvalgi xatti-harakat: `hidden lg:block` (ustun yoʻq).
                          Faqat haqiqatan desktop-only kontent uchun.
     mobile="self"      → bola oʻz holicha, toʻliq kenglikda render boʻladi;
                          ixcham koʻrinishni bolaning OʻZI boshqaradi
                          (masalan `ClassListPanel` — trigger tugma + Sheet).
     mobile={{ title }} → bola `Sheet` ichida; ustun oʻrnida trigger tugma.

   Detal/preview panellari `hideTrigger: true` bilan tugma chiqarmaydi —
   ular roʻyxatdagi qator bosilganda ochiladi:

     const { openPanel } = useDashboardColumns();
     <button onClick={() => { setSelected(id); openPanel("preview"); }}>

   ⚠️ JS chegarasi (`useIsBelow`) `hideBelow` bilan bir xil breakpointdan
   oladi — CSS va JS bir joyda ajralib qolsa oʻlik zona paydo boʻladi.
   ════════════════════════════════════════════════════════════════════ */

export type DashboardColumnMobile =
  | "self"
  | {
      /** Trigger tugmasi matni va Sheet sarlavhasi (skrin-riderga). */
      title: string;
      icon?: React.ReactNode;
      /** Sheet qaysi chetdan chiqadi: navigatsiya/tanlov — "left", detal — "right". */
      side?: "left" | "right";
      /** `openPanel`/`closePanels` uchun kalit. Berilmasa `title` ishlatiladi. */
      id?: string;
      /** Trigger tugmasi chizilmasin — panel faqat tashqaridan ochiladi. */
      hideTrigger?: boolean;
      /** Boshqariladigan rejim. `DashboardColumns`ni RENDER QILGAN sahifa
          kontekstdan tashqarida turadi (provider oʻzi shu yerda yaratiladi),
          shuning uchun sahifa panelni shu ikki prop orqali boshqaradi.
          Berilsa kontekst holati eʼtiborga olinmaydi. */
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    };

type DashboardColumnsCtx = {
  openId: string | null;
  openPanel: (id: string) => void;
  closePanels: () => void;
};

const DashboardColumnsContext = React.createContext<DashboardColumnsCtx | null>(null);

/**
 * Mobil panellarni sahifadan boshqarish.
 *
 * `DashboardColumns`dan tashqarida chaqirilsa jimgina no-op qaytaradi —
 * chaqiruv joyini shartli qilib yozish shart emas.
 */
export function useDashboardColumns() {
  const ctx = React.useContext(DashboardColumnsContext);
  const openPanel = ctx?.openPanel;
  const closePanels = ctx?.closePanels;
  return React.useMemo(
    () => ({
      openPanel: openPanel ?? (() => {}),
      closePanels: closePanels ?? (() => {}),
    }),
    [openPanel, closePanels]
  );
}

/**
 * Koʻp-ustunli dashboard qobigʻi (kanonik). CSS Grid asosida — `min-w-0` grid
 * track (`minmax(0,1fr)`) orqali avtomatik, inline `flexGrow/flexBasis` kerak emas.
 *
 * `template` — `lg+` `grid-template-columns` (mas.
 * `"minmax(0,2fr) minmax(0,3fr) minmax(0,1fr)"`). Dinamik nisbat sahifada hisoblanadi.
 * `xlTemplate` — ixtiyoriy: agar biror ustun faqat `xl+` da chiqsa (mas. detal panel),
 * `xl` da track soni oshadi; shu holatda alohida template beriladi.
 * `< lg` da bitta ustun (`grid-cols-1`) va TABIIY balandlik — sahifa oʻzi
 * vertikal scroll qiladi (`dashboard/layout.tsx` dagi `max-lg:overflow-y-auto`).
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
  const [openId, setOpenId] = React.useState<string | null>(null);
  const openPanel = React.useCallback((id: string) => setOpenId(id), []);
  const closePanels = React.useCallback(() => setOpenId(null), []);
  const ctx = React.useMemo<DashboardColumnsCtx>(
    () => ({ openId, openPanel, closePanels }),
    [openId, openPanel, closePanels]
  );

  return (
    <DashboardColumnsContext.Provider value={ctx}>
      <div
        className={cn(
          "stagger-children grid min-w-0 gap-6 grid-cols-1 lg:grid-cols-[var(--dash-cols)]",
          // Mobil: tabiiy balandlik (sahifa scroll qiladi). lg+: qolgan joyni
          // egallaydi va scroll panellar ichida qoladi.
          "max-lg:h-auto lg:flex-1 lg:min-h-0",
          // Ustun nisbati oʻzgarganda (sinf/detal tanlovi) silliq kengayish-torayish.
          // Track soni oʻzgarsa (2→3 ustun) brauzer interpolyatsiyasiz almashtiradi — bu normal.
          "transition-[grid-template-columns] duration-base ease-standard motion-reduce:transition-none",
          xlTemplate && "xl:grid-cols-[var(--dash-cols-xl)]",
          className
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
    </DashboardColumnsContext.Provider>
  );
}

/**
 * `DashboardColumns` ustuni. `min-w-0 min-h-0` majburiy (15px collapse himoyasi),
 * `h-full` esa faqat `lg+` da — mobilда ustun tabiiy balandlik oladi.
 *
 * `hideBelow` — breakpoint siyosati: chap panel `lg`, oʻng detal `xl`.
 * `mobile` — shu breakpointdan pastda ustun nima boʻlishi (yuqoridagi izohga qarang).
 */
type DashboardColumnProps = React.ComponentPropsWithoutRef<"div"> & {
  hideBelow?: "lg" | "xl";
  mobile?: DashboardColumnMobile;
};

export function DashboardColumn({
  hideBelow,
  mobile,
  className,
  children,
  ...rest
}: DashboardColumnProps) {
  const breakpoint: Breakpoint = hideBelow ?? "lg";
  const below = useIsBelow(breakpoint);
  const ctx = React.useContext(DashboardColumnsContext);

  const panel = typeof mobile === "object" && mobile !== null ? mobile : null;

  if (panel && below) {
    const id = panel.id ?? panel.title;
    const side = panel.side ?? "left";
    const controlled = panel.open !== undefined;
    const isOpen = controlled ? !!panel.open : ctx?.openId === id;
    const setOpen = (open: boolean) => {
      if (controlled) panel.onOpenChange?.(open);
      else if (open) ctx?.openPanel(id);
      else ctx?.closePanels();
    };
    return (
      <>
        {!panel.hideTrigger && (
          // 40px balandlik ATAYLAB (toolbar standarti 36px emas) — mobil
          // barmoq nishoni; DESIGN.md dagi hujjatlangan deviatsiya.
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(true)}
            className="h-10 w-full min-w-0 shrink-0 justify-start gap-2 shadow-none"
          >
            {panel.icon}
            <span className="min-w-0 truncate">{panel.title}</span>
          </Button>
        )}
        <Sheet open={isOpen} onOpenChange={setOpen}>
          {/* Sarlavha faqat skrin-rider uchun (Radix talab qiladi) va yopish
              tugmasi yoʻq — `Sidebar`ning mobil Sheet'i bilan bir xil naqsh:
              yopish qoplama (overlay) bosilganda. Panel oʻz chegarasini
              saqlashi uchun p-3 ichki masofa beriladi. */}
          <SheetContent
            side={side}
            showCloseButton={false}
            className="w-[88vw] gap-0 p-3 sm:max-w-sm"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>{panel.title}</SheetTitle>
            </SheetHeader>
            <div className="flex h-full min-h-0 flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0 min-h-0 lg:h-full max-lg:h-auto",
        // `mobile` berilgan ustun mobilда yashirilmaydi — u yerda oʻzini
        // boshqaradi ("self") yoki yuqoridagi Sheet shoxiga tushadi.
        !mobile && hideBelow === "lg" && "hidden lg:block",
        !mobile && hideBelow === "xl" && "hidden xl:block",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
