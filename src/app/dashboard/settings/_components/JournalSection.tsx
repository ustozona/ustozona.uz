"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowUpRight, Lock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import ScaleControls from "@/components/grade-scale/ScaleControls";
import { useClassStore } from "@/store/useClassStore";
import { useGradesStore } from "@/store/useGradesStore";
import { TOPIC_COLOR_HEX, type Topic } from "@/lib/grades-data";
import { SettingsCard, SettingsList, useDraft, useRegisterDraft } from "./SettingsShared";

/** BellSection'dagi "Faqat koʻrish" badge patterni — manba boshqa boʻlimda. */
function ReadOnlyBadge({ source }: { source: string }) {
  const t = useTranslations("JournalSection");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-default gap-1.5 font-normal text-muted-foreground">
          <Lock data-icon="inline-start" />
          {t("readOnlyBadge")}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{t("readOnlyTooltip", { source })}</TooltipContent>
    </Tooltip>
  );
}

/** Sinflar aro toifa guruhi — bir groupId bitta qator (NewTopicModal grammatikasi). */
type TopicGroup = {
  key: string;
  topic: Topic;
  classNames: string[];
};

/** Baholash mezoni kartasi — draft + explicit Save. */
function ScaleCard() {
  const t = useTranslations("JournalSection");
  const journalScale = useClassStore((s) => s.journalScale);
  const setJournalScale = useClassStore((s) => s.setJournalScale);
  const { draft, setDraft, dirty, save, reset } = useDraft(journalScale, setJournalScale);
  useRegisterDraft("jurnal-shkala", dirty, save, reset);

  return (
    <SettingsCard
      title={t("scaleTitle")}
      description={t("scaleDescription")}
    >
      <ScaleControls value={draft} onChange={(p) => setDraft({ ...draft, ...p })} />
    </SettingsCard>
  );
}

export default function JournalSection() {
  const t = useTranslations("JournalSection");
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const hydrated = useGradesStore((s) => s._hasHydrated);

  // Toifalarni groupId boʻyicha jamlash — bir xil toifa ("Test") har sinfda
  // alohida nusxa, lekin roʻyxatda bir marta koʻrinadi.
  const groups = React.useMemo<TopicGroup[]>(() => {
    const map = new Map<string, TopicGroup>();
    for (const cd of Object.values(classDataMap)) {
      for (const t of cd.topics) {
        const key = t.groupId ?? t.id;
        const existing = map.get(key);
        if (existing) {
          existing.classNames.push(cd.info.name);
        } else {
          map.set(key, { key, topic: t, classNames: [cd.info.name] });
        }
      }
    }
    return [...map.values()];
  }, [classDataMap]);

  const summativeTotal = groups
    .filter((g) => g.topic.purpose !== "formative")
    .reduce((sum, g) => sum + g.topic.weightPercent, 0);

  return (
    <>
      <ScaleCard />

      <SettingsCard
        title={t("categoriesTitle")}
        description={t("categoriesDescription")}
        action={<ReadOnlyBadge source={t("sourceJournal")} />}
      >
        {!hydrated ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : groups.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-border py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tag />
              </EmptyMedia>
              <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
              <EmptyDescription>
                {t("emptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <SettingsList
            items={groups.map((g) => ({
              key: g.key,
              title: g.topic.name,
              description:
                g.classNames.length > 2
                  ? `${g.classNames.slice(0, 2).join(", ")} ${t("moreClasses", { count: g.classNames.length - 2 })}`
                  : g.classNames.join(", "),
              leading: (
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: TOPIC_COLOR_HEX[g.topic.color] }}
                />
              ),
              trailing:
                g.topic.purpose === "formative" ? (
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {t("formativeBadge")}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal tabular-nums">
                    {t("summativeBadge", { percent: g.topic.weightPercent })}
                  </Badge>
                ),
            }))}
            footer={
              <>
                <span className="text-caption">{t("countCategories", { count: groups.length })}</span>
                <span className="text-caption tabular-nums">
                  {t("summativeWeightLabel", { percent: summativeTotal })}
                </span>
              </>
            }
          />
        )}
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/grades?topics=1">
            {t("goToJournal")}
            <ArrowUpRight />
          </Link>
        </Button>
      </SettingsCard>
    </>
  );
}
