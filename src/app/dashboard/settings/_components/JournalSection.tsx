"use client";

import * as React from "react";
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
import { SettingsGroup, SettingsList, SavedIndicator } from "./SettingsShared";

/** BellSection'dagi "Faqat koʻrish" badge patterni — manba boshqa boʻlimda. */
function ReadOnlyBadge({ source }: { source: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-default gap-1.5 font-normal text-muted-foreground">
          <Lock data-icon="inline-start" />
          Faqat koʻrish
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Manba: {source}</TooltipContent>
    </Tooltip>
  );
}

/** Sinflar aro toifa guruhi — bir groupId bitta qator (NewTopicModal grammatikasi). */
type TopicGroup = {
  key: string;
  topic: Topic;
  classNames: string[];
};

export default function JournalSection() {
  const journalScale = useClassStore((s) => s.journalScale);
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
      <SettingsGroup
        title="Baholash mezoni"
        description="Ushbu mezon barcha jurnallar uchun umumiy hisoblanadi. Tizim orqa fonda ballarni foizda hisoblaydi, bu yerda esa faqat ularning koʻrinishi sozlanadi."
        action={<SavedIndicator signal={journalScale} />}
      >
        <ScaleControls />
      </SettingsGroup>

      <SettingsGroup
        title="Baholash toifalari"
        description="Topshiriqlar toifalar boʻyicha guruhlanadi. Summativ toifalarning vazni yakuniy bahoga taʼsir qiladi. Tahrirlash jurnal boʻlimida amalga oshiriladi — u yerda har bir toifa qaysi sinf ustunlariga biriktirilgani koʻrinib turadi."
        action={<ReadOnlyBadge source="Jurnal boʻlimi" />}
      >
        {!hydrated ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : groups.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-border py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tag />
              </EmptyMedia>
              <EmptyTitle>Baholash toifalari yaratilmagan</EmptyTitle>
              <EmptyDescription>
                Toifalar jurnal boʻlimida shakllantiriladi — masalan Nazorat ishi, Uy vazifasi, Choraklik imtihon.
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
                  ? `${g.classNames.slice(0, 2).join(", ")} +${g.classNames.length - 2} sinf`
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
                    Formativ
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="font-normal tabular-nums">
                    Summativ · {g.topic.weightPercent}%
                  </Badge>
                ),
            }))}
            footer={
              <>
                <span className="text-caption">{groups.length} ta toifa</span>
                <span className="text-caption tabular-nums">
                  Summativ vazn: <span className="font-medium text-foreground">{summativeTotal}%</span>
                </span>
              </>
            }
          />
        )}
      </SettingsGroup>

      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/grades?topics=1">
          Jurnal boʻlimiga oʻtish
          <ArrowUpRight />
        </Link>
      </Button>
    </>
  );
}
