"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useDoskaStore, useIsSelected } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { IconPause, IconPlay, IconRestart } from "../icons";
import { SettingsChoices, SettingsSection, SettingsStepper, SettingsSwitch } from "../SettingsFields";
import { playTimerEnd, unlockDoskaSound } from "../sounds";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   TAYMER — orqaga sanash (docs/doska-ux-tadqiqot.md A3, R327).

   • ASOSIY AMAL — alohida ▶/⏸ tugmasi (tugaganda ↻). U `data-doska-no-drag`:
     bosish hech qachon vidjetni TANLAMAYDI va SUDRAMAYDI — sinf ekranida
     tanlov ramkasi va panel paydo boʻlmaydi, barmoq teginishda sal
     siljisa ham taymer baribir boshlanadi.
   • Vidjetning qolgan YUZI — oddiy vidjet: bosish tanlaydi (panel,
     sozlama, «+1»), sudrash koʻchiradi. Ishlab turgan taymerni sozlash
     uchun uni toʻxtatish SHART EMAS.

     Nega yuzning oʻzi boshlash tugmasi emas: bitta nishonda ikki niyat
     («toʻxtat» va «tanla») toʻqnashardi — ishlab turgan taymerga +1
     qoʻshmoqchi boʻlgan oʻqituvchi uni avval toʻxtatishga majbur edi.
   • Vaqt SOZLAMA KARTASIDA tanlanadi (tayyor daqiqalar, ±) — vidjet
     ichida emas. Taymer qoʻyilganda karta darhol ochiladi
     (`openSettingsOnAdd`).
   • Ikkilamchi tugmalar (qaytadan, +1 daqiqa) faqat vidjet TANLANGANDA
     koʻrinadi — sinf ekranida faqat vaqt qoladi (A7).
   • Disk — kamayib boruvchi sektor: raqamni oʻqimaydigan bola ham
     qolgan vaqtni koʻradi (R327).
   • Tugaganda — rang + soʻz («Vaqt tugadi») + ixtiyoriy ovoz; rang
     yolgʻiz maʼno tashimaydi (R326).

   Holat storeʼda (`durationSec`, `remainingSec`, `running`, `view`,
   `sound`), shuning uchun sahifa yangilansa ham taymer joyida qoladi.
   `view` va `sound` 2-bosqichda qoʻshildi — eski taymerlarda yoʻq,
   shuning uchun ular standart qiymat bilan oʻqiladi.
   ════════════════════════════════════════════════════════════════════ */

export type TimerView = "digits" | "disk" | "both";

/** Tayyor variantlar (daqiqa). Darsdagi eng koʻp ishlatiladigan oraliqlar. */
const PRESET_MINUTES = [1, 3, 5, 10, 15];
/** Eng qisqa taymer (soniya) — «30 soniya oʻylab koʻring». */
const MIN_SEC = 30;
/** Eng uzun taymer (soniya) — 99:00, raqam ikki xonada qoladi. */
const MAX_SEC = 99 * 60;

function readTimer(state: DoskaWidget["state"]) {
  const durationSec = Number(state.durationSec ?? 300);
  const view: TimerView =
    state.view === "digits" || state.view === "disk" ? state.view : "both";
  return {
    durationSec,
    remainingSec: Number(state.remainingSec ?? durationSec),
    running: state.running === true,
    view,
    sound: state.sound !== false,
  };
}

