"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Pencil, Users, Volume2, VolumeX, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { normalizeAngle, randomIndex, randomUnit, targetRotation } from "@/lib/spin-wheel";
import {
  parseEntries,
  pickedInList,
  readWheelState,
  remainingPool,
  withoutLast,
  WHEEL_MAX_ENTRIES,
  WHEEL_REDUCED_SPEED,
  WHEEL_SPEEDS,
  type WheelAccess,
  type WheelMode,
  type WheelRoster,
  type WheelSpeed,
  type WheelState,
  type WheelStudent,
} from "@/lib/doska/wheel";
import { wheelAccessAction, wheelRosterAction } from "@/server/actions/doska-wheel";
import { SpinWheel, type SpinRequest } from "@/components/stage/SpinWheel";
import { playSpinTick, playSpinWinner, unlockSpinSound } from "@/components/stage/spin-sound";
import { ClassList } from "../ClassList";
import { ProBadge } from "../ProBadge";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   GʻILDIRAK — tasodifiy ism tanlash (docs/doska-gildirak-spec.md).

   Ikki tomon (R300): GʻILDIRAK — sinf koʻradigani; ROʻYXAT — oʻqituvchi
   tahrirlaydigani. Roʻyxat bolalar oldida ochilib turmaydi.

   Qoidalar qisqacha:
     • tasodif kriptografik, gʻolib aylanish BOSHIDA tanlanadi (R289);
     • «Hamma bir martadan» — soʻralgan gʻildirakdan chiqadi; aylanma
       oxiri eʼlon qilinadi, oʻzi yangilanmaydi (R294, R306);
     • «Keyinroq» — bola hovuzga qaytadi, qutulmaydi (R295);
     • gʻildirakda faqat ism (R297), vazn yoʻq (R291).

   KALIT va KOʻRINISH ajratilgan: hovuz, «soʻralganlar», aylanish va gʻolib
   KALITLAR bilan ishlaydi. Qoʻlda yozilgan roʻyxatda kalit = ismning
   oʻzi; ulangan sinfda kalit = oʻquvchi ID si, ism esa faqat
   `labelOf` orqali chiziladi (qisqa ism yangi bola kelganda oʻzgarishi
   mumkin, ID — yoʻq).

   ⚠️ Saqlanadigani (store) — roʻyxat, soʻralganlar, rejim, burchak,
   sozlamalar. Qaysi tomon ochiqligi, gʻolib kartochkasi, aylanish va
   sinfdagi ismlar esa KOMPONENT holati (wheel.ts sarlavhasi).
   ════════════════════════════════════════════════════════════════════ */

type ActiveSpin = SpinRequest & {
  /** Aylanish davomida chiziladigan boʻlaklar (kalitlar) — hovuz shu paytda muzlaydi. */
  entries: string[];
  winner: string;
};

/**
 * Oxirgi aylanish chizgan boʻlaklar — `source` roʻyxati oʻzgarmaguncha
 * gʻildirakda shu holda turadi. `source` — oʻsha paytdagi `entries`
 * (memo qilingan): oʻqituvchi roʻyxatni tahrirlasa yoki til almashsa u
 * boshqa massiv boʻladi va eski boʻlaklar oʻz-oʻzidan tushib qoladi.
 */
type Landed = { source: string[]; keys: string[] };

/** Vidjet kartasi — reyestrdagi `tint: "teal"`. */
const CARD: React.CSSProperties = {
  background: "var(--doska-teal-bg)",
  color: "var(--doska-teal-fg)",
  boxShadow: "0 4px 0 var(--doska-teal-edge)",
};

/** Gʻolib va aylanma oxiri kartochkasi — gʻildirak kabi jismoniy, oq. */
const RESULT_CARD: React.CSSProperties = {
  background: "var(--doska-wheel-rim)",
  color: "var(--doska-wheel-ink)",
  boxShadow: "0 4px 0 var(--doska-wheel-edge)",
};

