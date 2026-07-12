"use client";

import * as React from "react";
import Link from "next/link";
import { Award, History, Settings2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { panelCardClass } from "@/components/DashboardPage";
import { confettiPresets } from "@/lib/confetti-presets";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classBalance, type BehaviorSkill } from "@/lib/behavior-data";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useMounted } from "@/lib/use-mounted";
import { AwardDialog } from "./AwardDialog";
import {
  AwardConfirmation,
  type AwardConfirmationData,
} from "./AwardConfirmation";
import { ClassReportDialog } from "./ClassReportDialog";
import { PointsSheet } from "./PointsSheet";
import { SkillFormDialog, type SkillType } from "./SkillFormDialog";
import { StudentDialog } from "./StudentDialog";
import { BalanceBubble, StudentPointCard } from "./StudentPointCard";

/* ════════════════════════════════════════════════════════════════════
   XULQ koʻrinishi — oʻquvchi kartochkalari toʻri (ClassDojo UX).

   Birinchi karta = "Sinf" (butun sinfga ball berish); qolganlari
   oʻquvchilar (bubble = balans). Kartani bosish → ball berish modali;
   koʻnikma tanlangach markaziy tasdiq kartasi (undo bilan) chiqadi.

   Multi-select: karta hover'ida doiracha → tanlash rejimi; pastki
   panel orqali tanlanganlarga birga ball beriladi. "Sinf" kartasi
   rejimda disabled.

   Roster read-only: useGradesStore.classDataMap (archived'lar chiqmaydi).
   Baholar tizimiga hech qanday yozuv YOʻQ.
   ════════════════════════════════════════════════════════════════════ */

type AwardTarget = {
  studentIds: string[];
  /** Modal sarlavhasi va tasdiqdagi obyekt yorligʻi uchun. */
  label: string;
  /** Guruhga berish (sinf yoki 2+ tanlov) — sarlavha va konfetti turi. */
  isGroup: boolean;
};

const EMPTY_EVENTS: never[] = [];

