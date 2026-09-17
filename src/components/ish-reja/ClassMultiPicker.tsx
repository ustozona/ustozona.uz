"use client";

import { Check, ChevronDown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ClassChip } from "@/components/ClassChip";
import { ClassSwatch } from "@/components/ClassSwatch";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";

/** Sinflar tanlagichi (chip'lar + roʻyxat). `lockedId` — oʻchirib boʻlmaydigan sinf. */
export function ClassMultiPicker({ label, placeholder, value, lockedId, onChange }: {
  label: string;
  placeholder?: string;
  value: string[];
  lockedId?: string;
  onChange: (ids: string[]) => void;
}) {
  const classes = useLiveClasses();
  const toggle = (id: string) => {
    if (id === lockedId) return;
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  const chosen = classes.filter((c) => value.includes(c.id));

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Lock className="size-3.5 text-muted-foreground" />
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors duration-fast ease-standard hover:bg-accent/50"
          >
            <span className="flex min-w-0 flex-wrap items-center gap-1.5">
              {chosen.length === 0
                ? <span className="text-muted-foreground">{placeholder}</span>
                : chosen.map((c) => <ClassChip key={c.id} color={classColor(c)} name={c.name} />)}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
          <div className="max-h-[220px] space-y-0.5 overflow-y-auto" onWheel={(e) => { e.currentTarget.scrollTop += e.deltaY; }}>
            {classes.map((c) => {
              const on = value.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={c.id === lockedId}
                  onClick={() => toggle(c.id)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors duration-fast ease-standard hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
                >
                  {/* Checkbox emas: Radix Checkbox — button, button ichida boʻlolmaydi */}
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input",
                    )}
                  >
                    {on && <Check className="size-3.5" />}
                  </span>
                  <ClassSwatch hex={CLASS_COLOR_HEX[classColor(c)]} />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
