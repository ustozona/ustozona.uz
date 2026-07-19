"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AcademicYearEntry } from "@/lib/academic-years";

/** Oʻquv yili tanlagich — bitta yil boʻlsa yashiriladi (bitta-yilli
    foydalanuvchi farq sezmasin), koʻp yil boʻlsa eng yangisi birinchi. */
export function YearSelect({
  years,
  value,
  onChange,
}: {
  years: AcademicYearEntry[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (years.length <= 1) return null;
  const sorted = [...years].sort((a, b) => (b.calendar.range.start ?? "").localeCompare(a.calendar.range.start ?? ""));
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sorted.map((y) => (
          <SelectItem key={y.id} value={y.id}>
            {y.calendar.yearLabel || y.calendar.range.start?.slice(0, 4) || y.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
