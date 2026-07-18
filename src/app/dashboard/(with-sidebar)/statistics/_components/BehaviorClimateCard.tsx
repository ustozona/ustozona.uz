"use client";

import { useTranslations } from "next-intl";
import { TypographyMuted } from "@/components/ui/typography";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import type { BehaviorClimateTrend } from "@/lib/class-stats";

export function BehaviorClimateCard({ climate }: { climate: BehaviorClimateTrend }) {
  const t = useTranslations("StatisticsPage");
  const weeksWithData = climate.weeks.filter((w) => w.positivePct !== null);
  const latest = weeksWithData.at(-1);

  return (
    <div className="space-y-3">
      {climate.autoCount + climate.manualCount > 0 && (
        <div className="flex justify-end">
          <TypographyMuted className="text-xs">
            {t("autoManualSplit", { auto: climate.autoCount, manual: climate.manualCount })}
          </TypographyMuted>
        </div>
      )}
      {weeksWithData.length === 0 ? (
        <TypographyMuted className="py-4 text-sm">{t("notEnoughData")}</TypographyMuted>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums leading-none">{latest?.positivePct}%</span>
            <TypographyMuted className="text-xs">{t("positiveShareLabel")}</TypographyMuted>
          </div>
          {climate.topSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {climate.topSkills.map((s) => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-1 text-xs"
                >
                  <AppleEmojiSprite emoji={s.emoji} className="size-3.5" />
                  <span className="truncate max-w-[8rem]">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">{s.count}</span>
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
