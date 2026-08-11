"use client";

import { forwardRef, type CSSProperties, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { cn } from "@/lib/utils";

/** Kunning oqimiga nisbatan holat (TodayRail semantikasi):
    current = hozir ketyapti (rang halqa), next = navbatdagi (yumshoq halqa).
    past uchun endi vizual farq yoʻq — darslar hech qachon xira koʻrinmaydi. */
export type EventCardTemporal = "past" | "current" | "next";

type EventCardOwnProps = {
  color: ClassColor;
  title: string;
  /** Sarlavha ostidagi qator (vaqt, ikona bilan). */
  subtitle?: ReactNode;
  /** Sarlavha oldidagi ikona (masalan bajarilgan/qoralama belgisi). */
  leading?: ReactNode;
  /** Sarlavha qatoridagi oxirgi belgi (masalan "Nazorat" badge). */
  trailing?: ReactNode;
  /** Absolute oʻng-yuqoridagi amal(lar) — hover'da chiqadi. */
  actions?: ReactNode;
  /** Pastki CTA zonasi (masalan boʻsh slotdagi "+ Dars" menyusi). */
  footer?: ReactNode;
  /** dizayn grammatikasi: ulangan (filled) vs boʻsh (empty) slot */
  state?: "filled" | "empty";
  /** "auto" — `style.height` (px) dan hisoblanadi; balandlik-boshqaruvli
      yuzalar (planner, jadval erkin rejimi) shuni ishlatsin. */
  density?: "cozy" | "compact" | "micro" | "auto";
  temporal?: EventCardTemporal;
  interactive?: boolean;
  titleRowClassName?: string;
  /** Sarlavha matni uchun qoʻshimcha klass (masalan kattaroq shrift) — bosiladigan
      hajm/zichlikni buzmasdan faqat matn oʻlchamini ustidan yozadi. */
  titleClassName?: string;
  /** Berilsa — sarlavhaning OʻZI havola boʻladi: hoverda tagi chiziladi va
      yonida `↗` chiqadi. Burchakka alohida tugma qoʻyishdan afzal — yolgʻiz
      amal uchun menyu ochish kerak boʻlmaydi va burchak boʻsh qoladi. */
  titleHref?: string;
  /** `titleHref` uchun tooltip / aria matni. */
  titleHrefLabel?: string;
};

type EventCardDivProps = EventCardOwnProps & { as?: "div" } & HTMLAttributes<HTMLDivElement>;
type EventCardButtonProps = EventCardOwnProps & { as: "button" } & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * EVENT KARTASI — barcha kalendar yuzalari uchun yagona retsept.
 * Ikki holat: `filled` (dars ulangan — toʻyingan sinf rangi) va
 * `empty` (boʻsh slot — sinf rangining xira "arvohi"). [[color-system-layers]]
 * Geometriya (absolute top/height) isteʼmolchidan `style` orqali keladi;
 * DnD/klik atributlari `...rest` bilan oʻtadi.
 */
export const EventCard = forwardRef<HTMLDivElement | HTMLButtonElement, EventCardDivProps | EventCardButtonProps>(
  function EventCard(
    {
      color,
      title,
      subtitle,
      leading,
      trailing,
      actions,
      footer,
      state = "filled",
      density = "cozy",
      temporal,
      interactive = false,
      titleRowClassName,
      titleClassName,
      titleHref,
      titleHrefLabel,
      className,
      style,
      children,
      as = "div",
      ...rest
    },
    ref,
  ) {
    const tints = classTints(color);
    const filled = state === "filled";
    const ringStyle: CSSProperties =
      temporal === "current"
        ? { boxShadow: `0 0 0 2px color-mix(in oklch, ${tints.solid} 55%, transparent)` }
        : temporal === "next"
          ? { boxShadow: `0 0 0 1px color-mix(in oklch, ${tints.solid} 35%, transparent)` }
          : {};

    // Zichlik: past blokda vaqt sarlavha bilan bir qatorga tushadi, juda pastida
    // umuman koʻrsatilmaydi (Google Calendar / Outlook naqshi).
    const h = typeof style?.height === "number" ? style.height : undefined;
    const resolvedDensity: "cozy" | "compact" | "micro" =
      density !== "auto" ? density : h == null || h >= 64 ? "cozy" : h >= 38 ? "compact" : "micro";

    const Comp = as as "div";
    return (
      <Comp
        {...(rest as HTMLAttributes<HTMLDivElement>)}
        ref={ref as never}
        style={{
          /* Ulangan yuza — tekstura SAQLANADI, lekin tekis rang ustida emas,
             gradient ustida (`gradientSurface` ikki qatlam beradi). Jadval
             (PeriodGrid) va chop etish varagʻi hozircha tekis-rangli
             `classStripedSurface` da qoladi — boshqa masshtabdagi yuzalar. */
          ...(filled ? tints.gradientSurface : { ...tints.tint, ...tints.borderMedium }),
          ...ringStyle,
          ...style,
        }}
        className={cn(
          // [[design-system]] konsentriklik qoidasi: rounded-xl (12px) tashqarida,
          // ichki elementlar rounded-md (12−padding).
          "group/ev relative flex flex-col overflow-hidden rounded-xl text-left",
          // BOʻSHLIQ SHKALASI — yagona manba, 4px setkasida. Isteʼmolchilar
          // `p-*` ni ustidan yozmasin: zichlik allaqachon kartaning oʻz
          // balandligidan hisoblanadi.
          resolvedDensity === "cozy" ? "gap-0.5 p-3" : resolvedDensity === "compact" ? "gap-0.5 p-2" : "gap-0 p-1.5",
          // Boʻsh slot yuzasi juda xira — chegara boʻlmasa fon bilan qoʻshilib ketadi
          !filled && "border border-dashed",
          interactive && "cursor-pointer transition hover:brightness-[0.97]",
          as === "button" && "w-full",
          className,
        )}
      >
        {/* Boʻsh slot belgisi FAQAT nozik dashed perimetr. Burchak qavslari
            ataylab yoʻq: ular karta ichidagi "+ Mavzu qoʻshish" tugmasida
            ishlatiladi, ikkala masshtabda takrorlansa pastki burchaklarda
            ikki qavs 10px masofada yonma-yon tushib, belgi maʼnosini
            yoʻqotardi. Bitta motiv — bitta joyda. */}
        <span className={cn("relative flex min-w-0 items-center gap-1.5", resolvedDensity === "compact" && "items-baseline", titleRowClassName)}>
          {leading}
          {titleHref ? (
            <Link
              href={titleHref}
              title={titleHrefLabel ?? title}
              aria-label={titleHrefLabel}
              onClick={(e) => e.stopPropagation()}
              style={filled ? tints.textOnSolid : tints.textOnTint}
              className={cn(
                "group/title flex min-w-0 items-center gap-1 font-bold leading-tight underline-offset-[3px] hover:underline focus-visible:underline focus-visible:outline-none",
                resolvedDensity === "micro" ? "text-xs" : "text-sm",
                titleClassName,
              )}
            >
              <span className="min-w-0 truncate">{title}</span>
              <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity duration-fast group-hover/ev:opacity-100 group-focus-visible/title:opacity-100 [@media(hover:none)]:opacity-100" />
            </Link>
          ) : (
            <span
              title={title}
              style={filled ? tints.textOnSolid : tints.textOnTint}
              className={cn(
                "min-w-0 truncate font-bold leading-tight",
                resolvedDensity === "micro" ? "text-xs" : "text-sm",
                titleClassName,
              )}
            >
              {title}
            </span>
          )}
          {trailing}
          {resolvedDensity === "compact" && subtitle != null && (
            <span
              style={filled ? tints.textOnSolidMuted : tints.textOnTintMuted}
              className="shrink-0 truncate text-xs"
            >
              {subtitle}
            </span>
          )}
        </span>
        {resolvedDensity === "cozy" && subtitle != null && (
          <span
            style={filled ? tints.textOnSolidMuted : tints.textOnTintMuted}
            className="relative flex min-w-0 items-center gap-1.5 truncate text-xs"
          >
            {subtitle}
          </span>
        )}
        {children}
        {actions != null && (
          <div className="absolute right-1 top-1 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover/ev:opacity-100 [@media(hover:none)]:opacity-100">
            {actions}
          </div>
        )}
        {footer != null && <div className="relative mt-auto pt-2">{footer}</div>}
      </Comp>
    );
  },
);
