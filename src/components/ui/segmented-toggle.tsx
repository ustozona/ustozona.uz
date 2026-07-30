"use client";

import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type SegmentedToggleOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
};

/**
 * Icon+matn segmentli toggle — `/classes` koʻrinish almashtirgichi bilan bir
 * xil vizual til (`ToggleGroup variant="outline"`): tashqi ramka, default
 * holatda oq, tanlangani primary rangda toʻldirilgan, hoverda muted.
 */
export function SegmentedToggle<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedToggleOption<T>[];
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      className={cn(
        "grid w-full gap-1 rounded-lg data-[variant=outline]:h-auto",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className={cn(
            "gap-1.5 px-3 py-2 text-sm font-medium data-[variant=outline]:h-auto",
            "data-[state=off]:text-muted-foreground",
            opt.hint ? "flex-col items-start text-left" : "flex-row items-center justify-center"
          )}
        >
          <span className="flex items-center gap-1.5">
            {opt.icon}
            {opt.label}
          </span>
          {opt.hint && <span className="text-[11px] opacity-75">{opt.hint}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
