"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ════════════════════════════════════════════════════════════════════
   «← ORQAGA» — toʻliq ekranli oynalarning chap yuqori burchagi.

   Ilgari bu joyda bezak ikonka (`SectionIcon`) turardi: koʻrinishi
   tugmaga oʻxshardi, lekin bosilmasdi. Oʻqituvchi esa aynan shu yerda
   «bir qadam orqaga» izlaydi (loyiha egasining fikri, 2026-09-28).
   Oʻlcham va shakl `SectionIcon` bilan bir xil — sarlavha ritmi
   oʻzgarmaydi, faqat endi bosiladi.

   Nima qilishini chaqiruvchi hal qiladi: dars muharriri — ilova
   tarixida orqaga (`useBackOrPush`), ustki oynalar — oʻzini yopib,
   ostidagi sahifaga qaytadi.
   ════════════════════════════════════════════════════════════════════ */

export function BackButton({
  onClick,
  disabled,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("BackButton");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={t("label")}
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/75 transition-colors duration-fast",
            "hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
        >
          <ArrowLeft className="size-[18px]" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{t("label")}</TooltipContent>
    </Tooltip>
  );
}
