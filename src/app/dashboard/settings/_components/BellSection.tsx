"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultBellConfig, type BellConfig } from "@/lib/bell-schedule";
import { useTimetableStore } from "@/store/useTimetableStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { todayKey } from "@/lib/date-keys";
import { SettingsGroup, SettingRow } from "./SettingsShared";

const minToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/* Qoʻngʻiroq jadvali JORIY jadval versiyasining snapshotida yashaydi va
   faqat dars jadvali sahifasidagi dialog orqali oʻzgartiriladi — u yerda
   saqlash "qachondan kuchga kiradi?" (versiyalash) oqimidan oʻtadi.
   Bu boʻlim FAQAT OʻQIYDI: ilgari shu yerdagi inputlar har keystroke'da
   joriy versiyani dialogsiz qayta yozib, versiyalash kafolatini buzardi. */

export default function BellSection() {
  const versions = useTimetableStore((s) => s.versions);
  const hydrated = useTimetableStore((s) => s._hasHydrated);
  const current = resolveVersionForDate(versions, todayKey()) ?? versions[versions.length - 1] ?? null;
  const config: BellConfig = current?.bellConfig ?? defaultBellConfig();

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted/40" />;
  }

  const shifts =
    config.profile === "double"
      ? [
          { label: "1-smena", cfg: config.shift1 },
          { label: "2-smena", cfg: config.shift2 },
        ]
      : [{ label: "1-smena", cfg: config.shift1 }];

  return (
    <>
      <SettingsGroup
        title="Qoʻngʻiroq jadvali"
        description="Joriy jadval versiyasidan oʻqiladi. Oʻzgartirish dars jadvali sahifasida — qaysi sanadan kuchga kirishi saqlashda soʻraladi."
        action={
          <Badge variant="secondary" className="gap-1.5 font-normal">
            Faqat koʻrish · manba: dars jadvali
          </Badge>
        }
      >
        <SettingRow title="Maktab rejimi">
          <span className="text-sm text-foreground">
            {config.profile === "double" ? "Ikki smenali" : "Bir smenali"}
          </span>
        </SettingRow>
        {shifts.map(({ label, cfg }) => (
          <SettingRow
            key={label}
            title={label}
            description={`${minToHHMM(cfg.startMin)} dan · ${cfg.lessonCount} ta dars · har biri ${cfg.lessonMin} daq`}
          >
            <span className="text-sm tabular-nums text-muted-foreground">
              tanaffus {cfg.breakMin} daq · katta {cfg.breakMin + cfg.longBreakExtraMin} daq
            </span>
          </SettingRow>
        ))}
      </SettingsGroup>

      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/timetable?bell=1">
          Dars jadvalida sozlash
          <ArrowUpRight />
        </Link>
      </Button>
    </>
  );
}
