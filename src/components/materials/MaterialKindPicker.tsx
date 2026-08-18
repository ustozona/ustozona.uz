"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MaterialKindTile } from "./MaterialKindTile";
import { MATERIAL_KINDS, MATERIAL_KIND_ORDER, type MaterialKind } from "@/lib/material-kinds";

/**
 * Kontent SHAKLINI tanlash qatori — Wayground'ning
 * «Assessment / Presentation / Video / Passage / Flashcards» naqshi.
 *
 * Nega tugma emas, qator: ilgari bu yerda ikkita oddiy tugma turardi
 * («Yangi test tuzish», «Mavjud testdan tanlash») va ostida kulrang
 * matn — «Taqdimot, video, matn va flashkartalar tez orada». Yaʼni
 * kelajakdagi turlar HAQIDA yozilardi, lekin oʻqituvchi ular qanday
 * koʻrinishini tasavvur qila olmasdi. Qator esa oʻsha turlarni
 * KOʻRSATADI: shakli, rangi va bir qatorlik izohi bilan.
 *
 * Tayyor boʻlmagan tur oʻchirilmaydi, soʻniq holda qoladi — yoʻl
 * xaritasi shu yerning oʻzida koʻrinib turadi va tur qoʻshilganda
 * interfeys oʻzgarmaydi, faqat rang jonlanadi.
 */
export function MaterialKindPicker({
  onPick,
  className,
}: {
  onPick: (kind: MaterialKind) => void;
  className?: string;
}) {
  const t = useTranslations("MaterialKinds");

  return (
    <div
      className={cn(
        "grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]",
        className
      )}
    >
      {MATERIAL_KIND_ORDER.map((kind) => {
        const meta = MATERIAL_KINDS[kind];
        const ready = meta.attachable;
        return (
          <button
            key={kind}
            type="button"
            disabled={!ready}
            onClick={() => onPick(kind)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-card border border-border p-3 text-center transition-colors",
              ready
                ? "cursor-pointer hover:bg-muted/50"
                : "cursor-not-allowed border-dashed"
            )}
          >
            <MaterialKindTile kind={kind} className="size-10 [&_svg]:size-5" muted={!ready} />
            <span className="text-sm font-medium">{t(meta.labelKey)}</span>
            <span className="text-xs leading-snug text-muted-foreground">
              {ready ? t(meta.hintKey) : t("soon")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
