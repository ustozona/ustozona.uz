"use client";

import { useMemo } from "react";
import { Award, Gift, Smile, TrendingDown, TrendingUp } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyLabel, TypographyMuted } from "@/components/ui/typography";
import { studentBalance, studentBehaviorStats } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { BehaviorEmoji } from "@/components/behavior/BehaviorEmoji";
import { EventTimeline, formatDateLabel } from "@/components/behavior/EventTimeline";
import { KpiCard } from "./OverviewTab";

/* Profil "Xulq" tabi — stat kartalar (Balans · Toʻplangan · Yoʻqotilgan ·
   Ijobiy ulush progress bilan, rechartsʼsiz), sana boʻyicha ballar
   tarixi va doʻkon (sarflar) tarixi. Batafsil donut-hisobot sinf
   sahifasidagi oʻquvchi modalida. */

// Xulq semantik juftligi — ATT_COLORS.present/absent bilan bir xil.
const POSITIVE_HEX = "#22c55e";
const NEGATIVE_HEX = "#ef4444";

const EMPTY_EVENTS: never[] = [];

export default function BehaviorTab({
  classId,
  studentId,
}: {
  classId: string;
  studentId: string;
}) {
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const redemptions = useBehaviorStore((s) => s.redemptions);
  const removeEvents = useBehaviorStore((s) => s.removeEvents);
  const setEventNote = useBehaviorStore((s) => s.setEventNote);

  const myEvents = useMemo(
    () => events.filter((e) => e.studentId === studentId),
    [events, studentId]
  );
  const myRedemptions = useMemo(
    () =>
      redemptions.filter((r) => r.classId === classId && r.studentId === studentId),
    [redemptions, classId, studentId]
  );
  const stats = useMemo(
    () => studentBehaviorStats(myEvents, studentId),
    [myEvents, studentId]
  );
  const balance = useMemo(
    () => studentBalance(myEvents, myRedemptions, studentId),
    [myEvents, myRedemptions, studentId]
  );

  return (
    <div className="space-y-4">
      {/* KPI qatori */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Balans"
          value={String(balance)}
          sub="hozirgi ball"
          color={balance < 0 ? NEGATIVE_HEX : POSITIVE_HEX}
          icon={<Award />}
        />
        <KpiCard
          label="Toʻplangan"
          value={`+${stats.earned}`}
          sub="jami ijobiy ball"
          color={POSITIVE_HEX}
          icon={<TrendingUp />}
        />
        <KpiCard
          label="Yoʻqotilgan"
          value={`−${stats.lost}`}
          sub="jami salbiy ball"
          color={NEGATIVE_HEX}
          icon={<TrendingDown />}
        />
        <div className="flex flex-col rounded-xl bg-card p-5 border border-border/50 shadow-sm">
          <div className="flex items-start justify-between">
            <TypographyLabel>Ijobiy ulush</TypographyLabel>
            <SectionIcon size="sm">
              <Smile />
            </SectionIcon>
          </div>
          <span className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
            {stats.positivePct === null ? "—" : `${stats.positivePct}%`}
          </span>
          <Progress
            value={stats.positivePct ?? 0}
            indicatorColor={POSITIVE_HEX}
            className="mt-3"
            style={{ backgroundColor: `color-mix(in srgb, ${POSITIVE_HEX} 16%, transparent)` }}
          />
          <TypographyMuted className="mt-1">
            {stats.eventCount === 0
              ? "hali yozuv yoʻq"
              : `${stats.eventCount} ta yozuv boʻyicha`}
          </TypographyMuted>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        {/* Ballar tarixi */}
        <section className="rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <SectionIcon size="sm">
              <Award />
            </SectionIcon>
            <CardTitle className="heading-small">Ballar tarixi</CardTitle>
          </div>
          <div className="p-5">
            {myEvents.length === 0 ? (
              <TypographyMuted className="text-sm">
                Hali ball berilmagan — sinf sahifasidagi &quot;Xulq-atvor&quot; boʻlimidan
                boshlang.
              </TypographyMuted>
            ) : (
              <EventTimeline
                events={myEvents}
                onDelete={(e) => removeEvents(classId, [e.id])}
                onSaveNote={(e, note) => setEventNote(classId, e.id, note)}
              />
            )}
          </div>
        </section>

        {/* Doʻkon tarixi */}
        <section className="rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <SectionIcon size="sm">
              <Gift />
            </SectionIcon>
            <CardTitle className="heading-small">Doʻkon tarixi</CardTitle>
          </div>
          <div className="px-5 py-3">
            {myRedemptions.length === 0 ? (
              <TypographyMuted className="py-2 text-sm">
                Hali ball sarflanmagan.
              </TypographyMuted>
            ) : (
              <div className="divide-y divide-border/60">
                {[...myRedemptions].reverse().map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-2.5">
                    <BehaviorEmoji code={r.emoji} label={r.name} className="size-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                      <TypographyMuted className="text-xs">
                        {formatDateLabel(r.date)}
                      </TypographyMuted>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                      −{r.cost}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
