"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ClipboardPaste, FilePlus2, FileSpreadsheet, FileText, Layers, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeaderBar, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLessonStore } from "@/store/useLessonStore";
import { ClassMultiPicker } from "@/components/ish-reja/ClassMultiPicker";
import { NameReviewList } from "@/components/ish-reja/NameReviewList";
import { ImportSummary, SourcePane, TemplateButton, useImportSource } from "@/components/ish-reja/ImportSource";

/* ════════════════════════════════════════════════════════════════════
   YANGI BOʻLIM — avval oʻquvchi qoʻshishdagi kabi tanlov: bitta boʻlim
   (batafsil oyna) / nusxa koʻchirish / Excel fayl. Keyingi ekran dars
   qoʻshish oynasining 1-bosqichi bilan bir xil: tepada sinflar, chapda
   manba (fayl boʻlsa — varaq/ustun moslash), oʻngda xulosa va jonli
   roʻyxat. Joriy sinfda shu nomli boʻlim bor boʻlsa — belgilanadi va
   oʻtkaziladi (boshqa sinflarda ham takror yaratilmaydi).
   Saqlangach toastdagi «Bekor qilish» butun importni qaytaradi.
   ════════════════════════════════════════════════════════════════════ */

export default function UnitImportModal({ classId, onDetailed, onCreated, onClose }: {
  classId: string;
  onDetailed: () => void;
  /** Joriy sinfdagi birinchi boʻlim id — sahifa shuni tanlaydi. */
  onCreated: (firstUnitId: string | null) => void;
  onClose: () => void;
}) {
  const t = useTranslations("UnitImport");
  const [step, setStep] = useState<"choice" | "list">("choice");
  const [source, setSource] = useState<"paste" | "upload">("paste");
  const [classIds, setClassIds] = useState<string[]>([classId]);
  const src = useImportSource("units", source);

  const units = useLessonStore((s) => s.units);
  const existing = useMemo(
    () => new Set(units.filter((u) => u.classId === classId).map((u) => u.title.toLowerCase().trim())),
    [units, classId],
  );
  const isDuplicate = (title: string) => existing.has(title.replace(/\s+/g, " ").trim().toLowerCase());
  const titles = [...new Set(src.rows.map((r) => r.title.replace(/\s+/g, " ").trim()).filter(Boolean))];
  const names = titles.filter((n) => !isDuplicate(n));
  const duplicateCount = titles.length - names.length;

  function save() {
    const store = useLessonStore.getState();
    const created: string[] = [];
    let first: string | null = null;
    for (const name of names) {
      for (const cid of classIds) {
        const found = useLessonStore.getState().units.find((u) => u.classId === cid && u.title === name);
        const id = found ? found.id : store.addUnit({ classId: cid, title: name });
        if (!found) created.push(id);
        if (cid === classId && !first) first = id;
      }
    }
    toast.success(t("savedToast", { count: names.length }), {
      duration: 8000,
      action: {
        label: t("undo"),
        onClick: () => {
          const st = useLessonStore.getState();
          created.forEach((id) => st.deleteUnit(id, { withLessons: false }));
          toast(t("undoneToast"));
        },
      },
    });
    onCreated(first);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn("flex flex-col gap-0 overflow-hidden p-0", step === "choice" ? "sm:max-w-2xl" : "h-[min(780px,92vh)] sm:max-w-6xl")}
      >
        <DialogHeaderBar
          icon={<Layers className="size-[18px]" aria-hidden />}
          title={t("title")}
          description={t(step === "choice" ? "choiceDescription" : "description")}
        />

        {step === "choice" && (
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">
            {([
              { key: "single", icon: <FilePlus2 className="size-6" />, onClick: onDetailed },
              { key: "paste", icon: <ClipboardPaste className="size-6" />, onClick: () => { setSource("paste"); setStep("list"); } },
              { key: "file", icon: <FileSpreadsheet className="size-6" />, onClick: () => { setSource("upload"); setStep("list"); } },
            ] as const).map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.onClick}
                className="flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center transition-colors duration-fast ease-standard hover:border-primary hover:bg-primary/5"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">{c.icon}</span>
                <span className="heading-small">{t(`choice.${c.key}Title`)}</span>
                <span className="text-caption leading-snug">{t(`choice.${c.key}Description`)}</span>
              </button>
            ))}
          </div>
        )}

        {step === "list" && (
          <>
            <div className="shrink-0 px-5 pt-5">
              <ClassMultiPicker label={t("classesLabel")} placeholder={t("classesPlaceholder")} value={classIds} onChange={setClassIds} />
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
              <div className="flex min-h-0 flex-col gap-3 p-5">
                <SourcePane src={src} placeholder={t("pastePlaceholder")} />
              </div>
              <div className="flex min-h-0 flex-col gap-3 p-5">
                <ImportSummary src={src} duplicates={duplicateCount} />
                {src.rows.length > 0 ? (
                  <NameReviewList
                    rows={src.rows}
                    onChange={src.setRows}
                    isMuted={(r) => isDuplicate(r.title)}
                    badge={(r) => (isDuplicate(r.title) ? t("duplicateBadge") : null)}
                    label={t("listLabel", { count: names.length })}
                    placeholder={t("namePlaceholder")}
                    deleteLabel={t("deleteRow")}
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                    <ListOrdered className="size-6 text-muted-foreground" />
                    <span className="text-caption">{t("listEmpty")}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-muted/20">
          {step === "choice" ? (
            <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          ) : (
            <>
              {source === "upload" && <TemplateButton kind="units" example={t("pastePlaceholder").split("\n")} />}
              {source === "paste" && (
                <p className="flex items-start gap-2 self-center text-caption sm:mr-auto">
                  <FileText className="mt-0.5 size-3.5 shrink-0" />
                  {t("pasteHint")}
                </p>
              )}
              <Button variant="ghost" onClick={() => setStep("choice")}>{t("back")}</Button>
              <Button disabled={!names.length || !classIds.length} onClick={save}>{t("confirm", { count: names.length })}</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
