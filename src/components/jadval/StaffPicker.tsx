"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { staffShort, type SchoolStaff } from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   OʻQITUVCHI TANLAGICH — qidiruvli.

   ⚠️ Ilgari bu oddiy `<select>` edi. Maktabda 25–60 oʻqituvchi boʻladi;
   qidiruvsiz roʻyxatda kerakli familiyani topish uchun sichqonchani
   uzoq aylantirish kerak. Loyihada `Command` (qidiruvli roʻyxat)
   allaqachon bor va boshqa sahifalarda ishlatiladi.
   ════════════════════════════════════════════════════════════════════ */

export default function StaffPicker({
  staff,
  value,
  onChange,
}: {
  staff: SchoolStaff[];
  value: string | null;
  onChange: (staffId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = staff.find((s) => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-52 justify-between font-normal"
        >
          <span className="truncate">
            {current ? staffShort(current.name) : "Barcha oʻqituvchilar"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          <CommandInput placeholder="Familiya boʻyicha qidirish…" className="h-9" />
          <CommandList>
            <CommandEmpty>Topilmadi</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__hammasi"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                Barcha oʻqituvchilar
                {value == null && <Check className="ml-auto size-4" />}
              </CommandItem>
              {staff.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={() => {
                    onChange(s.id === value ? null : s.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{s.name}</span>
                  {value === s.id && <Check className={cn("ml-auto size-4")} />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
