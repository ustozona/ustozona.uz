"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { STATUS_META, type StatusInfo } from "@/lib/assignment-status";

/**
 * Topshiriq holati chipi — miqdoriy holatda ikonka oʻrniga HALQA.
 *
 * Halqa rangi `currentColor`, yaʼni chip ohangidan meros oladi: rang faqat
 * `STATUS_META.cls` da bir marta eʼlon qilinadi.
 *
 * Yagona komponent, chunki chip IKKI joyda koʻrinadi — roʻyxat qatorida va
 * muharrir sarlavhasida. Ikkinchi nusxa yozilsa, ohang yoki tooltip matni
 * bir kun ajralib ketardi.
 */
export function AssignmentStatusChip({
  status,
  className,
}: {
  status: StatusInfo;
  className?: string;
}) {
  const t = useTranslations("AssignmentsPage");
  const meta = STATUS_META[status.kind];
  const Icon = meta.icon;
  const count = status.kind === "grading" || status.kind === "done" ? status : null;
  const label = count ? `${count.graded}/${count.total}` : t(`status_${status.kind}`);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex shrink-0 cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            meta.cls,
            className
          )}
        >
          {count ? (
            <ProgressRing
              pct={count.total > 0 ? (count.graded / count.total) * 100 : 0}
              size={14}
              strokeWidth={2.5}
              trackMix={25}
            />
          ) : (
            <Icon className="size-3.5" />
          )}
          <span className={cn(count && "font-mono tabular-nums")}>{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-56">
        {count
          ? t(`statusHint_${status.kind}`, { graded: count.graded, total: count.total })
          : t(`statusHint_${status.kind}`)}
      </TooltipContent>
    </Tooltip>
  );
}
