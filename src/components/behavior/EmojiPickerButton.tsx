"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import { cn } from "@/lib/utils";
import { BehaviorEmoji } from "./BehaviorEmoji";

/* Koʻnikma/mukofot formalarida emoji tanlash — umumiy Apple-only
   emoji-picker (@/components/ui/emoji-picker). Eski EmojiPalette
   (25 taga cheklangan) shu bilan almashtirildi.

   size="lg" — forma "yuzi" sifatida markazlashgan katta dumaloq tugma
   (pastki oʻng burchakda tahrirlash qalami bilan), skill/reward
   formalarida ishlatiladi. */

function toUnified(char: string): string {
  return [...char].map((c) => c.codePointAt(0)!.toString(16)).join("-");
}

export function EmojiPickerButton({
  value,
  onChange,
  size = "default",
}: {
  value: string;
  onChange: (code: string) => void;
  size?: "sm" | "default" | "lg" | "xl";
}) {
  const [open, setOpen] = useState(false);
  const isBig = size === "lg" || size === "xl";
  return (
    // modal — Dialog ichida ochilgani uchun shart: Dialog'ning scroll-qulfi
    // (react-remove-scroll) portal'dagi popoverda gʻildirakni bloklaydi.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex items-center justify-center border border-border bg-background transition-colors hover:bg-muted",
            size === "xl"
              ? "size-28 shrink-0 rounded-full"
              : size === "lg"
                ? "size-20 shrink-0 rounded-full"
                : size === "sm"
                  ? "size-9 shrink-0 rounded-md"
                  : "size-14 rounded-xl"
          )}
        >
          <BehaviorEmoji
            code={value}
            className={
              size === "xl" ? "size-12" : size === "lg" ? "size-9" : size === "sm" ? "size-4.5" : "size-7"
            }
          />
          {isBig && (
            <span
              className={cn(
                "absolute flex items-center justify-center rounded-full border border-border bg-background",
                size === "xl" ? "-right-1 -bottom-1 size-8" : "-right-1 -bottom-1 size-6"
              )}
            >
              <Pencil className={size === "xl" ? "size-3.5 text-muted-foreground" : "size-3 text-muted-foreground"} aria-hidden />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-fit p-0">
        <EmojiPicker
          onEmojiSelect={({ emoji }) => {
            onChange(toUnified(emoji));
            setOpen(false);
          }}
        >
          <EmojiPickerSearch />
          <EmojiPickerContent />
          <EmojiPickerFooter />
        </EmojiPicker>
      </PopoverContent>
    </Popover>
  );
}
