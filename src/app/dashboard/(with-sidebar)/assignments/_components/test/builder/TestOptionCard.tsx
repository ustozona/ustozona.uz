"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Test javob kartasi — Kahoot/Wayground/Blooket'dagi rang+shakl juftligi
 * (uchburchak-qizil, romb-koʻk...) ATAYLAB olib tashlangan: bu belgi
 * oʻquvchilar orasida ("men qizilni belgiladim" tarzida) javobni ogʻzaki
 * uzatish vositasiga aylanadi, oʻzimizga esa faqat Kahoot import qilingan
 * koʻrinish qoladi. Har variant bir xil neytral kartada — chapda katta
 * "toʻgʻri javob" katakchasi (Blooket uslubi), oʻngda matn CHAPGA
 * tekislangan (Blooket'dagidek gorizontal markazlash EMAS): koʻp qatorli
 * matnda markazlash chap qirrani notekis qilib oʻqishni sekinlashtiradi
 * (Nielsen Norman) — bu Kahoot/Blooket'da proyektordan uzoqdan tez
 * qarash uchun qabul qilinadi, bizda esa oʻquvchi yaqindan, xotirjam
 * oʻqiydi. Google/Microsoft Forms va jiddiy baholash vositalari ham
 * checkbox yonidagi matnni har doim chapga tekislaydi.
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
  onToggleCorrect: () => void;
}) {
  return (
    <div className="quiz-stage-answer flex items-center gap-[0.75em] rounded-choice border-choice border-border bg-card px-[0.75em]">
      <button
        type="button"
        onClick={onToggleCorrect}
        aria-label={isCorrect ? "Toʻgʻri javob" : "Toʻgʻri deb belgilash"}
        aria-pressed={isCorrect}
        data-correct={isCorrect}
        className={cn(
          "quiz-answer-toggle flex size-[1.85em] shrink-0 items-center justify-center rounded-[0.5em] border-2 shadow-sm",
          isCorrect
            ? "border-success bg-success text-success-foreground"
            : "border-border bg-card text-transparent hover:border-success/50"
        )}
      >
        <Check className="size-[1.05em]" strokeWidth={3} />
      </button>

      {/* `rows={1}` + `field-sizing: content` — bitta qatorli matn
          checkboxga nisbatan vertikal markazda turadi (Kahoot'dagidek),
          matn ikkinchi qatorga oshsa esa balandlik oʻsadi, lekin ota
          qatordagi `items-center` uni baribir markazda ushlab turadi. */}
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`${index + 1}-variant`}
        maxLength={500}
        rows={1}
        className="max-h-full min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent py-[0.5em] text-left text-[length:inherit] font-medium leading-snug text-foreground [field-sizing:content] placeholder:text-muted-foreground focus-visible:outline-none"
      />
    </div>
  );
}
