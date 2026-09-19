"use client";

import * as React from "react";
import { Check, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   SAHNA BOʻLAKLARI — viktorina va taqdimotning oʻquvchiga koʻrinadigan
   qismi uchun yagona toʻplam: javob plitkasi, natija lentasi, segmentli
   progress, taymer. Muharrir, oʻquvchi ekrani (/play) va Doska shu
   yerdan oladi — uch joyda uch xil «toʻgʻri javob» chiqmasligi uchun.

   Uslub `src/styles/quiz-stage.css` dagi `.stage-*` klasslarida; bu
   yerda faqat tuzilma va holat (`data-state`).
   ════════════════════════════════════════════════════════════════════ */

/** Slot soni — 6 dan ortiq variantda rang va shakl takrorlanadi. */
export const STAGE_CHOICE_COUNT = 6;

const SHAPE_LABELS = ["uchburchak", "romb", "doira", "kvadrat", "beshburchak", "yulduz"] as const;

/** Variant raqami boʻyicha rang oʻzgaruvchilari (`--choice`). */
export function choiceVars(index: number): React.CSSProperties {
  const slot = (index % STAGE_CHOICE_COUNT) + 1;
  return { "--choice": `var(--stage-choice-${slot})` } as React.CSSProperties;
}

/** Rangni ajrata olmaydigan koʻz uchun shakl — har slotda boshqa siluet. */
export function ChoiceShape({ index, className }: { index: number; className?: string }) {
  const slot = index % STAGE_CHOICE_COUNT;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      {slot === 0 && <path d="M12 3 22 20H2z" />}
      {slot === 1 && <path d="M12 2 22 12 12 22 2 12z" />}
      {slot === 2 && <circle cx="12" cy="12" r="9.5" />}
      {slot === 3 && <rect x="3.5" y="3.5" width="17" height="17" rx="1.5" />}
      {slot === 4 && <path d="M12 2.5 21.5 9.4 17.9 20.5H6.1L2.5 9.4z" />}
      {slot === 5 && (
        <path d="m12 2.5 2.8 6.1 6.7.7-5 4.5 1.4 6.6L12 17l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z" />
      )}
    </svg>
  );
}

export function choiceShapeLabel(index: number): string {
  return SHAPE_LABELS[index % STAGE_CHOICE_COUNT];
}

/**
 * Plitka holati:
 * - `idle` — oddiy;
 * - `selected` / `dim` — oʻquvchi tanladi / boshqasini tanladi (yuborilmagan);
 * - `correct` — toʻgʻri javob (yashil, ✓);
 * - `wrong` — oʻquvchi tanlagan xato javob (qizil, ✗);
 * - `ghost` — ochilgandan keyin qolgan variantlar (xira).
 */
export type ChoiceState = "idle" | "selected" | "dim" | "correct" | "wrong" | "ghost";

export function ChoiceTile({
  index,
  state = "idle",
  onClick,
  disabled,
  count,
  share,
  points,
  className,
  children,
}: {
  index: number;
  state?: ChoiceState;
  onClick?: () => void;
  disabled?: boolean;
  /** Jonli natija: nechta oʻquvchi tanladi. */
  count?: number;
  /** Jonli natija ustuni (0..1). */
  share?: number;
  /** Toʻgʻri javob uchun olingan ball («+100»). */
  points?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const badge = state === "correct" ? "correct" : state === "wrong" ? "wrong" : null;
  const inner = (
    <>
      {share !== undefined && (
        <span aria-hidden className="stage-choice-bar" style={{ width: `${Math.round(share * 100)}%` }} />
      )}
      <ChoiceShape index={index} className="stage-choice-shape relative" />
      {points ? <span className="stage-choice-points relative">+{points}</span> : null}
      <span className="stage-choice-text relative">{children}</span>
      {/* Raqam — kompyuterda 1–6 tugmasi shu variantni tanlaydi. */}
      <span aria-hidden className="stage-choice-key">
        {index + 1}
      </span>
      {count !== undefined && <span className="stage-choice-count relative">{count}</span>}
      {badge && (
        <span className="stage-choice-badge" data-kind={badge} aria-label={badge === "correct" ? "Toʻgʻri" : "Notoʻgʻri"}>
          {badge === "correct" ? (
            <Check className="size-[0.95em]" strokeWidth={3.5} />
          ) : (
            <X className="size-[0.95em]" strokeWidth={3.5} />
          )}
        </span>
      )}
    </>
  );
  const common = {
    className: cn("stage-choice", className),
    "data-state": state,
    style: choiceVars(index),
  };
  if (!onClick) return <div {...common}>{inner}</div>;
  return (
    <button
      type="button"
      {...common}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === "selected"}
      aria-label={`${choiceShapeLabel(index)}: ${typeof children === "string" ? children : ""}`}
    >
      {inner}
    </button>
  );
}