/** Natija kartochkasidagi matnli tugma — proyektordan oʻqilsin. */
const RESULT_BUTTON: React.CSSProperties = { fontSize: "clamp(0.875rem, 4.2cqw, 1.4rem)" };

const NO_KEYS: string[] = [];

export function WheelWidget({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.wheel");
  const patchWidgetState = useDoskaStore((s) => s.patchWidgetState);
  const state = React.useMemo(() => readWheelState(widget.state), [widget.state]);
  const patch = React.useCallback(
    (next: Partial<WheelState>) => patchWidgetState(widget.id, next),
    [patchWidgetState, widget.id],
  );

  // Hisoblar memo qilinadi: Doskada har store oʻzgarishida (boshqa
  // vidjetni sudrash, matn yozish) hamma vidjet qayta chiziladi, `SpinWheel`
  // esa `memo` — unga har safar yangi massiv berilsa memo foydasiz.
  const samples = React.useMemo(() => t.raw("sampleNames") as string[], [t]);
  const typed = React.useMemo(() => parseEntries(state.text), [state.text]);
  const roster = state.roster;
  const rosterLoad = useRosterStudents(roster?.classId ?? null);
  const students = rosterLoad?.status === "ok" ? rosterLoad.students : null;

  // Manba tartibi: ulangan sinf → qoʻlda yozilgan roʻyxat → namuna ismlar.
  const usingSamples = !roster && typed.length === 0;
  /** Gʻildirakka chiqishi mumkin boʻlganlar (chegaradan oldin). */
  const allKeys = React.useMemo(() => {
    if (roster) {
      if (!students) return NO_KEYS; // yuklanmoqda / yopiq — gʻildirak boʻsh
      const out = new Set(roster.excluded);
      return students.filter((s) => !out.has(s.id)).map((s) => s.id);
    }
    return usingSamples ? samples : typed;
  }, [roster, students, usingSamples, samples, typed]);
  const entries = React.useMemo(() => allKeys.slice(0, WHEEL_MAX_ENTRIES), [allKeys]);
  const overflow = allKeys.length > WHEEL_MAX_ENTRIES;
  const pool = React.useMemo(
    () => (state.mode === "once" ? remainingPool(entries, state.picked) : entries),
    [state.mode, entries, state.picked],
  );

  /** Kalit → koʻrinadigan ism. Qoʻlda yozilgan roʻyxatda kalitning oʻzi. */
  const labels = React.useMemo(
    () => (students ? new Map(students.map((s) => [s.id, s.name])) : null),
    [students],
  );
  const labelOf = React.useCallback((key: string) => labels?.get(key) ?? key, [labels]);

  const [side, setSide] = React.useState<"wheel" | "list">("wheel");
  const [winner, setWinner] = React.useState<string | null>(null);
  const [spin, setSpin] = React.useState<ActiveSpin | null>(null);
  const [landed, setLanded] = React.useState<Landed | null>(null);

  function startSpin() {
    if (spin || pool.length === 0) return;
    if (state.sound) unlockSpinSound();

    const index = randomIndex(pool.length);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { ms, turns } = reduce ? WHEEL_REDUCED_SPEED : WHEEL_SPEEDS[state.speed];

    setWinner(null);
    setSpin({
      id: Date.now(),
      to: targetRotation(state.rotation, index, pool.length, turns, randomUnit()),
      durationMs: ms,
      entries: pool,
      winner: pool[index],
    });
  }

  function finishSpin(id: number) {
    if (!spin || spin.id !== id) return;
    setSpin(null);
    // Gʻolibning boʻlagi keyingi aylanishgacha gʻildirakda QOLADI.
    // «Hamma bir martadan» da u darhol `picked` ga yoziladi; gʻildirak
    // uni shu zahoti olib tashlasa koʻrsatkich boshqa ismga qarab qolardi
    // va sinf «gʻildirak boshqasini koʻrsatdi» deb oʻylardi.
    setLanded({ source: entries, keys: spin.entries });
    setWinner(spin.winner);
    if (state.sound) playSpinWinner();
    patch(
      state.mode === "once"
        ? { rotation: normalizeAngle(spin.to), picked: [...state.picked, spin.winner] }
        : { rotation: normalizeAngle(spin.to) },
    );
  }

  // `SpinWheel` `memo` — unga barqaror callback beriladi, u esa har doim
  // oxirgi `finishSpin` ni chaqiradi.
  const finishRef = React.useRef(finishSpin);
  React.useEffect(() => {
    finishRef.current = finishSpin;
  });
  const onSpinEnd = React.useCallback((id: number) => finishRef.current(id), []);

  const idle = !spin && !winner;
  const shownKeys =
    spin?.entries ??
    (landed?.source === entries ? landed.keys : null) ??
    // Aylanma tugaganda gʻildirak boʻsh qolmasin — hamma ism parda ostida koʻrinadi.
    (pool.length > 0 ? pool : entries);
  const shownLabels = React.useMemo(() => shownKeys.map(labelOf), [shownKeys, labelOf]);

  function newRound() {
    setLanded(null);
    patch({ picked: [] });
  }

  if (side === "list") {
    return (
      <WheelList
        state={state}
        typed={typed}
        entries={entries}
        overflow={overflow}
        usingSamples={usingSamples}
        samples={samples}
        rosterLoad={rosterLoad}
        labelOf={labelOf}
        patch={patch}
        onBack={() => setSide("wheel")}
        onSourceChange={() => setLanded(null)}
      />
    );
  }

  const asked = entries.length - pool.length;
  const roundDone = state.mode === "once" && entries.length > 0 && pool.length === 0;
  const canSpin = idle && pool.length > 0;
  const winnerLabel = winner ? labelOf(winner) : null;

  // Ulangan sinfning ismlari hali kelmagan yoki yopiq — gʻildirak boʻsh,
  // sababini ustidagi yozuv aytadi.
  const rosterHint =
    roster && rosterLoad?.status !== "ok"
      ? rosterLoad?.status === "denied"
        ? t("rosterLocked")
        : rosterLoad?.status === "failed"
          ? t("rosterFailed")
          : t("loading")
      : null;

  return (
    <div className="relative size-full rounded-[var(--radius)] p-[5cqw]" style={CARD}>
      <button
        type="button"
        // Bosish sudrash boʻlmasin (`lib/doska/interaction.ts`). Vidjet
        // kartaning chetidan sudraladi.
        data-doska-no-drag=""
        // Faqat tinch holatda: gʻolib kartochkasi ochiq turganda fokus
        // hali shu tugmada — Space/Enter (yoki taqdimot pulti) gʻildirakni
        // qayta aylantirib, natijani oʻtkazib yuborardi.
        onClick={canSpin ? startSpin : undefined}
        aria-label={t("spin")}
        aria-disabled={!canSpin}
        // Brauzer tarjimasi gʻildirakdagi ismlarni buzmasin (R302).
        translate="no"
        className={cn(
          "focus-visible:ring-ring/50 block size-full rounded-full outline-none focus-visible:ring-4",
          // Ramkadagi `cursor-move` meros boʻlmasin — bu yerda bosish
          // sudrash emas, aylantirish.
          canSpin ? "cursor-pointer" : "cursor-default",
        )}
      >
        <SpinWheel
          className="size-full"
          entries={shownLabels}
          rotation={state.rotation}
          spin={spin}
          onTick={state.sound ? playSpinTick : undefined}
          onSpinEnd={onSpinEnd}
          // Yozuv faqat birinchi aylanishgacha — keyin u ismlarni yopadi.
          hint={rosterHint ?? (idle && state.rotation === 0 ? t("hint") : null)}
        />
      </button>

      {state.mode === "once" && entries.length > 0 && (
        <span
          className="absolute bottom-[2.5cqw] left-[2.5cqw] rounded-full bg-current/10 px-[2.5cqw] py-[0.8cqw] font-mono leading-none font-medium"
          style={{ fontSize: "clamp(0.7rem, 3.4cqw, 1.15rem)" }}
        >
          <span aria-hidden="true">{t("counter", { asked, total: entries.length })}</span>
          <span className="sr-only">{t("counterLabel", { asked, total: entries.length })}</span>
        </span>
      )}

      {/* Ekran oʻquvchi uchun gʻolib — doimiy jonli hudud. Kartochka ichida
          boʻlsa u paydo boʻlish bilan birga oʻqilmasdi: jonli hudud faqat
          OʻZGARISHNI eʼlon qiladi. Gʻildirakning oʻzi `aria-hidden`. */}
      <p className="sr-only" aria-live="polite">
        {winnerLabel ?? ""}
      </p>

      {winner && !spin && (
        <ResultOverlay onDismiss={() => setWinner(null)} closeLabel={t("close")}>
          <p
            translate="no"
            className="line-clamp-2 leading-tight font-semibold break-words"
            style={{ fontSize: "clamp(1.5rem, 12cqw, 5rem)" }}
          >
            {winnerLabel}
          </p>
          <div className="flex flex-wrap justify-center gap-[2cqw]">
            {pool.length > 0 && (
              <WidgetButton tone="primary" onClick={startSpin} className="px-[5cqw] py-[1.8cqw]" style={RESULT_BUTTON}>
                {t("again")}
              </WidgetButton>
            )}
            {state.mode === "once" && (
              <WidgetButton
                onClick={() => {
                  patch({ picked: withoutLast(state.picked, winner) });
                  setWinner(null);
                }}
                className="px-[5cqw] py-[1.8cqw]"
                style={RESULT_BUTTON}
              >
                {t("later")}
              </WidgetButton>
            )}
          </div>
        </ResultOverlay>
      )}

      {roundDone && idle && (
        <ResultOverlay>
          <p className="leading-tight font-semibold" style={{ fontSize: "clamp(1.25rem, 8cqw, 3.5rem)" }}>
            {t("roundDone")}
          </p>
          <p className="opacity-70" style={{ fontSize: "clamp(0.8rem, 3.6cqw, 1.25rem)" }}>
            {t("roundDoneHint", { total: entries.length })}
          </p>
          <WidgetButton tone="primary" onClick={newRound} className="px-[5cqw] py-[1.8cqw]" style={RESULT_BUTTON}>
            {t("newRound")}
          </WidgetButton>
        </ResultOverlay>
      )}

      {/* Boshqaruv pardalardan KEYIN — ularning ustida. Aks holda aylanma
          tugaganda roʻyxat ham, ovoz ham yopilib qolardi va oʻqituvchi
          kechikib kelgan bolani qoʻshish uchun butun aylanmani
          tashlashga majbur boʻlardi. Aylanish paytida va gʻolib
          kartochkasi ochiq turganda yashirinadi: sinf natijaga qarasin. */}
      {!spin && !winner && (
        <div className="absolute top-[2.5cqw] right-[2.5cqw] flex gap-[1.5cqw]">
          <WidgetButton
            shape="round"
            label={state.sound ? t("soundOn") : t("soundOff")}
            onClick={() => patch({ sound: !state.sound })}
          >
            {state.sound ? <Volume2 /> : <VolumeX />}
          </WidgetButton>
          <WidgetButton shape="round" label={t("editList")} onClick={() => setSide("list")}>
            <Pencil />
          </WidgetButton>
        </div>
      )}
    </div>
  );
}

/* ── Sinf roʻyxati: yuklash va kesh ────────────────────────────────────
   Ismlar localStorageʼda SAQLANMAYDI (wheel.ts, `WheelRoster`) — ular
   har sahifa ochilishida serverdan olinadi va shu yerda, xotirada
   turadi. Server har safar tarifni tekshiradi: Pro tugagan yoki
   hisobdan chiqilgan boʻlsa javob `denied` va gʻildirak yopiladi. */

type RosterLoad =
  | { status: "loading" }
  | { status: "ok"; className: string; students: WheelStudent[] }
  | { status: "denied" }
  | { status: "failed" };

/**
 * Sahifa davomida bitta sinf bir marta soʻraladi — ekranlar orasida
 * yurganda gʻildirak qayta ochilsa ham server qayta chaqirilmaydi.
 * Faqat MUVAFFAQIYATLI javob keshlanadi: rad javobi (kirib olgach) va
 * tarmoq xatosi (internet qaytgach) keyingi safar qayta soʻraladi.
 */
const rosterCache = new Map<string, Promise<RosterLoad>>();

function loadRoster(classId: string): Promise<RosterLoad> {
  let request = rosterCache.get(classId);
  if (!request) {
    request = wheelRosterAction({ classId })
      .then((res): RosterLoad => {
        if (!res.ok) return { status: "failed" };
        return res.data.status === "ok"
          ? { status: "ok", className: res.data.className, students: res.data.students }
          : { status: "denied" };
      })
      // Tarmoq uzilsa server amali REJECT qiladi — bu ham oddiy holat.
      .catch((): RosterLoad => ({ status: "failed" }));
    rosterCache.set(classId, request);
    void request.then((r) => {
      if (r.status !== "ok") rosterCache.delete(classId);
    });
  }
  return request;
}

function useRosterStudents(classId: string | null): (RosterLoad & { retry: () => void }) | null {
  const [result, setResult] = React.useState<{ classId: string; load: RosterLoad } | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!classId) return;
    let alive = true;
    void loadRoster(classId).then((load) => {
      if (alive) setResult({ classId, load });
    });
    return () => {
      alive = false;
    };
  }, [classId, attempt]);

  const retry = React.useCallback(() => {
    setResult(null);
    setAttempt((n) => n + 1);
  }, []);

  if (!classId) return null;
  const load: RosterLoad = result?.classId === classId ? result.load : { status: "loading" };
  return { ...load, retry };
}

