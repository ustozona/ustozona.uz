"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SUBJECT_GROUPS } from "@/lib/standard-templates";

/* ════════════════════════════════════════════════════════════════════
   FAN TANLAGICH — fan tanlanadigan HAR joyda shu komponent
   (sinf modali, Sozlamalar > Profil, Onboarding).

   ⛔ `<Input>` bilan erkin matn YOZILMAYDI. Sabab: bitta fan "Ingliz
   tili" / "ingliz" / "English" koʻrinishida saqlansa, keyin uni
   Standartlar, jadval va hisobotlardagi fan bilan moslashtirib
   boʻlmaydi — filtr va qidiruv jimgina yarim natija beradi.

   Katalog qiymati sifatida oʻzbekcha `label` saqlanadi (`SUBJECT_GROUPS`
   bilan bir xil). Roʻyxatda yoʻq fan uchun erkin matn saqlash imkoniyati
   QOLADI: toʻgarak, tayyorlov kursi va nostandart fanlar bor. Bunday
   qiymat xom satr boʻlib saqlanadi.
   ════════════════════════════════════════════════════════════════════ */

export function SubjectPicker({
  value,
  onChange,
  id,
  placeholder,
  className,
}: {
  /** Katalog nomi yoki oʻqituvchi kiritgan erkin nom. */
  value: string;
  onChange: (next: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("SubjectPicker");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const pick = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            className,
          )}
        >
          <BookOpen className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className={cn("flex-1 truncate text-left", !value && "text-muted-foreground")}>
            {value || placeholder || t("placeholder")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("search")} />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? (
                <button
                  type="button"
                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => pick(query.trim())}
                >
                  {t("useCustom", { value: query.trim() })}
                </button>
              ) : (
                t("empty")
              )}
            </CommandEmpty>
            {SUBJECT_GROUPS.map((g) => (
              <CommandGroup key={g.label} heading={g.label}>
                {g.items.map((s) => (
                  <CommandItem key={s} value={s} onSelect={() => pick(s)}>
                    {s}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {/* Tanlangan qiymat roʻyxatda boʻlmasa ham (erkin nom) tozalash
                yoʻli boʻlsin — aks holda faqat boshqa fanga almashtirib
                qutulish mumkin edi. */}
            {value ? (
              <CommandGroup>
                <CommandItem value="__clear__" onSelect={() => pick("")}>
                  <span className="text-muted-foreground">{t("clear")}</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
