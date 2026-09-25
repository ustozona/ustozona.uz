"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Pencil, Volume2, VolumeX, X } from "lucide-react";

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
  type WheelMode,
  type WheelSpeed,
  type WheelState,
} from "@/lib/doska/wheel";
import { SpinWheel, type SpinRequest } from "@/components/stage/SpinWheel";
import { playSpinTick, playSpinWinner, unlockSpinSound } from "@/components/stage/spin-sound";
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

   ⚠️ Saqlanadigani (store) — roʻyxat, soʻralganlar, rejim, burchak,
   sozlamalar. Qaysi tomon ochiqligi, gʻolib kartochkasi va aylanish esa
   KOMPONENT holati: ular faqat shu dars paytiga tegishli (wheel.ts
   sarlavhasi). Sahifa aylanish oʻrtasida yangilansa gʻolib yoʻqoladi —
   bu toʻgʻri: natija faqat gʻildirak toʻxtaganda yoziladi.
   ════════════════════════════════════════════════════════════════════ */

type ActiveSpin = SpinRequest & {
  /** Aylanish davomida chiziladigan boʻlaklar — hovuz shu paytda muzlaydi. */
  entries: string[];
  winner: string;
};

/**
 * Oxirgi aylanish chizgan boʻlaklar — `source` roʻyxati oʻzgarmaguncha
 * gʻildirakda shu holda turadi. `source` — oʻsha paytdagi `entries`
 * (memo qilingan): oʻqituvchi roʻyxatni tahrirlasa yoki til almashsa u
 * boshqa massiv boʻladi va eski boʻlaklar oʻz-oʻzidan tushib qoladi.
 */
type Landed = { source: string[]; names: string[] };

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
  const usingSamples = typed.length === 0;
  const entries = React.useMemo(
    () => (usingSamples ? samples : typed.slice(0, WHEEL_MAX_ENTRIES)),
    [usingSamples, samples, typed],
  );
  const pool = React.useMemo(
    () => (state.mode === "once" ? remainingPool(entries, state.picked) : entries),
    [state.mode, entries, state.picked],
  );

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
    setLanded({ source: entries, names: spin.entries });
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
        usingSamples={usingSamples}
        samples={samples}
        patch={patch}
        onBack={() => setSide("wheel")}
        onPickedChange={() => setLanded(null)}
      />
    );
  }

  const asked = entries.length - pool.length;
  const roundDone = state.mode === "once" && entries.length > 0 && pool.length === 0;
  const idle = !spin && !winner;
  const canSpin = idle && pool.length > 0;
  const shown =
    spin?.entries ??
    (landed?.source === entries ? landed.names : null) ??
    // Aylanma tugaganda gʻildirak boʻsh qolmasin — hamma ism parda ostida koʻrinadi.
    (pool.length > 0 ? pool : entries);

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
          entries={shown}
          rotation={state.rotation}
          spin={spin}
          onTick={state.sound ? playSpinTick : undefined}
          onSpinEnd={onSpinEnd}
          // Yozuv faqat birinchi aylanishgacha — keyin u ismlarni yopadi.
          hint={idle && state.rotation === 0 ? t("hint") : null}
        />
      </button>

      {state.mode === "once" && (
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
        {winner ?? ""}
      </p>

      {winner && !spin && (
        <ResultOverlay onDismiss={() => setWinner(null)} closeLabel={t("close")}>
          <p
            translate="no"
            className="line-clamp-2 leading-tight font-semibold break-words"
            style={{ fontSize: "clamp(1.5rem, 12cqw, 5rem)" }}
          >
            {winner}
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

/* ── Roʻyxat tomoni ────────────────────────────────────────────────────
   Bu ASBOB, sinf uchun kontent emas — shuning uchun Doska panellari
   kabi neytral sirtda va `desk` shkalasida (`doska-bar`), umumiy
   primitivlar bilan (docs/doska-dizayn-tizimi.md §1, §7). Sarlavha
   qatori — sudrash tutqichi; qolgan qismi `data-doska-no-drag`. */

function WheelList({
  state,
  typed,
  entries,
  usingSamples,
  samples,
  patch,
  onBack,
  onPickedChange,
}: {
  state: WheelState;
  /** Oʻqituvchi yozgan hamma ism — chegaradan oshgani ham. */
  typed: string[];
  /** Gʻildirakka chiqadiganlari. */
  entries: string[];
  usingSamples: boolean;
  samples: string[];
  patch: (next: Partial<WheelState>) => void;
  onBack: () => void;
  /** `picked` qoʻlda oʻzgardi — gʻildirakdagi oxirgi holat eskirdi. */
  onPickedChange: () => void;
}) {
  const t = useTranslations("Doska.wheel");

  const modes: { value: WheelMode; label: string }[] = [
    { value: "once", label: t("modeOnce") },
    { value: "repeat", label: t("modeRepeat") },
  ];
  const speeds: { value: WheelSpeed; label: string }[] = [
    { value: "short", label: t("speedShort") },
    { value: "medium", label: t("speedMedium") },
    { value: "long", label: t("speedLong") },
  ];

  const asked = state.mode === "once" ? pickedInList(entries, state.picked) : [];
  const overflow = typed.length > WHEEL_MAX_ENTRIES;

  const setPicked = (picked: string[]) => {
    onPickedChange();
    patch({ picked });
  };

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
          {typed.length > 0 && (
            <span className="text-muted-foreground ml-auto pr-2 font-mono text-xs">{typed.length}</span>
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

          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <Textarea
              value={state.text}
              onChange={(e) => {
                const text = e.target.value;
                // Namunadan oʻz roʻyxatiga oʻtish — yangi sinf. Namuna ismlar
                // bilan soʻralganlar «Soʻralganlar» ichida qolib ketmasin.
                if (usingSamples && text.trim()) {
                  onPickedChange();
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
            {overflow ? (
              <p role="alert" className="text-destructive text-xs leading-snug">
                {t("tooMany", { max: WHEEL_MAX_ENTRIES })}
              </p>
            ) : (
              <p className="text-muted-foreground text-xs leading-snug">
                {usingSamples ? t("samplesHint") : t("listHint")}
              </p>
            )}
          </div>

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
                {asked.map(({ name, index }) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={t("returnToPool", { name })}
                    onClick={() => setPicked(state.picked.filter((_, j) => j !== index))}
                    className="bg-muted hover:bg-muted/70 inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-3 text-xs transition-colors"
                  >
                    {name}
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
