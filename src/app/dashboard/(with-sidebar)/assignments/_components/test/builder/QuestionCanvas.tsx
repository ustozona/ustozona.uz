"use client";

import type * as React from "react";
import { ArrowRight, LayoutGrid, Rows3, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_PAIRS, newPair, stageThemeBg, type DraftQuestion } from "./types";
import TestOptionCard from "./TestOptionCard";

/* Markaziy kanvas — savol matni va javob kartalari. Javob kartalari
   HAR DOIM neytral (`TestOptionCard`) — bu oʻquvchi qurilmasida
   koʻradigan oddiy roʻyxat bilan bir xil, uslub tanlash sozlamasi yoʻq. */

type Props = {
  question: DraftQuestion;
  /** Sahna foni — toʻplam darajasidagi sozlama (reyldagi "Mavzu"). */
  stageTheme: string;
  onChange: (patch: Partial<DraftQuestion>) => void;
};

export default function QuestionCanvas({ question, stageTheme, onChange }: Props) {
  function patchOption(id: string, patch: Partial<DraftQuestion["options"][number]>) {
    onChange({
      options: question.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  }

  /** Bitta tanlov rejimida toʻgʻri javob belgilash boshqalarini oʻchiradi. */
  function toggleCorrect(id: string) {
    onChange({
      options: question.options.map((o) => {
        if (o.id === id) return { ...o, isCorrect: !o.isCorrect };
        return question.multiSelect ? o : { ...o, isCorrect: false };
      }),
    });
  }

  function patchPair(id: string, patch: Partial<DraftQuestion["pairs"][number]>) {
    onChange({ pairs: question.pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  return (
    /* 16:9 sahna — jonli ekran nisbati. Muharrirda koʻringan
       kompozitsiya projektorda AYNAN shunday chiqadi. */
    <div className="quiz-stage-frame h-full w-full bg-muted/20 p-4">
      <div className="quiz-stage-column">
        <div
          className="quiz-stage"
          style={{ "--stage-bg": stageThemeBg(stageTheme) } as React.CSSProperties}
        >
          <Textarea
            value={question.stem}
            onChange={(e) => onChange({ stem: e.target.value })}
            placeholder="Savolni shu yerga yozing…"
            rows={2}
            maxLength={2000}
            className="quiz-stage-stem h-auto min-h-0 w-full resize-none border-0 bg-card text-center font-semibold shadow-sm md:text-[length:inherit]"
          />

          {question.shape === "mcq" ? (
            <div
              className={cn(
                "quiz-stage-answers",
                question.answerLayout === "grid" ? "is-grid" : "is-list"
              )}
            >
              {question.options.map((option, index) => (
                <TestOptionCard
                  key={option.id}
                  index={index}
                  text={option.text}
                  onTextChange={(value) => patchOption(option.id, { text: value })}
                  isCorrect={option.isCorrect}
                  onToggleCorrect={() => toggleCorrect(option.id)}
                />
              ))}
            </div>
          ) : (
            /* Moslashtirishda javob soni oʻzgaruvchan — sahna balandligi
               qatʼiy, shuning uchun roʻyxat oʻz ichida aylanadi. */
            <div className="mt-auto flex min-h-0 flex-col gap-2 overflow-y-auto">
              {question.pairs.map((pair, index) => (
                <div key={pair.id} className="flex items-center gap-2">
                  <Input
                    value={pair.left}
                    onChange={(e) => patchPair(pair.id, { left: e.target.value })}
                    placeholder={`${index + 1}-chap`}
                    maxLength={300}
                    className="h-11 flex-1"
                  />
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <Input
                    value={pair.right}
                    onChange={(e) => patchPair(pair.id, { right: e.target.value })}
                    placeholder={`${index + 1}-oʻng`}
                    maxLength={300}
                    className="h-11 flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label="Juftlikni oʻchirish"
                    disabled={question.pairs.length <= 2}
                    onClick={() => onChange({ pairs: question.pairs.filter((p) => p.id !== pair.id) })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              {question.pairs.length < MAX_PAIRS && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-center"
                  onClick={() => onChange({ pairs: [...question.pairs, newPair()] })}
                >
                  <Plus className="size-4" /> Juftlik qoʻshish
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Wayground uslubi — almashtirgich javob kartalariga BEVOSITA
            yopishgan, sahna ustida "muallaq" burchak tugmasi emas. */}
        {question.shape === "mcq" && (
          <div className="flex shrink-0 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() =>
                onChange({ answerLayout: question.answerLayout === "grid" ? "list" : "grid" })
              }
            >
              {question.answerLayout === "grid" ? (
                <>
                  <Rows3 className="size-3.5" /> Vertikal koʻrinish
                </>
              ) : (
                <>
                  <LayoutGrid className="size-3.5" /> Katak koʻrinish
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
