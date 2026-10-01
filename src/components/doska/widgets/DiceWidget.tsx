"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsCards, SettingsSection, SettingsStepper } from "../SettingsFields";
import { Digits } from "./Digits";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   ZAR — tasodifiy son, harf yoki tanga (docs/doska-referens-koriklari.md R416).

   Toʻrt rejim:
     • zar    — 1–3 ta oddiy zar (nuqtalar bilan);
     • son    — oraliqdan tasodifiy son (masalan 1–30: navbat, misol raqami);
     • harf   — OʻZBEK lotin alifbosi, Oʻ, Gʻ, Sh, Ch, Ng bilan
                (boshlangʻich sinf: «shu harfga soʻz toping»);
     • tanga  — gerb / raqam.

   ⚠️ ASOSIY AMAL — «Tashlash» tugmasi, birinchi teginishda ishlaydi,
   vidjetni tanlamaydi (docs/doska-referens-koriklari.md §2.9, qoida 1).
   Natija storeʼda (`values`) — sahifa yangilansa ham qoladi.

   Aylanish animatsiyasi faqat ekranda: ~0,6 s qiymatlar tez almashadi,
   keyin natija storeʼga BIR MARTA yoziladi. Animatsiya paytida tugma
   nofaol — ketma-ket bosish natijani buzmasin.
   ════════════════════════════════════════════════════════════════════ */

export type DiceMode = "dice" | "number" | "letter" | "coin";

/** Oʻzbek lotin alifbosi — 29 harf va birikma (ʻ — U+02BB). */
export const UZ_LETTERS = [
  "A", "B", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
  "Q", "R", "S", "T", "U", "V", "X", "Y", "Z", "Oʻ", "Gʻ", "Sh", "Ch", "Ng",
] as const;

const MAX_DICE = 3;
const NUMBER_MIN = -999;
const NUMBER_MAX = 999;
const ROLL_MS = 600;
const ROLL_STEP_MS = 70;

function readDice(state: DoskaWidget["state"]) {
  const mode: DiceMode =
    state.mode === "number" || state.mode === "letter" || state.mode === "coin" ? state.mode : "dice";
  const count = Math.min(MAX_DICE, Math.max(1, Number(state.count ?? 1) || 1));
  const min = Number.isFinite(Number(state.min)) ? Number(state.min) : 1;
  const max = Number.isFinite(Number(state.max)) ? Number(state.max) : 30;
  const values = Array.isArray(state.values) ? state.values.map(String) : [];
  return { mode, count, min: Math.min(min, max), max: Math.max(min, max), values };
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Bitta tashlash natijasi — rejimga koʻra. */
function rollOnce(mode: DiceMode, count: number, min: number, max: number): string[] {
  switch (mode) {
    case "dice":
      return Array.from({ length: count }, () => String(randomInt(1, 6)));
    case "number":
      return [String(randomInt(min, max))];
    case "letter":
      return [UZ_LETTERS[randomInt(0, UZ_LETTERS.length - 1)]];
    case "coin":
      return [Math.random() < 0.5 ? "heads" : "tails"];
  }
}

export function DiceWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.dice");
  const { mode, count, min, max, values } = readDice(widget.state);
  const [spinning, setSpinning] = React.useState<string[] | null>(null);
  const timer = React.useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  React.useEffect(() => () => clearInterval(timer.current), []);

  const roll = () => {
    if (spinning) return;
    // Qadamlar sanaladi, vaqt emas — natija ROLL_MS dan keyin chiqadi.
    let steps = Math.round(ROLL_MS / ROLL_STEP_MS);
    setSpinning(rollOnce(mode, count, min, max));
    timer.current = setInterval(() => {
      if (--steps <= 0) {
        clearInterval(timer.current);
        setSpinning(null);
        patch(widget.id, { values: rollOnce(mode, count, min, max) });
        return;
      }
      setSpinning(rollOnce(mode, count, min, max));
    }, ROLL_STEP_MS);
  };

  const shown = spinning ?? (values.length ? values : null);
  const label = (v: string) => (mode === "coin" ? t(v === "heads" ? "heads" : "tails") : v);

  return (
    <div className="doska-card flex size-full flex-col items-center justify-center gap-[4cqw] p-[5cqw]" data-card="teal">
      <div
        aria-live="polite"
        aria-label={shown ? shown.map(label).join(", ") : t("empty")}
        className="flex min-h-0 w-full flex-1 items-center justify-center gap-[4cqw]"
      >
        {mode === "dice" ? (
          (shown ?? Array.from({ length: count }, () => "")).map((v, i) => <DieFace key={i} value={Number(v) || 0} />)
        ) : shown ? (
          <Digits
            text={label(shown[0])}
            style={{ fontSize: mode === "coin" ? "clamp(1.25rem, 16cqw, 12rem)" : "clamp(2rem, 34cqw, 24rem)" }}
          />
        ) : (
          <span className="opacity-50" style={{ fontSize: "clamp(1rem, 10cqw, 6rem)" }}>
            ?
          </span>
        )}
      </div>

      <WidgetButton
        tone="primary"
        label={t("roll")}
        disabled={spinning !== null}
        onClick={roll}
        className="min-h-11 px-[6cqw] py-[3cqw] font-semibold"
        style={{ fontSize: "clamp(0.9rem, 6cqw, 2.5rem)" }}
      >
        {t("roll")}
      </WidgetButton>
    </div>
  );
}

