"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, LayoutGrid, Rows3, Plus, Trash2 } from "lucide-react";
import { SlideView } from "@/components/slides/SlideView";
import { compressImageFile } from "@/lib/image-compress";
import { slideLayoutOf } from "@/lib/slide-layouts";
import { stageFontVars } from "@/lib/stage-fonts";
import { STAGE_FONT_CLASS } from "@/components/stage/stage-font-faces";
import { uploadEditorImageAction } from "@/server/actions/uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MAX_PAIRS, newPair, stageThemeVars, type DraftQuestion } from "./types";
import TestOptionCard from "./TestOptionCard";
import { ChoiceShape, choiceVars } from "@/components/stage/StageParts";

/* Markaziy kanvas — savol matni va javob kartalari. Kartalar oʻquvchi
   telefoni va Doska bilan BIR XIL sahna tilida (`--stage-choice-N`
   rang + shakl, oq karta, shisha joy) — muharrirda koʻrilgani
   proyektorda ham shunday chiqadi. */

type Props = {
  question: DraftQuestion;
  /** Sahna foni — toʻplam darajasidagi sozlama (reyldagi "Mavzu"). */
  stageTheme: string;
  /** Sahna shrifti — toʻplam darajasida, "Mavzu" panelida tanlanadi. */
  stageFont: string;
  /** Sahna uslubi — klassik / zamonaviy (lib/stage-styles.ts). */
  stageStyle: string;
  onChange: (patch: Partial<DraftQuestion>) => void;
};

export default function QuestionCanvas({ question, stageTheme, stageFont, stageStyle, onChange }: Props) {
  if (question.shape === "slide") {
    return (
      <SlideCanvas
        question={question}
        stageTheme={stageTheme}
        stageFont={stageFont}
        stageStyle={stageStyle}
        onChange={onChange}
      />
    );
  }
  return (
    <QuizCanvas
      question={question}
      stageTheme={stageTheme}
      stageFont={stageFont}
      stageStyle={stageStyle}
      onChange={onChange}
    />
  );
}

/* Slayd — oʻsha 16:9 sahna, ichida umumiy `SlideView` tahrir rejimida.
   Oʻquvchi ekrani va Doska ham aynan shu rendererni chizadi, shuning
   uchun muharrirda koʻrilgan slayd proyektorda ham shunday chiqadi. */
function SlideCanvas({ question, stageTheme, stageFont, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const bg = question.slideBg ?? stageTheme;

  async function pickImage(file: File) {
    setUploading(true);
    try {
      const dataUrl = await compressImageFile(file);
      const { url } = await uploadEditorImageAction(dataUrl);
      onChange({ imageUrl: url });
    } catch {
      toast.error("Rasmni yuklab boʻlmadi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="quiz-stage-frame h-full w-full bg-muted/20 p-4">
      <div className="quiz-stage-column">
        <div
          className={cn("quiz-stage stage-font", STAGE_FONT_CLASS)}
          style={{ ...stageThemeVars(bg), ...stageFontVars(stageFont) }}
        >
          <SlideView
            slide={{
              layout: slideLayoutOf(question.slideLayout),
              title: question.title,
              body: question.stem,
              imageUrl: question.imageUrl,
              videoUrl: question.videoUrl,
            }}
            edit={{
              onTitle: (title) => onChange({ title }),
              onBody: (stem) => onChange({ stem }),
              onPickImage: pickImage,
              onRemoveImage: () => onChange({ imageUrl: undefined }),
              uploading,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function QuizCanvas({ question, stageTheme, stageFont, stageStyle, onChange }: Props) {
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
          className={cn("quiz-stage stage-font", STAGE_FONT_CLASS)}
          data-stage-style={stageStyle}
          style={{ ...stageThemeVars(stageTheme), ...stageFontVars(stageFont) }}
        >
          <Textarea
            value={question.stem}
            onChange={(e) => onChange({ stem: e.target.value })}
            placeholder="Savolni shu yerga yozing…"
            rows={2}
            maxLength={2000}
            className="quiz-stage-stem h-auto min-h-0 w-full resize-none border-0 bg-card text-center shadow-sm md:text-[length:inherit]"
          />

          {question.shape === "text" ? (
            /* Ochiq javob — oʻquvchi erkin matn yozadi, oʻqituvchi keyin
               sessiya panelida qoʻlda baholaydi (0 / ½ / 1). */
            <div className="mt-auto flex h-[30cqw] flex-col items-start justify-start gap-[1cqw] rounded-choice border-2 border-dashed border-white/60 bg-white/15 p-[2cqw] text-white">
              <span className="quiz-stage-stem p-0">Oʻquvchi javobi shu yerga yoziladi…</span>
              <span className="text-sm text-white/85">Erkin matn, 2000 belgigacha. Sessiyadan keyin qoʻlda baholaysiz.</span>
            </div>
          ) : question.shape === "wordcloud" ? (
            /* Soʻz buluti — oʻquvchi bitta qisqa soʻz yozadi; doskada eng koʻp
               yozilgan soʻzlar kattaroq chiqadi. Muharrirda kiritish yoʻq. */
            <div className="mt-auto flex h-[30cqw] flex-col items-center justify-center gap-[1cqw] rounded-choice border-2 border-dashed border-white/60 bg-white/15 text-white">
              <span className="quiz-stage-stem">Soʻz buluti</span>
              <span className="text-sm text-white/85">Oʻquvchilar bitta qisqa soʻz yozadi (40 belgigacha)</span>
            </div>
          ) : question.shape === "mcq" || question.shape === "poll" ? (
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
                  onToggleCorrect={
                    question.shape === "poll" ? undefined : () => toggleCorrect(option.id)
                  }
                />
              ))}
            </div>
          ) : (
            /* Moslashtirishda javob soni oʻzgaruvchan — sahna balandligi
               qatʼiy, shuning uchun roʻyxat oʻz ichida aylanadi. */
            <div className="mt-auto flex min-h-0 flex-col gap-2 scrollbar-hover overflow-y-auto">
              {question.pairs.map((pair, index) => (
                /* Doska'dagi koʻrinish bilan bir xil: chap — variant rangidagi
                   plitka (shakl bilan), oʻng — oq karta (javob ochilganda chiqadi). */
                <div key={pair.id} className="flex items-center gap-2">
                  <div
                    className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-choice px-3 text-white"
                    style={{
                      ...choiceVars(index),
                      background: "var(--choice)",
                      boxShadow: "0 0.2rem 0 0 var(--stage-choice-edge)",
                    }}
                  >
                    <ChoiceShape index={index} className="size-4 shrink-0" />
                    <input
                      value={pair.left}
                      onChange={(e) => patchPair(pair.id, { left: e.target.value })}
                      placeholder={`${index + 1}-chap`}
                      maxLength={300}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/70"
                    />
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-white" />
                  <Input
                    value={pair.right}
                    onChange={(e) => patchPair(pair.id, { right: e.target.value })}
                    placeholder={`${index + 1}-oʻng`}
                    maxLength={300}
                    className="h-11 flex-1 border-0 bg-card font-medium text-foreground shadow-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-white hover:bg-white/15 hover:text-white"
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

        {/* Almashtirgich javob kartalariga BEVOSITA
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
