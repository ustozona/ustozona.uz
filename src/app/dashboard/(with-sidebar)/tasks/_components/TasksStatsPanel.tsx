"use client";

import { useTranslations } from "next-intl";
import { BarChart3, CalendarClock, CheckCircle2, ListChecks, Timer } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { SectionIcon } from "@/components/ui/section-icon";
import { StatCard } from "@/components/StatCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AttendanceRing } from "../../statistics/_components/AttendanceRing";
import { taskElapsedMinutes, taskPomoLengthMin, type Task } from "@/lib/tasks-data";

/** `formatMinutes` "daq."ni qiymat matniga qotirib qoʻygan (bir xil qalin
    shrift); statistika sahifasidagi kabi kichik/xira `unit` sifatida
    koʻrsatish uchun sonni birlikdan ajratamiz. Soat+daqiqa (masalan
    "1s 20 daq.") kamdan-kam holat — shunda butun matn qiymat sifatida
    qoladi (ajratish mazmunsiz boʻlardi). */
function splitMinutes(total: number, t: (key: string) => string): { value: number | string; unit?: string } {
  if (total <= 0) return { value: 0, unit: t("minutesUnit") };
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return { value: m, unit: t("minutesUnit") };
  return { value: m > 0 ? `${h}s ${m} daq.` : `${h}s` };
}

/**
 * Oʻng panelning "boʻsh" holati — hech qanday vazifa tanlanmaganda doim
 * koʻrinadi (Focus To-Do "Today" statistika bloki asosida). Joriy
 * tanlangan roʻyxat/sinf doirasidagi (activeTasks+doneTasks) koʻrsatkichlar
 * — faqat "Bugun" emas, har qanday roʻyxatga moslashadi.
 */
export function TasksStatsPanel({
  activeTasks,
  doneTasks,
  pomoMinutes,
}: {
  activeTasks: Task[];
  doneTasks: Task[];
  pomoMinutes: number;
}) {
  const t = useTranslations("TasksPage.stats");

  const estimatedMinutes = activeTasks.reduce(
    (sum, task) => sum + (task.estPomos ?? 0) * taskPomoLengthMin(task, pomoMinutes),
    0
  );
  const elapsedMinutes = [...activeTasks, ...doneTasks].reduce((sum, task) => sum + taskElapsedMinutes(task), 0);
  const completedCount = doneTasks.filter((task) => task.status === "done").length;
  const totalCount = activeTasks.length + completedCount;
  const completedPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : null;
  const estPomoCount = activeTasks.reduce((sum, task) => sum + (task.estPomos ?? 0), 0);
  const estimated = splitMinutes(estimatedMinutes, t);
  const elapsed = splitMinutes(elapsedMinutes, t);
  const countUnit = t("countUnit") || undefined;

  return (
    <Panel>
      <PanelHeader icon={<BarChart3 />} title={t("title")} />
      <PanelBody inset>
        {/* A-yondashuv (Notion/Linear/Todoist yon-panel standarti): kartalar
            TABIIY (ixcham) balandlikda, tepadan pastga oqadi (`flex-col`,
            markazlash/choʻzish YOʻQ). Ortiqcha vertikal joy — pastda tinch
            boʻsh maydon (stats-panel uchun normal). Kartalar hech qachon
            choʻzilmaydi/kesilmaydi, oraliqlar doim bir xil (`gap-3`). Kichik
            oynada panelning oʻz scrolli oxirgi chora sifatida ishlaydi. */}
        <div className="flex flex-col gap-3">
          {estPomoCount > 0 ? (
            // Tooltip triggerini oddiy `<div>`ga qoʻyamiz — asChild
            // StatCard'ga ulansa, Radix uning ildiziga `onClick` uzatib,
            // karta "bosiluvchi" (hover-soya + chevron + pointer) koʻrinardi.
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <StatCard
                    icon={Timer}
                    label={t("estimatedTime")}
                    value={estimated.value}
                    unit={estimated.unit}
                    iconClassName="bg-info/10 text-info"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("pomoSub", { count: estPomoCount })}</TooltipContent>
            </Tooltip>
          ) : (
            <StatCard
              icon={Timer}
              label={t("estimatedTime")}
              value={estimated.value}
              unit={estimated.unit}
              iconClassName="bg-info/10 text-info"
            />
          )}
          <StatCard
            icon={ListChecks}
            label={t("toBeCompleted")}
            value={activeTasks.length}
            unit={countUnit}
            iconClassName="bg-warning/10 text-warning"
          />
          <StatCard
            icon={CalendarClock}
            label={t("elapsedTime")}
            value={elapsed.value}
            unit={elapsed.unit}
            iconClassName="bg-primary/10 text-primary"
          />
          {/* Yagona nisbat-asosli metrika (bajarilgan/jami) — shu sababli
              Tremor "Web vitals" naqshiga koʻra rangli halqa bilan. Qolgan
              uchtasi xom miqdor (vaqt/soni), ularda "jami"ga nisbat yoʻq —
              halqa yolgʻon signal berardi. */}
          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card p-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <SectionIcon className="rounded-full bg-success/10 text-success">
                <CheckCircle2 />
              </SectionIcon>
              <span className="truncate text-sm font-medium text-muted-foreground">{t("completedTasks")}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold tabular-nums leading-none tracking-tight">
                  {completedCount}
                </span>
                {totalCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">/{totalCount}</span>
                )}
              </div>
              {completedPct !== null && <AttendanceRing pct={completedPct} showUnit size={48} />}
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}
