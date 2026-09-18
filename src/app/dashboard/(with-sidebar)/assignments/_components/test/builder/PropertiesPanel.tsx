"use client";

import { Award, Copy, LayoutTemplate, ListChecks, Palette, Shapes, Timer, Trash2, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SLIDE_LAYOUT_META, slideLayoutOf } from "@/lib/slide-layouts";
import { parseVideoUrl } from "@/lib/video-embed";
import SlideLayoutPicker from "./SlideLayoutPicker";
import { STAGE_THEMES } from "@/lib/stage-themes";
import { cn } from "@/lib/utils";
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
        <h2 className="text-sm font-semibold">
          {question.shape === "slide" ? `${questionNumber}-slayd` : `${questionNumber}-savol xossalari`}
        </h2>
      </div>

      <div className="min-h-0 flex-1 scrollbar-hover overflow-y-auto">
        <Field icon={<Shapes className="size-4" />} label="Savol turi">
          <QuestionTypePicker value={question.shape} onChange={changeShape} />
        </Field>

        {question.shape === "slide" && (
          <Field icon={<LayoutTemplate className="size-4" />} label="Maket">
            <SlideLayoutPicker
              value={slideLayoutOf(question.slideLayout)}
              onChange={(slideLayout) => onChange({ slideLayout })}
            />
          </Field>
        )}

        {question.shape === "slide" && (
          <Field icon={<Palette className="size-4" />} label="Slayd foni">
            {/* Boʻsh tanlov — toʻplamning umumiy foni (reyldagi «Mavzu»). Faqat
                ajralib turishi kerak boʻlgan slayd (boʻlim boshi, xulosa) uchun
                alohida fon tanlanadi. */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                aria-pressed={!question.slideBg}
                onClick={() => onChange({ slideBg: undefined })}
                className={cn(
                  "h-7 rounded-full border px-3 text-caption transition-colors",
                  !question.slideBg ? "border-primary bg-accent" : "border-border hover:bg-muted",
                )}
              >
                Umumiy
              </button>
              {STAGE_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  title={theme.label}
                  aria-label={theme.label}
                  aria-pressed={question.slideBg === theme.id}
                  onClick={() => onChange({ slideBg: theme.id })}
                  className={cn(
                    "size-7 rounded-full transition-shadow",
                    question.slideBg === theme.id
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:ring-2 hover:ring-primary/40",
                  )}
                  style={{ background: theme.bg }}
                />
              ))}
            </div>
          </Field>
        )}

        {question.shape === "slide" && SLIDE_LAYOUT_META[slideLayoutOf(question.slideLayout)].fields.video && (
          <Field icon={<Video className="size-4" />} label="Video (YouTube havolasi)">
            <Input
              value={question.videoUrl ?? ""}
              onChange={(e) => onChange({ videoUrl: e.target.value })}
              placeholder="https://youtu.be/…"
              maxLength={500}
            />
            {question.videoUrl?.trim() && !parseVideoUrl(question.videoUrl.trim()) && (
              <p className="text-caption text-destructive">Havola tanilmadi — YouTube havolasini qoʻying.</p>
            )}
            {question.videoUrl?.trim() && question.imageUrl && (
              <p className="text-caption text-muted-foreground">Video bor — rasm oʻrniga video koʻrsatiladi.</p>
            )}
          </Field>
        )}

        {/* Slayd baholanmaydi va vaqtga bogʻlanmaydi — vaqt va ball maydonlari yoʻq. */}
        {question.shape !== "slide" && (
        <>
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
        </>
        )}

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
