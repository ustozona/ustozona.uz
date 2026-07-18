"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Gauge, BookOpen, CalendarCheck, HeartPulse, GraduationCap } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCalendarStore } from "@/store/useCalendarStore";
import { statPeriods, currentStatPeriod, previousStatPeriod } from "@/lib/class-stats";
import { dateToKey } from "@/lib/date-keys";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { OverviewPanel } from "./_components/OverviewPanel";
import { ClassStatsView, type StatsGroup } from "./_components/ClassStatsView";
import { StatsTabs, type StatsTabItem } from "./_components/StatsTabs";
import { PeriodSelect } from "./_components/PeriodSelect";

export default function StatisticsPage() {
  const t = useTranslations("StatisticsPage");
  const { setOpen } = useSidebar();

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
  const handleToggleClass = (id: string) => {
    handleSelectClass(id === selectedClassId ? null : id);
  };

  // Navbar doim mantiqiy guruhlangan holatda turadi: Umumiy/Baholar/Davomat/
  // Xulq. Sinf tanlangan-tanlanmaganidan qatʼi nazar bir xil tab toʻplami —
  // faqat kontent doirasi (sinf vs butun maktab) oʻzgaradi.
  const [group, setGroup] = useState<StatsGroup>("overview");
  const groupTabs: StatsTabItem[] = useMemo(
    () => [
      { id: "overview", label: t("groupOverview"), icon: Gauge },
      { id: "grades", label: t("groupGrades"), icon: BookOpen },
      { id: "attendance", label: t("groupAttendance"), icon: CalendarCheck },
      { id: "behavior", label: t("groupBehavior"), icon: HeartPulse },
    ],
    [t]
  );

  // Davr filtri — butun sahifa uchun YAGONA manba (Umumiy va sinf detali bir
  // xil davrni koʻrsatadi); navbarda tab'lar yonida joylashadi.
  const todayKey = dateToKey(new Date());
  const calendar = useCalendarStore((s) => s.calendar);
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
              {period && periods.length > 0 && (
                <PeriodSelect periods={periods} value={period.id} onChange={setPeriodId} />
              )}
            </div>
          </div>

          <div className="flex min-w-0 min-h-0 flex-1 flex-col">
            {selectedClassId ? (
              <ClassStatsView classId={selectedClassId} period={period} prevPeriod={prevPeriod} group={group} />
            ) : group === "overview" ? (
              <OverviewPanel onSelectClass={handleSelectClass} period={period} prevPeriod={prevPeriod} />
            ) : (
              <SelectClassPrompt />
            )}
          </div>
        </div>
      </DashboardColumns>
    </div>
  );
}

function SelectClassPrompt() {
  const t = useTranslations("StatisticsPage");
  return (
    <div className="bg-card rounded-xl card-elevation h-full flex items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GraduationCap />
          </EmptyMedia>
          <EmptyTitle>{t("selectClassTitle")}</EmptyTitle>
          <EmptyDescription>{t("selectClassDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
