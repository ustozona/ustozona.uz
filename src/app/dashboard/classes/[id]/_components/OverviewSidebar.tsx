"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { TypographyMuted } from "@/components/ui/typography";
import { panelCardClass } from "@/components/DashboardPage";
import { MONTHS_UZ_SHORT } from "@/lib/localization";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { lessonClassIds } from "@/lib/lessons-data";
import { useLessonStore } from "@/store/useLessonStore";
import type { ClassIdentity } from "@/lib/class-id";
import { useClassNotesStore } from "@/store/useClassNotesStore";
import { useMounted } from "@/lib/use-mounted";

/** "YYYY-MM-DD" → mahalliy Date (UTC siljishisiz). */
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function OverviewSidebar({ identity }: { identity: ClassIdentity }) {
  const t = useTranslations("OverviewSidebar");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const hex = CLASS_COLOR_HEX[identity.color];

  // Persist tiklanmaguncha (mount) SSR seed bilan mos placeholder.
  const mounted = useMounted();

  // Eslatma — sinf boʻyicha persist (yoʻqolmaydi).
  const note = useClassNotesStore((s) => s.notes[identity.id]) ?? "";
  const setNote = useClassNotesStore((s) => s.setNote);

  // Kalendar markerlari — shu sinfning rejalashtirilgan dars kunlari.
  const lessons = useLessonStore((s) => s.lessons);
  const lessonDays = useMemo(() => {
    if (!mounted) return [] as Date[];
    return lessons
      .filter((l) => lessonClassIds(l).includes(identity.id) && l.scheduledDate)
      .map((l) => parseLocalDate(l.scheduledDate as string));
  }, [mounted, lessons, identity.id]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6">
      {/* Calendar */}
      <Card className="shrink-0 p-2 shadow-none">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="w-full bg-transparent"
          modifiers={{ lesson: lessonDays }}
          modifiersStyles={{ lesson: { fontWeight: 700, color: hex } }}
        />
        <div className="flex items-center gap-1.5 px-2 pb-1 pt-0.5">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: hex }} />
          <TypographyMuted className="text-[11px]">{t("lessonDaysLegend")}</TypographyMuted>
        </div>
      </Card>

      {/* Notes */}
      <Card className={panelCardClass}>
        <div className="shrink-0 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">{t("notesTab")}</span>
        </div>
        <div className="flex-1 min-h-0 p-4">
          <Textarea
            value={mounted ? note : ""}
            onChange={(e) => setNote(identity.id, e.target.value)}
            placeholder={t("notesPlaceholder")}
            className="h-full resize-none border-0 shadow-none px-0 focus-visible:ring-0 bg-transparent"
          />
        </div>
      </Card>
    </div>
  );
}
