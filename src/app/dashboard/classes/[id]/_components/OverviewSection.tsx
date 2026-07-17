"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardTitle } from "@/components/ui/card";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { panelCardClass } from "@/components/DashboardPage";
import { classTints, CLASS_COLOR_HEX } from "@/lib/class-colors";
import { lessonClassIds } from "@/lib/lessons-data";
import { useLessonStore } from "@/store/useLessonStore";
import type { ClassIdentity } from "@/lib/class-id";

/** Bugungi kun "YYYY-MM-DD" (lokal) — scheduledDate bilan leksikografik solishtirish uchun. */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function OverviewSection({ identity }: { identity: ClassIdentity }) {
  const t = useTranslations("OverviewSection");
  const tints = classTints(identity.color);
  const hex = CLASS_COLOR_HEX[identity.color];

  // Jonli mavzu banki (Darslar boʻlimi bilan bir manba). `_hasHydrated` —
  // localStorage tiklanmaguncha SSR seed bilan mos kelishi uchun gate.
  const lessons = useLessonStore((s) => s.lessons);
  const hydrated = useLessonStore((s) => s._hasHydrated);

  // Yaqin darslar = shu sinfning rejalashtirilgan, bugundan keyingi (yoki bugungi)
  // darslari, sanaga koʻra oʻsish tartibida. Sanasi yoʻqlar oxirida.
  const upcoming = useMemo(() => {
    const tk = todayKey();
    return lessons
      .filter(
        (l) =>
          lessonClassIds(l).includes(identity.id) &&
          l.status === "Scheduled" &&
          (!l.scheduledDate || l.scheduledDate >= tk)
      )
      .sort((a, b) => (a.scheduledDate ?? "9999").localeCompare(b.scheduledDate ?? "9999"));
  }, [lessons, identity.id]);

  return (
    <Card className={panelCardClass}>
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <SectionIcon>
            <BookOpen />
          </SectionIcon>
          <div className="min-w-0">
            <CardTitle className="truncate">{t("title")}</CardTitle>
          </div>
        </div>
        <Link
          href={`/dashboard/classes/${identity.id}?b=lessons`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {t("viewAll")}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-5 py-5">
          {!hydrated ? null : upcoming.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia><Illustration name="28" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-2">
              {upcoming.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="list-card group flex items-center gap-3 p-4 cursor-pointer"
                  style={{ ["--card-accent" as string]: hex }}
                >
                  <div className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center text-white" style={tints.gradientTile}>
                    <BookOpen className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-foreground leading-tight truncate transition-colors group-hover:text-primary">
                      {lesson.title || t("untitledLesson")}
                    </h4>
                    {(lesson.date || lesson.time) && (
                      <TypographyMuted className="text-xs mt-1 tabular-nums">
                        {lesson.date}
                        {lesson.date && lesson.time ? " · " : ""}
                        {lesson.time}
                      </TypographyMuted>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
