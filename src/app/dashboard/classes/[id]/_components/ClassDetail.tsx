"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { BookOpen, ArrowLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypographyMuted } from "@/components/ui/typography";
import { panelCardClass, DashboardColumns } from "@/components/DashboardPage";
import { classTints, CLASS_COLOR_HEX, classColorStyle } from "@/lib/class-colors";
import { lessonClassIds } from "@/lib/lessons-data";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useMounted } from "@/lib/use-mounted";
import { type ClassIdentity } from "@/lib/class-id";
import { cn } from "@/lib/utils";
import { OverviewSection } from "./OverviewSection";
import { OverviewSidebar } from "./OverviewSidebar";
import { LessonsSection } from "./LessonsSection";
import { StudentsSection } from "./StudentsSection";
import { GradesSection } from "./GradesSection";
import { AttendanceSection } from "./AttendanceSection";
import { BehaviorSection } from "./BehaviorSection";
import { StandardsSection } from "./StandardsSection";
import { PlannerSection } from "./PlannerSection";
import { CLASS_SECTIONS, type ClassSection } from "./sections";

type Props = {
  identity: ClassIdentity;
  initialSection: ClassSection;
};

export default function ClassDetail({ identity, initialSection }: Props) {
  const t = useTranslations("ClassDetail");
  const tSections = useTranslations("ClassSections");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [section, setSection] = useState<ClassSection>(initialSection);

  const hex = CLASS_COLOR_HEX[identity.color];
  const tints = useMemo(() => classTints(identity.color), [identity.color]);

  /* ── Jonli statistika — Darslar (useLessonStore) va Baholar (useGradesStore)
     bilan bir manbadan. Mount'gacha nol — SSR/hydratsiya mosligi uchun. ── */
  const mounted = useMounted();
  const lessons = useLessonStore((s) => s.lessons);
  const classDataMap = useGradesStore((s) => s.classDataMap);

  const stats = useMemo(() => {
    if (!mounted) {
      return { students: 0, lessons: 0, progress: 0 };
    }
    const gradeData = classDataMap[identity.id];
    const classLessons = lessons.filter((l) => lessonClassIds(l).includes(identity.id));
    const completed = classLessons.filter((l) => l.status === "Completed").length;

    const progress = classLessons.length
      ? Math.round((completed / classLessons.length) * 100)
      : 0;

    return { students: gradeData?.students.length ?? 0, lessons: classLessons.length, progress };
  }, [identity.id, mounted, lessons, classDataMap]);

  const counts = useMemo<Partial<Record<ClassSection, number>>>(
    () => ({ lessons: stats.lessons || undefined, students: stats.students || undefined }),
    [stats]
  );

  /* ── Boʻlimni oʻzgartirish — URL ?b= bilan sinxron (refresh/share ishlaydi).
     `replace` (push emas) — ataylab: boʻlimlar tarix yozuvi emas, shuning uchun
     brauzer "Orqaga" tugmasi boʻlimlar orasida emas, butun sahifadan chiqaradi. ── */
  const selectSection = useCallback(
    (key: ClassSection) => {
      setSection(key);
      const params = new URLSearchParams(searchParams.toString());
      if (key === "overview") params.delete("b");
      else params.set("b", key);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const showRight = section === "overview";

  /* Ustun nisbatlari — qatʼiy en emas, "sidebardan tashqari" maydon flex-grow +
     flex-basis:0 bilan boʻlinadi (lessons sahifasi naqshi): noutbukdan full HD gacha
     moslashadi. Overview → 25/50/25; boshqa boʻlimlar (oʻng panel yoʻq) → 25/75. */
  const grow = { left: 1, center: showRight ? 2 : 3, right: 1 };

  /* Grid template — chap panel `lg+`, oʻng panel faqat `xl+` (va overview'da).
     `lg` da 2 track (chap+markaz); `xl` da 3 track (chap+markaz+oʻng, 25/50/25). */
  const columnsTemplate = `minmax(0,${grow.left}fr) minmax(0,${grow.center}fr)`;
  const columnsXlTemplate = showRight
    ? `minmax(0,${grow.left}fr) minmax(0,${grow.center}fr) minmax(0,${grow.right}fr)`
    : undefined;

  return (
    <DashboardColumns
      template={columnsTemplate}
      xlTemplate={columnsXlTemplate}
      className="h-full overflow-hidden p-4 md:p-6 lg:p-8"
    >
      {/* ───────────── LEFT: sinf identifikatori + boʻlim navigatsiyasi ───────────── */}
      <aside className="hidden lg:flex min-w-0 min-h-0 h-full">
        <Card className={cn(panelCardClass, "w-full")} style={classColorStyle(identity.color)}>
          {/* Header */}
          <div className="shrink-0 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl shrink-0 flex items-center justify-center" style={tints.iconBg}>
                <BookOpen className="size-5" style={tints.iconText} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground leading-tight truncate">{identity.name}</h2>
                <TypographyMuted className="text-xs mt-0.5">{t("subjectPlaceholder")}</TypographyMuted>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="flex items-center gap-8 mt-5 px-1 mb-2">
              <div>
                <p className="text-2xl font-bold leading-none tabular-nums text-foreground">{stats.students}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">{t("studentsUnit")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tabular-nums text-foreground">{stats.lessons}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wider font-semibold">{t("lessonsUnit")}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-5 space-y-2 px-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{t("masteredLabel")}</span>
                <span className="font-bold tabular-nums text-foreground">{stats.progress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${stats.progress}%`, backgroundColor: hex }}
                />
              </div>
            </div>
          </div>

          {/* Nav list */}
          <ScrollArea className="flex-1 min-h-0">
            <nav className="p-3 space-y-1">
              {CLASS_SECTIONS.map((s) => {
                const isActive = s.key === section;
                const Icon = s.icon;
                const count = counts[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => selectSection(s.key)}
                    aria-current={isActive ? "true" : undefined}
                    className="list-row group w-full border-none px-3"
                    data-active={isActive || undefined}
                    style={isActive ? { ["--card-accent" as string]: tints.solid, ...tints.tint } : undefined}
                  >
                    <Icon className={cn("size-4 shrink-0 transition-colors", isActive ? "" : "text-muted-foreground group-hover:text-foreground")} style={isActive ? { color: tints.solid } : undefined} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[13px] font-medium leading-tight truncate transition-colors",
                          isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                        )}
                      >
                        {tSections(s.key)}
                      </p>
                    </div>
                    {count != null && (
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{count}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </Card>
      </aside>

      {/* ───────────── CENTER: faol boʻlim kontenti ───────────── */}
      <main className="flex min-w-0 h-full min-h-0 flex-col gap-4">
        {/* <lg: chap aside yashirin — gorizontal boʻlim almashtirgich */}
        <div className="lg:hidden shrink-0 -mx-1 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 px-1">
            <Link
              href="/dashboard/classes"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              <span className="truncate max-w-[80px]">{identity.name}</span>
            </Link>
            {CLASS_SECTIONS.map((s) => {
              const isActive = s.key === section;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => selectSection(s.key)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                    isActive ? "" : "border border-border bg-card text-foreground/70 hover:text-foreground"
                  )}
                  style={isActive ? { ...tints.tint, ...tints.iconText } : undefined}
                >
                  <Icon className="size-3.5" />
                  {tSections(s.key)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1">
        {section === "overview" ? (
          <OverviewSection identity={identity} />
        ) : section === "lessons" ? (
          <LessonsSection identity={identity} />
        ) : section === "students" ? (
          <StudentsSection identity={identity} />
        ) : section === "grades" ? (
          <GradesSection identity={identity} />
        ) : section === "attendance" ? (
          <AttendanceSection identity={identity} />
        ) : section === "behavior" ? (
          <BehaviorSection identity={identity} />
        ) : section === "standards" ? (
          <StandardsSection identity={identity} />
        ) : section === "planner" ? (
          <PlannerSection identity={identity} />
        ) : (
          <SectionPlaceholder
            label={tSections(section)}
            icon={CLASS_SECTIONS.find((s) => s.key === section)!.icon}
          />
        )}
        </div>
      </main>

      {/* ───────────── RIGHT: kontekstli panel ───────────── */}
      {showRight && (
        <aside className="hidden xl:flex min-w-0 min-h-0 h-full">
          <OverviewSidebar identity={identity} />
        </aside>
      )}
    </DashboardColumns>
  );
}

/* ── Hali tayyor boʻlmagan boʻlimlar uchun boʻsh holat ── */
function SectionPlaceholder({
  label,
  icon: Icon,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const t = useTranslations("ClassDetail");
  return (
    <Card className={cn(panelCardClass, "items-center justify-center text-center")}>
      <div className="flex flex-col items-center px-6 py-16">
        <SectionIcon size="lg" className="mb-4">
          <Icon className="size-6" />
        </SectionIcon>
        <p className="text-base font-semibold text-foreground">{label}</p>
        <TypographyMuted className="text-sm mt-1.5 max-w-xs">
          {t("sectionPlaceholderBody")}
        </TypographyMuted>
      </div>
    </Card>
  );
}
