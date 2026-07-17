"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BookOpen, ClipboardList, Users, GraduationCap, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { AnimatedCounter } from "@/components/dashboard/AnimatedCounter";
import { cn } from "@/lib/utils";
import { classTints, type ClassColor } from "@/lib/class-colors";

/** Bugungi darsning agenda qatori uchun minimal maʼlumot. */
export type WelcomeAgendaItem = {
  id: string;
  className: string;
  timeLabel: string;
  hex: string;
};

/**
 * Bosh sahifa salomlashuv kartasi — kontekstga moslashuvchi (Notion Home
 * uslubi): dars bor kunda BUGUNGI AGENDA (vaqt + sinf), boʻsh/dam olish
 * kunida METRIK QATOR (darslar/vazifalar/oʻquvchilar/sinflar). Salom (+
 * Apple 😊) → sana → moslashuvchi tana. Toʻliq responsive, dizayn-tizim
 * tokenlariga tekislangan.
 */
export function WelcomeCard({
  firstName,
  greeting,
  dateLabel,
  restNote,
  todayLessonCount,
  todayTaskCount,
  studentCount,
  classCount,
  todayAgenda,
}: {
  firstName: string;
  greeting: string;
  dateLabel: string;
  /** Dam olish kuni / taʼtil izohi (mas. "Yaxshi dam oling!") — ixtiyoriy. */
  restNote?: string;
  todayLessonCount: number;
  todayTaskCount: number;
  studentCount: number;
  classCount: number;
  /** Bugungi darslar (vaqt boʻyicha tartiblangan). Boʻsh boʻlsa metrik qator. */
  todayAgenda: WelcomeAgendaItem[];
}) {
  const t = useTranslations("WelcomeCard");
  const hasAgenda = todayAgenda.length > 0;
  // Yangi hisob — hali biror sinf qoʻshilmagan: metrika oʻrniga boshlash CTA.
  const isSetup = classCount > 0;
  const subtitle = hasAgenda
    ? t("subtitleWithAgenda", { dateLabel, count: todayAgenda.length })
    : !isSetup
      ? t("subtitleGetStarted")
      : dateLabel;

  return (
    <Card className="relative shrink-0 overflow-hidden rounded-xl border-0 p-0 card-elevation">
      <CardContent className="p-0">
        {/* Landing hero gradienti — yumshoq blur blob (sky → white → amber) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 z-0 rounded-full bg-linear-to-r from-sky-100 via-white to-amber-100 opacity-80 blur-2xl dark:from-slate-800 dark:via-black dark:to-stone-700"
        />
        <div className="relative z-10 flex flex-col gap-3 px-5 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="heading-section">
                {greeting}, {firstName}! <AppleEmoji code="1f60a" label="Tabassum" />
              </p>
              <p className="mt-1 text-caption">
                {subtitle}
                {!hasAgenda && isSetup && restNote ? (
                  <span className="text-foreground/70">. {restNote}</span>
                ) : null}
              </p>
            </div>
            {hasAgenda ? (
              <Link
                href="/dashboard/timetable"
                className="hidden shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                {t("schedule")}
                <ArrowRight className="size-3.5" />
              </Link>
            ) : isSetup ? (
              <MetricGrid
                todayLessonCount={todayLessonCount}
                todayTaskCount={todayTaskCount}
                studentCount={studentCount}
                classCount={classCount}
              />
            ) : (
              <Link
                href="/dashboard/grades"
                className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-white/60 bg-white/50 px-3.5 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-white/80 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20 sm:inline-flex"
              >
                <Plus className="size-4" />
                {t("addClass")}
              </Link>
            )}
          </div>

          {hasAgenda ? <AgendaList items={todayAgenda} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Bugungi darslar roʻyxati — vaqt · rangli nuqta · sinf nomi. Koʻpi bilan
 * 3 qator, qolgani "+N" chipiga yigʻiladi. Har qatori jadvalga oltadi.
 */
function AgendaList({ items }: { items: WelcomeAgendaItem[] }) {
  const t = useTranslations("WelcomeCard");
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-col gap-0.5">
      {shown.map((it) => (
        <Link
          key={it.id}
          href="/dashboard/timetable"
          className="group flex items-center gap-3 rounded-lg py-1.5 pr-2 transition-colors hover:bg-muted/60"
        >
          <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
            {it.timeLabel}
          </span>
          <span
            className="size-2 shrink-0 rounded-[3px]"
            style={{ backgroundColor: it.hex }}
          />
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">
            {it.className}
          </span>
          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      ))}
      {extra > 0 ? (
        <Link
          href="/dashboard/timetable"
          className="mt-0.5 pl-14 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("moreLessons", { count: extra })}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Ixcham 2×2 metrik panjara — salom matni oʻngida turadi (kartani past
 * saqlaydi). Bugungi darslar/vazifalar bosiluvchi, oʻquvchilar/sinflar
 * umumiy hisob. Tor ekranda yashirinadi.
 */
function MetricGrid({
  todayLessonCount,
  todayTaskCount,
  studentCount,
  classCount,
}: {
  todayLessonCount: number;
  todayTaskCount: number;
  studentCount: number;
  classCount: number;
}) {
  const t = useTranslations("WelcomeCard");
  return (
    <div className="hidden shrink-0 grid-cols-2 gap-1.5 sm:grid">
      <MetricTile href="/dashboard/timetable" icon={<BookOpen />} color="sky" value={todayLessonCount} noun={t("nounLesson")} emphasize={todayLessonCount > 0} />
      <MetricTile href="/dashboard/tasks" icon={<ClipboardList />} color="green" value={todayTaskCount} noun={t("nounTask")} emphasize={todayTaskCount > 0} />
      <MetricTile href="/dashboard/students" icon={<Users />} color="violet" value={studentCount} noun={t("nounStudent")} />
      <MetricTile href="/dashboard/grades" icon={<GraduationCap />} color="amber" value={classCount} noun={t("nounClass")} />
    </div>
  );
}

/**
 * Bitta metrik kafeli — "frosted glass" uslubi (gradient fon bilan garmoniya):
 * yarim-shaffof oq + backdrop-blur + oqimtir chegara, rangli ikon. "N ta noun"
 * koʻrinishida. Bosiluvchi.
 */
function MetricTile({
  href,
  icon,
  color,
  value,
  noun,
  emphasize,
}: {
  href: string;
  icon: React.ReactNode;
  color: ClassColor;
  value: number;
  noun: string;
  emphasize?: boolean;
}) {
  const t = useTranslations("WelcomeCard");
  const tints = classTints(color);
  return (
    <Link
      href={href}
      className="flex min-w-[92px] items-center gap-2 rounded-[10px] border border-white/60 bg-white/35 px-2.5 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/75 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
    >
      <span style={tints.iconText} className="shrink-0 [&_svg]:size-4">{icon}</span>
      <span
        className={cn(
          "text-lg font-semibold leading-none tabular-nums",
          emphasize ? "text-foreground" : "text-foreground/85"
        )}
      >
        <AnimatedCounter value={value} />
      </span>
      <span className="text-xs text-muted-foreground">{t("unitLabel", { noun })}</span>
    </Link>
  );
}
