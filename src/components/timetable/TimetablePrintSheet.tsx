"use client";

import type { TimetableEvent } from "@/lib/timetable";
import type { PeriodRow } from "@/lib/bell-schedule";
import type { TimetableClass } from "./PeriodGrid";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import { useCalendarFormat } from "@/components/calendar/format";
import { classTints, classStripedSurface } from "@/lib/class-colors";
import { subjectLabel } from "@/lib/standards-data";

/** Jadval 6 ish kuni (Du..Sha) — ISO kun raqamlari. */
const WORK_DAYS = [1, 2, 3, 4, 5, 6];

/**
 * Chop etish/PDF uchun statik A4 (albom) jadval — ekrandagi interaktiv
 * PeriodGrid'dan mustaqil, faqat `print:block` orqali koʻrinadi
 * (`.timetable-print-sheet` — globals.css'dagi A4 landshaft @page qoidasi).
 */
export function TimetablePrintSheet({
  periods,
  events,
  getClass,
  profile,
  title,
  subtitle,
}: {
  periods: PeriodRow[];
  events: TimetableEvent[];
  getClass: (id: string) => TimetableClass;
  profile: "single" | "double";
  title: string;
  subtitle?: string;
}) {
  const fmt = useCalendarFormat();

  const renderTable = (shiftPeriods: PeriodRow[], heading?: string) => (
    <div className="mb-5" style={{ breakInside: "avoid" }}>
      {heading && <h2 className="mb-1.5 text-[13px] font-bold text-black">{heading}</h2>}
      <table className="w-full table-fixed border-collapse text-[10.5px]">
        <colgroup>
          <col style={{ width: "13%" }} />
          {WORK_DAYS.map((d) => (
            <col key={d} style={{ width: `${87 / WORK_DAYS.length}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="border border-black/30 bg-black/[0.06] px-2 py-1.5 text-left font-semibold text-black">
              {fmt.t("hourHeader")}
            </th>
            {WORK_DAYS.map((d) => (
              <th key={d} className="border border-black/30 bg-black/[0.06] px-2 py-1.5 text-center font-semibold text-black">
                {fmt.dayName(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shiftPeriods.map((p) => (
            <tr key={`${p.shift}-${p.index}`}>
              <td className="border border-black/30 px-2 py-1.5 align-top">
                <div className="font-semibold text-black">{fmt.t("periodLabel", { index: p.index })}</div>
                <div className="text-[9.5px] tabular-nums text-black/60">
                  {minToHHMM(p.startMin)}–{minToHHMM(p.endMin)}
                </div>
              </td>
              {WORK_DAYS.map((day) => {
                const ev = events.find((e) => e.day === day && e.startMin === p.startMin);
                const cls = ev ? getClass(ev.classId) : null;
                const tints = cls ? classTints(cls.color) : null;
                return (
                  <td key={day} className="border border-black/30 p-1 align-top">
                    {cls && tints && (
                      <div className="relative overflow-hidden rounded-md px-2 py-1.5" style={classStripedSurface(cls.color)}>
                        <div className="relative truncate font-bold leading-tight" style={tints.textOnSolid}>
                          {cls.name}
                        </div>
                        {cls.subject && (
                          <div className="relative truncate text-[9.5px]" style={tints.textOnSolidMuted}>
                            {subjectLabel(cls.subject)}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="timetable-print-sheet hidden bg-white text-black print:block">
      <div className="mb-3">
        <h1 className="text-[15px] font-bold text-black">{title}</h1>
        {subtitle && <p className="text-[11px] text-black/60">{subtitle}</p>}
      </div>
      {profile === "double" ? (
        <>
          {renderTable(periods.filter((p) => p.shift === 1), fmt.t("firstShift"))}
          {renderTable(periods.filter((p) => p.shift === 2), fmt.t("secondShift"))}
        </>
      ) : (
        renderTable(periods)
      )}
    </div>
  );
}