export default function BehaviorView({ classId }: { classId: string }) {
  const mounted = useMounted();

  const skills = useBehaviorStore((s) => s.skills);
  const events = useBehaviorStore((s) => s.eventsByClass[classId]) ?? EMPTY_EVENTS;
  const redemptions = useBehaviorStore((s) => s.redemptions);
  const awardPoints = useBehaviorStore((s) => s.awardPoints);
  const removeEvents = useBehaviorStore((s) => s.removeEvents);

  const gradesClass = useGradesStore((s) => s.classDataMap[classId]);
  const students = React.useMemo(
    () => (gradesClass?.students ?? []).filter((st) => st.status !== "archived"),
    [gradesClass]
  );
  const info = gradesClass?.info ?? { id: classId, name: classId };
  const hex = CLASS_COLOR_HEX[classColor(info)];

  /* Balanslar — bitta oʻtishda (Σ events − Σ redemptions), mount-gate. */
  const balances = React.useMemo(() => {
    if (!mounted) return null;
    const map = new Map<string, number>();
    for (const e of events) map.set(e.studentId, (map.get(e.studentId) ?? 0) + e.points);
    for (const r of redemptions) {
      if (r.classId !== classId) continue;
      map.set(r.studentId, (map.get(r.studentId) ?? 0) - r.cost);
    }
    return map;
  }, [mounted, events, redemptions, classId]);

  const classTotal = React.useMemo(() => {
    if (!mounted) return null;
    return classBalance(events, redemptions.filter((r) => r.classId === classId));
  }, [mounted, events, redemptions, classId]);

  const [target, setTarget] = React.useState<AwardTarget | null>(null);
  const [confirmation, setConfirmation] = React.useState<AwardConfirmationData | null>(null);
  const undoRef = React.useRef<{ eventIds: string[] } | null>(null);

  /* Tanlash rejimi: null = oʻchiq; Set = tanlangan oʻquvchi idlari. */
  const [selected, setSelected] = React.useState<Set<string> | null>(null);
  const selecting = selected !== null;

  /* AwardDialog/StudentDialog ichidagi "+ Koʻnikma qoʻshish" shortcuti. */
  const [skillForm, setSkillForm] = React.useState<SkillType | null>(null);

  /* Bitta-oʻquvchi modali (chap nav) va "Ballar" yon paneli. */
  const [activeStudentId, setActiveStudentId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const activeStudent = React.useMemo(() => {
    const st = students.find((s) => s.id === activeStudentId);
    return st ? { id: st.id, name: st.name, initials: st.initials } : null;
  }, [students, activeStudentId]);

  const toggleSelect = (studentId: string) =>
    setSelected((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });

  const openForClass = () =>
    setTarget({
      studentIds: students.map((s) => s.id),
      label: `${students.length} ta oʻquvchi`,
      isGroup: true,
    });

  const openForSelection = () => {
    if (!selected || selected.size === 0) return;
    // Roster tartibida — tasodifiy Set-tartibga tayanmaslik uchun.
    const picked = students.filter((s) => selected.has(s.id));
    if (picked.length === 0) return;
    setTarget({
      studentIds: picked.map((s) => s.id),
      label: picked.length === 1 ? picked[0].name : `${picked.length} ta oʻquvchi`,
      isGroup: picked.length > 1,
    });
  };

  /* Yagona yozish yoʻli — AwardDialog ham, StudentDialog ham shu orqali. */
  const performAward = (t: AwardTarget, skill: BehaviorSkill, el: HTMLElement) => {
    const eventIds = awardPoints(classId, t.studentIds, skill);
    if (eventIds.length === 0) return;

    if (skill.points > 0) {
      if (t.isGroup) confettiPresets.sideCannons();
      else confettiPresets.fromElement(el);
    }

    undoRef.current = { eventIds };
    setConfirmation({
      key: eventIds.join(","),
      targetLabel: t.label,
      count: eventIds.length,
      skillName: skill.name,
      emoji: skill.emoji,
      points: skill.points,
    });
    setSelected(null);
  };

  const handleSelectSkill = (skill: BehaviorSkill, el: HTMLElement) => {
    if (!target) return;
    performAward(target, skill, el);
    setTarget(null);
  };

  const handleStudentDialogAward = (skill: BehaviorSkill, el: HTMLElement) => {
    if (!activeStudent) return;
    performAward(
      { studentIds: [activeStudent.id], label: activeStudent.name, isGroup: false },
      skill,
      el
    );
    setActiveStudentId(null);
  };

  const handleUndo = () => {
    if (undoRef.current) removeEvents(classId, undoRef.current.eventIds);
    undoRef.current = null;
  };

  return (
    <Card className={panelCardClass}>
      {/* Panel header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-4">
        <SectionIcon>
          <Award aria-hidden />
        </SectionIcon>
        <div className="min-w-0 flex-1">
          <h3 className="heading-small truncate">Xulq</h3>
          <TypographyMuted className="text-xs">
            Ball berish va ragʻbatlantirish
          </TypographyMuted>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={() => setSheetOpen(true)}
        >
          <History className="size-4" aria-hidden />
          Ballar
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" asChild className="size-8 shrink-0">
              <Link href="/dashboard/settings?section=xulq">
                <Settings2 className="size-4" aria-hidden />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Koʻnikmalar va doʻkon — Sozlamalar</TooltipContent>
        </Tooltip>
      </div>

      {/* Kartochkalar toʻri */}
      <ScrollArea className="min-h-0 flex-1">
        {students.length === 0 ? (
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>Oʻquvchilar yoʻq</EmptyTitle>
              <EmptyDescription>
                Ball berish uchun avval &quot;Oʻquvchilar&quot; boʻlimida sinfga
                oʻquvchi qoʻshing.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {/* "Sinf" kartasi — butun sinfga ball berish; rejimda disabled */}
            <button
              type="button"
              onClick={openForClass}
              disabled={selecting}
              className={cn(
                "flex flex-col items-center gap-2.5 rounded-xl border border-border px-3 py-4",
                "cursor-pointer transition-all hover:ring-2 hover:ring-inset hover:ring-primary/30",
                "active:scale-[0.97]",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:ring-0 disabled:active:scale-100"
              )}
              style={{ backgroundColor: `color-mix(in srgb, ${hex} 8%, var(--card))` }}
            >
              <span className="relative inline-flex">
                <span
                  className="flex size-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${hex} 18%, var(--card))` }}
                >
                  <Users className="size-6" style={{ color: hex }} aria-hidden />
                </span>
                {classTotal !== null && classTotal !== 0 && (
                  <BalanceBubble balance={classTotal} />
                )}
              </span>
              <span className="w-full truncate text-center text-[13px] font-semibold leading-tight text-foreground">
                Sinf
              </span>
            </button>

            {students.map((st) => (
              <StudentPointCard
                key={st.id}
                name={st.name}
                initials={st.initials}
                colorHex={hex}
                balance={balances?.get(st.id) ?? (balances ? 0 : null)}
                selectionMode={selecting}
                selected={selected?.has(st.id) ?? false}
                onToggleSelect={() => toggleSelect(st.id)}
                onClick={() => setActiveStudentId(st.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Tanlash paneli — rejim yoqiq boʻlsa pastda */}
      {selecting && (
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-border px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set(students.map((s) => s.id)))}
          >
            Hammasini tanlash
          </Button>
          <TypographyMuted className="text-xs tabular-nums">
            {selected.size} ta tanlandi
          </TypographyMuted>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Bekor qilish
            </Button>
            <Button size="sm" disabled={selected.size === 0} onClick={openForSelection}>
              Ball berish
            </Button>
          </div>
        </div>
      )}

      <AwardDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title={
          target?.isGroup
            ? `${target.studentIds.length} ta oʻquvchiga ball berish`
            : `${target?.label ?? ""}ga ball berish`
        }
        skills={skills}
        onSelect={handleSelectSkill}
        onAddSkill={(type) => setSkillForm(type)}
      />

      <SkillFormDialog
        open={skillForm !== null}
        onOpenChange={(open) => {
          if (!open) setSkillForm(null);
        }}
        defaultType={skillForm ?? "positive"}
      />

      <StudentDialog
        open={activeStudent !== null}
        onOpenChange={(open) => {
          if (!open) setActiveStudentId(null);
        }}
        classId={classId}
        student={activeStudent}
        colorHex={hex}
        onAward={handleStudentDialogAward}
        onAddSkill={(type) => setSkillForm(type)}
      />

      <PointsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        classId={classId}
        students={students}
        onOpenReport={() => {
          setSheetOpen(false);
          setReportOpen(true);
        }}
      />

      <ClassReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        classId={classId}
        students={students}
        colorHex={hex}
      />

      {confirmation && (
        <AwardConfirmation
          data={confirmation}
          onUndo={handleUndo}
          onDismiss={() => setConfirmation(null)}
        />
      )}
    </Card>
  );
}
