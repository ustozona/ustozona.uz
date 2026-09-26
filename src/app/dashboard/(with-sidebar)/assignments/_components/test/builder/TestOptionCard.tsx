"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChoiceShape, choiceVars } from "@/components/stage/StageParts";

/**
 * Test javob kartasi — oʻquvchi ekrani va Doska bilan BIR XIL rang+shakl
 * (`--stage-choice-N`, ▲ ◆ ● ■ ⬟ ★): muharrirda koʻrilgan variant
 * proyektorda ham shu rangda chiqadi (WYSIWYG).
 *
 * Ilgari rang ataylab olib tashlangan edi («men qizilni belgiladim»
 * tarzida javob uzatilishi xavfi). 2026-09-19 da qayta qaytarildi:
 * jonli rejimda oʻquvchi proyektorga qarab telefonidan rang boʻyicha tez
 * topadi, oʻz tezligidagi rejimda esa variantlar har oʻquvchiga
 * aralashtirib beriladi (play/content.ts) — rang javobni bildirmaydi.
 *
 * Boʻsh variant — oq karta, rang faqat shakl katakchasida; matn yozilgach
 * butun karta variant rangiga kiradi. Matn CHAPGA tekislangan: koʻp qatorli
 * javobda markazlash chap qirrani notekis qilib oʻqishni sekinlashtiradi.
 */
export default function TestOptionCard({
  index,
  text,
  onTextChange,
  isCorrect,
  onToggleCorrect,
}: {
  index: number;
  text: string;
  onTextChange: (value: string) => void;
  isCorrect: boolean;
  /** Yoʻq boʻlsa (soʻrovnoma) — toʻgʻri javob tushunchasi yoʻq, katakcha chiqmaydi. */
  onToggleCorrect?: () => void;
}) {
  const filled = text.trim().length > 0;
  return (
    <div
      className={cn(
        "quiz-stage-answer flex items-center gap-[0.75em] rounded-choice px-[0.75em] transition-colors",
        // `stage-choice-surface` — zamonaviy uslubda gradient chuqurlik (quiz-stage.css).
        filled ? "stage-choice-surface text-white" : "border-choice border-border bg-card",
      )}
      style={{
        ...choiceVars(index),
        ...(filled
          ? { backgroundColor: "var(--choice)", boxShadow: "0 0.28em 0 0 var(--stage-choice-edge)" }
          : {}),
      }}
    >
      <span
        className="flex size-[1.85em] shrink-0 items-center justify-center rounded-[0.5em] text-white"
        style={{ background: filled ? "oklch(1 0 0 / 0.18)" : "var(--choice)" }}
      >
        <ChoiceShape index={index} className="size-[1.05em]" />
      </span>

      {/* `rows={1}` + `field-sizing: content` — bitta qatorli matn
          katakchaga nisbatan vertikal markazda turadi, matn ikkinchi
          qatorga oshsa balandlik oʻsadi, `items-center` baribir markazlaydi. */}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`${index + 1}-variant`}
        maxLength={500}
        rows={1}
        className={cn(
          "max-h-full min-w-0 flex-1 resize-none scrollbar-hover overflow-y-auto border-0 bg-transparent py-[0.5em] text-left text-[length:inherit] font-medium leading-snug [field-sizing:content] focus-visible:outline-none",
          filled ? "text-white" : "text-foreground placeholder:text-muted-foreground",
        )}
      />

      {onToggleCorrect && (
        <button
          type="button"
          onClick={onToggleCorrect}
          aria-label={isCorrect ? "Toʻgʻri javob" : "Toʻgʻri deb belgilash"}
          aria-pressed={isCorrect}
          data-correct={isCorrect}
          className={cn(
            "quiz-answer-toggle flex size-[1.85em] shrink-0 items-center justify-center rounded-full border-2 shadow-sm",
            isCorrect
              ? "border-white bg-success text-success-foreground"
              : filled
                ? "border-white/80 bg-transparent text-transparent hover:bg-white/15"
                : "border-border bg-card text-transparent hover:border-success/50",
          )}
        >
          <Check className="size-[1.05em]" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
