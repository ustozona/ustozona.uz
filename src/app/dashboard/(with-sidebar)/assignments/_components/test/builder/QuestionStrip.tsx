"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Copy,
  FileUp,
  GitCompareArrows,
  ListChecks,
  Plus,
  Presentation,
  ChartBar,
  Cloud,
  PenLine,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onMove: (key: string, direction: -1 | 1) => void;
};

export default function QuestionStrip({
  questions,
  activeKey,
  onSelect,
  onAdd,
  onImport,
  onDuplicate,
  onRemove,
  onMove,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-border bg-muted/30">
      {/* "Qoʻshish" roʻyxat OQIMINING ICHIDA, oxirgi
          savoldan darhol keyin turadi (alohida, butun balandlikka
          choʻzilgan qator emas). Roʻyxat qisqa boʻlsa tugma yuqorida
          qoladi, pastda ishlatilmagan boʻshliq esa ekran tagida —
          kontent bilan bogʻliqligi buzilmaydi. */}
      <div className="min-h-0 flex-1 scrollbar-hover overflow-y-auto p-3">
        <ul className="flex flex-col gap-2">
          {questions.map((question, index) => {
            const isActive = question.key === activeKey;
            return (
              <li key={question.key} className={cn(
                "rounded-lg border bg-card p-2 transition-colors",
                isActive ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
              )}>
                <button
                  type="button"
                  onClick={() => onSelect(question.key)}
                  aria-current={isActive ? "step" : undefined}
                  className="flex w-full min-w-0 items-start gap-2 text-left"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-micro text-muted-foreground">
                      {SHAPE_LABEL[question.shape]}
                    </span>
                    <span className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                      {questionLabel(question, index)}
                    </span>
                  </span>
                </button>

                <div className="mt-1 flex justify-end gap-0.5" role="group" aria-label={`${index + 1}. ${SHAPE_LABEL[question.shape]}`}>
                  <Button variant="ghost" size="icon" className="size-6" aria-label="Yuqoriga koʻchirish"
                    disabled={index === 0} onClick={() => onMove(question.key, -1)}>
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-6" aria-label="Pastga koʻchirish"
                    disabled={index === questions.length - 1} onClick={() => onMove(question.key, 1)}>
                    <ArrowDown className="size-3.5" />
                  </Button>
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
