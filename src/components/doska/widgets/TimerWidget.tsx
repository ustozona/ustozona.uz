"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useDoskaStore, useIsSelected } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { IconPause, IconPlay, IconRestart } from "../icons";
import { SettingsCards, SettingsChoices, SettingsSection, SettingsStepper, SettingsSwitch } from "../SettingsFields";
import { playTimerEnd, unlockDoskaSound } from "../sounds";
import { Digits } from "./Digits";
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

   Holat storeʼda (`durationSec`, `remainingSec`, `running`, `endsAt`,
   `view`, `sound`), shuning uchun sahifa yangilansa ham taymer joyida
   qoladi. `view` va `sound` 2-bosqichda qoʻshildi — eski taymerlarda
   yoʻq, shuning uchun ular standart qiymat bilan oʻqiladi.

   ⚠️ ISHLAB TURGAN taymer storeʼga har soniya YOZMAYDI. U tugash
   vaqtini (`endsAt`, epoch ms) bir marta yozadi, qolgan soniyalar esa
   shu vidjetning oʻz holatida sanaladi. Avval har soniya
   `remainingSec` yozilardi — va har yozuv butun ekranni yangilab,
   butun deckni diskka yozishga navbat qoʻyardi: sensorli doskaning
   kuchsiz protsessorida taymer yonida yozilgan siyoh har soniya
   tutilib qolardi. `remainingSec` endi faqat TOʻXTAGAN taymerning
   qolgan vaqti.

   QOʻSHIMCHA (docs/doska-referens-koriklari.md R405):
   • Takrorlash (`repeat`, 0–9) — stansiyalar boʻyicha aylanish: tugagach
     taymer oʻzi qayta boshlanadi, har aylanishda ovoz chalinadi, pastda
     «2 / 4» koʻrinadi. Qayta yuklashda tugagan taymer aylanishni davom
     ettirmaydi — jim tugaydi (yuqoridagi qoida).
   • Oxirgi soniyalar (`warn`, standart yoqiq) — qolgan vaqt 10% dan yoki
     10 soniyadan kam boʻlsa disk va ramka «tugadi» rangiga oʻtadi.
   • Brauzer yorligʻida qolgan vaqt (`tabTitle`, standart yoqiq) —
     oʻqituvchi boshqa varaqqa oʻtsa ham vaqtni koʻradi.

   Tugash vaqtiga tayanilgani uchun taymer sahifa yangilanganda ham,
   boshqa ekran ochiq turganda ham real vaqtda sanaydi. Tugash ovozi
   esa faqat taymer koʻz oldida tugasa chalinadi: qaytib kelganda
   allaqachon tugagan taymer jim «Vaqt tugadi» holatida turadi.
   ════════════════════════════════════════════════════════════════════ */

export type TimerView = "auto" | "digits" | "disk" | "both";

/** Tayyor variantlar (daqiqa). Darsdagi eng koʻp ishlatiladigan oraliqlar. */
const PRESET_MINUTES = [1, 3, 5, 10, 15];
/** Eng qisqa taymer (soniya) — «30 soniya oʻylab koʻring». */
const MIN_SEC = 30;
/** Eng uzun taymer (soniya) — 99:00, raqam ikki xonada qoladi. */
const MAX_SEC = 99 * 60;
/** Eng koʻp takrorlash. */
const MAX_REPEAT = 9;
/** Ogohlantirish oynasi: davomiylikning shu ulushi, lekin kamida 10 soniya. */
const WARN_SHARE = 0.1;
const WARN_MIN_SEC = 10;

/**
 * «Avto» (R433): koʻrinish vidjet shaklidan. Keng yoki tor vidjetda disk
 * raqamni siqib qoʻyadi — faqat raqam; qolganida ikkalasi.
 */
function autoView(widget: DoskaWidget): "digits" | "both" {
  return widget.w / widget.h >= 1.9 || widget.w < 300 ? "digits" : "both";
}

function readTimer(state: DoskaWidget["state"]) {
  const durationSec = Number(state.durationSec ?? 300);
  const view: TimerView =
    state.view === "digits" || state.view === "disk" || state.view === "auto" ? state.view : "both";
  return {
    durationSec,
    remainingSec: Number(state.remainingSec ?? durationSec),
    running: state.running === true,
    /** Ishlab turgan taymerning tugash vaqti (epoch ms); eski yozuvlarda yoʻq. */
    endsAt: typeof state.endsAt === "number" ? state.endsAt : null,
    view,
    sound: state.sound !== false,
    /** Necha marta qayta boshlanadi (0 — yoʻq). */
    repeat: Math.min(MAX_REPEAT, Math.max(0, Number(state.repeat ?? 0) || 0)),
    /** Shu paytgacha tugagan aylanishlar. */
    round: Math.max(0, Number(state.round ?? 0) || 0),
    warn: state.warn !== false,
    tabTitle: state.tabTitle !== false,
  };
}

