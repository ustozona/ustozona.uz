"use client";

import { CalendarClock } from "lucide-react";
import { TypographyMuted } from "@/components/ui/typography";
import type { UpcomingDeadline } from "@/lib/class-stats";

export function DeadlinesCard({ deadlines }: { deadlines: UpcomingDeadline[] }) {
  if (deadlines.length === 0) return null;

  return (
    <div>
      <div className="space-y-2">
        {deadlines.map((d) => (
          <div key={d.assignmentId} className="flex items-center gap-2.5 text-sm">
            <CalendarClock className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate flex-1 text-foreground/90">{d.title}</span>
            {d.topicName && <TypographyMuted className="text-xs shrink-0">{d.topicName}</TypographyMuted>}
            <span className="tabular-nums text-xs text-muted-foreground shrink-0">{d.dueDate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
