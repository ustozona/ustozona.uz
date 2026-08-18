"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { classTints } from "@/lib/class-colors";
import { MaterialKindTile } from "./MaterialKindTile";
import { MATERIAL_KINDS, MATERIAL_KIND_ORDER, type MaterialKind } from "@/lib/material-kinds";

/**
 * Kontent SHAKLINI tanlash qatori — ilova launcher'i uslubidagi kartalar.
 *
 * Nega qator: ilgari bu yerda ikkita oddiy tugma turardi va ostida
 * kulrang matn — «Taqdimot, video, matn va flashkartalar tez orada».
 * Yaʼni kelajakdagi turlar HAQIDA yozilardi, lekin oʻqituvchi ular
 * qanday koʻrinishini tasavvur qila olmasdi. Qator esa ularni
 * KOʻRSATADI: shakli, rangi va qisqa izohi bilan.
 *
 * ── KARTA RETSEPTI ───────────────────────────────────────────────────
 * Karta OQ (`bg-card`), rangli fon butun kartani egallamaydi. Rang —
 * ikonka ORTIDAGI yumshoq radial dogʻ: chap-yuqori burchakdan chiqib,
 * kartaning yarmiga yetmay soʻnadi. Butun karta boʻyalganda beshta
 * karta yonma-yon turib «rangli chiziq» hosil qiladi va matn oʻqilishi
 * pasayadi; dogʻ esa rangni ikonkaga BOGʻLAB qoʻyadi.
 *
 * Rang qotirilmagan — `classTints(...).solid` OKLCH qiymati, yaʼni
 * `class-colors.ts` dvigatelidan. Dark mode avtomatik.
 *
 * Tayyor boʻlmagan tur oʻchirilmaydi: dogʻsiz, uzuq chegarali va
 * neytral plitkali holda qoladi — yoʻl xaritasi shu yerning oʻzida
 * koʻrinib turadi va tur qoʻshilganda interfeys oʻzgarmaydi.
 */
/* Faqat SAVOL IDISHLARI. Dars bu yerda yoʻq — u savol idishi emas,
   baholanmaydigan dars hujjati (registrdagi izohga qarang). */
const CONTAINER_KINDS = MATERIAL_KIND_ORDER.filter((k) => MATERIAL_KINDS[k].isContainer);

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
        "grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(124px,1fr))]",
        className
      )}
    >
      {CONTAINER_KINDS.map((kind) => {
        const meta = MATERIAL_KINDS[kind];
        const ready = meta.attachable;
        return (
          <button
            key={kind}
            type="button"
            disabled={!ready}
            onClick={() => onPick(kind)}
            className={cn(
              "relative overflow-hidden rounded-card border bg-card p-3.5 text-left transition-colors",
              ready
                ? "cursor-pointer border-border hover:bg-muted/40"
                : "cursor-not-allowed border-dashed border-border"
            )}
          >
            {ready && (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-7 -top-7 size-28 rounded-full opacity-30 blur-2xl"
                style={{ backgroundColor: classTints(meta.color).solid }}
              />
            )}
            <span className="relative flex flex-col gap-0.5">
              <MaterialKindTile kind={kind} muted={!ready} />
              <span
                className={cn(
                  "mt-3 text-sm font-medium",
                  ready ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {t(meta.labelKey)}
              </span>
              <span className="text-xs leading-snug text-muted-foreground">
                {ready ? t(meta.shortHintKey) : t("soon")}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