/** Zar yuzi — nuqtalar 3×3 toʻrda. `0` — hali tashlanmagan (boʻsh yuz). */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DieFace({ value }: { value: number }) {
  const pips = PIPS[value] ?? [];
  return (
    <span
      aria-hidden="true"
      className="grid aspect-square h-full max-h-[min(100%,30cqw)] grid-cols-3 grid-rows-3 place-items-center rounded-[18%] p-[12%]"
      style={{ background: "var(--card-fg)", color: "var(--card-bg)" }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className="size-[70%] rounded-full" style={{ background: pips.includes(i) ? "currentColor" : "transparent" }} />
      ))}
    </span>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function DiceSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.dice");
  const { mode, count, min, max } = readDice(widget.state);

  // Namunalar — natijaning kichik nusxasi (R435).
  const modes: { value: DiceMode; label: string; preview: React.ReactNode }[] = [
    { value: "dice", label: t("modeDice"), preview: <span className="text-xl leading-none">⚄</span> },
    { value: "number", label: t("modeNumber"), preview: <span className="font-mono text-sm font-semibold">17</span> },
    { value: "letter", label: t("modeLetter"), preview: <span className="text-sm font-semibold">Oʻ</span> },
    { value: "coin", label: t("modeCoin"), preview: <span className="grid size-6 place-items-center rounded-full border-2 border-current text-xs font-semibold">1</span> },
  ];

  // Rejim yoki oraliq oʻzgarsa eski natija oʻchadi — u endi boshqa narsa.
  return (
    <>
      <SettingsSection label={t("mode")}>
        <SettingsCards ariaLabel={t("mode")} value={mode} options={modes} onChange={(v) => patch(widget.id, { mode: v, values: [] })} />
      </SettingsSection>

      {mode === "dice" && (
        <SettingsSection label={t("count")}>
          <SettingsStepper
            value={String(count)}
            minusLabel={t("less")}
            plusLabel={t("more")}
            minusDisabled={count <= 1}
            plusDisabled={count >= MAX_DICE}
            onMinus={() => patch(widget.id, { count: count - 1, values: [] })}
            onPlus={() => patch(widget.id, { count: count + 1, values: [] })}
          />
        </SettingsSection>
      )}

      {mode === "number" && (
        <>
          <SettingsSection label={t("from")}>
            <SettingsStepper
              value={String(min)}
              minusLabel={t("less")}
              plusLabel={t("more")}
              minusDisabled={min <= NUMBER_MIN}
              plusDisabled={min >= max}
              onMinus={() => patch(widget.id, { min: min - 1, values: [] })}
              onPlus={() => patch(widget.id, { min: min + 1, values: [] })}
            />
          </SettingsSection>
          <SettingsSection label={t("to")}>
            <SettingsStepper
              value={String(max)}
              minusLabel={t("less")}
              plusLabel={t("more")}
              minusDisabled={max <= min}
              plusDisabled={max >= NUMBER_MAX}
              onMinus={() => patch(widget.id, { max: max - 1, values: [] })}
              onPlus={() => patch(widget.id, { max: max + 1, values: [] })}
            />
          </SettingsSection>
        </>
      )}
    </>
  );
}
