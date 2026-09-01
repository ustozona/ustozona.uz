"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ════════════════════════════════════════════════════════════════════
   SUZUVCHI BOSHQARUV GURUHI — Doskadagi har panelning idishi.

   Doskada kanvas butun ekranni egallaydi, boshqaruv esa uning ustida
   suzadi. Yaʼni har boshqaruv toʻdasi oʻzini fondan ajratishi kerak:
   oq yuza, chegara, soya, oʻz z-qatlami. Bu klass satri ilgari
   `DoskaShell` da uch marta va `DoskaMenu` da toʻrtinchi marta qoʻlda
   yozilgan edi — biri oʻzgarsa qolgani ortda qolardi.

   ⚠️ Panel border BILAN ham, shadow BILAN ham chiziladi va bu
   `docs/design-system.md` dagi «border YOKI shadow» qoidasidan ATAYLAB
   chetlashish. Sabab: u yerdagi qoida panel varaq ustida turishini
   nazarda tutadi, bu yerda esa fon ixtiyoriy rangda — och fonda
   chegara, toʻq fonda soya ushlab turadi. Bittasi yetmaydi.

   IKKI TUR, chunki ular haqiqatan boshqacha ishlaydi:

     • `segmented` — ichki tugmalar bir-biriga tegib turadi, radius
       idishda, ajratgich `<BarDivider>`. Ikonali boshqaruv toʻdasi
       uchun (uy, toʻliq ekran, menyu, ekran navigatsiyasi).

     • `padded` — ichki tugmalar oʻz radiusini saqlaydi va idish ularga
       joy beradi. Yorliqli vidjet tugmalari uchun: ular allaqachon
       52px kenglikda va tegib tursa qator devorga aylanadi.
   ════════════════════════════════════════════════════════════════════ */

export function BarGroup({
  variant = "segmented",
  layer = "top",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "segmented" | "padded";
  /** Qaysi z-qatlamda turadi (docs/doska-dizayn-tizimi.md §5). */
  layer?: "top" | "bar" | "context";
}) {
  return (
    <div
      className={cn(
        "doska-bar bg-background pointer-events-auto isolate inline-flex items-center rounded-[var(--radius)] border shadow-md",
        // `overflow-clip` faqat segmentli turda: u ichki tugmaning
        // burchagini idish radiusiga qirqadi. Yorliqli turda esa
        // tugmalar idish ichida suzadi, qirqish kerak emas — aksincha,
        // u tor holatdagi gorizontal aylantirishni buzardi.
        variant === "segmented" ? "overflow-clip" : "gap-1 p-2",
        className,
      )}
      style={{ zIndex: `var(--z-doska-${layer})` }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Guruh ichidagi ajratgich.
 *
 * `self-stretch` + vertikal margin: chiziq idish balandligiga
 * choʻziladi, lekin chetiga tegmaydi — shunda u chegaraning davomi
 * emas, ichki boʻlinish boʻlib oʻqiladi.
 */
export function BarDivider() {
  return <span className="bg-border my-1.5 w-px self-stretch" aria-hidden="true" />;
}

/**
 * Guruh ichidagi yakka ikonali tugma — 40×40.
 *
 * `BarButton` dan farqi: unda yorliq bor va u vidjet qoʻyadi; bu esa
 * amal bajaradi va nomini faqat tooltipʼda aytadi.
 *
 * ⚠️ `title` atributi ISHLATILMAYDI — brauzer uni ~1 soniya kutib
 * chiqaradi va uslubga boʻysunmaydi. Dars oʻrtasida bu «tugma nima
 * qilishini bilmadim» degani. `TooltipProvider` `DoskaShell` da.
 */
/**
 * Guruh ichidagi tugmaning koʻrinishi — klass sifatida.
 *
 * ⚠️ Ochiq eksport qilingan, chunki `DoskaMenu` ning tugmasi
 * `PopoverTrigger asChild` ning bolasi boʻlishi kerak. U
 * `<BarIconButton>` ga oʻralса zanjir `asChild` → `<Tooltip>` (DOM
 * element EMAS) boʻlib uzilardi. Menyu tugmasiga tooltip baribir
 * kerak emas — u bosilganda mazmuni oʻzini tanishtiradi.
 */
export const barIconButtonClass =
  "text-foreground/85 hover:bg-muted hover:text-foreground grid size-10 shrink-0 place-items-center transition-colors " +
  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none focus-visible:-outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-30";

export function BarIconButton({
  label,
  asChild = false,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { label: string; asChild?: boolean }) {
  const shell = cn(barIconButtonClass, className);

  const trigger =
    asChild && React.isValidElement(children) ? (
      React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        className: shell,
        "aria-label": label,
      })
    ) : (
      <button type="button" aria-label={label} className={shell} {...props}>
        {children}
      </button>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}
