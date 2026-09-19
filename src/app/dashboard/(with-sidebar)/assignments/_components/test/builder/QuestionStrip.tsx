"use client";

import {
  ChevronDown,
  Copy,
  FileUp,
  GitCompareArrows,
  Image as ImageIcon,
  ListChecks,
  Plus,
  Presentation,
  ChartBar,
  Cloud,
  PenLine,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLIDE_LAYOUT_META, slideLayoutOf } from "@/lib/slide-layouts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SHAPE_LABEL, questionLabel, type DraftQuestion } from "./types";

/* Chap tasma — toʻplamdagi savollar tartibi va miniatyurasi. */

type Props = {
  questions: DraftQuestion[];
  activeKey: string | null;
  onSelect: (key: string) => void;
  onAdd: (shape: DraftQuestion["shape"]) => void;
  /** Tayyor taqdimotni (PDF yoki PPTX) slaydlarga aylantirish. */
  onImport: () => void;
  onDuplicate: (key: string) => void;
  onRemove: (key: string) => void;
};

export default function QuestionStrip({
  questions,
  activeKey,
  onSelect,
  onAdd,
  onImport,
  onDuplicate,
  onRemove,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-muted/30">
      {/* "Qoʻshish" roʻyxat OQIMINING ICHIDA, oxirgi
          savoldan darhol keyin turadi (alohida, butun balandlikka
          choʻzilgan qator emas). Roʻyxat qisqa boʻlsa tugma yuqorida
          qoladi, pastda ishlatilmagan boʻshliq esa ekran tagida —
          kontent bilan bogʻliqligi buzilmaydi. */}
      <div className="min-h-0 flex-1 scrollbar-hover overflow-y-auto p-3">
        <ul className="flex flex-col gap-3">
          {questions.map((question, index) => {
            const isActive = question.key === activeKey;
            return (
              <li key={question.key} className="group/item relative">
                <button
                  type="button"
                  onClick={() => onSelect(question.key)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-lg border bg-card p-3 text-left transition-colors",
                    isActive
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
                    <span className="truncate text-tag text-muted-foreground">
                      {SHAPE_LABEL[question.shape]}
                    </span>
                  </div>

                  {/* Mini-slayd — sahna bilan bir xil 16:9 nisbat va bir
                      xil tartib (savol tepada, javoblar pastda), shuning
                      uchun tasmaga qarab kompozitsiyani baholash mumkin. */}
                  <div className="flex aspect-video flex-col gap-1 rounded-md bg-muted/60 p-1.5">
                    <span className="line-clamp-2 text-micro font-medium leading-tight text-foreground">
                      {questionLabel(question, index)}
                    </span>
                    {question.shape === "slide" ? (
                      /* Slaydda vaqt va javob yoʻq — maket nomi koʻrsatiladi. */
                      <div className="flex flex-1 items-end justify-center gap-1 text-muted-foreground">
                        {question.imageUrl && <ImageIcon className="size-3.5 opacity-50" />}
                        <span className="truncate text-micro">
                          {SLIDE_LAYOUT_META[slideLayoutOf(question.slideLayout)].label}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-1 items-center justify-center gap-1.5 text-muted-foreground">
                          <span className="flex size-4 items-center justify-center rounded-full bg-background text-micro font-semibold">
                            {question.timeLimitSec}
                          </span>
                          <ImageIcon className="size-3.5 opacity-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-0.5">
                          {(question.shape === "mcq" || question.shape === "poll"
                            ? question.options.slice(0, 4)
                            : question.pairs.slice(0, 4)
                          ).map((slot) => (
                            <span key={slot.id} className="h-1.5 rounded-sm bg-background" />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </button>

                <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Nusxalash"
                    onClick={() => onDuplicate(question.key)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Oʻchirish"
                    disabled={questions.length <= 1}
                    onClick={() => onRemove(question.key)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}

          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full">
                  <Plus className="size-4" /> Savol qoʻshish
                  <ChevronDown className="size-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onSelect={() => onAdd("mcq")}>
                  <ListChecks className="size-4" /> Test savoli
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAdd("pairs")}>
                  <GitCompareArrows className="size-4" /> Moslashtirish
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAdd("text")}>
                  <PenLine className="size-4" /> Ochiq javob
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAdd("poll")}>
                  <ChartBar className="size-4" /> Soʻrovnoma
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAdd("wordcloud")}>
                  <Cloud className="size-4" /> Soʻz buluti
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onAdd("slide")}>
                  <Presentation className="size-4" /> Slayd
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onImport}>
                  <FileUp className="size-4" /> Taqdimotni import qilish
                  <span className="ml-auto text-caption text-muted-foreground">PDF, PPTX</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </div>
  );
}
