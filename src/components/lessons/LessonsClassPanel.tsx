"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { panelHeaderClass } from "@/components/DashboardPage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { ClassFormModal } from "@/components/ClassFormModal";
import ClassListPanel from "@/components/ClassListPanel";
import { classColor, type ClassInfo } from "@/lib/grades-data";
import { classTints } from "@/lib/class-colors";
import { classIcon, type ClassIconKey } from "@/lib/class-icons";
import { isTaught, lessonClassIds, lessonUnitIds, type Lesson, type Unit } from "@/lib/lessons-data";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiveClasses, useLiveClassesHydrated, classInfoFromForm, classFormInitial } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { useIsBelow } from "@/hooks/use-mobile";

type Props = {
  selectedClassId: string;
  onSelect: (id: string) => void;
  onAddClass: () => void;
  units: Unit[];
  lessons: Lesson[];
  demoClasses?: ClassInfo[];
};

/* Darslar sahifasining sinflar ustuni — har sinf kartasi: nom, ostida
   boʻlim/mavzu soni matnda, oʻngda qamrov halqasi (tooltipda boʻlimlar kesimi).
   Umumiy `ClassListPanel` boshqa sahifalarda ham ishlatilgani uchun unga
   tegilmaydi; mobil (`< lg`) Sheet koʻrinishi esa oʻshaning oʻzidan olinadi. */