/**
 * Kirish turi har safar roʻyxat tomoni ochilganda soʻraladi — keshlanmaydi.
 * Keshlansa: mehmon «Kirish» ni bosib kirgach Doskaga qaytganda ham
 * «hisobingizga kiring» koʻrib turardi (sahifa qayta yuklanmaguncha).
 * Bir vaqtda kelgan soʻrovlar bitta tarmoq chaqiruvida birlashadi.
 */
let accessInflight: Promise<WheelAccess> | null = null;

function loadWheelAccess(): Promise<WheelAccess> {
  accessInflight ??= wheelAccessAction()
    .then((res): WheelAccess => (res.ok ? res.data : { access: "guest" }))
    .catch((): WheelAccess => ({ access: "guest" }))
    .then((access) => {
      // Hisobdan chiqilgan — xotiradagi ismlar ham ketsin (umumiy kompyuter).
      if (access.access === "guest") rosterCache.clear();
      return access;
    })
    .finally(() => {
      accessInflight = null;
    });
  return accessInflight;
}

function useWheelAccess(): WheelAccess | null {
  const [access, setAccess] = React.useState<WheelAccess | null>(null);
  React.useEffect(() => {
    let alive = true;
    void loadWheelAccess().then((a) => {
      if (alive) setAccess(a);
    });
    return () => {
      alive = false;
    };
  }, []);
  return access;
}

