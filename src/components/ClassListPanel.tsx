"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { GraduationCap, Plus, ArrowUpRight, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { classColor } from "@/lib/grades-data";
import { useLiveClasses, useLiveClassesHydrated, useCreateClass, classInfoFromForm } from "@/hooks/useLiveClasses";
import { classTints } from "@/lib/class-colors";
import { useGradesStore } from "@/store/useGradesStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassFormModal } from "@/components/ClassFormModal";
import type { ClassIconKey } from "@/lib/class-icons";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { useClassPanelStats, type Page } from "@/hooks/useClassPanelStats";
import type { ClassInfo } from "@/lib/grades-data";

type Props = {
  page: Page;
  selectedClassId: string;
  onSelect: (id: string) => void;
  onAddClass?: () => void;
  /** Tur (product tour) uchun: roʻyxat boʻsh boʻlsa shu namunaviy sinflar koʻrsatiladi. */
  demoClasses?: ClassInfo[];
};

export default function ClassListPanel({
  page,
  selectedClassId,
  onSelect,
  onAddClass,
  demoClasses,
}: Props) {
  const t = useTranslations("ClassListPanel");
  const liveClassesReal = useLiveClasses();
  const liveClasses = demoClasses && liveClassesReal.length === 0 ? demoClasses : liveClassesReal;
  const hydrated = useLiveClassesHydrated();
  const createClass = useCreateClass();
  const updateClass = useGradesStore((s) => s.updateClass);
  const selected = liveClasses.find((c) => c.id === selectedClassId);
  const tints = selected ? classTints(classColor(selected)) : undefined;

  const stats = useClassPanelStats(page, selectedClassId);
  const showStats = !!(selected && tints && stats);

  // onAddClass berilmasa (koʻp sahifada shunday) — panel oʻzi sinf yaratish
  // modalini boshqaradi, "Sinflar" boʻlimiga sakrash oʻrniga.
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const handleAddClass = onAddClass ?? (() => setInternalModalOpen(true));

  // Context-menu: tahrirlash (modal) va oʻchirish (arxivlash — doim alert +
  // toast'dagi "Bekor qilish" orqali undo, hard-delete emas).
  const [editTarget, setEditTarget] = useState<ClassInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassInfo | null>(null);

  const handleRestoreClass = (id: string) => {
    updateClass(id, (cd) => {
      if (!cd.info.archivedAt) return cd;
      const info = { ...cd.info };
      delete info.archivedAt;
      return { ...cd, info };
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    updateClass(id, (cd) => ({ ...cd, info: { ...cd.info, archivedAt: new Date().toISOString() } }));
    setDeleteTarget(null);
    if (id === selectedClassId) {
      const next = liveClasses.find((c) => c.id !== id);
      if (next) onSelect(next.id);
    }
    toast.success(t("toast.deleted", { name }), {
      action: { label: t("toast.undo"), onClick: () => handleRestoreClass(id) },
    });
  };

  // Footer — sidebardagidek foydalanuvchi yopib/ochib qoʻyadigan holat, localStorage'da saqlanadi.
  const [footerOpen, setFooterOpen] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("class-panel-footer-open");
    if (saved !== null) setFooterOpen(saved === "1");
  }, []);
  const toggleFooter = () => {
    setFooterOpen((prev) => {
      const next = !prev;
      localStorage.setItem("class-panel-footer-open", next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header */}
        <div className="flex min-h-16 items-center justify-between shrink-0 gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <SectionIcon><GraduationCap /></SectionIcon>
            <CardTitle className="truncate">{t("title")}</CardTitle>
          </div>
          {liveClasses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddClass}
              className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
              aria-label={t("addClass")}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("add")}
            </Button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
          <ScrollArea className="h-full w-full">
            <div className="px-3 pt-4 pb-5 space-y-1">
              {!hydrated && liveClasses.length === 0 && (
                <div className="space-y-2 pt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-lg" />
                  ))}
                </div>
              )}
              {hydrated && liveClasses.length === 0 && (
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyMedia><Illustration name="23" className="h-32 text-black dark:text-white" /></EmptyMedia>
                    <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                    <EmptyDescription>
                      {t("emptyDescription")}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={handleAddClass} className="gap-1.5">
                      <Plus className="size-4" /> {t("addClass")}
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
              {liveClasses.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                const color = classColor(cls);
                const rowTints = classTints(color);

                // Karta pasporti v2: BITTA andoza — tanlov faqat tint fon +
                // 3px rail + qalinroq matn orqali; geometriya (balandlik,
                // ikonka) oʻzgarmaydi (morf yoʻq).
                return (
                  <ContextMenu key={cls.id}>
                    <ContextMenuTrigger asChild>
                      <button
                        onClick={() => onSelect(cls.id)}
                        style={isSelected ? { ["--card-accent" as string]: rowTints.solid, ...rowTints.tint } : undefined}
                        className="list-row group w-full"
                        data-active={isSelected || undefined}
                        aria-current={isSelected || undefined}
                      >
                        <span className="size-2.5 rounded-[4px] shrink-0" style={rowTints.dot} />
                        <span className={cn(
                          "text-sm truncate flex-1 transition-colors",
                          isSelected ? "font-semibold text-foreground" : "text-foreground/70 group-hover:text-foreground"
                        )}>
                          {cls.name}
                        </span>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem className="gap-2 cursor-pointer" onClick={() => setEditTarget(cls)}>
                        <Pencil className="size-4" />
                        {t("edit")}
                      </ContextMenuItem>
                      <ContextMenuItem
                        variant="destructive"
                        className="gap-2 cursor-pointer"
                        onClick={() => setDeleteTarget(cls)}
                      >
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

        {/* Footer — tanlangan sinf; foydalanuvchi sidebardagidek ochib/yopib qoʻyadi (localStorage'da saqlanadi) */}
        {showStats && (
          <div className="border-t border-border shrink-0">
            <div className="flex items-center gap-3 px-4 py-3">
              <Link
                href={`/dashboard/classes/${selected!.id}`}
                title={t("openClass")}
                className="relative group/icon size-9 rounded-full shrink-0 flex items-center justify-center text-white overflow-hidden"
                style={tints!.gradientTile}
              >
                <GraduationCap
                  className="relative size-4 transition-opacity duration-fast group-hover/icon:opacity-0"
                  aria-hidden="true"
                />
                <ArrowUpRight
                  className="size-4 absolute inset-0 m-auto opacity-0 transition-opacity duration-fast group-hover/icon:opacity-100"
                  aria-hidden="true"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{selected!.name}</h4>
                {selected!.time && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{selected!.time}</p>
                )}
              </div>
              <button
                onClick={toggleFooter}
                title={footerOpen ? t("hideStats") : t("showStats")}
                aria-expanded={footerOpen}
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronDown className={cn("size-4 transition-transform duration-fast", footerOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </div>
            {footerOpen && (
              <div className="px-4 pb-4">
                <div className="flex items-start divide-x divide-border">
                  {stats!.items.map((item, i) => (
                    <div key={i} className="flex-1 min-w-0 px-3 first:pl-0 last:pr-0 text-center">
                      <p className="text-xs text-muted-foreground truncate">{item.label}:</p>
                      <p className="text-sm font-bold tabular-nums text-foreground mt-1">{t("countSuffix", { value: item.value })}</p>
                    </div>
                  ))}
                </div>
                {stats!.progress && (
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{stats!.progress.label}</span>
                      <span className="font-bold tabular-nums text-foreground">{Math.round(stats!.progress.value)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(stats!.progress.value, 100)}%`, backgroundColor: tints!.solid }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {internalModalOpen && (
        <ClassFormModal
          mode="create"
          onSubmit={(v) => { onSelect(createClass(v)); setInternalModalOpen(false); }}
          onClose={() => setInternalModalOpen(false)}
        />
      )}

      {editTarget && (
        <ClassFormModal
          mode="edit"
          initial={{
            name: editTarget.name,
            grade: editTarget.grade ?? null,
            subject: editTarget.subject ?? "",
            color: classColor(editTarget),
            icon: editTarget.icon as ClassIconKey | undefined,
            description: editTarget.description ?? "",
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
            <AlertDialogDescription>
              {deleteTarget && t("deleteDialog.description", { name: deleteTarget.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
