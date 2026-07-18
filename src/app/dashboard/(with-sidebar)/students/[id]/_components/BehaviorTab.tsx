"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Award, Gift, Smile, TrendingDown, TrendingUp } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { StatCard } from "@/components/StatCard";
import { studentBalance, studentBehaviorStats } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { BehaviorEmoji } from "@/components/behavior/BehaviorEmoji";
import { EventTimeline, formatDateLabel } from "@/components/behavior/EventTimeline";

/* Profil "Xulq" tabi — stat kartalar (Balans · Toʻplangan · Yoʻqotilgan ·
   Ijobiy ulush progress bilan, rechartsʼsiz), sana boʻyicha ballar
   tarixi va doʻkon (sarflar) tarixi. Batafsil donut-hisobot sinf
   sahifasidagi oʻquvchi modalida. */

const EMPTY_EVENTS: never[] = [];

export default function BehaviorTab({
  classId,
  studentId,
}: {
  classId: string;
  studentId: string;
}) {
  const t = useTranslations("BehaviorTab");
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const redemptions = useBehaviorStore((s) => s.redemptions);
  const deleteEventWithLog = useBehaviorStore((s) => s.deleteEventWithLog);
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
        <StatCard
          label={t("balance")}
          value={String(balance)}
          sub={t("balanceSub")}
          tone={balance < 0 ? "destructive" : "success"}
          icon={Award}
        />
        <StatCard
          label={t("earned")}
          value={`+${stats.earned}`}
          sub={t("earnedSub")}
          tone="success"
          icon={TrendingUp}
        />
        <StatCard
          label={t("lost")}
          value={`−${stats.lost}`}
          sub={t("lostSub")}
          tone="destructive"
          icon={TrendingDown}
        />
        <StatCard
          label={t("positiveShare")}
          value={stats.positivePct === null ? "—" : `${stats.positivePct}%`}
          sub={stats.eventCount === 0 ? t("positiveShareSubZero") : t("positiveShareSub", { count: stats.eventCount })}
          tone="success"
          icon={Smile}
          progress={stats.positivePct ?? 0}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        {/* Ballar tarixi */}
        <section className="rounded-xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <SectionIcon size="sm">
              <Award />
            </SectionIcon>
            <CardTitle className="heading-small">{t("pointsHistory")}</CardTitle>
          </div>
          <div className="p-5">
            {myEvents.length === 0 ? (
              <TypographyMuted className="text-sm">
                {t("pointsHistoryEmpty")}
              </TypographyMuted>
            ) : (
              <EventTimeline
                events={myEvents}
                onDelete={(e, reason) => deleteEventWithLog(classId, e, reason)}
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
            <CardTitle className="heading-small">{t("storeHistory")}</CardTitle>
          </div>
          <div className="px-5 py-3">
            {myRedemptions.length === 0 ? (
              <TypographyMuted className="py-2 text-sm">
                {t("storeHistoryEmpty")}
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
