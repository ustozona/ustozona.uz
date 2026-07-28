"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppleEmoji } from "@/components/ui/apple-emoji";
import { YearProgress } from "@/components/dashboard/YearProgress";
import { QuoteText } from "@/components/dashboard/QuoteText";
import { QuotesDialog } from "@/components/dashboard/QuotesDialog";
import { useQuotesStore } from "@/store/useQuotesStore";
import { newQuoteSeed, pickQuote } from "@/lib/quotes";
import { fmtMin } from "@/lib/timetable";
import { cn } from "@/lib/utils";
import type { AcademicYearCalendar } from "@/lib/academic-calendar";

/** Bugungi dars — hero subtitle hisobi uchun minimal koʻrinish. */
export type HeroEvent = { startMin: number; endMin: number; className: string };

/** Iqtibos bezak-belgisi — public/noun-quote-5739394.svg'dan (`currentColor`,
    attribution matnlari render'ga kerak emas, shuning uchun olib tashlangan). */
function QuoteMarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 30" className={className} fill="currentColor" aria-hidden>
      <path d="m21.301 4c.411 0 .699.313.699.663 0 .248-.145.515-.497.702-1.788.948-3.858 4.226-3.858 6.248 3.016-.092 4.326 2.582 4.326 4.258 0 2.007-1.738 4.129-4.308 4.129-3.24 0-4.83-2.547-4.83-5.307 0-5.98 6.834-10.693 8.468-10.693zm-10.833 0c.41 0 .699.313.699.663 0 .248-.145.515-.497.702-1.788.948-3.858 4.226-3.858 6.248 3.016-.092 4.326 2.582 4.326 4.258 0 2.007-1.739 4.129-4.308 4.129-3.241 0-4.83-2.547-4.83-5.307 0-5.98 6.833-10.693 8.468-10.693z" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HERO ALMASHISHI — "kun-birinchi" qoidasi.

   Kunning BIRINCHI kirishida salom koʻrsatiladi (orientatsiya: bugun
   nechta dars, qayerdamiz), oʻsha kunning keyingi kirishlarida esa
   iqtibos. Sabab: salomning qiymati kuniga bir marta, iqtibosning
   qiymati esa takrorlanmasligida.

   Istisnolar — salom har doim ustun:
     • hisob hali sozlanmagan (classCount === 0) — yoʻnaltirish kerak;
     • hozir dars ketyapti yoki 90 daqiqa ichida boshlanadi — subtitle'dagi
       vaqt maʼlumoti iqtibosdan muhimroq.

   Belgi localStorage'da (qurilma-lokal, server sync yoʻq). HomeHero
   faqat mount'dan keyin render qilinadi (dashboard/page.tsx mount-gate),
   shuning uchun lazy oʻqish gidratatsiya nomuvofiqligini keltirmaydi.
   ════════════════════════════════════════════════════════════════════ */

const GREETED_KEY = "hero-greeted-on";
/** Shu daqiqadan yaqin dars — vaqt maʼlumoti iqtibosdan ustun turadi. */
const IMMINENT_MIN = 90;

/** Bugun salom allaqachon koʻrsatilganmi; koʻrsatilmagan boʻlsa belgilab qoʻyadi. */
function consumeGreeting(todayKey: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (localStorage.getItem(GREETED_KEY) === todayKey) return false;
    localStorage.setItem(GREETED_KEY, todayKey);
    return true;
  } catch {
    // Shaxsiy rejimda localStorage yopiq boʻlishi mumkin — salom zaxira variant.
    return true;
  }
}

/**
 * Bosh sahifa hero'si — ikki variantda: kunning birinchi kirishida salom +
 * kun konteksti + oʻquv yili progress-chizigʻi; keyingi kirishlarda kunlik
 * iqtibos (progress-chiziqsiz).
 */
