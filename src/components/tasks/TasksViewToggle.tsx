"use client";

import { ListTodo, CalendarDays } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCalendarFormat } from "@/components/calendar/format";

export type TasksPageView = "list" | "calendar";

/** Vazifalar sahifasi rejim almashtirgichi: Roʻyxat ⇄ Kalendar.
    Ham TasksList sarlavhasida, ham TasksCalendar toolbar'ida bir xil. */
export function TasksViewToggle({
  value,
  onChange,
}: {
  value: TasksPageView;
  onChange: (v: TasksPageView) => void;
}) {
  const fmt = useCalendarFormat();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => { if (v) onChange(v as TasksPageView); }}
    >
      <ToggleGroupItem value="list" aria-label={fmt.t("listView")} title={fmt.t("listView")}>
        <ListTodo className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="calendar" aria-label={fmt.t("calendarView")} title={fmt.t("calendarView")}>
        <CalendarDays className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
