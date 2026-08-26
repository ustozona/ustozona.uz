"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGradesStore } from "@/store/useGradesStore";
import { getWorkspaceRosterAction } from "@/server/actions/workspace";
import { unwrap } from "@/lib/action-result";
import type { Student } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   MAVJUD OʻQUVCHINI OʻZ GURUHIGA QOʻSHISH.

   ⭐ Butun koʻp-oʻqituvchi arxitekturasining maʼnosi shu tugmada.
   Busiz ikkinchi oʻqituvchi 6-A ga oʻz fan guruhini tuzayotganda 30
   ismni QOʻLDA qayta yozadi — va oʻshanda bir bola ikki yozuvga
   boʻlinib, koʻchishdan olingan foyda yoʻqoladi.

   Bola AYNAN OʻSHA `id` bilan qoʻshiladi. Server tomonda bu yangi
   `students` qatori emas, yangi YOZILISH (`enrollments`) boʻlib
   tushadi — demak baho/davomat har oʻqituvchida oʻzicha qoladi, lekin
   bola bitta.
   ════════════════════════════════════════════════════════════════════ */

type RosterEntry = {
  id: string;
  name: string;
  initials: string;
  classNames: string[];
};

export function AddFromRosterDialog({
  open,
  onOpenChange,
  classId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string;
}) {
  const updateClass = useGradesStore((s) => s.updateClass);
  const existing = useGradesStore((s) => s.classDataMap[classId]?.students);
  const [roster, setRoster] = React.useState<RosterEntry[] | null>(null);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRoster(null);
    getWorkspaceRosterAction()
      .then((r) => {
        if (!cancelled) setRoster(unwrap(r));
      })
      .catch(() => {
        if (!cancelled) setRoster([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Guruhda allaqachon bor bolalar chiqarib tashlanadi.
  const alreadyIn = React.useMemo(
    () => new Set((existing ?? []).map((s) => s.id)),
    [existing]
  );
  const candidates = React.useMemo(
    () => (roster ?? []).filter((r) => !alreadyIn.has(r.id)),
    [roster, alreadyIn]
  );

  const add = (entry: RosterEntry) => {
    const student: Student = {
      id: entry.id, // ⚠️ MAVJUD id — yangi bola yaratilmaydi
      name: entry.name,
      initials: entry.initials,
      status: "active",
    };
    updateClass(classId, (cd) => ({ ...cd, students: [student, ...cd.students] }));
    onOpenChange(false);
    toast.success(`${entry.name} qoʻshildi`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Roʻyxatdan qoʻshish"
      description="Maktabdagi mavjud oʻquvchini shu guruhga qoʻshing"
    >
      <CommandInput placeholder="Ism boʻyicha qidiring…" />
      <CommandList>
        <CommandEmpty>
          {roster === null ? "Yuklanmoqda…" : "Qoʻshiladigan oʻquvchi topilmadi"}
        </CommandEmpty>
        {candidates.length > 0 ? (
          <CommandGroup heading="Maktab roʻyxati">
            {candidates.map((r) => (
              <CommandItem
                key={r.id}
                value={`${r.name} ${r.classNames.join(" ")}`}
                onSelect={() => add(r)}
              >
                <span className="truncate">{r.name}</span>
                {r.classNames.length > 0 ? (
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {r.classNames.join(", ")}
                  </span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
