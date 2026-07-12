"use client";

import * as React from "react";
import { BarChart3, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { EventTimeline } from "./EventTimeline";

/* "Ballar" yon paneli — sinfning oxirgi eventlari lentasi (yangi→eski),
   har yozuvda "Bekor qilish" + "Izoh qoʻshish" (undo semantikasi,
   tasdiqsiz). Tepadagi "Hisobot" sinf-darajali hisobot dialogini ochadi. */

const EMPTY_EVENTS: never[] = [];
const RECENT_LIMIT = 100;

export function PointsSheet({
  open,
  onOpenChange,
  classId,
  students,
  onOpenReport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  students: { id: string; name: string }[];
  /** "Hisobot" tugmasi — sheet yopilib, sinf hisoboti dialogi ochiladi. */
  onOpenReport?: () => void;
}) {
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const removeEvents = useBehaviorStore((s) => s.removeEvents);
  const setEventNote = useBehaviorStore((s) => s.setEventNote);

  const nameById = React.useMemo(
    () => new Map(students.map((s) => [s.id, s.name])),
    [students]
  );
  /* Append-only roʻyxat — oxirgi N ta; tartiblashni EventTimeline qiladi. */
  const recent = React.useMemo(() => events.slice(-RECENT_LIMIT), [events]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle>Ballar</SheetTitle>
              <SheetDescription>
                Oxirgi berilgan ballar — bekor qilish va izoh qoʻshish.
              </SheetDescription>
            </div>
            {onOpenReport && (
              <Button
                variant="outline"
                size="sm"
                className="mr-6 h-8 shrink-0"
                onClick={onOpenReport}
              >
                <BarChart3 className="size-4" aria-hidden />
                Hisobot
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            {recent.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <History />
                  </EmptyMedia>
                  <EmptyTitle>Hali yozuv yoʻq</EmptyTitle>
                  <EmptyDescription>
                    Oʻquvchi kartasini bosib birinchi ballni bering.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <EventTimeline
                events={recent}
                nameById={nameById}
                actionStyle="inline"
                onDelete={(e) => removeEvents(classId, [e.id])}
                onSaveNote={(e, note) => setEventNote(classId, e.id, note)}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
