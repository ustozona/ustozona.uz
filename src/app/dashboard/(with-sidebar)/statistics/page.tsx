"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Gauge, BookOpen, CalendarCheck, HeartPulse, Table as TableIcon, Users } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCalendarStore } from "@/store/useCalendarStore";
import { activeYear } from "@/lib/academic-years";
import { statPeriods, currentStatPeriod, previousStatPeriod } from "@/lib/class-stats";
import { dateToKey } from "@/lib/date-keys";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { OverviewPanel } from "./_components/OverviewPanel";
import { ClassesTablePanel } from "./_components/ClassesTablePanel";
import { StudentsTablePanel } from "./_components/StudentsTablePanel";
import { DomainSignalsPanel } from "./_components/DomainSignalsPanel";
import { ClassStatsView, type StatsGroup } from "./_components/ClassStatsView";
import { StatsTabs, type StatsTabItem } from "./_components/StatsTabs";
import { PeriodSelect } from "./_components/PeriodSelect";
import { YearSelect } from "./_components/YearSelect";

export default function StatisticsPage() {
  const t = useTranslations("StatisticsPage");
  const { setOpen } = useSidebar();
  const router = useRouter();

  // Statistika — toʻliq-canvas rejim: ilova sidebar'i icon-holatga siqiladi
  // (koʻproq joy uchun), sahifadan chiqishda avvalgi holatga qaytadi.
  useEffect(() => {
    setOpen(false);
    return () => setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinflar paneli DOIM koʻrinadi (endi Umumiy/Sinflar almashuvi yoʻq) —
  // sinf tanlovi shu paneldagi qatorni bosish orqali, qayta bossa bekor
  // boʻladi (toggle): tanlangan boʻlsa sinf maʼlumoti, boʻlmasa butun
  // maktab boʻyicha umumiy maʼlumot koʻrsatiladi.
  const [selectedClassId, handleSelectClass] = useClassIdParam();

  // Navbar doim mantiqiy guruhlangan holatda turadi: Umumiy/Oʻquvchilar/
  // Baholar/Davomat/Xulq. "Oʻquvchilar" tabi sinf tanlangan-tanlanmaganidan
  // qatʼi nazar koʻrinadi — faqat roʻyxat doirasi (sinf vs butun maktab)
  // oʻzgaradi. "Sinflar" jadval tabi esa faqat sinf tanlanmaganda maʼnoli
  // (butun maktab roʻyxati).
  const [group, setGroup] = useState<StatsGroup>("overview");
  const handleToggleClass = (id: string) => {
    const next = id === selectedClassId ? null : id;
    if (next && group === "classes") setGroup("overview");
    handleSelectClass(next);
  };
  const groupTabs: StatsTabItem[] = useMemo(
    () => [
      { id: "overview", label: t("groupOverview"), icon: Gauge },
      ...(selectedClassId ? [] : [{ id: "classes", label: t("groupClasses"), icon: TableIcon }]),
      { id: "students", label: t("groupStudents"), icon: Users },
      { id: "grades", label: t("groupGrades"), icon: BookOpen },
      { id: "attendance", label: t("groupAttendance"), icon: CalendarCheck },
      { id: "behavior", label: t("groupBehavior"), icon: HeartPulse },
    ],
    [t, selectedClassId]
  );

  // Oʻquv yili filtri — bitta yildan koʻp boʻlsa tanlash mumkin (masalan,
  // faol yil yangisiga oʻtganda oʻtgan yil maʼlumotini koʻrish uchun).
  // Global faol yilni OʻZGARTIRMAYDI — faqat shu sahifaning koʻrinishi.
  const years = useCalendarStore((s) => s.years);
  const activeCalendar = useCalendarStore((s) => s.calendar);
  const [yearId, setYearId] = useState<string | null>(null);
  const selectedYear = useMemo(
    () => years.find((y) => y.id === yearId) ?? activeYear(years),
    [years, yearId]
  );
  const calendar = selectedYear?.calendar ?? activeCalendar;
  const handleYearChange = (id: string) => {
    setYearId(id);
    setPeriodId(null); // yangi yilning davrlari boshqa — eski tanlov endi mos kelmasligi mumkin
  };

  // Davr filtri — butun sahifa uchun YAGONA manba (Umumiy va sinf detali bir
  // xil davrni koʻrsatadi); navbarda tab'lar yonida joylashadi.
  const todayKey = dateToKey(new Date());
  const periods = useMemo(() => statPeriods(calendar), [calendar]);
  const [periodId, setPeriodId] = useState<string | null>(null);
  const period = useMemo(() => {
    if (periodId) return periods.find((p) => p.id === periodId) ?? null;
    return currentStatPeriod(calendar, todayKey);
  }, [periods, periodId, calendar, todayKey]);
  const prevPeriod = useMemo(() => (period ? previousStatPeriod(calendar, period) : null), [calendar, period]);

  const columnsTemplate = "minmax(0,1fr) minmax(0,3fr)";

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0 p-4 md:p-6">
      <DashboardColumns
        template={columnsTemplate}
        className="h-full overflow-hidden"
        style={{ gap: "1.5rem" }}
      >
        <DashboardColumn hideBelow="lg">
          <ClassListPanel
            page="statistics"
            selectedClassId={selectedClassId ?? ""}
            onSelect={handleToggleClass}
          />
        </DashboardColumn>

        <div className="flex flex-col min-w-0 min-h-0 h-full gap-4 md:gap-6">
          <div className="shrink-0">
            <div className="bg-card rounded-xl card-elevation flex items-center justify-between gap-3 pr-3">
              <StatsTabs tabs={groupTabs} value={group} onChange={(v) => setGroup(v as StatsGroup)} />
              <div className="flex items-center gap-2">
                {selectedYear && <YearSelect years={years} value={selectedYear.id} onChange={handleYearChange} />}
                {period && periods.length > 0 && (
                  <PeriodSelect periods={periods} value={period.id} onChange={setPeriodId} />
                )}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 min-h-0 flex-1 flex-col">
            {group === "students" ? (
              <StudentsTablePanel
                onSelectStudent={(id) => router.push(`/dashboard/students/${id}`)}
                period={period}
                calendar={calendar}
                classId={selectedClassId ?? undefined}
              />
            ) : selectedClassId ? (
              <ClassStatsView classId={selectedClassId} period={period} prevPeriod={prevPeriod} group={group} calendar={calendar} />
            ) : group === "overview" ? (
              <OverviewPanel period={period} prevPeriod={prevPeriod} calendar={calendar} onSelectClass={handleSelectClass} />
            ) : group === "classes" ? (
              <ClassesTablePanel onSelectClass={handleSelectClass} period={period} prevPeriod={prevPeriod} calendar={calendar} />
            ) : (
              <DomainSignalsPanel
                domain={group as "grades" | "attendance" | "behavior"}
                calendar={calendar}
                period={period}
                onSelectClass={handleSelectClass}
              />
            )}
          </div>
        </div>
      </DashboardColumns>
    </div>
  );
}