/** Tugash vaqtigacha qolgan butun soniyalar — «00:01» oxirgi soniya davomida turadi. */
function secondsUntil(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

function format(sec: number): string {
  const s = Math.max(0, sec);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Rejim: orqaga sanash yoki SEKUNDOMER (docs/doska-referens-koriklari.md
 * R407 — «bitta primitiv»: alohida vidjet emas, taymerning rejimi).
 */
export function TimerWidget({ widget }: { widget: DoskaWidget }) {
  return widget.state.mode === "stopwatch" ? <StopwatchView widget={widget} /> : <CountdownView widget={widget} />;
}

function CountdownView({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const selected = useIsSelected(widget.id);
  const t = useTranslations("Doska.timer");
  const { durationSec, remainingSec: storedSec, running, endsAt, view, sound, repeat, round, warn, tabTitle } =
    readTimer(widget.state);
  const [now, setNow] = React.useState(() => Date.now());
  const remainingSec = running && endsAt !== null ? secondsUntil(endsAt, now) : storedSec;
  const finished = remainingSec <= 0;
  const fresh = !running && remainingSec === durationSec;
  const warnSec = Math.max(WARN_MIN_SEC, Math.ceil(durationSec * WARN_SHARE));
  const warning = warn && running && !finished && durationSec > warnSec && remainingSec <= warnSec;

  // `useLayoutEffect` — boshlanish yoki «+1» dan keyingi birinchi kadr
  // eski `now` bilan chizilmasin: soat boʻyalishdan OLDIN yangilanadi.
  React.useLayoutEffect(() => {
    if (!running) return;
    if (endsAt === null) {
      // Eski yozuv: har soniya `remainingSec` yozadigan taymerdan qolgan.
      patch(widget.id, { endsAt: Date.now() + storedSec * 1000 });
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = (watching: boolean) => {
      const at = Date.now();
      if (at >= endsAt) {
        // Navbatdagi aylanish — faqat koʻz oldida tugaganda (qayta
        // yuklashda tugagan taymer jim tugaydi, aylanish davom etmaydi).
        if (watching && round < repeat) {
          patch(widget.id, { round: round + 1, endsAt: at + durationSec * 1000 });
          if (sound) playTimerEnd();
          return;
        }
        patch(widget.id, { running: false, remainingSec: 0, endsAt: null });
        // Birinchi tekshiruvda tugagan boʻlsa — taymer koʻz oldida emas,
        // qayta yuklash yoki boshqa ekranda tugagan: jim.
        if (sound && watching) playTimerEnd();
        return;
      }
      setNow(at);
      // Keyingi soniya chegarasidan sal keyin — raqam aynan shunda almashadi.
      timer = setTimeout(() => tick(true), ((endsAt - at) % 1000 || 1000) + 5);
    };
    tick(false);
    return () => clearTimeout(timer);
  }, [running, endsAt, sound, storedSec, widget.id, patch, round, repeat, durationSec]);

  useTabTitle(tabTitle && running, format(remainingSec));

  /** Asosiy tugma: tugagan — qaytadan tayyor; aks holda boshlash/toʻxtatish. */
  const onPrimary = () => {
    if (finished) {
      patch(widget.id, { remainingSec: durationSec, running: false, endsAt: null, round: 0 });
      return;
    }
    if (running) {
      // Toʻxtatilgan paytdagi qolgan vaqt saqlanadi; ekrandagi `now`
      // soniyaning boshida qolgan boʻlishi mumkin — shu sabab hozirgi vaqt.
      const left = endsAt !== null ? secondsUntil(endsAt, Date.now()) : storedSec;
      patch(widget.id, { running: false, remainingSec: left, endsAt: null });
      return;
    }
    // Tovush konteksti foydalanuvchi harakatida ochiladi — tugash ovozi
    // keyin harakatsiz chalinadi (sounds.ts).
    if (sound) unlockDoskaSound();
    patch(widget.id, { running: true, endsAt: Date.now() + remainingSec * 1000 });
  };

  const fraction = durationSec > 0 ? Math.min(1, Math.max(0, remainingSec) / durationSec) : 0;
  const shown = view === "auto" ? autoView(widget) : view;
  const showDisk = shown !== "digits";
  const showDigits = shown !== "disk";

  const primaryLabel = finished ? t("reset") : running ? t("pause") : t("start");

  return (
    // Tugaganda karta «done» tusiga oʻtadi (qizil + oq matn) — lekin
    // yolgʻiz rang emas, pastda «Vaqt tugadi» soʻzi ham chiqadi (R326).
    <div
      className="doska-card relative size-full"
      data-card={finished ? "done" : "amber"}
      data-warn={warning ? "" : undefined}
    >
      <div className="flex size-full flex-col items-center justify-center gap-[2.5cqw] p-[4cqw]">
        <span
          role="timer"
          aria-label={format(remainingSec)}
          className="flex min-h-0 w-full flex-1 items-center justify-center gap-[5cqw]"
        >
          {showDisk && <TimerDisk fraction={fraction} large={!showDigits} />}
          {showDigits && (
            <Digits
              text={format(remainingSec)}
              style={{ fontSize: showDisk ? "clamp(1.5rem, 15cqw, 30rem)" : "clamp(2rem, 24cqw, 30rem)" }}
            />
          )}
        </span>

        <span className="flex items-center gap-[3cqw]">
          {repeat > 0 && !finished && (
            <span className="tabular-nums opacity-70" style={{ fontSize: "clamp(0.75rem, 5cqw, 2.5rem)" }}>
              {t("round", { n: Math.min(round + 1, repeat + 1), total: repeat + 1 })}
            </span>
          )}
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
              onClick={() => patch(widget.id, { remainingSec: durationSec, running: false, endsAt: null, round: 0 })}
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
              // Ishlab turgan taymerda tugash vaqti suriladi — sanash uzilmaydi.
              patch(
                widget.id,
                running && endsAt !== null
                  ? { durationSec: durationSec + add, endsAt: endsAt + add * 1000 }
                  : { durationSec: durationSec + add, remainingSec: Math.max(0, remainingSec) + add },
              );
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
 * Ishlab turgan taymerning qolgan vaqti brauzer yorligʻida («04:32 — …»).
 * Asl sarlavha taymer toʻxtaganda yoki vidjet olib tashlanganda tiklanadi.
 */
function useTabTitle(active: boolean, text: string) {
  const base = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!active) return;
    base.current ??= document.title;
    document.title = `${text} — ${base.current}`;
  }, [active, text]);
  React.useEffect(() => {
    if (!active) return;
    return () => {
      if (base.current !== null) document.title = base.current;
      base.current = null;
    };
  }, [active]);
}

/**
 * Disk — qolgan vaqt sektori, soat mili yoʻnalishida kamayadi.
 * Rang kartaning urgʻu rangidan (`--card-accent`): Sokinda oq, Oʻyinchoqda
 * siyoh, Doskada magnit tusi. Tugagan holat ham avtomatik ishlaydi.
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
        <circle cx="50" cy="50" r={r} fill="var(--card-accent, currentColor)" />
      ) : fraction > 0 ? (
        <path d={`M50 50 L50 ${50 - r} A${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`} fill="var(--card-accent, currentColor)" />
      ) : null}
    </svg>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function TimerSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.timer");
  const { durationSec, view, sound, repeat, warn, tabTitle } = readTimer(widget.state);

  /** Vaqt tanlansa taymer toʻxtaydi va toʻliq vaqtga qaytadi. */
  const setDuration = (sec: number) =>
    patch(widget.id, { durationSec: sec, remainingSec: sec, running: false, endsAt: null, round: 0 });

  // 2 daqiqagacha qadam 30 soniya — «30 soniya oʻylab koʻring» uchun.
  const stepDown = durationSec <= 120 ? 30 : 60;
  const stepUp = durationSec < 120 ? 30 : 60;

  // Namunalar — haqiqiy koʻrinishning kichik nusxasi (R435).
  const ring = <svg viewBox="0 0 20 20" className="size-6"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" /><path d="M10 2a8 8 0 0 1 8 8" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
  const digits = <span className="font-mono text-xs font-semibold tabular-nums">05:00</span>;
  const views: { value: TimerView; label: string; preview: React.ReactNode }[] = [
    { value: "auto", label: t("viewAuto"), preview: <span className="text-sm font-semibold">A</span> },
    { value: "digits", label: t("viewDigits"), preview: digits },
    { value: "disk", label: t("viewDisk"), preview: ring },
    { value: "both", label: t("viewBoth"), preview: <span className="flex items-center gap-1">{ring}{digits}</span> },
  ];

  const stopwatch = widget.state.mode === "stopwatch";
  const modeToggle = (
    <SettingsSection label={t("mode")}>
      <SegmentedToggle
        aria-label={t("mode")}
        value={stopwatch ? "stopwatch" : "countdown"}
        options={[
          { value: "countdown", label: t("modeCountdown") },
          { value: "stopwatch", label: t("modeStopwatch") },
        ]}
        // Rejim almashsa ikkalasi ham toʻxtaydi — ishlab turgan sanoq
        // koʻrinmay qolib, fonda ovoz chalmasin.
        onValueChange={(mode) =>
          patch(widget.id, {
            mode,
            running: false,
            endsAt: null,
            remainingSec: durationSec,
            round: 0,
            swStartedAt: null,
            swElapsedMs: 0,
            laps: [],
          })
        }
      />
    </SettingsSection>
  );

  if (stopwatch) return modeToggle;

  return (
    <>
      {modeToggle}
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
        <SettingsCards ariaLabel={t("view")} value={view} options={views} onChange={(v) => patch(widget.id, { view: v })} />
      </SettingsSection>

      <SettingsSection label={t("repeat")}>
        <SettingsStepper
          value={repeat === 0 ? t("repeatNone") : t("repeatTimes", { n: repeat })}
          minusLabel={t("less")}
          plusLabel={t("more")}
          minusDisabled={repeat <= 0}
          plusDisabled={repeat >= MAX_REPEAT}
          onMinus={() => patch(widget.id, { repeat: repeat - 1, round: 0 })}
          onPlus={() => patch(widget.id, { repeat: repeat + 1, round: 0 })}
        />
      </SettingsSection>

      <SettingsSection label={t("whenDone")}>
        <SettingsSwitch label={t("warn")} checked={warn} onChange={(on) => patch(widget.id, { warn: on })} />
        <SettingsSwitch label={t("tabTitle")} checked={tabTitle} onChange={(on) => patch(widget.id, { tabTitle: on })} />
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

/* ── Sekundomer ───────────────────────────────────────────────────────
   Taymer kabi storeʼga har soniya YOZMAYDI: boshlangan payt
   (`swStartedAt`) va toʻxtaganda yigʻilgan vaqt (`swElapsedMs`) yoziladi,
   koʻrinadigan vaqt shu ikkisidan hisoblanadi. Oraliqlar (`laps`) —
   «birinchi guruh tugatdi» kabi belgilar, eng koʻpi bilan 5 tasi. */

const MAX_LAPS = 5;

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function StopwatchView({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.timer");
  const startedAt = typeof widget.state.swStartedAt === "number" ? widget.state.swStartedAt : null;
  const elapsed = Math.max(0, Number(widget.state.swElapsedMs) || 0);
  const laps = Array.isArray(widget.state.laps) ? widget.state.laps.map(Number).filter(Number.isFinite) : [];
  const running = startedAt !== null;
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const shown = running ? elapsed + Math.max(0, now - startedAt) : elapsed;

  const toggle = () => {
    const at = Date.now();
    setNow(at);
    if (running) patch(widget.id, { swStartedAt: null, swElapsedMs: elapsed + (at - startedAt) });
    else patch(widget.id, { swStartedAt: at });
  };

  return (
    <div className="doska-card flex size-full flex-col items-center justify-center gap-[3cqw] p-[4cqw]" data-card="amber">
      <Digits text={formatMs(shown)} style={{ fontSize: "clamp(1.75rem, 20cqw, 12rem)" }} />

      {laps.length > 0 && (
        <ol className="flex flex-wrap justify-center gap-x-[3cqw] font-mono opacity-80" style={{ fontSize: "clamp(0.7rem, 3.5cqw, 1.25rem)" }}>
          {laps.map((ms, i) => (
            <li key={i}>
              {i + 1}. {formatMs(ms)}
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-[2cqw]" style={{ fontSize: "clamp(0.8rem, 4cqw, 1.5rem)" }}>
        <WidgetButton tone="primary" shape="round" label={running ? t("pause") : t("start")} onClick={toggle}>
          {running ? <IconPause /> : <IconPlay />}
        </WidgetButton>
        {running && laps.length < MAX_LAPS && (
          <WidgetButton onClick={() => patch(widget.id, { laps: [...laps, shown] })} className="px-[4cqw] py-[1.5cqw]">
            {t("lap")}
          </WidgetButton>
        )}
        {!running && shown > 0 && (
          <WidgetButton
            shape="round"
            label={t("reset")}
            onClick={() => patch(widget.id, { swStartedAt: null, swElapsedMs: 0, laps: [] })}
          >
            <IconRestart />
          </WidgetButton>
        )}
      </div>
    </div>
  );
}
