import { useMemo } from 'react';
import { useMounted } from '@/lib/use-mounted';
import { useLessonStore } from '@/store/useLessonStore';
import { useGradesStore } from '@/store/useGradesStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import { statusWeights } from '@/lib/attendance-data';
import { isCalendarConfigured } from '@/lib/academic-calendar';
import { todayKey } from '@/lib/date-keys';
import { useCalendarStore } from '@/store/useCalendarStore';
import { classBalance } from '@/lib/behavior-data';
import { classSummativeAverage } from '@/lib/grades-stats';
import { useStandardsStore } from '@/store/useStandardsStore';
import { lessonCoverage } from '@/lib/standards-coverage';

export type Page = "lessons" | "students" | "grades" | "attendance" | "standards" | "behavior" | "statistics" | "assignments";

export function useClassPanelStats(page: Page, classId: string): {
  items: { value: number | string; label: string }[];
  progress?: { value: number; label: string };
} | undefined {
  const mounted = useMounted();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const attendanceRecords = useAttendanceStore((s) => s.recordsByClass[classId]);
  const attendanceStatuses = useAttendanceStore((s) => s.statuses);
  const calendar = useCalendarStore((s) => s.calendar);
  const behaviorEvents = useBehaviorStore((s) => s.eventsByClass[classId]);
  const behaviorRedemptions = useBehaviorStore((s) => s.redemptions);
  const lessonUnits = useLessonStore((s) => s.units);
  const lessonsAll = useLessonStore((s) => s.lessons);
  const standardSets = useStandardsStore((s) => s.sets);

  return useMemo(() => {
    switch (page) {
      case 'lessons': {
        // Sinfda boʻlim/dars boʻlmasa ham statistika doimo koʻrsatiladi (0/0/0%).
        const unitsCount = lessonUnits.filter((u) => u.classId === classId).length;
        const lessonsForClass = lessonsAll.filter((l) => l.classId === classId);

        const completed = lessonsForClass.filter((l) => l.status === "Completed").length;
        const progress = lessonsForClass.length ? Math.round((completed / lessonsForClass.length) * 100) : 0;

        return {
          items: [
            { value: unitsCount, label: "Boʻlimlar" },
            { value: lessonsForClass.length, label: "Darslar" }
          ],
          progress: { value: progress, label: "Progress" }
        };
      }
      case 'students': {
        const classData = classDataMap[classId];
        if (!classData) return undefined;
        
        const activeCount = classData.students.filter((s) => s.status === 'active').length;
        const inactiveCount = classData.students.length - activeCount;
        const activePercent = classData.students.length ? Math.round((activeCount / classData.students.length) * 100) : 0;
        
        return {
          items: [
            { value: classData.students.length, label: "Jami" },
            { value: activeCount, label: "Faol" },
            { value: inactiveCount, label: "Yoʻq" }
          ],
          progress: { value: activePercent, label: "Faollik" }
        };
      }
      case 'grades': {
        const classData = classDataMap[classId];
        if (!classData) return undefined;
        
        // Sinf o‘rtachasi — YAGONA MANBA (grades-stats). Summativ, normallashgan, Q/T chiqarilgan.
        const classAverage = Math.round(
          classSummativeAverage(classData.students, classData.assignments, classData.grades, classData.topics)
        );

        return {
          items: [
            { value: classData.students.length, label: "Oʻquvchilar" },
            { value: classData.assignments.length, label: "Topshiriqlar" }
          ],
          progress: { value: classAverage, label: "Sinf oʻrtachasi" }
        };
      }
      case 'attendance': {
        // Yozuvlar — useAttendanceStore, roster — useGradesStore (server-backed).
        // SSR va klient birinchi renderi mos boʻlishi uchun mount'dan keyin.
        if (!mounted) return undefined;
        const roster = classDataMap[classId]?.students ?? [];
        if (roster.length === 0) return undefined;

        // FAQAT faol oʻquv yili: yil boshidan bugungacha (kelajak sanadagi
        // yozuvlar ham, oldingi yillarniki ham hisobga olinmaydi).
        // Kalendar sozlanmagan boʻlsa — cheklovsiz.
        const today = todayKey();
        const configured = isCalendarConfigured(calendar);
        const end = configured && calendar.range.end < today ? calendar.range.end : today;
        const rosterIds = new Set(roster.map((s) => s.id));
        const records = (attendanceRecords ?? []).filter(
          (r) =>
            rosterIds.has(r.studentId) &&
            r.status !== "unmarked" &&
            r.date <= end &&
            (!configured || r.date >= calendar.range.start)
        );

        // Foizlar belgilangan yozuvlar ulushi. «Davomat» — sahifadagi bilan
        // bir xil vaznli formula (Keldi=1, Kechikdi=0.5, …; sozlamalardan).
        const weights = statusWeights(attendanceStatuses);
        let present = 0;
        let absent = 0;
        let counted = 0;
        let weightSum = 0;
        for (const r of records) {
          if (r.status === "present") present++;
          else if (r.status === "absent") absent++;
          const w = weights[r.status];
          if (w == null) continue;
          counted++;
          weightSum += w;
        }
        const pct = (n: number) => (records.length ? Math.round((n / records.length) * 100) : 0);
        const rate = counted ? Math.round((weightSum / counted) * 100) : 0;

        return {
          items: [
            { value: `${pct(present)}%`, label: "Keldi" },
            { value: `${pct(absent)}%`, label: "Kelmadi" }
          ],
          progress: { value: rate, label: "Davomat" }
        };
      }
      case 'standards': {
        // Tanlangan sinfga tegishli toʻplamlar (useStandardsStore) — sahifa bilan bitta manba.
        const classSets = standardSets.filter((s) => s.classIds.includes(classId));
        const allStandards = classSets.flatMap((s) => s.standards);
        // Qamrov FAQAT dars-standart bogʻlanishidan (qoʻlda belgilash yoʻq).
        const covered = allStandards.filter((s) => lessonCoverage(lessonsAll, classId, s.id).taught).length;
        const coveragePercent = allStandards.length
          ? Math.round((covered / allStandards.length) * 100)
          : 0;

        return {
          items: [
            { value: classSets.length, label: "Toʻplam" },
            { value: allStandards.length, label: "Standartlar" },
            { value: covered, label: "Oʻtildi" }
          ],
          progress: { value: coveragePercent, label: "Qamrov" }
        };
      }
      case 'behavior': {
        // Eventlar — useBehaviorStore; SSR mismatch boʻlmasligi uchun mount'dan keyin.
        if (!mounted) return undefined;
        const events = behaviorEvents ?? [];
        const classRedemptions = behaviorRedemptions.filter((r) => r.classId === classId);
        const balance = classBalance(events, classRedemptions);

        let positive = 0;
        for (const e of events) if (e.points > 0) positive += 1;
        const positivePct = events.length ? Math.round((positive / events.length) * 100) : 0;

        return {
          items: [
            { value: balance, label: "Balans" },
            { value: positive, label: "Ijobiy" },
            { value: events.length - positive, label: "Salbiy" },
          ],
          progress: { value: positivePct, label: "Ijobiy ulushi" },
        };
      }
      case 'assignments': {
        const classData = classDataMap[classId];
        if (!classData) return undefined;
        const testCount = classData.assignments.filter((a) => a.kind === "test").length;
        const deckCount = classData.assignments.filter((a) => a.kind === "deck").length;
        return {
          items: [
            { value: testCount, label: "Test" },
            { value: deckCount, label: "Taqdimot" },
          ],
        };
      }
      case 'statistics':
        // Statistika sahifasida oʻng panel shu sinf uchun toʻliq (davr-asosli)
        // statistikani koʻrsatadi — footer'dagi mini-KPI shu bilan takrorlanib,
        // ikki xil hisoblash manbai orqali nomuvofiq raqam koʻrsatish xavfi
        // tugʻdirardi. Ataylab footer chiqarilmaydi.
        return undefined;
      default:
        return undefined;
    }
  }, [page, classId, classDataMap, attendanceRecords, attendanceStatuses, calendar, lessonUnits, lessonsAll, standardSets, behaviorEvents, behaviorRedemptions, mounted]);
}
