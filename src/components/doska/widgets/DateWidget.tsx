"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { dayLabel } from "@/lib/doska/date-label";
import { dateKeyToDate } from "@/lib/date-keys";
import { SettingsSection, SettingsSwitch } from "../SettingsFields";
import { useFitText } from "./useFitText";
import { useTodayLoad } from "./useTodayLoad";

/* ════════════════════════════════════════════════════════════════════
   SANA — bugungi kun nomi va sana, OʻZI yangilanadi
   (docs/doska-referens-koriklari.md R445).

   Boshqa xizmatlarda kun nomi rasm qilib qoʻyiladi va har kun uchun
   alohida ekran tuziladi (Dushanba…Juma — beshta ekran). Bu yerda bitta
   vidjet: doska tun boʻyi yoqiq qolsa ham ertalab toʻgʻri kunni
   koʻrsatadi (`useNowMin` har 30 soniyada sanani tekshiradi).

   Bayram yoki taʼtil nomi — oʻqituvchining oʻquv kalendaridan («Bugun»
   bilan bitta soʻrov, `useTodayLoad`). Mehmonda u yoʻq — faqat kun va sana.

   ⚠️ IDISHSIZ — matn vidjeti kabi: siyoh och fonda, boʻr toʻq fonda.
   Kun nomi — uslubning displey vaznida; ekranning sarlavhasi.

   Koʻrinish shakldan (R433): keng vidjetda kun va sana bir qatorda, aks
   holda ustma-ust. Oʻlcham `useFitText` bilan qutiga sigʻdiriladi —
   «Chorshanba» «Juma»dan ikki barobar uzun.
   ════════════════════════════════════════════════════════════════════ */

/** Shundan keng vidjetda kun va sana bir qatorda. */
const WIDE_RATIO = 3.2;

function readDate(state: DoskaWidget["state"]) {
  return {
    showDate: state.showDate !== false,
    showYear: state.showYear === true,
    showHoliday: state.showHoliday !== false,
  };
}

export function DateWidget({ widget }: { widget: DoskaWidget }) {
  const locale = useLocale();
  const { showDate, showYear, showHoliday } = readDate(widget.state);
  const { now, load } = useTodayLoad();
  const ref = React.useRef<HTMLDivElement>(null);

  // Sana mountdan keyin — server va brauzer soati farq qilsa gidratsiya buzilmasin.
  const label = now ? dayLabel(dateKeyToDate(now.day), locale, showYear) : null;
  const holiday = showHoliday ? (load?.holiday ?? null) : null;
  const wide = widget.w / widget.h > WIDE_RATIO;

  useFitText(ref, {
    text: [label?.weekday, showDate ? label?.date : "", holiday, wide].join("|"),
    widthRatio: 0.3,
    min: 12,
    max: 360,
  });

  const weekday = (
    <span style={{ fontWeight: "var(--doska-display-weight)" }}>{label?.weekday}</span>
  );

  return (
    <div
      ref={ref}
      translate="no"
      className="doska-ink flex size-full flex-col justify-center overflow-hidden px-[3cqw] leading-[1.1] whitespace-nowrap"
    >
      {label &&
        (wide ? (
          <p>
            {weekday}
            {showDate && <span style={{ fontSize: "0.5em", marginLeft: "0.5em", opacity: 0.8 }}>{label.date}</span>}
          </p>
        ) : (
          <>
            <p>{weekday}</p>
            {showDate && <p style={{ fontSize: "0.42em", marginTop: "0.15em", opacity: 0.8 }}>{label.date}</p>}
          </>
        ))}
      {holiday && <p style={{ fontSize: "0.3em", marginTop: "0.3em", opacity: 0.8 }}>{holiday}</p>}
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function DateSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.date");
  const { showDate, showYear, showHoliday } = readDate(widget.state);

  return (
    <SettingsSection label={t("show")}>
      <SettingsSwitch checked={showDate} onChange={(v) => patch(widget.id, { showDate: v })} label={t("showDate")} />
      {showDate && (
        <SettingsSwitch checked={showYear} onChange={(v) => patch(widget.id, { showYear: v })} label={t("showYear")} />
      )}
      <SettingsSwitch
        checked={showHoliday}
        onChange={(v) => patch(widget.id, { showHoliday: v })}
        label={t("showHoliday")}
      />
      <p className="text-muted-foreground text-xs leading-snug">{t("holidayHint")}</p>
    </SettingsSection>
  );
}
