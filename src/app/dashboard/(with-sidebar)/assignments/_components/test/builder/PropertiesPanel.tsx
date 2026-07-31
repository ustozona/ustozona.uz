"use client";

import { Award, Copy, ListChecks, Shapes, Timer, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POINTS_LABEL, TIME_LIMITS, newOptions, newPair, type DraftQuestion } from "./types";
import QuestionTypePicker from "./QuestionTypePicker";

/* Oʻng panel — joriy savolning xossalari.

   Tur almashtirilganda kontent tashlab yuborilmaydi: mcq variantlari va
   pairs juftliklari qoralamada YONMA-YON saqlanadi, shuning uchun
   tasodifan almashtirib qoʻyish maʼlumot yoʻqotmaydi. */

type Props = {
  question: DraftQuestion;
  questionNumber: number;
  canDelete: boolean;
  onChange: (patch: Partial<DraftQuestion>) => void;
  onApplyTimeToAll: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function PropertiesPanel({
  question,
  questionNumber,
  canDelete,
  onChange,
  onApplyTimeToAll,
  onDuplicate,
  onRemove,
}: Props) {
  function changeShape(shape: DraftQuestion["shape"]) {
    if (shape === question.shape) return;
    onChange({
      shape,
      options: shape === "mcq" && question.options.length === 0 ? newOptions() : question.options,
      pairs: shape === "pairs" && question.pairs.length === 0 ? [newPair(), newPair()] : question.pairs,
    });
  }

  /** Koʻp tanlovdan bittaga qaytilganda ortiqcha toʻgʻri javoblar tozalanadi. */
  function changeMultiSelect(multiSelect: boolean) {
    if (multiSelect) {
      onChange({ multiSelect });
      return;
    }
    let seen = false;
    onChange({
      multiSelect,
      options: question.options.map((o) => {
        if (!o.isCorrect) return o;
        if (seen) return { ...o, isCorrect: false };
        seen = true;
        return o;
      }),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-border bg-card">
      <div className="flex min-h-16 shrink-0 items-center border-b border-border px-4">
        <h2 className="text-sm font-semibold">{questionNumber}-savol xossalari</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Field icon={<Shapes className="size-4" />} label="Savol turi">
          <QuestionTypePicker value={question.shape} onChange={changeShape} />
        </Field>

        <Field icon={<Timer className="size-4" />} label="Vaqt limiti">
          <Select
            value={String(question.timeLimitSec)}
            onValueChange={(v) => onChange({ timeLimitSec: Number(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_LIMITS.map((seconds) => (
                <SelectItem key={seconds} value={String(seconds)}>
                  {seconds} soniya
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="link" size="sm" className="self-start px-0" onClick={onApplyTimeToAll}>
            Hamma savolga qoʻllash
          </Button>
        </Field>

        <Field icon={<Award className="size-4" />} label="Ball">
          <Select
            value={question.pointsMode}
            onValueChange={(v) => onChange({ pointsMode: v as DraftQuestion["pointsMode"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(POINTS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {question.shape === "mcq" && (
          <Field icon={<ListChecks className="size-4" />} label="Javob variantlari">
            <Select
              value={question.multiSelect ? "multi" : "single"}
              onValueChange={(v) => changeMultiSelect(v === "multi")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Bitta toʻgʻri javob</SelectItem>
                <SelectItem value="multi">Bir nechta toʻgʻri javob</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

      <div className="flex shrink-0 gap-2 border-t border-border p-4">
        <Button variant="outline" size="sm" className="flex-1" disabled={!canDelete} onClick={onRemove}>
          <Trash2 className="size-4" /> Oʻchirish
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={onDuplicate}>
          <Copy className="size-4" /> Nusxalash
        </Button>
      </div>
    </div>
  );
}
