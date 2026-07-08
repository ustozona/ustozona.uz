"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Lock, Sunrise, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { classTints } from "@/lib/class-colors";
import { defaultBellConfig, type BellConfig } from "@/lib/bell-schedule";
import { buildSlots, type ShiftConfig } from "@/lib/timetable";
import { useTimetableStore } from "@/store/useTimetableStore";
import { resolveVersionForDate } from "@/lib/timetable-versions";
import { todayKey } from "@/lib/date-keys";
import { SettingsGroup } from "./SettingsShared";

const minToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/* Ranglar — loyihaning kanonik OKLCH tints dvigatelidan (class-colors.ts):
   hammasi BITTA sky oilasida. Katta tanaffus alohida rang emas — CardStripes
   uslubidagi diagonal shtrix (jadvaldagi band/boʻsh slot tili), oddiy
   tanaffus neytral boʻshliq. Amber olib tashlandi: koʻk palitraga begona edi. */
const SKY = classTints("sky");
/** Diagonal shtrix generatori (CardStripes cover bilan bir grammatika) */
const stripes = (color: string, pct: number) =>
  `repeating-linear-gradient(-45deg, color-mix(in oklch, ${color} ${pct}%, transparent) 0, color-mix(in oklch, ${color} ${pct}%, transparent) 5px, transparent 5px, transparent 13px)`;
/** Katta tanaffus — sky shtrix */
const LONG_BREAK_STRIPES = stripes(SKY.solid, 22);
/** Oddiy tanaffus — neytral, nozikroq shtrix */
const BREAK_STRIPES = stripes("var(--muted-foreground)", 16);

/* Qoʻngʻiroq jadvali JORIY jadval versiyasining snapshotida yashaydi va
   faqat dars jadvali sahifasidagi dialog orqali oʻzgartiriladi — u yerda
   saqlash "qachondan kuchga kiradi?" (versiyalash) oqimidan oʻtadi.
   Bu boʻlim FAQAT OʻQIYDI: ilgari shu yerdagi inputlar har keystroke'da
   joriy versiyani dialogsiz qayta yozib, versiyalash kafolatini buzardi.

   Koʻrinish — kalendar-agenda (Google Calendar kun koʻrinishi uslubi):
   chap tomonda soat oʻqi (dumaloq bekatlar + vertikal chiziq), darslar
   vaqtga PROPORSIONAL koʻk bloklar, oddiy tanaffuslar ingichka kulrang
   qatlam, katta tanaffus amber blok. Yorliqlar "N-soat" (jurnal tili). */

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
          { label: "1-smena", icon: Sunrise, cfg: config.shift1 },
          { label: "2-smena", icon: Sunset, cfg: config.shift2 },
        ]
      : [{ label: "1-smena", icon: Sunrise, cfg: config.shift1 }];

  // Dars soni/davomiyligi barcha smenalarda bir xil boʻlsa — umumiy qatorda
  // bir marta koʻrsatiladi, kartalar faqat vaqt oqimini chizadi.
  const allSame = shifts.every(
    (s) =>
      s.cfg.lessonCount === shifts[0].cfg.lessonCount &&
      s.cfg.lessonMin === shifts[0].cfg.lessonMin
  );

  return (
    <>
      <SettingsGroup
        title="Smenalar va qoʻngʻiroqlar jadvali"
        description="Maʼlumotlar amaldagi dars jadvalidan olinadi. Oʻzgartirishlar dars jadvali sahifasida amalga oshiriladi (yangi jadvalni saqlash paytida uning kuchga kirish sanasi soʻraladi)."
        action={
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="cursor-default gap-1.5 font-normal text-muted-foreground">
                <Lock data-icon="inline-start" />
                Faqat koʻrish
              </Badge>
            </TooltipTrigger>
            <TooltipContent>Manba: Dars jadvali boʻlimi</TooltipContent>
          </Tooltip>
        }
      >
        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap items-center gap-2 px-5 py-3">
            <Badge variant="secondary" className="font-normal">
              {config.profile === "double" ? "Ikki smenali" : "Bir smenali"}
            </Badge>
            {allSame && (
              <span className="text-xs text-muted-foreground">
                {shifts.length > 1 && "Har ikki smenada: "}
                <span className="font-medium text-foreground">{shifts[0].cfg.lessonCount} ta dars</span> ·{" "}
                <span className="font-medium text-foreground">{shifts[0].cfg.lessonMin} daqiqadan</span>
              </span>
            )}
          </div>
          <div className="grid divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {shifts.map(({ label, icon: Icon, cfg }) => (
              <ShiftCard key={label} label={label} icon={Icon} cfg={cfg} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border px-5 py-3">
            <LegendItem style={{ backgroundColor: SKY.badge.backgroundColor, borderColor: SKY.ring.borderColor }} label="Dars" />
            <LegendItem className="border-border" style={{ backgroundImage: BREAK_STRIPES }} label="Tanaffus" />
            <LegendItem style={{ backgroundImage: LONG_BREAK_STRIPES, borderColor: SKY.ring.borderColor }} label="Katta tanaffus" />
          </div>
        </div>
      </SettingsGroup>

      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/timetable?bell=1">
          Dars jadvali boʻlimiga oʻtish
          <ArrowUpRight />
        </Link>
      </Button>
    </>
  );
}

