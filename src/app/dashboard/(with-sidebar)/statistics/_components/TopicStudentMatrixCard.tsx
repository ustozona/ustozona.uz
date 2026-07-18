"use client";

import { useTranslations } from "next-intl";
import { TypographyMuted } from "@/components/ui/typography";
import { scoreBarColor } from "@/lib/score-colors";
import type { TopicStudentMatrix } from "@/lib/class-stats";

function cellTint(pct: number): string {
  return scoreBarColor(pct).replace(")", " / 0.16)");
}

export function TopicStudentMatrixCard({ matrix }: { matrix: TopicStudentMatrix }) {
  const t = useTranslations("StatisticsPage");

  if (matrix.topics.length === 0 || matrix.students.length === 0) {
    return <TypographyMuted className="py-4 text-sm">{t("notEnoughData")}</TypographyMuted>;
  }

  const cellByKey = new Map(matrix.cells.map((c) => [`${c.studentId}:${c.topicId}`, c.avg]));

  return (
    <div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="min-w-full border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-card text-left font-normal text-muted-foreground pr-2 min-w-[7rem]" />
              {matrix.topics.map((topic) => (
                <th key={topic.id} className="font-normal text-muted-foreground px-1 pb-1 text-center align-bottom">
                  <span className="block max-w-[4.5rem] truncate mx-auto" title={topic.name}>{topic.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.students.map((student) => (
              <tr key={student.id}>
                <td className="sticky left-0 bg-card truncate pr-2 text-foreground/80 max-w-[7rem]" title={student.name}>
                  {student.name}
                </td>
                {matrix.topics.map((topic) => {
                  const avg = cellByKey.get(`${student.id}:${topic.id}`) ?? null;
                  return (
                    <td
                      key={topic.id}
                      className="w-9 h-7 text-center tabular-nums rounded"
                      style={avg !== null ? { backgroundColor: cellTint(avg), color: scoreBarColor(avg) } : undefined}
                      title={avg !== null ? `${student.name} · ${topic.name}: ${Math.round(avg)}%` : undefined}
                    >
                      {avg !== null ? Math.round(avg) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
