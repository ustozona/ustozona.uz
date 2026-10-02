"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX, classTints } from "@/lib/class-colors";
import { classColor, type ClassInfo } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   TOPSHIRIQLAR — YUQORI QATOR: sinf + koʻrinish.

   Sinflar chap ustundan shu qatorga koʻchdi (loyiha egasining qarori,
   2026-10-02): chap ustun endi dars rejasiga kerak. Sinflar gorizontal
   chiplar — bir qarashda hammasi koʻrinadi, telefonda yon tomonga
   suriladi. Tanlangan chip — sinf rangining yumshoq yuzasi (ClassChip
   retsepti, `classTints().badge`).

   Koʻrinish: «Dars studiyasi» (rejadan darsga) va «Barcha ishlar»
   (jurnal ustunlari, tayyor testlar, ochiq ishlar — avvalgi roʻyxat).
   ════════════════════════════════════════════════════════════════════ */

export type AssignmentsView = "studio" | "all";

export function AssignmentsTopBar({
  classes,
  selectedId,
  onSelect,
  view,
  onView,
  openRuns,
}: {
  classes: ClassInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  view: AssignmentsView;
  onView: (v: AssignmentsView) => void;
  /** Ochiq va natijasi kutilayotgan ishlar — «Barcha ishlar» yonida nishon. */
  openRuns: number;
}) {
  const t = useTranslations("LessonStudio");
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 md:flex-row md:items-center">
      <div
        data-tour="assignments-classes"
        role="tablist"
        aria-label={t("topbar.classes")}
        className="-mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]"
      >
        {classes.map((c) => {
          const color = classColor(c);
          const tints = classTints(color);
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(c.id)}
              style={active ? { ...tints.badge, ...tints.textStrong, borderColor: tints.solid } : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
                active ? "" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <ClassSwatch hex={CLASS_COLOR_HEX[color]} />
              {c.name}
            </button>
          );
        })}
      </div>
      <SegmentedToggle
        variant="pill"
        aria-label={t("topbar.view")}
        value={view}
        onValueChange={onView}
        className="shrink-0 self-start md:self-auto"
        options={[
          { value: "studio", label: t("topbar.studio"), icon: <Sparkles className="size-4" /> },
          {
            value: "all",
            label: openRuns > 0 ? t("topbar.allWithRuns", { count: openRuns }) : t("topbar.all"),
            icon: <ClipboardList className="size-4" />,
          },
        ]}
      />
    </div>
  );
}
