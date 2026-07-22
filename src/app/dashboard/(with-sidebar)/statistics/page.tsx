"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Gauge, Users } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  statPeriods, weekStatPeriods, monthStatPeriods, currentStatPeriod, previousStatPeriod,
  type StatPeriodKind,
} from "@/lib/class-stats";
import { dateToKey } from "@/lib/date-keys";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { OverviewPanel } from "./_components/OverviewPanel";
import { StudentsTablePanel } from "./_components/StudentsTablePanel";
import { ClassStatsView } from "./_components/ClassStatsView";
import { StatsTabs, type StatsTabItem } from "./_components/StatsTabs";

/** Sahifa tablari — endi FAQAT "koʻrinish" oʻqini boshqaradi (Umumiy/
    Oʻquvchilar), sinf tanlangan-tanlanmaganidan qatʼi nazar bir xil ikkita
    tab doim turadi. "Doira" (maktab vs sinf) oʻqi mustaqil — chap paneldagi
    sinf tanlovi orqali. Avvalgi "Sinflar" tabi olib tashlandi: uning jadvali
    endi Umumiy koʻrinishning bir qismi (OverviewPanel ichida karta). */
type StatsGroup = "overview" | "students";
import { PeriodSelect } from "./_components/PeriodSelect";

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

  // Ikki doimiy tab: Umumiy / Oʻquvchilar — ikkalasi ham sinf tanlangan-
  // tanlanmaganidan qatʼi nazar bir xil koʻrinadi, faqat roʻyxat doirasi
  // (sinf vs butun maktab) oʻzgaradi.
  const [group, setGroup] = useState<StatsGroup>("overview");
  const handleToggleClass = (id: string) => {
    const next = id === selectedClassId ? null : id;
    handleSelectClass(next);
  };
  const groupTabs: StatsTabItem[] = useMemo(
    () => [
      { id: "overview", label: t("groupOverview"), icon: Gauge },
      { id: "students", label: t("groupStudents"), icon: Users },
    ],
    [t]
  );

  // Oʻquv yili — endi sahifada tanlanmaydi (bu Sozlamalarga tegishli).
  // useCalendarStore.calendar — faol yilning KOʻZGUSI, doim shundan
  // oʻqiladi (multi-year-phase1 konvensiyasi).
  const calendar = useCalendarStore((s) => s.calendar);

  // Davr filtri — granulyarlik (Hafta/Oy/Chorak/Yil) + shu granulyarlikdagi
  // aniq davr, butun sahifa uchun YAGONA manba (Umumiy va sinf detali bir
  // xil davrni koʻrsatadi). Granulyarlik almashsa avvalgi tanlov mos
  // kelmasligi mumkin — shuning uchun periodId reset boʻladi va joriy
  // sanaga mos davr avtomatik tanlanadi.
  const todayKey = dateToKey(new Date());
  const [periodKind, setPeriodKind] = useState<StatPeriodKind>("quarter");
  const periods = useMemo(() => {
    if (periodKind === "week") return weekStatPeriods(calendar);
    if (periodKind === "month") return monthStatPeriods(calendar);
    return statPeriods(calendar).filter((p) => p.kind === periodKind);
  }, [calendar, periodKind]);
  const [periodId, setPeriodId] = useState<string | null>(null);
  const handleKindChange = (kind: StatPeriodKind) => {
    setPeriodKind(kind);
    setPeriodId(null);
  };
  const period = useMemo(() => {
    if (periodId) return periods.find((p) => p.id === periodId) ?? null;
    return currentStatPeriod(calendar, todayKey, periodKind);
  }, [periods, periodId, calendar, todayKey, periodKind]);
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
            <div className="bg-card rounded-xl border border-border flex items-center gap-3 px-3 py-2.5">
              {/* ── Doira (scope) endi bu yerda EMAS — global header
                    breadcrumb'ida (`Bosh sahifa › Statistika › 5-A`,
                    HeaderBreadcrumb.tsx). Sahifada faqat koʻrinish tab'lari
                    va filtrlar qoladi, ikkilanish yoʻqoladi. ── */}

              {/* ── View (doimiy — sinf tanlangan-tanlanmaganidan qatʼi nazar bir xil) ── */}
              <StatsTabs tabs={groupTabs} value={group} onChange={(v) => setGroup(v as StatsGroup)} />

              <div className="flex-1" />

              <div className="h-6 w-px bg-border shrink-0" />

              {/* ── Filtrlar (doimiy — navigatsiyadan vizual ajratilgan) ── */}
              <div className="flex items-center gap-2 shrink-0">
                <PeriodSelect
                  kind={periodKind}
                  onKindChange={handleKindChange}
                  periods={periods}
                  value={period?.id ?? ""}
                  onChange={setPeriodId}
                />
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
              <ClassStatsView
                classId={selectedClassId}
                period={period}
                prevPeriod={prevPeriod}
                calendar={calendar}
                onViewStudents={() => setGroup("students")}
              />
            ) : (
              <OverviewPanel
                period={period}
                prevPeriod={prevPeriod}
                calendar={calendar}
                onSelectClass={handleSelectClass}
                onViewStudents={() => setGroup("students")}
              />
            )}
          </div>
        </div>
      </DashboardColumns>
    </div>
  );
}