/** Javob plitkalari toʻri. Joylashuv sahna uslubiga qarab CSS da
    (`.stage-choices`); `--row` — keng ekranda bir qatordagi plitka soni. */
export function ChoiceGrid({
  count,
  className,
  children,
}: {
  count: number;
  className?: string;
  children: React.ReactNode;
}) {
  const row = count <= 4 ? Math.max(count, 1) : 3;
  return (
    <div className={cn("stage-choices", className)} style={{ "--row": row } as React.CSSProperties}>
      {children}
    </div>
  );
}

/** Savol raqami pillasi — zamonaviy uslubda savol kartasi ustida. */
export function StageCounter({ current, total }: { current: number; total: number }) {
  return (
    <span className="stage-counter">
      {current + 1} / {total}
    </span>
  );
}

export type BannerKind = "correct" | "wrong" | "timeout" | "info";

/** Natija lentasi — karta ustidan qiya oʻtadi (telefonda `inline`). */
export function ResultBanner({
  kind,
  inline,
  children,
}: {
  kind: BannerKind;
  inline?: boolean;
  children: React.ReactNode;
}) {
  const Icon = kind === "correct" ? Check : kind === "wrong" ? X : kind === "timeout" ? Clock : null;
  return (
    <div role="status" className={cn("stage-banner", inline && "is-inline")} data-kind={kind}>
      {Icon && (
        <span className="stage-banner-icon">
          <Icon className="size-[0.8em]" strokeWidth={3} />
        </span>
      )}
      <span>{children}</span>
    </div>
  );
}

/** Segmentli progress; 40 tadan koʻp qadamda bitta uzluksiz chiziq. */
export function StageProgress({ total, current, className }: { total: number; current: number; className?: string }) {
  if (total <= 0) return null;
  const label = `${current + 1} / ${total}`;
  if (total > 40) {
    return (
      <div className={cn("stage-timer-track", className)} role="progressbar" aria-label={label}>
        <div className="stage-timer-fill" style={{ transform: `scaleX(${(current + 1) / total})` }} />
      </div>
    );
  }
  return (
    <div className={cn("stage-progress", className)} role="progressbar" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} data-done={i <= current} />
      ))}
    </div>
  );
}

/**
 * Teskari sanoq. `runKey` oʻzgarsa (yangi savol) — boshidan boshlanadi;
 * `active` false boʻlsa (javob ochildi) — toʻxtaydi. Nolga yetganda
 * `onEnd` bir marta chaqiriladi.
 */
export function useCountdown(
  seconds: number | undefined,
  runKey: string,
  active: boolean,
  onEnd?: () => void,
): number {
  const [state, setState] = React.useState({ key: runKey, left: seconds ?? 0 });
  if (state.key !== runKey) setState({ key: runKey, left: seconds ?? 0 });

  const onEndRef = React.useRef(onEnd);
  React.useEffect(() => {
    onEndRef.current = onEnd;
  });

  React.useEffect(() => {
    if (!active || !seconds) return;
    const deadline = Date.now() + seconds * 1000;
    const timer = setInterval(() => {
      const left = Math.max(0, (deadline - Date.now()) / 1000);
      setState({ key: runKey, left });
      if (left <= 0) {
        clearInterval(timer);
        onEndRef.current?.();
      }
    }, 200);
    return () => clearInterval(timer);
  }, [active, seconds, runKey]);

  return state.key === runKey ? state.left : (seconds ?? 0);
}

/** Taymer chizigʻi — oxirida qolgan soniya; 5 s qolganda qizaradi. */
export function StageTimer({ seconds, left, className }: { seconds: number; left: number; className?: string }) {
  const ratio = seconds > 0 ? Math.max(0, Math.min(1, left / seconds)) : 0;
  return (
    <div className={cn("stage-timer", className)} data-low={left > 0 && left <= 5}>
      <div className="stage-timer-track">
        <div className="stage-timer-fill" style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <span className="stage-timer-num" aria-live="off">
        {Math.ceil(left)}
      </span>
    </div>
  );
}
