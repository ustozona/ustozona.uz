"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { BookOpen, ChevronDown, Plus } from "lucide-react";

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
import {
  SUBJECT_GROUPS_BY_AREA,
  customSubjectId,
  isCustomSubject,
  subjectKey,
  subjectLabel,
} from "@/lib/standards-data";
import { useLiveClasses } from "@/hooks/useLiveClasses";

/* ════════════════════════════════════════════════════════════════════
   FAN TANLAGICH — fan tanlanadigan HAR joyda shu komponent
   (sinf modali, Sozlamalar > Profil, Onboarding).

   Qiymat sifatida katalog `id` saqlanadi ("math"), koʻrsatishda esa
   `subjectLabel()` orqali nom chiqadi. Sabab: ilova koʻp tilda ishlaydi —
   nom saqlansa, ruscha interfeysdagi «Математика» va oʻzbekchadagi
   «Matematika» bir fan ekanini tizim bila olmasdi. Nomlar rasman ham
   oʻzgaradi (MMTV buyruqlari), `id` esa oʻzgarmaydi.

   ⛔ `<Input>` bilan erkin matn YOZILMAYDI.

   Roʻyxatda yoʻq fan uchun oʻqituvchi oʻzi qoʻsha oladi — u `custom:` bilan
   saqlanadi va shu maktabning boshqa sinflarida ham roʻyxatda koʻrinadi
   (pastdagi `useCustomSubjects`), yaʼni bir marta yoziladi.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Roʻyxat filtri. cmdk sukut boʻyicha xom satrni solishtiradi — «san'at» deb
 * qidirilganda katalogdagi «Tasviriy sanʼat» topilmasdi. Ikkala tomon ham
 * `subjectKey()` bilan birxillashtiriladi.
 */
function subjectFilter(value: string, search: string): number {
  const q = subjectKey(search);
  if (!q) return 1;
  return subjectKey(value).includes(q) ? 1 : 0;
}

/** Maktabda allaqachon ishlatilgan «oʻz fanlari» — mavjud sinflardan. */
function useCustomSubjects(current: string): string[] {
  const classes = useLiveClasses();
  return React.useMemo(() => {
    const seen = new Set<string>();
    for (const c of classes) {
      if (c.subject && isCustomSubject(c.subject)) seen.add(c.subject);
    }
    // Tanlangan qiymat hali hech qaysi sinfga yozilmagan boʻlishi mumkin
    // (modal ochiq, saqlanmagan) — roʻyxatdan tushib qolmasin.
    if (isCustomSubject(current)) seen.add(current);
    return [...seen].sort((a, b) => subjectLabel(a).localeCompare(subjectLabel(b)));
  }, [classes, current]);
}

export function SubjectPicker({
  value,
  onChange,
  id,
  placeholder,
  className,
}: {
  /** Katalog `id` yoki `custom:<nom>`. */
  value: string;
  onChange: (next: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const t = useTranslations("SubjectPicker");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const customSubjects = useCustomSubjects(value);

  const pick = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  const trimmed = query.trim();
  // Yozilgan nom allaqachon roʻyxatda boʻlsa, «qoʻshish» taklif qilinmaydi.
  const alreadyKnown = React.useMemo(() => {
    if (!trimmed) return true;
    // subjectKey() bilan solishtiriladi — «Tasviriy san'at» va «Tasviriy
    // sanʼat» bitta fan. Oddiy toLowerCase() ularni ikki xil deb bilib,
    // rasmiy fanning nusxasini `custom:` sifatida yaratib yuborardi.
    const key = subjectKey(trimmed);
    return (
      SUBJECT_GROUPS_BY_AREA.some((g) =>
        g.items.some((s) => subjectKey(s.label) === key)
      ) || customSubjects.some((s) => subjectKey(subjectLabel(s)) === key)
    );
  }, [trimmed, customSubjects]);

  const addCustom = (
    <CommandItem
      value={`__add__${trimmed}`}
      onSelect={() => pick(customSubjectId(trimmed))}
      className="gap-2"
    >
      <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{t("addCustom", { value: trimmed })}</span>
    </CommandItem>
  );

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
            {subjectLabel(value) || placeholder || t("placeholder")}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command filter={subjectFilter}>
          <CommandInput value={query} onValueChange={setQuery} placeholder={t("search")} />
          <CommandList>
            {/* Bu yerga «qoʻshish» qoʻyilmaydi: u pastda alohida turadi va
                cmdk uchun mos element sifatida sanaladi — demak roʻyxat boʻsh
                boʻlmaydi va CommandEmpty umuman chizilmasdi. */}
            <CommandEmpty>
              <span className="px-2 py-1.5 text-sm">{t("empty")}</span>
            </CommandEmpty>

            {customSubjects.length > 0 ? (
              <CommandGroup heading={t("mySubjects")}>
                {customSubjects.map((s) => (
                  <CommandItem key={s} value={subjectLabel(s)} onSelect={() => pick(s)}>
                    {subjectLabel(s)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}

            {SUBJECT_GROUPS_BY_AREA.map((g) => (
              <CommandGroup key={g.id} heading={g.label}>
                {g.items.map((s) => (
                  <CommandItem key={s.id} value={s.label} onSelect={() => pick(s.id)}>
                    {s.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {/* Qidiruvda natija bor, lekin aynan yozilgani roʻyxatda yoʻq
                boʻlsa ham qoʻshish yoʻli ochiq tursin — CommandEmpty bunday
                holatda koʻrinmaydi. */}
            {trimmed && !alreadyKnown ? <CommandGroup>{addCustom}</CommandGroup> : null}

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
