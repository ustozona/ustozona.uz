"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypographyLabel } from "@/components/ui/typography";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import {
  getAllStudents, getSchoolStudent, kinshipLabel, type SchoolStudent,
} from "@/lib/relations";
import { useRelatives, linkRelatives, unlinkRelatives } from "@/lib/relations-store";
import { useGradesStore } from "@/store/useGradesStore";
import { toast } from "sonner";
import { UserPlus, X, ChevronRight, Users, ChevronDown } from "lucide-react";

/** Rang doirasi ichidagi bosh harflar (paneldagi uslub bilan bir xil) */
function AvatarDot({ hex, initials, className }: { hex: string; initials: string; className?: string }) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold text-white", className)}
      style={{ backgroundColor: hex }}
    >
      {initials}
    </div>
  );
}

export default function RelativesSection({
  studentId,
  onNavigate,
}: {
  studentId: string;
  /** Qarindosh profiliga oʻtish */
  onNavigate: (id: string) => void;
}) {
  const relativeIds = useRelatives(studentId);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const [pickerOpen, setPickerOpen] = useState(false);

  const relatives = useMemo(
    () =>
      relativeIds
        .map((id) => getSchoolStudent(classDataMap, id))
        .filter((s): s is SchoolStudent => Boolean(s)),
    [relativeIds, classDataMap]
  );

  // Tanlash uchun nomzodlar — oʻzi va allaqachon bogʻlanganlardan tashqari, sinf boʻyicha guruhlangan
  const candidatesByClass = useMemo(() => {
    const exclude = new Set([studentId, ...relativeIds]);
    const groups = new Map<string, SchoolStudent[]>();
    for (const s of getAllStudents(classDataMap)) {
      if (exclude.has(s.id)) continue;
      const arr = groups.get(s.className) ?? [];
      arr.push(s);
      groups.set(s.className, arr);
    }
    return [...groups.entries()];
  }, [studentId, relativeIds, classDataMap]);

  return (
    <Collapsible defaultOpen={false} className="border-b border-border p-5">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="group/col -ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:text-foreground">
          <TypographyLabel className="cursor-pointer">Qarindoshlar</TypographyLabel>
          {relatives.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] tabular-nums">
              {relatives.length}
            </Badge>
          )}
          <ChevronDown className="size-4 text-muted-foreground transition-transform duration-fast ease-standard group-data-[state=open]/col:rotate-180" />
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPickerOpen(true)}
          className="h-7 gap-1.5 px-2 text-muted-foreground"
        >
          <UserPlus className="size-3.5" /> Qoʻshish
        </Button>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="pt-4">
          {relatives.length === 0 ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-5 text-center transition-colors hover:bg-muted/50"
            >
              <Users className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Aka, uka, opa yoki singil qoʻshing</span>
            </button>
          ) : (
            <div className="space-y-1">
              {relatives.map((r) => (
            <div
              key={r.id}
              className="group flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/60"
            >
              <button
                type="button"
                onClick={() => onNavigate(r.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <AvatarDot hex={r.hex} initials={r.initials} className="size-9 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
                      {kinshipLabel(classDataMap, studentId, r.id)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{r.className}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  unlinkRelatives(studentId, r.id);
                  toast.success(`${r.name} bilan bogʻlanish olib tashlandi`, {
                    action: { label: "Qaytarish", onClick: () => linkRelatives(studentId, r.id) },
                  });
                }}
                aria-label={`${r.name} bogʻlanishini olib tashlash`}
                className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </Button>
            </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>

      {/* Qarindosh tanlash — shadcn Command palette */}
      <CommandDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Qarindosh qoʻshish"
        description="Maktabdan oʻquvchini qidirib bogʻlang"
      >
        <CommandInput placeholder="Ism boʻyicha qidirish…" />
        <CommandList>
          <CommandEmpty>Oʻquvchi topilmadi</CommandEmpty>
          {candidatesByClass.map(([className, students]) => (
            <CommandGroup key={className} heading={className}>
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`${s.name} ${s.className}`}
                  onSelect={() => {
                    linkRelatives(studentId, s.id);
                    setPickerOpen(false);
                  }}
                >
                  <AvatarDot hex={s.hex} initials={s.initials} className="size-7 text-[11px]" />
                  <span className="truncate">{s.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{s.className}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </Collapsible>
  );
}