/* ── Roʻyxat tomoni ────────────────────────────────────────────────────
   Bu ASBOB, sinf uchun kontent emas — shuning uchun Doska panellari
   kabi neytral sirtda va `desk` shkalasida (`doska-bar`), umumiy
   primitivlar bilan (docs/doska-dizayn-tizimi.md §1, §7). Sarlavha
   qatori — sudrash tutqichi; qolgan qismi `data-doska-no-drag`. */

function WheelList({
  state,
  typed,
  entries,
  overflow,
  usingSamples,
  samples,
  rosterLoad,
  labelOf,
  patch,
  onBack,
  onSourceChange,
}: {
  state: WheelState;
  /** Oʻqituvchi yozgan hamma ism — chegaradan oshgani ham. */
  typed: string[];
  /** Gʻildirakka chiqadiganlar (kalitlar). */
  entries: string[];
  /** Roʻyxat gʻildirak chegarasidan uzun — ortigʻi chiqmaydi. */
  overflow: boolean;
  usingSamples: boolean;
  samples: string[];
  rosterLoad: (RosterLoad & { retry: () => void }) | null;
  labelOf: (key: string) => string;
  patch: (next: Partial<WheelState>) => void;
  onBack: () => void;
  /** Roʻyxat yoki `picked` qoʻlda oʻzgardi — gʻildirakdagi oxirgi holat eskirdi. */
  onSourceChange: () => void;
}) {
  const t = useTranslations("Doska.wheel");
  const access = useWheelAccess();

  const modes: { value: WheelMode; label: string }[] = [
    { value: "once", label: t("modeOnce") },
    { value: "repeat", label: t("modeRepeat") },
  ];
  const speeds: { value: WheelSpeed; label: string }[] = [
    { value: "short", label: t("speedShort") },
    { value: "medium", label: t("speedMedium") },
    { value: "long", label: t("speedLong") },
  ];

  const roster = state.roster;
  const asked = state.mode === "once" ? pickedInList(entries, state.picked) : [];
  const count = roster
    ? rosterLoad?.status === "ok"
      ? rosterLoad.students.length
      : 0
    : typed.length;

  const setPicked = (picked: string[]) => {
    onSourceChange();
    patch({ picked });
  };

  const overflowWarning = overflow && (
    <p role="alert" className="text-destructive text-xs leading-snug">
      {t("tooMany", { max: WHEEL_MAX_ENTRIES })}
    </p>
  );

  return (
    // Radius vidjet doirasidan olinadi — `doska-bar` uni ichkarida
    // panel radiusiga almashtiradi, tashqi burchak esa ramka bilan mos
    // qolishi kerak.
    <div
      className="bg-popover text-popover-foreground size-full overflow-hidden rounded-[var(--radius)] border"
      style={{ boxShadow: "0 4px 0 var(--border)" }}
    >
      <div className="doska-bar flex size-full flex-col text-sm">
        <div className="flex items-center gap-2 border-b px-2 py-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-doska-no-drag=""
            aria-label={t("backToWheel")}
            onClick={onBack}
          >
            <ArrowLeft />
          </Button>
          <span className="font-medium">{t("listTitle")}</span>
          {count > 0 && (
            <span className="text-muted-foreground ml-auto pr-2 font-mono text-xs">{count}</span>
          )}
        </div>

        <div data-doska-no-drag="" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="flex flex-col gap-1.5">
            <SegmentedToggle
              variant="pill"
              aria-label={t("mode")}
              value={state.mode}
              options={modes}
              onValueChange={(mode) => patch({ mode })}
            />
            <p className="text-muted-foreground text-xs leading-snug">
              {state.mode === "once" ? t("modeOnceHint") : t("modeRepeatHint")}
            </p>
          </div>

          {roster ? (
            <RosterNames
              roster={roster}
              load={rosterLoad}
              overflowWarning={overflowWarning}
              onToggle={(id) => {
                const out = roster.excluded.includes(id)
                  ? roster.excluded.filter((x) => x !== id)
                  : [...roster.excluded, id];
                onSourceChange();
                patch({ roster: { ...roster, excluded: out } });
              }}
              onDisconnect={() => {
                // Qoʻlda yozilgan roʻyxat (`text`) oʻchirilmagan — u qaytadi.
                onSourceChange();
                patch({ roster: null, picked: [] });
              }}
            />
          ) : (
            <>
              <ConnectClass
                access={access}
                onConnected={(next) => {
                  onSourceChange();
                  patch({ roster: next, picked: [] });
                }}
              />

              <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                <Textarea
                  value={state.text}
                  onChange={(e) => {
                    const text = e.target.value;
                    // Namunadan oʻz roʻyxatiga oʻtish — yangi sinf. Namuna ismlar
                    // bilan soʻralganlar «Soʻralganlar» ichida qolib ketmasin.
                    if (usingSamples && text.trim()) {
                      onSourceChange();
                      patch({ text, picked: [] });
                    } else {
                      patch({ text });
                    }
                  }}
                  placeholder={samples.join("\n")}
                  aria-label={t("listTitle")}
                  // Imlo tekshiruvi har ismni qizil chiziq bilan belgilamasin,
                  // brauzer tarjimasi ismni «tarjima» qilmasin (R302).
                  spellCheck={false}
                  translate="no"
                  rows={6}
                  // Ramkada `select-none` bor — maydon ichida qaytarib yoqiladi,
                  // aks holda oʻqituvchi yozganini belgilay olmaydi.
                  className="min-h-24 flex-1 resize-none select-text"
                />
                {overflowWarning || (
                  <p className="text-muted-foreground text-xs leading-snug">
                    {usingSamples ? t("samplesHint") : t("listHint")}
                  </p>
                )}
                {/* Yumshoq taklif (Doska biznes modeli): ogʻriq his qilingandan
                    KEYIN — beshinchi ism qoʻlda yozilganda. Ishlatish bloklanmaydi. */}
                {typed.length >= 5 && access && access.access !== "pro" && (
                  <p className="text-muted-foreground text-xs leading-snug">{t("suggestConnect")}</p>
                )}
              </div>
            </>
          )}

          {asked.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {t("asked")} <span className="text-muted-foreground font-mono text-xs">{asked.length}</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setPicked([])}
                >
                  {t("resetRound")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5" translate="no">
                {asked.map(({ name: key, index }) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={t("returnToPool", { name: labelOf(key) })}
                    onClick={() => setPicked(state.picked.filter((_, j) => j !== index))}
                    className="bg-muted hover:bg-muted/70 inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-3 text-xs transition-colors"
                  >
                    {labelOf(key)}
                    <X className="size-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Label className="gap-2 font-normal">
              <Switch checked={state.sound} onCheckedChange={(sound) => patch({ sound })} />
              {t("sound")}
            </Label>
            <SegmentedToggle
              variant="pill"
              aria-label={t("speed")}
              value={state.speed}
              options={speeds}
              onValueChange={(speed) => patch({ speed })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sinf roʻyxatini ulash (v1.1, pullik — R296) ──────────────────────
   Pullik band OʻCHIRILMAYDI: yulduzcha bilan turadi, bosilganda taklif
   ochiladi (DoskaMenu naqshi). Ruxsat va tarif serverda tekshiriladi —
   bu yerdagi `access` faqat nimani koʻrsatishni hal qiladi. */

function ConnectClass({
  access,
  onConnected,
}: {
  access: WheelAccess | null;
  onConnected: (roster: WheelRoster) => void;
}) {
  const t = useTranslations("Doska.wheel");
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function connect(classId: string) {
    setBusy(classId);
    setError(null);
    try {
      // `loadRoster` hech qachon reject qilmaydi (tarmoq xatosi — `failed`)
      // va muvaffaqiyatli javobni keshlaydi: vidjet ismlarni shu zahoti oladi.
      const load = await loadRoster(classId);
      if (load.status === "ok") {
        onConnected({ classId, className: load.className, excluded: [] });
      } else {
        // Server matni koʻrsatilmaydi — u faqat oʻzbekcha; oʻrniga tarjima.
        setError(load.status === "denied" ? t("rosterUnavailable") : t("loadFailed"));
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Users />
        {t("connectClass")}
        {/* Faqat kirish turi MAʼLUM boʻlganda: yuklanish paytida Pro
            foydalanuvchiga ham «pullik» yulduzchasi lip etib koʻrinardi. */}
        {access && access.access !== "pro" && <ProBadge />}
      </Button>

      {open && (
        <div className="bg-muted/50 flex flex-col gap-2 rounded-md p-3">
          {access === null && <p className="text-muted-foreground text-xs">{t("loading")}</p>}

          {access?.access === "guest" && (
            <>
              <p className="text-xs leading-snug">{t("connectGuest")}</p>
              <Button asChild size="sm" className="w-fit">
                <Link href="/login">{t("login")}</Link>
              </Button>
            </>
          )}

          {access?.access === "free" && (
            <>
              <p className="text-xs leading-snug">{t("connectFree")}</p>
              <Button asChild size="sm" className="w-fit">
                <Link href="/dashboard/settings?section=tarif">{t("aboutPro")}</Link>
              </Button>
            </>
          )}

          {access?.access === "pro" && (
            <div className="flex flex-col gap-1">
              <ClassList
                title={t("chooseClass")}
                classes={access.classes}
                error={error}
                busyId={busy}
                loadingText={t("loading")}
                emptyText={t("noClasses")}
                onPick={(classId) => void connect(classId)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ulangan sinf: ismlar — tugma. Bosilgan bola bugun yoʻq deb belgilanadi va
 * gʻildirakka chiqmaydi (R296: «bittasini vaqtincha oʻchirib qoʻyish»).
 * Davomatdan avtomatik olish — keyingi bosqich (v2).
 */
function RosterNames({
  roster,
  load,
  overflowWarning,
  onToggle,
  onDisconnect,
}: {
  roster: WheelRoster;
  load: (RosterLoad & { retry: () => void }) | null;
  overflowWarning: React.ReactNode;
  onToggle: (studentId: string) => void;
  onDisconnect: () => void;
}) {
  const t = useTranslations("Doska.wheel");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Users className="text-muted-foreground size-4" />
        <span className="font-medium">{t("fromClass", { className: roster.className })}</span>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onDisconnect}>
          {t("disconnect")}
        </Button>
      </div>

      {(load === null || load.status === "loading") && (
        <p className="text-muted-foreground text-xs">{t("loading")}</p>
      )}

      {load?.status === "denied" && (
        <p role="alert" className="text-xs leading-snug">
          {t("rosterUnavailable")}
        </p>
      )}

      {load?.status === "failed" && (
        <div className="flex items-center gap-2">
          <p role="alert" className="text-destructive text-xs">
            {t("loadFailed")}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={load.retry}>
            {t("retry")}
          </Button>
        </div>
      )}

      {load?.status === "ok" && (
        <>
          <div className="flex flex-wrap gap-1.5" translate="no">
            {load.students.map((s) => {
              const absent = roster.excluded.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={absent}
                  aria-label={t("absentToggle", { name: s.name })}
                  onClick={() => onToggle(s.id)}
                  className={cn(
                    "rounded-full px-3 py-0.5 text-xs transition-colors",
                    absent
                      ? "bg-muted text-muted-foreground line-through"
                      : "bg-primary/10 hover:bg-primary/15",
                  )}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          {overflowWarning || (
            <p className="text-muted-foreground text-xs leading-snug">{t("absentHint")}</p>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Gʻildirak ustidagi natija: parda + oq kartochka. Pardaga bosilsa yopiladi
 * (`onDismiss` berilgan boʻlsa) — oʻqituvchi dars ritmini buzmasin.
 */
function ResultOverlay({
  children,
  onDismiss,
  closeLabel,
}: {
  children: React.ReactNode;
  onDismiss?: () => void;
  closeLabel?: string;
}) {
  return (
    <div
      data-doska-no-drag=""
      onClick={onDismiss}
      className="absolute inset-0 grid place-items-center rounded-[var(--radius)] p-[6cqw]"
      style={{ background: "var(--doska-wheel-scrim)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-in fade-in zoom-in-90 relative flex w-full flex-col items-center gap-[3cqw] rounded-[var(--radius)] px-[6cqw] py-[6cqw] text-center duration-300"
        style={RESULT_CARD}
      >
        {onDismiss && closeLabel && (
          <WidgetButton
            shape="round"
            label={closeLabel}
            onClick={onDismiss}
            className="absolute top-[2cqw] right-[2cqw] size-[clamp(1.75rem,7cqw,2.25rem)]"
          >
            <X />
          </WidgetButton>
        )}
        {children}
      </div>
    </div>
  );
}