function format(sec: number): string {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function TimerWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const selected = useIsSelected(widget.id);
  const t = useTranslations("Doska.timer");
  const { durationSec, remainingSec, running, view, sound } = readTimer(widget.state);
  const finished = remainingSec <= 0;
  const fresh = !running && remainingSec === durationSec;

  React.useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      // Storeʼdan oʻqiymiz, propʼdan emas: interval yopilmasidan oldin
      // prop eskirgan boʻlishi mumkin.
      const current = useDoskaStore
        .getState()
        .deck.screens.flatMap((s) => s.widgets)
        .find((w) => w.id === widget.id);
      if (!current) return;

      const left = Number(current.state.remainingSec ?? 0) - 1;
      if (left <= 0) {
        patch(widget.id, { remainingSec: 0, running: false });
        if (current.state.sound !== false) playTimerEnd();
      } else {
        patch(widget.id, { remainingSec: left });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, finished, widget.id, patch]);

  /** Asosiy tugma: tugagan — qaytadan tayyor; aks holda boshlash/toʻxtatish. */
  const onPrimary = () => {
    if (finished) {
      patch(widget.id, { remainingSec: durationSec, running: false });
      return;
    }
    // Tovush konteksti foydalanuvchi harakatida ochiladi — tugash ovozi
    // keyin harakatsiz chalinadi (sounds.ts).
    if (!running && sound) unlockDoskaSound();
    patch(widget.id, { running: !running });
  };

  const fraction = durationSec > 0 ? Math.min(1, Math.max(0, remainingSec) / durationSec) : 0;
  const showDisk = view !== "digits";
  const showDigits = view !== "disk";

  const primaryLabel = finished ? t("reset") : running ? t("pause") : t("start");

  return (
    <div
      className="relative size-full rounded-[var(--radius)]"
      style={{
        background: finished ? "var(--doska-light-red)" : "var(--doska-amber-bg)",
        color: finished ? "oklch(0.99 0 0)" : "var(--doska-amber-fg)",
        boxShadow: `0 4px 0 ${finished ? "oklch(0.45 0.18 27)" : "var(--doska-amber-edge)"}`,
      }}
    >
      <div className="flex size-full flex-col items-center justify-center gap-[2.5cqw] p-[4cqw]">
        <span
          role="timer"
          aria-label={format(remainingSec)}
          className="flex min-h-0 w-full flex-1 items-center justify-center gap-[5cqw]"
        >
          {showDisk && <TimerDisk fraction={fraction} large={!showDigits} />}
          {showDigits && (
            <span
              className="font-mono leading-none font-medium tabular-nums"
              style={{ fontSize: showDisk ? "clamp(1.5rem, 15cqw, 30rem)" : "clamp(2rem, 24cqw, 30rem)" }}
            >
              {format(remainingSec)}
            </span>
          )}
        </span>

        <span className="flex items-center gap-[3cqw]">
          {finished && (
            <span className="leading-tight font-semibold" style={{ fontSize: "clamp(0.9rem, 7cqw, 4rem)" }}>
              {t("finished")}
            </span>
          )}
          {/* Asosiy amal. Oʻlcham kattaroq (≥ 44 px): sensorli doskada eng
              koʻp bosiladigan nishon (R320–R321). */}
          <WidgetButton
            shape="round"
            label={primaryLabel}
            onClick={onPrimary}
            className="size-[clamp(2.75rem,15cqw,8rem)]"
          >
            {finished ? <IconRestart /> : running ? <IconPause /> : <IconPlay />}
          </WidgetButton>
        </span>
      </div>

      {/* Ikkilamchi tugmalar — faqat tanlanganda (A7). Asosiy amal pastda. */}
      {selected && (
        <div className="absolute top-[3cqw] right-[3cqw] flex gap-[1.5cqw]">
          {!fresh && !finished && (
            <WidgetButton
              shape="round"
              label={t("reset")}
              onClick={() => patch(widget.id, { remainingSec: durationSec, running: false })}
            >
              <IconRestart />
            </WidgetButton>
          )}
          <WidgetButton
            label={t("addMinute")}
            className="px-[3cqw] py-[1.5cqw]"
            style={{ fontSize: "clamp(0.75rem, 4cqw, 1.5rem)" }}
            onClick={() => {
              const add = Math.min(60, MAX_SEC - durationSec);
              patch(widget.id, {
                durationSec: durationSec + add,
                remainingSec: Math.max(0, remainingSec) + add,
              });
            }}
          >
            +1
          </WidgetButton>
        </div>
      )}
    </div>
  );
}

/**
 * Disk — qolgan vaqt sektori, soat mili yoʻnalishida kamayadi.
 * Rang kartaning oʻz rangidan (`currentColor`), shuning uchun toʻq
 * fondagi «boʻr rejimi» va tugagan holat avtomatik ishlaydi.
 */
function TimerDisk({ fraction, large }: { fraction: number; large: boolean }) {
  const r = 46;
  const angle = fraction * 2 * Math.PI;
  const x = 50 + r * Math.sin(angle);
  const y = 50 - r * Math.cos(angle);
  const largeArc = fraction > 0.5 ? 1 : 0;

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("aspect-square shrink-0", large ? "h-[92%]" : "h-[78%]")}
    >
      <circle cx="50" cy="50" r="48" fill="currentColor" opacity=".14" />
      {fraction >= 0.999 ? (
        <circle cx="50" cy="50" r={r} fill="currentColor" />
      ) : fraction > 0 ? (
        <path d={`M50 50 L50 ${50 - r} A${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`} fill="currentColor" />
      ) : null}
    </svg>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function TimerSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.timer");
  const { durationSec, view, sound } = readTimer(widget.state);

  /** Vaqt tanlansa taymer toʻxtaydi va toʻliq vaqtga qaytadi. */
  const setDuration = (sec: number) =>
    patch(widget.id, { durationSec: sec, remainingSec: sec, running: false });

  // 2 daqiqagacha qadam 30 soniya — «30 soniya oʻylab koʻring» uchun.
  const stepDown = durationSec <= 120 ? 30 : 60;
  const stepUp = durationSec < 120 ? 30 : 60;

  const views: { value: TimerView; label: string }[] = [
    { value: "digits", label: t("viewDigits") },
    { value: "disk", label: t("viewDisk") },
    { value: "both", label: t("viewBoth") },
  ];

  return (
    <>
      <SettingsSection label={t("time")}>
        <SettingsChoices
          ariaLabel={t("time")}
          value={durationSec}
          options={PRESET_MINUTES.map((m) => ({ value: m * 60, label: t("minutes", { n: m }) }))}
          onChange={setDuration}
        />
        <SettingsStepper
          value={format(durationSec)}
          minusLabel={t("less")}
          plusLabel={t("more")}
          minusDisabled={durationSec <= MIN_SEC}
          plusDisabled={durationSec >= MAX_SEC}
          onMinus={() => setDuration(Math.max(MIN_SEC, durationSec - stepDown))}
          onPlus={() => setDuration(Math.min(MAX_SEC, durationSec + stepUp))}
        />
      </SettingsSection>

      <SettingsSection label={t("view")}>
        <SegmentedToggle
          aria-label={t("view")}
          value={view}
          options={views}
          onValueChange={(v) => patch(widget.id, { view: v })}
        />
      </SettingsSection>

      <SettingsSection label={t("whenDone")}>
        <SettingsSwitch
          label={t("sound")}
          checked={sound}
          onChange={(on) => {
            if (on) unlockDoskaSound();
            patch(widget.id, { sound: on });
          }}
        />
      </SettingsSection>
    </>
  );
}
