"use client";

import type { ReactNode } from "react";
import { ClassBadge } from "@/components/ClassBadge";
import { ClassSwatch } from "@/components/ClassSwatch";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CLASS_COLOR_HEX, classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/**
 * EVENT CHIPI — oy-koʻrinish katakchalari uchun ixcham pill.
 *
 * Tuzilishi (Google Calendar agenda + Amie "vaqt gutteri" naqshi):
 *
 *   boʻsh slot:  [ 08:00 ]( • 5-A )              ← ichida SINF BADGE'i
 *   darsli slot: [ 08:50 ] • Kasrlarni qoʻshish  ← ichida MAVZU nomi
 *                  30px
 *
 * ① VAQT — CHAPDA, fiksirlangan 30px mono ustunda. Ilgari `ml-auto` bilan
 *    oʻngga surilardi va uzun mavzu nomi uni siqib chiqarardi; endi nom har
 *    doim bir xil x'dan boshlanadi, koʻz ustundan pastga yuguradi.
 *    `font-mono` MAJBURIY — DM Sans'da tabular figura yoʻq, `tabular-nums`
 *    bu shriftda hech narsa qilmaydi va raqamlar sakraydi. [[dm-sans-no-tabular-nums]]
 *
 * ② SHAKL — TASHQI chip HAR DOIM standart event card: `rounded-md`
 *    ([[design-system]] §4, "kichik chip"). Badge tili tashqi chipga EMAS,
 *    faqat uning ICHIDAGI SINF YORLIGʻIGA tegishli: boʻsh slotda yorliq
 *    sinf nomi boʻlgani uchun u kanonik `<ClassBadge>` bilan chiziladi.
 *    Darsli slotda yorliq MAVZU nomi — u sinf yorligʻi emas, shuning uchun
 *    badge'siz, oddiy matn (sinf qaysiligini yonidagi doira tashiydi).
 *
 * ③ HOLAT — yuzaning TOʻYINGANLIGI bilan beriladi (dashed ramka bilan emas):
 *    `fill` = dars ulangan → `chipFill` (55%) yuza + `textStrong` siyoh;
 *    `tint` = hali boʻsh slot → sinf rangining ENG OCHI (`tint`, 7%) yuza,
 *    ustida badge (`badge`, 18%) — ikki qatlam bir-biridan ajralib turadi.
 *    Oy toʻrida 35 katak × 2 pill bor, ularning koʻpi boʻsh — har biriga
 *    dashed perimetr berilsa toʻr tirnalib ketadi. `dashed` shu sababli
 *    faqat drag-drop nishoni sifatida qoladi (oʻz asl maʼnosida).
 *
 * ④ RANG — har ikkala holatda ham kanonik `ClassSwatch` doirasi tashiydi
 *    ([[class-swatch-standard]]), faqat joyi farq qiladi: boʻsh slotda
 *    badge ichida, darsli slotda mavzu nomining oldida.
 *
 * Nega `EventCard` emas: u vaqt-proporsional bloklar (hafta/kun/jadval)
 * uchun, u yerda `micro` zichlik BOʻSH slotda ham koʻrinishi shart. Bu yerda
 * masshtab boshqa — roʻyxat qatori. Umumiy qolgani rang manbai: `classTints`.
 * [[color-system-layers]]
 *
 * ⑤ HOVER — `hoverContent` berilsa, pill ustiga turilganda tafsilot ochiladi
 *    (Google Calendar/Notion Calendar oy-koʻrinish naqshi: katak juda tor,
 *    toʻliq mavzu nomi va vaqt oralig'i pillda kesilib qoladi). Mazmun
 *    ISTEʼMOLCHIDAN keladi — bu komponent domenni bilmaydi (mavzu, status
 *    v.b.), faqat joylashtiradi. `openDelay={150}` — loyihadagi boshqa
 *    hover-kartalar bilan bir xil ([[GradesTable]] `pedagogikSignal`),
 *    Radix defaulti (700ms) zich toʻrda sekin tuyuladi. Qobiq oʻlchami
 *    (`w-64`/`p-4`) ham loyihaning yagona `HoverCardContent` konvensiyasi —
 *    isteʼmolchi ustidan yozmaydi.
 */
export function EventPill({
  color,
  label,
  time,
  variant = "tint",
  hoverContent,
  onClick,
  className,
}: {
  color: ClassColor;
  label: string;
  /** Boshlanish vaqti (masalan "08:50") — chapdagi mono ustunda. */
  time?: string;
  /** `tint` = boʻsh slot (yorliq = sinf badge'i), `fill` = darsli slot (yorliq = mavzu). */
  variant?: "tint" | "fill";
  /** Berilsa — hoverda tafsilot popover'i ochiladi (vaqt oralig'i, toʻliq nom, holat). */
  hoverContent?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const tints = classTints(color);
  const filled = variant === "fill";
  const button = (
    <button
      type="button"
      onClick={onClick}
      title={time ? `${time} · ${label}` : label}
      style={filled ? tints.chipFill : tints.tint}
      className={cn(
        "flex h-6 w-full shrink-0 items-center gap-1.5 rounded-md pl-1.5 pr-1.5 text-left transition-[filter] duration-fast hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        className,
      )}
    >
      {time && (
        /* 30px = JetBrains Mono 10px'da "08:50" ning aniq kengligi (0.6em × 5).
           `shrink-0` — nom uzun boʻlsa ham ustun qisqarmasin. */
        <span style={tints.text} className="w-[30px] shrink-0 font-mono text-[10px] leading-none">
          {time}
        </span>
      )}
      {filled ? (
        <>
          <ClassSwatch hex={CLASS_COLOR_HEX[color]} className="size-2" />
          <span style={tints.textStrong} className="min-w-0 truncate text-xs font-semibold">
            {label}
          </span>
        </>
      ) : (
        <ClassBadge color={color} name={label} />
      )}
    </button>
  );

  if (!hoverContent) return button;

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>{button}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-64">
        {hoverContent}
      </HoverCardContent>
    </HoverCard>
  );
}
