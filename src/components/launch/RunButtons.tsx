"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LaunchIntent } from "@/lib/launch-types";
import { LAUNCH_INTENTS } from "./launch-modes";

/* ════════════════════════════════════════════════════════════════════
   «DARSDA OʻTKAZISH» · «UYGA BERISH» — testni oʻquvchilarga berishning
   yagona ikki tugmasi.

   Topshiriqlar roʻyxati, topshiriq muharriri va test banki — uchalasi
   ham AYNAN shu tugmalarni koʻrsatadi. Nom nima boʻlishini aytadi:
   yolgʻiz «Boshlash» yoki «Sessiya» nimani boshlashini aytmasdi
   (loyiha egasining fikri, 2026-09-27).

   `labels` — tor joyda (roʻyxat qatori) yozuv kichik ekranda yashiriladi,
   ikonka va `aria-label` qoladi.
   ════════════════════════════════════════════════════════════════════ */

export const RUN_INTENTS: LaunchIntent[] = ["class", "home"];

export function useRunIntentLabels() {
  const t = useTranslations("LaunchHub");
  return {
    class: { label: t("runInClass"), hint: t("runInClassHint") },
    home: { label: t("giveHomework"), hint: t("giveHomeworkHint") },
  } satisfies Record<LaunchIntent, { label: string; hint: string }>;
}

export function RunButtons({
  onRun,
  labels = "always",
  primary,
}: {
  onRun: (intent: LaunchIntent) => void;
  /** Yozuv qachon koʻrinadi: har doim yoki `sm`/`md` dan kengroq ekranda. */
  labels?: "always" | "sm" | "md";
  /** Toʻldirilgan (asosiy) tugma — muharrirda test kartasining keyingi qadami. */
  primary?: boolean;
}) {
  const text = useRunIntentLabels();
  return (
    <>
      {RUN_INTENTS.map((intent) => {
        const Icon = LAUNCH_INTENTS[intent].icon;
        return (
          <Button
            key={intent}
            size="sm"
            variant={primary ? "default" : "outline"}
            className={cn("shrink-0 gap-1.5", !primary && "shadow-none")}
            title={text[intent].hint}
            aria-label={text[intent].label}
            onClick={() => onRun(intent)}
          >
            <Icon className="size-3.5" />
            <span
              className={cn(
                labels === "sm" && "hidden sm:inline",
                labels === "md" && "hidden md:inline",
              )}
            >
              {text[intent].label}
            </span>
          </Button>
        );
      })}
    </>
  );
}
