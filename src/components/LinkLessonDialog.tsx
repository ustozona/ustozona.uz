"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TypographyMuted } from "@/components/ui/typography";
import { useLessonStore } from "@/store/useLessonStore";
import { useGradesStore } from "@/store/useGradesStore";
import { classColor } from "@/lib/grades-data";
import { classTints } from "@/lib/class-colors";
import { lessonClassIds, lessonSessions, unitIdForClass } from "@/lib/lessons-data";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   MAVZU ULASH DIALOGI — PlannerView'dagi "bogʻlash" modalidan koʻchirilgan,
   umumiy komponentga aylantirilgan (dastlab TodayRail ham foydalanishi
   uchun). Boʻsh slotga (sinf + sana + vaqt) hali rejalanmagan mavzuni
   ulaydi — sinf/sana/vaqt slot orqali beriladi, PlannerView oʻzi hali
   mahalliy state bilan ishlaydi (bu yerga koʻchirilmagan, faqat yangi
   isteʼmolchilar shuni ishlatishi kerak).
   ════════════════════════════════════════════════════════════════════ */

export type LinkLessonSlot = {
  dateKey: string;
  classId: string;
  startMin: number;
  endMin: number;
};

export function LinkLessonDialog({
  slot,
  onOpenChange,
}: {
  slot: LinkLessonSlot | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("PlannerView");
  const lessons = useLessonStore((s) => s.lessons);
  const units = useLessonStore((s) => s.units);
  const addScheduleForClass = useLessonStore((s) => s.addScheduleForClass);
  const classDataMap = useGradesStore((s) => s.classDataMap);

  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");

  // Har safar yangi slot ochilganda tanlov/qidiruv/filtr tozalanadi.
  useEffect(() => {
    setSearch("");
    setUnitFilter("all");
    setSelectedId("");
  }, [slot?.classId, slot?.dateKey, slot?.startMin]);

  const classInfo = slot ? classDataMap[slot.classId]?.info : undefined;
  const tints = classInfo ? classTints(classColor(classInfo)) : null;

  const slotUnits = useMemo(
    () => (slot ? units.filter((u) => u.classId === slot.classId) : []),
    [units, slot]
  );

  const candidates = useMemo(() => {
    if (!slot) return [];
    const q = search.trim().toLowerCase();
    return lessons.filter((l) =>
      lessonClassIds(l).includes(slot.classId) &&
      l.status !== "Completed" &&
      lessonSessions(l).every((s) => s.classId !== slot.classId) &&
      (unitFilter === "all" || unitIdForClass(l, slot.classId) === unitFilter) &&
      (!q || l.title.toLowerCase().includes(q))
    );
  }, [lessons, slot, search, unitFilter]);

  const save = () => {
    if (!slot || !selectedId) return;
    const linked = lessons.find((l) => l.id === selectedId);
    addScheduleForClass(selectedId, slot.classId, slot.dateKey, slot.startMin, slot.endMin);
    onOpenChange(false);
    toast.success(t("lessonLinkedToast"), { description: linked?.title });
  };

  return (
    <Dialog open={!!slot} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {classInfo ? t("linkToClassTitle", { name: classInfo.name }) : t("linkLessonTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("linkDialogDescription")}
            {slot ? ` · ${minToHHMM(slot.startMin)}–${minToHHMM(slot.endMin)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {slot && (
          <div className="flex flex-col gap-3 py-1">
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchLessonPlaceholder")}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 block text-label">{t("classLabel")}</Label>
                  <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                    {tints && <span style={tints.dot} className="size-2 shrink-0 rounded-[4px]" />}
                    <span className="truncate">{classInfo?.name}</span>
                  </div>
                </div>
                <div>
                  <Label className="mb-1 block text-label">{t("unit")}</Label>
                  <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-full" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allUnits")}</SelectItem>
                      {slotUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {candidates.length === 0 ? (
              <TypographyMuted className="rounded-lg border border-border/50 bg-muted/30 p-4 text-center text-sm">
                {t("noCandidatesFound")}
              </TypographyMuted>
            ) : (
              <ScrollArea className="max-h-[240px] pr-1">
                <div className="flex flex-col gap-1.5">
                  {candidates.map((l) => {
                    const sel = selectedId === l.id;
                    const uid = unitIdForClass(l, slot.classId);
                    const unitTitle = uid ? slotUnits.find((u) => u.id === uid)?.title : null;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setSelectedId(sel ? "" : l.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
                          sel
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-foreground/30"
                        )}
                      >
                        {tints && <span style={tints.dot} className="size-2 shrink-0 rounded-[4px]" />}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {l.title || t("untitled")}
                          </span>
                          {unitTitle && (
                            <span className="block truncate text-xs text-muted-foreground">{unitTitle}</span>
                          )}
                        </div>
                        <span
                          className={cn(
                            "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                            sel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {sel ? (
                            <>
                              <Check className="size-3.5" /> {t("selected")}
                            </>
                          ) : (
                            t("add")
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancelShort")}
          </Button>
          <Button onClick={save} disabled={!selectedId}>
            {t("link")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