export function HomeHero({
  firstName,
  greeting,
  dateLabel,
  restNote,
  classCount,
  todayEvents,
  nowMin,
  calendar,
  todayKey,
}: {
  firstName: string;
  greeting: string;
  dateLabel: string;
  /** Dam olish kuni / taʼtil izohi — ixtiyoriy. */
  restNote?: string;
  classCount: number;
  /** Bugungi jadval darslari (vaqt boʻyicha tartiblangan). */
  todayEvents: HeroEvent[];
  /** Joriy vaqt (kun boshidan daqiqada). */
  nowMin: number;
  calendar: AcademicYearCalendar;
  todayKey: string;
}) {
  const t = useTranslations("HomeHero");
  const tq = useTranslations("Quotes");
  const [quotesOpen, setQuotesOpen] = useState(false);
  const quotes = useQuotesStore((s) => s.quotes);
  // Seed mount'da bir marta — sahifadan chiqib qaytganda (yoki qayta yuklanganda)
  // HomeHero unmount/mount boʻladi, demak yangi iqtibos chiqadi. Render davomida
  // esa barqaror: store yangilanishi iqtibosni almashtirmaydi.
  const [quoteSeed] = useState(newQuoteSeed);
  const quote = useMemo(() => pickQuote(quotes, quoteSeed), [quotes, quoteSeed]);

  const isSetup = classCount > 0;
  const hasLessons = todayEvents.length > 0;

  // ── Subtitle — kun holatiga qarab ──
  const ongoing = todayEvents.find((e) => e.startMin <= nowMin && nowMin < e.endMin);
  const next = todayEvents.find((e) => e.startMin > nowMin);
  let subtitle: string;
  if (!isSetup) {
    subtitle = t("subtitleGetStarted");
  } else if (!hasLessons) {
    subtitle = dateLabel;
  } else {
    const isFirst = next ? todayEvents.indexOf(next) === 0 : false;
    let status: string;
    if (ongoing) {
      status = t("ongoing", { className: ongoing.className });
    } else if (next) {
      const diff = next.startMin - nowMin;
      if (diff <= IMMINENT_MIN) {
        status = isFirst
          ? t("firstInMinutes", { minutes: diff })
          : t("nextInMinutes", { minutes: diff });
      } else {
        status = isFirst
          ? t("firstAt", { time: fmtMin(next.startMin) })
          : t("nextAt", { time: fmtMin(next.startMin) });
      }
    } else {
      status = t("allDone");
    }
    subtitle = `${t("lessonsCount", { count: todayEvents.length })} · ${status}`;
  }

  // ── Qaysi variant? ──
  // consumeGreeting nojoʻya taʼsirli (belgini yozadi), shuning uchun bir
  // marta — birinchi render'da — hisoblanadi va shu kunga muzlatiladi.
  const [greetedFirst] = useState(() => consumeGreeting(todayKey));
  const timeCritical = Boolean(ongoing) || (next != null && next.startMin - nowMin <= IMMINENT_MIN);
  const showQuote = !greetedFirst && isSetup && !timeCritical && quote != null;

  return (
    <Card className="relative shrink-0 overflow-hidden rounded-xl border border-border p-0 shadow-none">
      <CardContent className="group/hero p-0">
        {/* Landing hero gradienti — yumshoq blur blob (sky → white → amber) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 z-0 rounded-full bg-linear-to-r from-sky-100 via-white to-amber-100 opacity-80 blur-2xl dark:from-slate-800 dark:via-black dark:to-stone-700"
        />
        <div className="relative z-10 px-5 py-4 md:px-6 md:py-5">
          {showQuote && quote ? (
            /* ── Iqtibos varianti — progress-chiziqsiz ──
               Chapdagi ikonka ham boshqaruv tugmasi: uni bosish iqtiboslar
               dialogini ochadi (alohida ikonka-tugma yoʻq). Tinch holatda
               toza bezak, karta ustiga kursor kelganda affordans kuchayadi
               (guruh-hover — Notion/Linear qolipi). */
            <div className="flex items-center gap-3 md:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={tq("manage")}
                    onClick={() => setQuotesOpen(true)}
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center justify-center rounded-full p-2",
                      "text-foreground/25 transition-colors group-hover/hero:text-foreground/40",
                      "hover:!text-foreground/70",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <QuoteMarkIcon className="size-7 md:size-8" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{tq("manage")}</TooltipContent>
              </Tooltip>
              <blockquote className="min-w-0 flex-1">
                <p className="heading-small font-normal">
                  <QuoteText quote={quote} />
                </p>
                {quote.author && (
                  <footer className="mt-3 text-body">
                    <cite className="not-italic">— {quote.author}</cite>
                  </footer>
                )}
              </blockquote>
            </div>
          ) : (
            /* ── Salom varianti ── */
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="heading-section">
                    {greeting}, {firstName}! <AppleEmoji code="1f60a" label="Tabassum" />
                  </p>
                  <p className="mt-1 text-caption">
                    {subtitle}
                    {isSetup && !hasLessons && restNote ? (
                      <span className="text-foreground/70">. {restNote}</span>
                    ) : null}
                  </p>
                </div>
              </div>

              <YearProgress calendar={calendar} todayKey={todayKey} className="mt-3" />
            </>
          )}
        </div>
      </CardContent>

      <QuotesDialog open={quotesOpen} onOpenChange={setQuotesOpen} />
    </Card>
  );
}
