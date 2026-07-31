"use client";

import { useState } from "react";
import { ChevronDown, GitCompareArrows, ListChecks } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SHAPE_LABEL, type DraftQuestion } from "./types";

/* Savol turi tanlagichi — select emas, KARTOCHKALI panel (Kahoot naqshi).

   Nega: savol turi — muharrirning eng katta qarori (butun kanvas
   oʻzgaradi), va turlar soni oʻsib boradi. Kartochka ikonka bilan
   turni bir qarashda tanitadi, toifalar esa roʻyxat uzayganda ham
   tartibni saqlaydi. Bitta qatorli select buni bermaydi.

   Toifalar hujjatdagi boʻlinishga mos (docs/ost-loyihalar-arxitektura.md):
   bilim tekshirish · fikr yigʻish · maʼlumot berish. Hozircha faqat
   birinchisi toʻlgan — yangi tur qoʻshilishi = shu roʻyxatga qator. */

const TYPES: ReadonlyArray<{
  group: string;
  items: ReadonlyArray<{ id: DraftQuestion["shape"]; icon: typeof ListChecks }>;
}> = [
  {
    group: "Bilim tekshirish",
    items: [
      { id: "mcq", icon: ListChecks },
      { id: "pairs", icon: GitCompareArrows },
    ],
  },
];

type Props = {
  value: DraftQuestion["shape"];
  onChange: (shape: DraftQuestion["shape"]) => void;
};

export default function QuestionTypePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = TYPES.flatMap((g) => g.items).find((i) => i.id === value);
  const CurrentIcon = current?.icon ?? ListChecks;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Tashqi koʻrinishi select bilan bir xil — panelda boshqa
          maydonlar bilan bir qatorda turadi. */}
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm",
          "outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50",
          open && "border-primary ring-[3px] ring-primary/50"
        )}
      >
        <CurrentIcon className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate text-left">{SHAPE_LABEL[value]}</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" />
      </PopoverTrigger>

      <PopoverContent align="end" side="left" className="w-80 p-4">
        <div className="flex flex-col gap-4">
          {TYPES.map((group) => (
            <div key={group.group} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">{group.group}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === value;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        onChange(item.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-lg border-2 px-2 py-3 text-xs font-medium transition-colors",
                        isActive
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-transparent bg-muted hover:border-primary/40"
                      )}
                    >
                      <Icon className="size-6" />
                      {SHAPE_LABEL[item.id]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
