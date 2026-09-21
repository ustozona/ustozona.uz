"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, FileCheck, FilePen, FileText, Paperclip, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTaught, lessonPlanState, type Lesson } from "@/lib/lessons-data";

/* Mavzu kartasidagi dars rejasi belgilari.
   Ikonka doirasi — reja holati: toʻla ✓ (tayyor, qoʻlda belgilangan),
   yarim toʻla (qoralama — matn bor), uzuq chiziqli (hali yoʻq).
   Chiplar — standartlar qamrovi va biriktirilgan materiallar soni. */

export function LessonPlanIcon({ lesson, hex, className }: { lesson: Lesson; hex: string; className?: string }) {
  const t = useTranslations("LessonCycle");
  const state = lessonPlanState(lesson);
  const style: CSSProperties =
    state === "ready"
      ? { backgroundImage: `linear-gradient(135deg, color-mix(in oklch, ${hex} 70%, white) 0%, ${hex} 100%)`, color: "white" }
      : state === "draft"
        ? { backgroundImage: `linear-gradient(to top, color-mix(in oklch, ${hex} 45%, var(--card)) 50%, color-mix(in oklch, ${hex} 12%, var(--card)) 50%)`, color: hex, border: `1.5px solid ${hex}` }
        : { border: `1.5px dashed ${hex}`, color: hex };
  const Icon = state === "ready" ? FileCheck : state === "draft" ? FilePen : FileText;
  const label = t(state === "ready" ? "planStateReady" : state === "draft" ? "planStateDraft" : "planStateNone");
  return (
    <div
      title={label}
      aria-label={label}
      className={cn("list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center", className)}
      style={style}
    >
      <Icon className="size-5" />
    </div>
  );
}

const CHIP = "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-tag font-semibold tabular-nums";

export function LessonMetaChips({ lesson }: { lesson: Lesson }) {
  const t = useTranslations("LessonCycle");
  const standards = lesson.standards?.length ?? 0;
  const materials = lesson.setIds?.length ?? 0;
  return (
    <span className="hidden lg:inline-flex items-center gap-1">
      <span
        title={t("standardsChip", { count: standards })}
        className={cn(CHIP, standards ? "border-border text-foreground/80" : "border-dashed border-border text-muted-foreground")}
      >
        <Target className="size-3" />
        {standards}
      </span>
      {materials > 0 && (
        <span title={t("materialsChip", { count: materials })} className={cn(CHIP, "border-border text-foreground/80")}>
          <Paperclip className="size-3" />
          {materials}
        </span>
      )}
    </span>
  );
}

/* Kartaning oʻng chetidagi holat pill'i — ustun boʻlib tekislanadi (bir xil
   kenglik). Oʻtilgan mavzuda «Oʻtildi», aks holda dars rejasi holati. */
const STATUS_PILL = {
  taught: { cls: "bg-success/10 text-success", Icon: CircleCheck, key: "taught" },
  ready: { cls: "bg-info/10 text-info", Icon: FileCheck, key: "planReadyShort" },
  draft: { cls: "bg-muted text-muted-foreground", Icon: FilePen, key: "pillDraft" },
  none: { cls: "border border-dashed border-warning/60 text-warning", Icon: FileText, key: "pillNone" },
} as const;

export function LessonStatusPill({ lesson }: { lesson: Lesson }) {
  const t = useTranslations("LessonCycle");
  const k = isTaught(lesson) ? "taught" : lessonPlanState(lesson);
  const { cls, Icon, key } = STATUS_PILL[k];
  return (
    <span className={cn("inline-flex h-6 w-28 items-center justify-center gap-1 rounded-full text-tag font-semibold", cls)}>
      <Icon className="size-3" />
      {t(key)}
    </span>
  );
}
