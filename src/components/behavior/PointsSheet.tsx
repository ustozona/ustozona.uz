"use client";

import * as React from "react";
import { History, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { studentBalance, studentBehaviorStats } from "@/lib/behavior-data";
import { EventTimeline, type EventGroupBy, type StudentHoverInfo } from "./EventTimeline";

/* "Ballar" yon paneli — sinfning oxirgi eventlari lentasi (yangi→eski),
   har yozuvda "Bekor qilish" + "Izoh qoʻshish" (undo semantikasi, tasdiqsiz).
   "Hisobot" tugmasi asosiy panel headerida (BehaviorView). */

const EMPTY_EVENTS: never[] = [];
const RECENT_LIMIT = 100;

export function PointsSheet({
  open,
  onOpenChange,
  classId,
  students,
  classHex,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  students: { id: string; name: string; initials: string }[];
  classHex?: string;
}) {
  const t = useTranslations("PointsSheet");
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const redemptions = useBehaviorStore((s) => s.redemptions);
  const deleteEventWithLog = useBehaviorStore((s) => s.deleteEventWithLog);
  const setEventNote = useBehaviorStore((s) => s.setEventNote);

  const [groupBy, setGroupBy] = React.useState<EventGroupBy>("date");

  const nameById = React.useMemo(
    () => new Map(students.map((s) => [s.id, s.name])),
    [students]
  );

  /* Hovercard uchun: balans (events − redemptions) + ijobiy/salbiy yigʻindi. */
  const studentInfoById = React.useMemo(() => {
    const classRedemptions = redemptions.filter((r) => r.classId === classId);
    const map = new Map<string, StudentHoverInfo>();
    for (const s of students) {
      const stats = studentBehaviorStats(events, s.id);
      map.set(s.id, {
        name: s.name,
        initials: s.initials,
        balance: studentBalance(events, classRedemptions, s.id),
        earned: stats.earned,
        lost: stats.lost,
      });
    }
    return map;
  }, [students, events, redemptions, classId]);

  /* Append-only roʻyxat — oxirgi N ta; tartiblashni EventTimeline qiladi. */
  const recent = React.useMemo(() => events.slice(-RECENT_LIMIT), [events]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton={false} side="right" className="flex w-full flex-col gap-0 bg-muted p-0 sm:max-w-md">
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-5 py-4">
          <SectionIcon>
            <History />
          </SectionIcon>
          <CardTitle className="min-w-0 flex-1 truncate">{t("title")}</CardTitle>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as EventGroupBy)}>
            <SelectTrigger size="sm" className="h-8 w-auto shrink-0 gap-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="date">{t("sortByDate")}</SelectItem>
              <SelectItem value="student">{t("sortByStudent")}</SelectItem>
              <SelectItem value="skill">{t("sortBySkill")}</SelectItem>
            </SelectContent>
          </Select>
          <SheetClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </SheetClose>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            {recent.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia>
                    <Illustration name="22" className="h-32 text-black dark:text-white" />
                  </EmptyMedia>
                  <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                  <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <EventTimeline
                events={recent}
                nameById={nameById}
                actionStyle="inline"
                groupBy={groupBy}
                studentInfoById={studentInfoById}
                classHex={classHex}
                onDelete={(e, reason) => deleteEventWithLog(classId, e, reason)}
                onSaveNote={(e, note) => setEventNote(classId, e.id, note)}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