export function LessonsClassPanel({ selectedClassId, onSelect, onAddClass, units, lessons, demoClasses }: Props) {
  const t = useTranslations("ClassListPanel");
  const tlp = useTranslations("LessonsPage");
  const real = useLiveClasses();
  const classes = demoClasses && real.length === 0 ? demoClasses : real;
  const hydrated = useLiveClassesHydrated();
  const updateClass = useGradesStore((s) => s.updateClass);
  const isCompact = useIsBelow("lg");
  const [editTarget, setEditTarget] = useState<ClassInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassInfo | null>(null);

  const stats = useMemo(() => {
    type UnitStat = { id: string; title: string; total: number; taught: number };
    const out = new Map<string, { units: number; lessons: number; taught: number; perUnit: UnitStat[] }>();
    for (const c of classes) out.set(c.id, { units: 0, lessons: 0, taught: 0, perUnit: [] });
    const unitStat = new Map<string, UnitStat>();
    const unitClass = new Map<string, string>();
    for (const u of [...units].sort((a, b) => a.number - b.number)) {
      const s = out.get(u.classId);
      if (!s) continue;
      s.units++;
      const us = { id: u.id, title: u.title, total: 0, taught: 0 };
      s.perUnit.push(us);
      unitStat.set(u.id, us);
      unitClass.set(u.id, u.classId);
    }
    for (const l of lessons) {
      for (const id of lessonClassIds(l)) {
        const taught = isTaught(l, id);
        const s = out.get(id);
        if (!s) continue;
        s.lessons++;
        if (taught) s.taught++;
      }
      for (const uid of lessonUnitIds(l)) {
        const us = unitStat.get(uid);
        if (!us) continue;
        us.total++;
        if (isTaught(l, unitClass.get(uid))) us.taught++;
      }
    }
    return out;
  }, [classes, units, lessons]);

  if (isCompact) {
    return (
      <ClassListPanel page="lessons" selectedClassId={selectedClassId} onSelect={onSelect} onAddClass={onAddClass} demoClasses={demoClasses} />
    );
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    updateClass(id, (cd) => ({ ...cd, info: { ...cd.info, archivedAt: new Date().toISOString() } }));
    setDeleteTarget(null);
    if (id === selectedClassId) {
      const next = classes.find((c) => c.id !== id);
      if (next) onSelect(next.id);
    }
    toast.success(t("toast.deleted", { name }), {
      action: {
        label: t("toast.undo"),
        onClick: () => updateClass(id, (cd) => {
          if (!cd.info.archivedAt) return cd;
          const info = { ...cd.info };
          delete info.archivedAt;
          return { ...cd, info };
        }),
      },
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
      <div className={cn(panelHeaderClass, "items-center justify-between gap-3")}>
        <div className="flex items-center gap-2 min-w-0">
          <SectionIcon><GraduationCap /></SectionIcon>
          <CardTitle className="truncate">{t("title")}</CardTitle>
          {classes.length > 0 && <span className="text-caption tabular-nums text-muted-foreground">{classes.length}</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
        {classes.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onAddClass} className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground" aria-label={t("addClass")}>
            <Plus className="size-4" aria-hidden="true" />
            {t("add")}
          </Button>
        )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
        <ScrollArea className="h-full w-full">
          <div className="px-3 pt-4 pb-5 space-y-2">
            {!hydrated && classes.length === 0 && Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
            ))}
            {hydrated && classes.length === 0 && (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia><Illustration name="23" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                  <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={onAddClass} className="gap-1.5"><Plus className="size-4" /> {t("addClass")}</Button>
                </EmptyContent>
              </Empty>
            )}
            {classes.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const tints = classTints(classColor(cls));
              const Icon = classIcon(cls.icon);
              const s = stats.get(cls.id) ?? { units: 0, lessons: 0, taught: 0, perUnit: [] };
              const segs = s.perUnit.filter((u) => u.total > 0);
              const pct = s.lessons ? Math.round((s.taught / s.lessons) * 100) : 0;
              return (
                <ContextMenu key={cls.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      onClick={() => onSelect(cls.id)}
                      className="list-card group w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                      data-active={isSelected || undefined}
                      aria-current={isSelected || undefined}
                      style={{ ["--card-accent" as string]: tints.solid, ...(isSelected ? tints.tint : {}) }}
                    >
                      <span
                        className="list-card-icon size-11 rounded-full shrink-0 flex items-center justify-center"
                        style={isSelected ? { ...tints.gradientTile, color: "white" } : { ...tints.badge, ...tints.iconText }}
                        aria-hidden="true"
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-body font-semibold text-foreground truncate flex-1">{cls.name}</span>
                        </span>
                        <span className="block text-caption text-muted-foreground truncate mt-0.5 tabular-nums">
                          {tlp("classMeta", { units: s.units, lessons: s.lessons })}
                        </span>
                      </span>
                      {/* Qamrov halqasi — oʻtilgan mavzular ulushi; tooltipda boʻlimlar kesimi. */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="relative size-10 shrink-0" aria-label={tlp("classCoverage", { pct })}>
                            <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
                              <circle
                                cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
                                stroke={tints.solid}
                                strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                                className="transition-all"
                                style={{ opacity: pct ? 1 : 0 }}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-tag font-semibold tabular-nums text-foreground">{pct}%</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="block">{tlp("classCoverage", { pct })}</span>
                          {segs.map((u) => (
                            <span key={u.id} className="block tabular-nums opacity-80">{tlp("unitSegTip", { title: u.title, taught: u.taught, total: u.total })}</span>
                          ))}
                        </TooltipContent>
                      </Tooltip>
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => setEditTarget(cls)}>
                      <Pencil className="size-4" />
                      {t("edit")}
                    </ContextMenuItem>
                    <ContextMenuItem variant="destructive" className="gap-2 cursor-pointer" onClick={() => setDeleteTarget(cls)}>
                      <Trash2 className="size-4" />
                      {t("delete")}
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {editTarget && (
        <ClassFormModal
          mode="edit"
          initial={{
            ...classFormInitial(editTarget),
            color: classColor(editTarget),
            icon: editTarget.icon as ClassIconKey | undefined,
            slots: [],
          }}
          onSubmit={(v) => {
            updateClass(editTarget.id, (cd) => ({ ...cd, info: classInfoFromForm(editTarget.id, v, cd.info) }));
            setEditTarget(null);
          }}
          onClose={() => setEditTarget(null)}
        />
      )}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget && t("deleteDialog.description", { name: deleteTarget.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleConfirmDelete}>
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
