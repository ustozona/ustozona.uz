"use client";

import { type CSSProperties, type MouseEvent, type ComponentType, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { classTints, CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * BOʻSH SLOT CHORLOVI — "+ Mavzu qoʻshish" va uning ikkilamchi hamrohi
 * (masalan "Ulash"). Kalendar yuzalari (TodayRail, Planner) uchun yagona
 * retsept — ikkalasi HAM shu komponent, farqi faqat `iconOnly`.
 *
 * Anatomiyasi:
 * — nozik dashed perimetr (1px, sinf rangining xira ottenkasi) + QALIN
 *   burchak qavslari (2px, toʻyingan sinf rangi). Qavslar `border` emas,
 *   4 ta absolute span: tinch holatda faqat burchaklar koʻrinadi (dashed
 *   ramkadan sokinroq), hoverda ular 50% gacha oʻsib toʻliq ramkaga
 *   qoʻshiladi;
 * — hoverda tugma sinf gradienti bilan toʻladi (`gradientTile` — sinf
 *   kartalari iconbox'i bilan bir xil), matn `textOnSolid` ga oʻtadi;
 * — `+` belgisi 90° buriladi (faqat asosiy — `icon` almashtirilganda buruvchi
 *   yoʻq, chunki masalan zanjir ikonkasini burash maʼnosiz).
 *
 * Rang KLASS orqali beriladi (inline `color` hover klassini yengib qoʻyardi)
 * — shu sabab ikkala holat ham CSS oʻzgaruvchisi. [[color-system-layers]]
 */
export function AddTopicButton({
  color,
  label,
  icon: Icon = Plus,
  iconOnly = false,
  tooltip,
  onClick,
  className,
}: {
  color: ClassColor;
  /** `iconOnly` boʻlsa faqat `aria-label` uchun ishlatiladi. */
  label: string;
  /** Ikonka — default `+` (asosiy chorlov). Ikkilamchi amal uchun almashtiring. */
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Matn yashirilib, kvadrat ikon-tugmaga aylanadi (ikkilamchi amal uchun). */
  iconOnly?: boolean;
  /** Berilsa — `label`dan toʻliqroq izoh bilan tooltip chiqadi (masalan
      tugma matni "Yaratish", tooltip esa "Yangi dars yaratish"). Native
      `title` emas, ilovaning oʻz `Tooltip` komponenti — uslub bir xil
      boʻlishi uchun. */
  tooltip?: ReactNode;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Balandlik/shrift kontekstga qarab (default `h-9 text-sm`). */
  className?: string;
}) {
  const tints = classTints(color);
  const bracket =
    "pointer-events-none absolute size-3 border-[var(--dot-color)] opacity-60 transition-[width,height,opacity] duration-200 ease-out group-hover/add:h-1/2 group-hover/add:w-1/2 group-hover/add:opacity-100";
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      style={
        {
          ["--dot-color"]: CLASS_COLOR_HEX[color],
          ["--dot-ink"]: tints.textOnSolid.color,
          ["--dot-idle-ink"]: tints.textOnTint.color,
          ["--dot-dash"]: tints.borderMedium.borderColor,
          ["--dot-grad"]: tints.gradientTile.backgroundImage,
        } as CSSProperties
      }
      className={cn(
        "group/add relative flex h-9 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--dot-dash)] text-sm font-semibold text-[var(--dot-idle-ink)] transition-colors duration-200 ease-out hover:border-solid hover:border-[var(--dot-color)] hover:bg-[image:var(--dot-grad)] hover:text-[var(--dot-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring)]",
        iconOnly ? "w-9 shrink-0" : "flex-1 px-3",
        className,
      )}
    >
      <span className={cn(bracket, "-left-px -top-px rounded-tl-md border-l-2 border-t-2")} />
      <span className={cn(bracket, "-right-px -top-px rounded-tr-md border-r-2 border-t-2")} />
      <span className={cn(bracket, "-bottom-px -left-px rounded-bl-md border-b-2 border-l-2")} />
      <span className={cn(bracket, "-bottom-px -right-px rounded-br-md border-b-2 border-r-2")} />
      <Icon
        className={cn(
          "size-4 shrink-0",
          !iconOnly && "transition-transform duration-200 ease-out group-hover/add:rotate-90",
        )}
        strokeWidth={2.5}
      />
      {!iconOnly && <span className="min-w-0 truncate">{label}</span>}
    </button>
  );

  if (!tooltip) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
