"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { defaultBellConfig, type BellConfig } from "@/lib/bell-schedule";
import type { SchoolProfile } from "@/lib/timetable";
import { useTimetableStore } from "@/store/useTimetableStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { todayKey } from "@/lib/date-keys";
import { SettingsGroup, SettingRow } from "./SettingsShared";

const PROFILES: { value: SchoolProfile; label: string }[] = [
  { value: "single", label: "1 smena" },
  { value: "double", label: "2 smena" },
];

export default function BellSection() {
  // Qoʻngʻiroq jadvali endi JORIY jadval versiyasining snapshotida yashaydi —
  // bu yerda tahrir bugun amaldagi versiyaga toʻgʻridan-toʻgʻri yoziladi.
  const versions = useTimetableStore((s) => s.versions);
  const hydrated = useTimetableStore((s) => s._hasHydrated);
  const commitDraft = useTimetableStore((s) => s.commitDraft);
  const current = resolveVersionForDate(versions, todayKey()) ?? versions[versions.length - 1] ?? null;
  const config: BellConfig = current?.bellConfig ?? defaultBellConfig();

  const update = (next: BellConfig) => {
    if (current) commitDraft(current.id, current.events, next);
  };

  const setShift1 = (patch: Partial<BellConfig["shift1"]>) =>
    update({ ...config, shift1: { ...config.shift1, ...patch } });

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />;
  }

  return (
    <>
      <SettingsGroup title="Smena" description="Maktab bir yoki ikki smenada ishlaydimi.">
        <SettingRow title="Smena rejimi">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {PROFILES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => update({ ...config, profile: p.value })}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  config.profile === p.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </SettingRow>
      </SettingsGroup>

      <SettingsGroup
        title="Dars va tanaffus"
        description="1-smena parametrlari. Qoʻngʻiroq jadvali qatorlari shu qiymatlardan hosil boʻladi."
      >
        <SettingRow title="Dars davomiyligi" description="Bir dars necha daqiqa.">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={20}
              max={90}
              value={config.shift1.lessonMin}
              onChange={(e) => setShift1({ lessonMin: Number(e.target.value) || 0 })}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground">daq</span>
          </div>
        </SettingRow>

        <SettingRow title="Tanaffus" description="Darslar orasidagi tanaffus.">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={30}
              value={config.shift1.breakMin}
              onChange={(e) => setShift1({ breakMin: Number(e.target.value) || 0 })}
              className="w-20"
            />
            <span className="text-xs text-muted-foreground">daq</span>
          </div>
        </SettingRow>
      </SettingsGroup>

      <div className="space-y-1.5">
        <Link
          href="/dashboard/timetable"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Boshlanish vaqti va katta tanaffusni dars jadvalida sozlang
          <ArrowUpRight className="size-3.5" />
        </Link>
        <p className="text-xs text-muted-foreground">
          Bu qiymatlar joriy jadval versiyasiga yoziladi. Yil oʻrtasida qoʻngʻiroq jadvali
          oʻzgargan boʻlsa, dars jadvali sahifasida yangi versiya yarating.
        </p>
      </div>
    </>
  );
}
