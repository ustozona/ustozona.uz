"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import type { ScoreImpact } from "@/lib/attendance-data";
import { SettingsGroup, SettingsList, SavedIndicator } from "./SettingsShared";

const IMPACT_OPTIONS: { value: ScoreImpact; label: string }[] = [
  { value: "positive", label: "Ijobiy (+)" },
  { value: "neutral", label: "Betaraf (0)" },
  { value: "negative", label: "Salbiy (–)" },
];

const TONE_DOT: Record<string, string> = {
  success: "bg-success",
  destructive: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
};

export default function AttendanceSection() {
  const statuses = useAttendanceStore((s) => s.statuses);
  const setStatuses = useAttendanceStore((s) => s.setStatuses);

  const patch = (key: string, next: Partial<(typeof statuses)[number]>) =>
    setStatuses(statuses.map((s) => (s.key === key ? { ...s, ...next } : s)));

  return (
    <>
      <SettingsGroup
        title="Davomat statuslari"
        description="Statuslarni yoqing/oʻchiring va ularning davomat foiziga taʼsirini belgilang. Oʻzgarish butun davomatda amal qiladi."
        action={<SavedIndicator signal={statuses} />}
      >
        <SettingsList
          items={statuses.map((st) => ({
            key: st.key,
            title: st.label,
            description: !st.active ? "Oʻchirilgan" : undefined,
            leading: (
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full",
                  TONE_DOT[st.tone] ?? "bg-muted-foreground"
                )}
              />
            ),
            trailing: (
              <>
                <Select
                  value={st.scoreImpact}
                  onValueChange={(v) => patch(st.key, { scoreImpact: v as ScoreImpact })}
                >
                  <SelectTrigger className="w-32" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Switch
                  checked={st.active}
                  onCheckedChange={(v) => patch(st.key, { active: v })}
                  aria-label={`${st.label} statusini yoqish`}
                />
              </>
            ),
          }))}
        />

        <Link
          href="/dashboard/attendance"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Yangi status qoʻshish uchun davomat sahifasiga oʻting
          <ArrowUpRight className="size-3.5" />
        </Link>
      </SettingsGroup>
    </>
  );
}
