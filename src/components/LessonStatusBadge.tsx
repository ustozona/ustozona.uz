import { useTranslations } from "next-intl";
import { CircleCheck, CalendarCheck, CalendarX, PencilLine, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LessonStatus } from "@/lib/lessons-data";

/**
 * Mavzu holati — YAGONA rang/ikonka/yorliq manbai (avval `NextLessonsCard`
 * ichida qoʻlda takrorlangan edi). Ikki koʻrinish bor, IKKALASI HAM shu
 * yerdan tarqaladi, chunki ular boshqa-boshqa fon ustida ishlaydi:
 *
 *   • `LessonStatusPill` — TOʻLIQ badge (rangli fon + ikonka + yorliq),
 *     `ClassBadge` bilan bir oilada (`rounded-full`, 18px, 11px matn).
 *     Neytral/oq yuza ustida ishlatiladi (kartalar, hover popover).
 *   • `LessonStatusBadge` — nuqta + yorliq, fon YARIM-SHAFFOF blur bilan
 *     (`bg-background/85`). Toʻyingan sinf rangidagi yuza ustida (jadval/
 *     planner blokining burchagi) — u yerda rangli badge fon bilan
 *     toʻqnashib, oʻqilmay qolardi.
 */
export const STATUS_ICON: Record<LessonStatus, LucideIcon> = {
  Completed: CircleCheck,
  Scheduled: CalendarCheck,
  Unscheduled: CalendarX,
  Draft: PencilLine,
};

/** `LessonStatusPill` uchun — semantik tokenlarga bogʻlangan rangli fon.
    Boshqa oʻlchamdagi badge kerak boʻlsa (masalan `NextLessonsCard`), shu
    ikkovi (`STATUS_ICON` + `STATUS_PILL_CLASS`) import qilinadi — rang/ikonka
    manbai bitta, faqat oʻlcham/padding isteʼmolchida qoladi. */
export const STATUS_PILL_CLASS: Record<LessonStatus, string> = {
  Completed: "bg-success/10 text-success",
  Scheduled: "bg-info/10 text-info",
  Unscheduled: "bg-warning/10 text-warning",
  Draft: "bg-muted text-muted-foreground",
};

const LABEL: Record<LessonStatus, string> = {
  Completed: "Oʻtilgan",
  Scheduled: "Rejalangan",
  Unscheduled: "Rejalanmagan",
  Draft: "Qoralama",
};

const DOT: Record<LessonStatus, string> = {
  Completed: "bg-success",
  Scheduled: "bg-info",
  Unscheduled: "bg-warning",
  Draft: "bg-muted-foreground",
};

/** Mavzu holati belgisi — radiussiz, jadval kartalari uchun (har xil tinted fon ustida oʻqiladi). */
export function LessonStatusBadge({ status, className }: { status: LessonStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 bg-background/85 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/75 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[status])} />
      {LABEL[status]}
    </span>
  );
}

/** Mavzu holati — TOʻLIQ badge (ikonka + rangli fon), `ClassBadge` bilan bir qatorda turishga moslangan (h-[18px]). */
export function LessonStatusPill({ status, className }: { status: LessonStatus; className?: string }) {
  const t = useTranslations("LessonsPage");
  const Icon = STATUS_ICON[status];
  const label: Record<LessonStatus, string> = {
    Completed: t("statusCompleted"),
    Scheduled: t("statusScheduled"),
    Unscheduled: t("statusUnscheduled"),
    Draft: t("statusDraft"),
  };
  return (
    <Badge
      variant="secondary"
      className={cn("h-[18px] gap-1 rounded-full border-transparent px-1.5 text-[11px] font-semibold leading-none", STATUS_PILL_CLASS[status], className)}
    >
      <Icon className="size-3" />
      {label[status]}
    </Badge>
  );
}
