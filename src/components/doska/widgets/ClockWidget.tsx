"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { bellNow, type BellPeriod } from "@/lib/doska/bells";
import { todayKey } from "@/lib/date-keys";
import { doskaBellsAction } from "@/server/actions/doska-bells";
import { SettingsSection, SettingsStepper, SettingsSwitch } from "../SettingsFields";
import { playBell, unlockDoskaSound } from "../sounds";
import { Digits } from "./Digits";

/* ════════════════════════════════════════════════════════════════════
   SOAT — joriy vaqt; ixtiyoriy QOʻNGʻIROQ JADVALI bilan
   (docs/doska-referens-koriklari.md R408).

   `bells` yoqilsa soat ostida «3-soat · tugashiga 12 daq» yoki
   «Tanaffus · 4 daq» chiqadi. Jadval oʻqituvchining dars jadvalidan
   (qoʻngʻiroq sozlamasi) olinadi — budilnik qoʻlda qoʻyilmaydi.
   Oxirgi `warnMin` daqiqada yozuv «tugadi» rangiga oʻtadi, `bellSound`
   yoqilgan boʻlsa dars tugaganda qoʻngʻiroq chalinadi (faqat koʻz
   oldida — sahifa keyin ochilsa jim).

   Kirmagan yoki jadvali yoʻq — yozuv chiqmaydi, soat oddiy ishlaydi.

   ⚠️ Vaqt serverda va brauzerda har xil boʻlgani uchun birinchi render
   BOʻSH chiqadi (`null`), qiymat esa mount'dan keyin qoʻyiladi. Aks
   holda hydration mismatch boʻladi.
   ════════════════════════════════════════════════════════════════════ */

let bellsPromise: { day: string; promise: Promise<BellPeriod[] | null> } | null = null;

function loadBells(day: string): Promise<BellPeriod[] | null> {
  if (bellsPromise?.day !== day) {
    const promise = doskaBellsAction({ today: day })
      .then((res) => (res.ok && res.data.status === "ok" ? res.data.periods : null))
      .catch(() => {
        bellsPromise = null;
        return null;
      });
    bellsPromise = { day, promise };
  }
  return bellsPromise.promise;
}

function readClock(state: DoskaWidget["state"]) {
  return {
    showSeconds: state.showSeconds !== false,
    bells: state.bells === true,
    warnMin: Math.min(15, Math.max(1, Number(state.warnMin) || 5)),
    bellSound: state.bellSound === true,
  };
}

export function ClockWidget({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.clock");
  const { showSeconds, bells, warnMin, bellSound } = readClock(widget.state);
  const [now, setNow] = React.useState<Date | null>(null);
  const [periods, setPeriods] = React.useState<BellPeriod[] | null>(null);
  const day = now ? todayKey() : null;

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (!bells || !day) return;
    let alive = true;
    void loadBells(day).then((p) => alive && setPeriods(p));
    return () => {
      alive = false;
    };
  }, [bells, day]);

  const status =
    bells && periods && now ? bellNow(periods, now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) : null;

  // Dars tugashi — oldingi soniyada dars edi, endi emas.
  const prevLesson = React.useRef<number | null>(null);
  React.useEffect(() => {
    const lesson = status?.kind === "lesson" ? status.period.startMin : null;
    // Faqat haqiqiy dars oxiri: jadval oʻchirilsa yoki yuklanmasa (`status`
    // yoʻq) qoʻngʻiroq chalinmaydi.
    if (status && prevLesson.current !== null && lesson !== prevLesson.current && bellSound) playBell();
    prevLesson.current = lesson;
  }, [status, bellSound]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const text = now
    ? showSeconds
      ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      : `${pad(now.getHours())}:${pad(now.getMinutes())}`
    : "";

  const leftMin = status ? Math.ceil(status.leftSec / 60) : 0;
  const warning = status?.kind === "lesson" && status.leftSec <= warnMin * 60;

  return (
    <div className="doska-card flex size-full flex-col items-center justify-center gap-[2cqw] px-4" data-card="blue" data-warn={warning ? "" : undefined}>
      {/* Yuqori chegara katta: «Markazga» rejimida soat butun ekranga
          kattalashadi va raqam u bilan oʻsishi kerak. */}
      <Digits text={text} style={{ fontSize: status ? "clamp(1.75rem, 21cqw, 24rem)" : "clamp(2rem, 26cqw, 30rem)" }} />
      {status && (
        <p
          aria-live="polite"
          className="rounded-full px-[3cqw] py-[0.8cqw] text-center leading-tight font-semibold"
          style={{
            fontSize: "clamp(0.75rem, 5.5cqw, 2.5rem)",
            background: warning ? "var(--doska-done-bg)" : "color-mix(in oklch, currentColor 12%, transparent)",
            color: warning ? "var(--doska-done-fg)" : undefined,
          }}
        >
          {status.kind === "lesson"
            ? t("lessonLeft", { n: status.period.index, min: leftMin })
            : t("breakLeft", { min: leftMin })}
        </p>
      )}
    </div>
  );
}

export function ClockSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.clock");
  const { showSeconds, bells, warnMin, bellSound } = readClock(widget.state);

  return (
    <>
      <SettingsSection label={t("view")}>
        <SettingsSwitch
          label={t("showSeconds")}
          checked={showSeconds}
          onChange={(on) => patch(widget.id, { showSeconds: on })}
        />
      </SettingsSection>

      <SettingsSection label={t("bells")}>
        <SettingsSwitch label={t("bellsOn")} checked={bells} onChange={(on) => patch(widget.id, { bells: on })} />
        {bells && (
          <>
            <p className="text-muted-foreground text-xs leading-snug">{t("bellsHint")}</p>
            <span className="text-sm">{t("warnMin")}</span>
            <SettingsStepper
              value={String(warnMin)}
              minusLabel={t("less")}
              plusLabel={t("more")}
              minusDisabled={warnMin <= 1}
              plusDisabled={warnMin >= 15}
              onMinus={() => patch(widget.id, { warnMin: warnMin - 1 })}
              onPlus={() => patch(widget.id, { warnMin: warnMin + 1 })}
            />
            <SettingsSwitch
              label={t("bellSound")}
              checked={bellSound}
              onChange={(on) => {
                if (on) unlockDoskaSound();
                patch(widget.id, { bellSound: on });
              }}
            />
          </>
        )}
      </SettingsSection>
    </>
  );
}
