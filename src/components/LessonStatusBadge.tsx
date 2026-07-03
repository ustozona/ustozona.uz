import { cn } from "@/lib/utils";
import type { LessonStatus } from "@/lib/lessons-data";

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
