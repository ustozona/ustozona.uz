"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDownIcon, Download as DownloadIcon, Trash2 as TrashIcon, ArchiveRestore } from "lucide-react";
import { unwrap } from "@/lib/action-result";
import {
  listTrashedClassesAction,
  previewClassTrashAction,
  purgeClassesNowAction,
  restoreClassesAction,
  trashClassesAction,
} from "@/server/actions/class-trash";
import { TRASH_DAYS, type ClassTrashPreview, type TrashedClass } from "@/lib/class-trash";
import { reloadGradesFromServer } from "@/components/sync/GradesServerSync";
import { useGradesStore } from "@/store/useGradesStore";
import { classColor, type ClassData } from "@/lib/grades-data";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { classIcon } from "@/lib/class-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   SINF SAVATI — UI (qoidalar: dal/class-trash.ts).

   Faol → arxiv → savat (7 kun) → butunlay. Oʻchirish tugmasi faqat
   arxivdagi sinfda turadi. Savatga tashlash va tiklash OʻZ server
   amali orqali boʻladi, keyin store `reloadGradesFromServer` bilan
   yangilanadi — store'ni qoʻlda tahrirlash sync diff'ini aldardi.
   ════════════════════════════════════════════════════════════════════ */

/** Butunlay oʻchishdan oldin — sinf jurnalini Excel'ga (har sinf alohida varaq). */
async function exportGradebooks(list: ClassData[]): Promise<void> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const cd of list) {
    const pupils = [...cd.students, ...(cd.formerStudents ?? [])];
    const rows = pupils.map((s) => {
      const row: Record<string, string | number> = { "": s.name };
      for (const a of cd.assignments) {
        const g = cd.grades.find((x) => x.studentId === s.id && x.assignmentId === a.id);
        const head = a.date ? `${a.title} (${a.date})` : a.title;
        row[head] = g?.score ?? (g?.missing ?? "");
      }
      return row;
    });
    let sheet = cd.info.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 28) || "Sinf";
    while (used.has(sheet)) sheet = `${sheet.slice(0, 26)}_${used.size}`;
    used.add(sheet);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet);
  }
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `ustozona-jurnal-${date}.xlsx`);
}

/* ─────────────────────────── Savatga tashlash ─────────────────────────── */

