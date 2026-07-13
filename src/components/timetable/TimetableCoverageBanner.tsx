"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useTimetableStore } from "@/store/useTimetableStore";
import { isCalendarConfigured, fmtDayMonthUz } from "@/lib/academic-calendar";
import { resolveVersionForDate } from "@/lib/timetable-versions";

/* ════════════════════════════════════════════════════════════════════
   "JADVAL YIL BOSHINI QOPLAMAYDI" BANNERI (koʻp-yil, 1-bosqich)

   Eng erta jadval versiyasining `effectiveFrom`i faol oʻquv yili boshidan
   KEYIN boʻlsa, yil boshidagi dars kunlari "jadval yoʻq" boʻlib boʻsh
   koʻrinadi (davomat/planner). Bu banner shuni aniqlaydi va bir bosishda
   eng erta versiyani yil boshiga klonlaydi (ensureVersionAt).

   Faol yil almashtirilmaydi — faqat jadval qamrovi tuzatiladi. Qamrov
   toʻliq boʻlsa (yoki versiya/kalendar yoʻq) — hech narsa koʻrsatilmaydi.
   ════════════════════════════════════════════════════════════════════ */

export default function TimetableCoverageBanner({ className }: { className?: string }) {
  const calHydrated = useCalendarStore((s) => s._hasHydrated);
  const ttHydrated = useTimetableStore((s) => s._hasHydrated);
  const calendar = useCalendarStore((s) => s.calendar);
  const versions = useTimetableStore((s) => s.versions);
  const ensureVersionAt = useTimetableStore((s) => s.ensureVersionAt);

  if (!calHydrated || !ttHydrated) return null;
  if (!isCalendarConfigured(calendar) || versions.length === 0) return null;

  const start = calendar.range.start;
  // Yil boshini qoplovchi versiya bormi (effectiveFrom <= start)?
  if (resolveVersionForDate(versions, start)) return null;

  return (
    <Alert
      variant="info"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <span className="flex min-w-0 items-start gap-2">
        <CalendarClock className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0">
          <AlertTitle>Jadval yil boshini qoplamaydi</AlertTitle>
          <AlertDescription>
            Dars jadvali {fmtDayMonthUz(start)}dan (oʻquv yili boshi) amal qilmaydi — shu kungacha
            dars kunlari koʻrinmasligi mumkin.
          </AlertDescription>
        </span>
      </span>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => {
          if (ensureVersionAt(start)) {
            toast.success(`Jadval ${fmtDayMonthUz(start)}dan boshlab qoplandi`);
          }
        }}
      >
        Tuzatish
      </Button>
    </Alert>
  );
}
