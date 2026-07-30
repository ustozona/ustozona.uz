"use client";

import * as React from "react";
import { PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Konik-gradient palitra tugmasi — bosilganda rangli doiralar toʻri ochiladi.
 * Sinf va toifa rang tanlagichlari bir xil vizual tildan foydalanadi.
 */
export function ColorPickerButton<T extends string>({
  value,
  onChange,
  colors,
  hexOf,
  ariaLabel,
  columns = 5,
  className,
}: {
  value: T;
  onChange: (color: T) => void;
  colors: readonly T[];
  hexOf: (color: T) => string;
  ariaLabel?: string;
  columns?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const presetHexes = colors.map(hexOf);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={ariaLabel}
          className={cn("shrink-0 border-0 shadow-sm hover:opacity-90", className)}
          style={{ background: `conic-gradient(${presetHexes.join(", ")}, ${presetHexes[0]})` }}
        >
          <PaletteIcon className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3">
        <div
          className="grid gap-2 justify-items-center"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {colors.map((c) => {
            const hex = hexOf(c);
            const active = c === value;
            return (
              <Button
                key={c}
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={c}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="size-7 rounded-full ring-2 ring-transparent hover:ring-border ring-offset-2 ring-offset-card shadow-sm p-0 min-w-0 min-h-0"
                style={{
                  backgroundColor: hex,
                  outline: active ? `3px solid ${hex}` : undefined,
                  outlineOffset: "2px",
                }}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