export function TrashClassDialog({
  targets,
  onClose,
  onDone,
}: {
  /** null = yopiq. */
  targets: { id: string; name: string }[] | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("ClassesPage");
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const [preview, setPreview] = useState<ClassTrashPreview[] | null>(null);
  const [busy, setBusy] = useState(false);

  /* Dialog oqibatni raqam bilan aytishi uchun avval server soʻraladi.
     Javob kelmaguncha tasdiq tugmasi yoʻq — taxminiy matn koʻrsatilmaydi. */
  useEffect(() => {
    setPreview(null);
    if (!targets || targets.length === 0) return;
    let alive = true;
    previewClassTrashAction({ classIds: targets.map((c) => c.id) })
      .then((r) => alive && setPreview(unwrap(r)))
      .catch(() => {
        if (!alive) return;
        toast.error(t("trashError"));
        onClose();
      });
    return () => {
      alive = false;
    };
  }, [targets, t, onClose]);

  const trash = preview?.filter((p) => p.mode === "trash") ?? [];
  const leave = preview?.filter((p) => p.mode === "leave") ?? [];
  const sum = (k: "students" | "grades" | "attendance") => trash.reduce((s, p) => s + p[k], 0);
  const coTeachers = [...new Set(trash.flatMap((p) => p.otherTeachers))];
  const onlyLeave = !!preview && trash.length === 0 && leave.length > 0;

  const confirm = async () => {
    if (!preview || busy) return;
    const ids = [...trash, ...leave].map((p) => p.classId);
    if (ids.length === 0) return onClose();
    setBusy(true);
    try {
      const res = unwrap(await trashClassesAction({ classIds: ids }));
      await reloadGradesFromServer();
      if (res.trashed > 0) {
        toast.success(
          res.trashed === 1 && trash[0]
            ? t("trashToast", { name: trash[0].name, days: TRASH_DAYS })
            : t("trashBulkToast", { count: res.trashed, days: TRASH_DAYS })
        );
      }
      if (res.left > 0) toast.success(t("leaveToast", { count: res.left }));
      onDone();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("trashError"));
    } finally {
      setBusy(false);
    }
  };

  const exportable = trash.map((p) => classDataMap[p.classId]).filter((cd): cd is ClassData => !!cd);

  return (
    <AlertDialog open={!!targets} onOpenChange={(o) => !o && !busy && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{onlyLeave ? t("leaveDialogTitle") : t("trashDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              {!preview ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  {t("trashLoading")}
                </span>
              ) : (
                <>
                  {trash.length > 0 && (
                    <p>
                      {trash.length === 1
                        ? t("trashDialogLead", { name: trash[0].name, days: TRASH_DAYS })
                        : t("trashDialogLeadBulk", { count: trash.length, days: TRASH_DAYS })}
                    </p>
                  )}
                  {trash.length > 0 && (sum("students") > 0 || sum("grades") > 0 || sum("attendance") > 0) && (
                    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                      <p className="font-medium text-foreground">{t("trashImpactTitle", { days: TRASH_DAYS })}</p>
                      <ul className="mt-1.5 list-disc pl-5 tabular-nums">
                        {sum("students") > 0 && <li>{t("trashImpactStudents", { count: sum("students") })}</li>}
                        {sum("grades") > 0 && <li>{t("trashImpactGrades", { count: sum("grades") })}</li>}
                        {sum("attendance") > 0 && <li>{t("trashImpactAttendance", { count: sum("attendance") })}</li>}
                      </ul>
                    </div>
                  )}
                  {coTeachers.length > 0 && <p>{t("trashCoTeachers", { names: coTeachers.join(", ") })}</p>}
                  {leave.length > 0 && (
                    <p>
                      {leave.length === 1
                        ? t("leaveNoteOne", { name: leave[0].name })
                        : t("leaveNoteBulk", { count: leave.length })}
                    </p>
                  )}
                  {exportable.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start gap-1.5"
                      onClick={() => exportGradebooks(exportable).catch(() => toast.error(t("trashError")))}
                    >
                      <DownloadIcon className="size-4" />
                      {t("trashExport")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
          {preview && trash.length + leave.length > 0 && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirm();
              }}
              disabled={busy}
              /* Darsdan chiqish qaytariladigan amal — qizil tugma uni
                 haqiqatdan xavfliroq koʻrsatardi. */
              className={onlyLeave ? undefined : "bg-destructive text-white hover:bg-destructive/90"}
            >
              {busy && <Spinner className="size-4" />}
              {onlyLeave ? t("leaveConfirm") : t("delete")}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─────────────────────────── Savat boʻlimi ─────────────────────────── */

export function TrashedClassesSection({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations("ClassesPage");
  const [items, setItems] = useState<TrashedClass[]>([]);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TrashedClass | null>(null);
  const [typed, setTyped] = useState("");

  const load = useCallback(() => {
    listTrashedClassesAction()
      .then((r) => setItems(unwrap(r)))
      .catch(() => {});
  }, []);
  useEffect(load, [load, refreshKey]);

  const restore = async (c: TrashedClass) => {
    setBusyId(c.id);
    try {
      unwrap(await restoreClassesAction({ classIds: [c.id] }));
      await reloadGradesFromServer();
      toast.success(t("trashRestoreToast", { name: c.name }));
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("trashError"));
    } finally {
      setBusyId(null);
    }
  };

  const purge = async () => {
    const c = purgeTarget;
    if (!c || typed.trim() !== c.name.trim()) return;
    setBusyId(c.id);
    try {
      unwrap(await purgeClassesNowAction({ classIds: [c.id] }));
      toast.success(t("purgeToast", { name: c.name }));
      setPurgeTarget(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("trashError"));
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-t border-border pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <TrashIcon className="size-4" />
        {t("trashSection")}
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{items.length}</span>
        <ChevronDownIcon className={cn("ml-auto size-4 transition-transform duration-fast ease-standard", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("trashSectionHint", { days: TRASH_DAYS })}</p>
          {items.map((c) => {
            const hex = CLASS_COLOR_HEX[classColor({ id: c.id, name: c.name, color: (c.color ?? undefined) as ClassColor | undefined })];
            const Icon = classIcon(c.icon ?? undefined);
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `color-mix(in oklch, ${hex} 12%, transparent)` }}
                >
                  <Icon className="size-4" style={{ color: hex }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.daysLeft > 0 ? t("trashPurgeIn", { count: c.daysLeft }) : t("trashPurgeToday")}
                    {c.deletedByName ? ` · ${t("trashDeletedBy", { name: c.deletedByName })}` : ""}
                  </p>
                </div>
                {c.canManage && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyId === c.id}
                      onClick={() => {
                        setTyped("");
                        setPurgeTarget(c);
                      }}
                    >
                      {t("purgeNow")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      disabled={busyId === c.id}
                      onClick={() => restore(c)}
                    >
                      <ArchiveRestore className="size-4" />
                      {t("restore")}
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Qaytarib boʻlmaydigan amal — nomni qoʻlda yozib tasdiqlash. */}
      <AlertDialog open={!!purgeTarget} onOpenChange={(o) => !o && !busyId && setPurgeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("purgeDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {purgeTarget && t("purgeDialogBody", { name: purgeTarget.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {purgeTarget && (
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">{t("purgeTypeLabel", { name: purgeTarget.name })}</span>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            </label>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyId}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void purge();
              }}
              disabled={!purgeTarget || typed.trim() !== purgeTarget.name.trim() || !!busyId}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busyId && <Spinner className="size-4" />}
              {t("purgeConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
