"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Check, CircleCheck, CircleDashed, Clock, FileCheck, Paperclip, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const Icon = state === "ready" ? FileCheck : state === "draft" ? Clock : CircleDashed;
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

/* Mavzu kartasining chap tomoni — kalendar varaqcha (sinf rangida: oy, kun)
   va burchakda dars holati belgisi. Belgilar ataylab turli shaklda, rangga
   tayanmasdan ham farqlansin: uzuq doira — reja yoʻq, soat — jarayonda,
   hujjat ✓ — rejalashtirilgan, ✓ — oʻtildi. Sanasiz mavzuda varaqcha «—» koʻrsatadi. */
const LEAF_BADGE = {
  none: { cls: "bg-card border-card text-muted-foreground", Icon: CircleDashed, key: "pillNone" },
  draft: { cls: "bg-warning border-card text-warning-foreground", Icon: Clock, key: "pillDraft" },
  ready: { cls: "bg-info border-card text-info-foreground", Icon: FileCheck, key: "planReadyShort" },
  taught: { cls: "bg-success border-card text-success-foreground", Icon: Check, key: "taught" },
} as const;

export function LessonDateLeaf({ lesson, hex, day, month }: { lesson: Lesson; hex: string; day?: string; month?: string }) {
  const t = useTranslations("LessonCycle");
  const k = isTaught(lesson) ? "taught" : lessonPlanState(lesson);
  const { cls, Icon, key } = LEAF_BADGE[k];
  return (
    <div className="relative shrink-0 w-11" title={t(key)} aria-label={t(key)}>
      <div className="rounded-lg overflow-hidden text-center border" style={{ borderColor: hex }}>
        <div className="text-micro uppercase py-px text-white" style={{ backgroundColor: hex }}>{month ?? "—"}</div>
        <div className="text-base font-semibold leading-6 tabular-nums text-foreground">{day ?? "—"}</div>
      </div>
      <span className={cn("absolute -right-1.5 -bottom-1.5 size-5 rounded-full border-2 flex items-center justify-center", cls)}>
        <Icon className={k === "none" ? "size-4" : "size-2.5"} strokeWidth={k === "none" ? 2.5 : 3} />
      </span>
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
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(CHIP, standards ? "border-border text-foreground/80" : "border-dashed border-border text-muted-foreground")}>
            <Target className="size-3" />
            {standards}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          {t("standardsChip", { count: standards })}
          {standards > 0 && <span className="block tabular-nums opacity-80">{lesson.standards!.join(", ")}</span>}
        </TooltipContent>
      </Tooltip>
      {materials > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(CHIP, "border-border text-foreground/80")}>
              <Paperclip className="size-3" />
              {materials}
            </span>
          </TooltipTrigger>
          <TooltipContent>{t("materialsChip", { count: materials })}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/* Kartaning oʻng chetidagi holat pill'i — ustun boʻlib tekislanadi (bir xil
   kenglik). Oʻtilgan mavzuda «Oʻtildi», aks holda dars rejasi holati. */
const STATUS_PILL = {
  taught: { cls: "bg-success/10 text-success", Icon: CircleCheck, key: "taught" },
  ready: { cls: "bg-info/10 text-info", Icon: FileCheck, key: "planReadyShort" },
  draft: { cls: "bg-warning/10 text-warning", Icon: Clock, key: "pillDraft" },
  none: { cls: "border border-dashed border-muted-foreground/40 text-muted-foreground", Icon: CircleDashed, key: "pillNone" },
} as const;

export function LessonStatusPill({ lesson }: { lesson: Lesson }) {
  const t = useTranslations("LessonCycle");
  const k = isTaught(lesson) ? "taught" : lessonPlanState(lesson);
  const { cls, Icon, key } = STATUS_PILL[k];
  const tip = k === "taught" ? t("taught") : t(k === "ready" ? "planStateReady" : k === "draft" ? "planStateDraft" : "planStateNone");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex h-6 w-36 items-center justify-center gap-1 rounded-full text-tag font-semibold", cls)}>
          <Icon className="size-3" />
          {t(key)}
        </span>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
