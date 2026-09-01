"use client";

import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import type { DoskaWidget } from "@/lib/doska/types";
import { BarDivider, BarGroup, BarIconButton } from "./BarGroup";
import { IconBringForward, IconCopy, IconTrash } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   KONTEKST ASBOBLAR PANELI — tanlangan vidjet ustida suzadi.

   Ilgari tanlovda faqat yakka «×» tugmasi bor edi: oʻchirishdan boshqa
   amalning uyi yoʻq edi va har yangi amal burchakka yana bir doira
   qoʻshishni talab qilardi. Endi amallar bitta guruhda, vidjetning
   ustida — yaʼni oʻqituvchining nigohi allaqachon turgan joyda.

   ⚠️ Panel tanlov ramkasining ICHIDA emas. Ramka `--z-doska-handles`
   da, panel esa `--z-doska-context` da (§5) — aks holda ustidan
   tushgan boshqa vidjet uni berkitib qoʻyardi.

   ⚠️ Har tugmada `data-doska-no-drag`: dispatcher hodisa nishoniga
   qarab ish koʻradi va busiz panelga bosish vidjetni sudrab yuborardi
   (`interaction.ts` dagi ATTR_NO_DRAG izohi).
   ════════════════════════════════════════════════════════════════════ */

/** Panel bilan vidjet orasidagi masofa (piksel). */
const GAP = 10;

/**
 * Panelning taxminiy balandligi — tepada joy yetadimi degan hisob uchun.
 * Aniq oʻlchash (`getBoundingClientRect`) shart emas: xato qilsa ham
 * eng yomoni panel pastga tushadi, bu esa buzilish emas.
 */
const HEIGHT = 48;

export function WidgetToolbar({ widget }: { widget: DoskaWidget }) {
  const removeWidget = useDoskaStore((s) => s.removeWidget);
  const duplicateWidget = useDoskaStore((s) => s.duplicateWidget);
  const bringToFront = useDoskaStore((s) => s.bringToFront);

  const label = widgetMeta(widget.kind).label;

  // Vidjet ekranning tepasiga yopishganda panel yuqorida joy topolmaydi
  // va kanvasdan chiqib ketardi — bunday holatda pastga tushadi.
  const above = widget.y >= HEIGHT + GAP;

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: widget.x + widget.w / 2,
        top: above ? widget.y - GAP : widget.y + widget.h + GAP,
        transform: `translate(-50%, ${above ? "-100%" : "0"})`,
        zIndex: "var(--z-doska-context)",
      }}
    >
      <BarGroup layer="context">
        <BarIconButton
          label={`${label} — nusxalash`}
          data-doska-no-drag=""
          onClick={() => duplicateWidget(widget.id)}
        >
          <IconCopy className="size-5" />
        </BarIconButton>

        <BarIconButton
          label={`${label} — oldinga chiqarish`}
          data-doska-no-drag=""
          onClick={() => bringToFront(widget.id)}
        >
          <IconBringForward className="size-5" />
        </BarIconButton>

        <BarDivider />

        <BarIconButton
          label={`${label} — oʻchirish`}
          data-doska-no-drag=""
          onClick={() => removeWidget(widget.id)}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <IconTrash className="size-5" />
        </BarIconButton>
      </BarGroup>
    </div>
  );
}