function LegendItem({ className, style, label }: { className?: string; style?: React.CSSProperties; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-[3px] border ${className ?? ""}`} style={style} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </span>
  );
}

/* ─── Bitta smena kartochkasi — sarlavha + kalendar-agenda oqimi ─── */
function ShiftCard({ label, icon: Icon, cfg }: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  cfg: ShiftConfig;
}) {
  const slots = buildSlots(cfg);
  const endMin = slots.at(-1)?.endMin ?? cfg.startMin;

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-base font-semibold tabular-nums text-foreground">
            {minToHHMM(cfg.startMin)} – {minToHHMM(endMin)}
          </span>
        </div>
      </div>
      <ShiftAgenda cfg={cfg} slots={slots} endMin={endMin} />
    </div>
  );
}

/** 1 daqiqa necha px — masshtab. 45 daq dars ≈ 63px blok. */
const PX_PER_MIN = 1.4;

function ShiftAgenda({ cfg, slots, endMin }: {
  cfg: ShiftConfig;
  slots: ReturnType<typeof buildSlots>;
  endMin: number;
}) {
  const y = (m: number) => (m - cfg.startMin) * PX_PER_MIN;
  const height = y(endMin);

  // Soat bekatlari: oraliqdagi har toʻliq soat + chetlari toʻliq soat boʻlmasa
  // boshlanish/tugash vaqtining oʻzi ham bekat boʻladi (m-n: 17:55).
  const ticks: number[] = [];
  if (cfg.startMin % 60 !== 0) ticks.push(cfg.startMin);
  for (let m = Math.ceil(cfg.startMin / 60) * 60; m <= endMin; m += 60) ticks.push(m);
  if (endMin % 60 !== 0) ticks.push(endMin);

  return (
    <div className="relative tabular-nums" style={{ height }}>
      {/* Vertikal oʻq */}
      <div className="absolute bottom-1 top-1 left-[46px] w-0.5 rounded-full bg-border" />

      {/* Soat bekatlari: yorliq + dumaloq */}
      {ticks.map((m) => (
        <React.Fragment key={m}>
          <span
            className="absolute left-0 -translate-y-1/2 text-xs text-muted-foreground"
            style={{ top: y(m) }}
          >
            {minToHHMM(m)}
          </span>
          <span
            className="absolute left-[41px] size-3 -translate-y-1/2 rounded-full border-2 bg-card"
            style={{ top: y(m), borderColor: SKY.ring.borderColor }}
          />
        </React.Fragment>
      ))}

      {/* Dars bloklari va tanaffuslar */}
      {slots.map((s, i) => {
        const isLast = i === slots.length - 1;
        const afterLong = s.index === cfg.longBreakAfter && !isLast;
        const nextStart = isLast ? null : slots[i + 1].startMin;
        const breakLen = nextStart === null ? 0 : nextStart - s.endMin;
        return (
          <React.Fragment key={s.index}>
            <div
              className="absolute right-0 left-16 flex items-center justify-between border-l-[3px] px-3"
              style={{
                top: y(s.startMin),
                height: (s.endMin - s.startMin) * PX_PER_MIN,
                borderColor: SKY.ring.borderColor,
                backgroundColor: SKY.badge.backgroundColor,
              }}
            >
              <span className="text-[13px] font-medium" style={SKY.textStrong}>
                {s.index}-soat
              </span>
              <span className="text-xs opacity-80" style={SKY.textStrong}>
                {minToHHMM(s.startMin)} – {minToHHMM(s.endMin)}
              </span>
            </div>
            {!isLast && breakLen > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  {afterLong ? (
                    <div
                      className="absolute right-0 left-16 cursor-default"
                      style={{
                        top: y(s.endMin),
                        height: breakLen * PX_PER_MIN,
                        backgroundImage: LONG_BREAK_STRIPES,
                      }}
                    />
                  ) : (
                    <div
                      className="absolute right-0 left-16 cursor-default"
                      style={{
                        top: y(s.endMin),
                        height: breakLen * PX_PER_MIN,
                        backgroundImage: BREAK_STRIPES,
                      }}
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {afterLong ? "Katta tanaffus" : "Tanaffus"}: {breakLen} daq
                </TooltipContent>
              </Tooltip>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
