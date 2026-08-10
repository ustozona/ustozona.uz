"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft, ChevronRight, Download, FileSpreadsheet, FileText,
  GraduationCap, Plus, Trash2, Users, X,
} from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { FileUploadStruc } from "@/components/shadcn-space/file-upload/file-upload-01";
import {
  CLASS_IMPORT_PLACEHOLDER, countUnassigned, downloadSampleClassCsv, groupByClass,
  parseClassList, parseSpreadsheetFile, rosterInitials, type ParsedClass,
} from "@/lib/import-roster";
import { displayClassName, parseClassName } from "@/lib/class-naming";
import { useCreateClass, useLiveClasses } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import { DEFAULT_CLASS_ICON } from "@/lib/class-icons";
import { ClassSwatch } from "@/components/ClassSwatch";
import type { Student } from "@/lib/grades-data";

type Step = "choice" | "paste" | "file" | "review";

/** Koʻrib chiqish jadvalining bitta qatori. */
type Row = ParsedClass & { id: string };

const PALETTE = (Object.keys(CLASS_COLOR_HEX) as ClassColor[]).filter((c) => c !== "gray");

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Import tugagach birinchi yaratilgan sinfga oʻtish uchun. */
  onDone?: (firstClassId: string) => void;
};

/** Sinflarni koʻplab import qilish — «Yangi oʻquvchi» modalining aynan
 *  juftligi (tanlov → kirish → koʻrib chiqish → tasdiq).
 *
 *  Ikki kirish shakli:
 *    · matn — har qatorda sinf nomi, oʻquvchisiz;
 *    · fayl — «Sinf» ustuni bor jadval, sinf ham, oʻquvchilari ham.
 *
 *  ⚠️ NOMI BOR SINF QAYTA YARATILMAYDI. Moslik `displayClassName` dan
 *  keyingi kanonik nom boʻyicha tekshiriladi, yaʼni «5 а» (kirill) ham,
 *  «5-A» ham mavjud «5-A» ga tushadi. Oʻquvchilar oʻsha sinfga
 *  QOʻSHILADI — bu import odatda ikki marta bosiladi (birinchisi yarim
 *  qolgan fayl bilan), va har safar sinflar koʻpayib ketmasligi kerak. */
export function ImportClassesModal({ open, onOpenChange, onDone }: Props) {
  const t = useTranslations("ImportClassesModal");
  const liveClasses = useLiveClasses();
  const createClass = useCreateClass();
  const updateClass = useGradesStore((s) => s.updateClass);

  const [step, setStep] = useState<Step>("choice");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [source, setSource] = useState<"paste" | "file">("paste");
  const [unassigned, setUnassigned] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("choice");
    setText("");
    setRows([]);
    setSource("paste");
    setUnassigned(0);
    setFileError(null);
  }, [open]);

  /** Mavjud sinflar — kanonik nom → id. */
  const existingByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of liveClasses) map.set(c.name.trim().toLowerCase(), c.id);
    return map;
  }, [liveClasses]);

  const withIds = (parsed: ParsedClass[]): Row[] =>
    parsed.map((c, i) => ({ ...c, id: `cls-${Date.now()}-${i}` }));

  const previewCount = useMemo(() => parseClassList(text).length, [text]);

  const goReviewFromText = () => {
    const parsed = parseClassList(text);
    if (parsed.length === 0) return;
    setSource("paste");
    setUnassigned(0);
    setRows(withIds(parsed));
    setStep("review");
  };

  const processFile = async (file: File) => {
    setFileError(null);
    try {
      const students = await parseSpreadsheetFile(file);
      const grouped = groupByClass(students);
      if (grouped.length === 0) {
        setFileError(t("fileErrorNoClass"));
        return;
      }
      setSource("file");
      setUnassigned(countUnassigned(students));
      setRows(withIds(grouped));
      setStep("review");
    } catch {
      setFileError(t("fileErrorParse"));
    }
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const renameRow = (id: string, name: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));

  /** Nomi boʻsh qatorlar tashlab yuboriladi. */
  const validRows = rows.filter((r) => r.name.trim().length > 0);
  const isExisting = (name: string) => existingByName.has(name.trim().toLowerCase());
  const newCount = validRows.filter((r) => !isExisting(r.name)).length;
  const existingCount = validRows.length - newCount;
  const studentCount = validRows.reduce((n, r) => n + r.students.length, 0);

  const submit = () => {
    if (validRows.length === 0) return;
    let firstId: string | null = null;
    // Shu chaqiruv davomida yaratilganlar. `existingByName` render paytida
    // hisoblangan va sikl ichida yangilanmaydi — qoʻlda ikkita qatorga bir
    // xil nom yozilsa ikkita sinf ochilib ketardi.
    const created = new Map<string, string>();

    validRows.forEach((row, i) => {
      // Nomi qoʻlda tahrirlangan boʻlishi mumkin — kanonik shaklga
      // qaytaramiz, aks holda «5 a» yozilsa ikkinchi sinf paydo boʻladi.
      const parts = parseClassName(row.name);
      const name = displayClassName(parts) || row.name.trim();
      const key = name.toLowerCase();
      const existingId = existingByName.get(key) ?? created.get(key);

      const classId =
        existingId ??
        createClass({
          grade: parts.grade ?? null,
          section: parts.section ?? "",
          label: parts.label ?? "",
          subject: "",
          color: PALETTE[i % PALETTE.length],
          icon: DEFAULT_CLASS_ICON,
          slots: [],
        });
      created.set(key, classId);
      firstId ??= classId;

      if (row.students.length === 0) return;
      const students: Student[] = row.students.map((s) => ({
        id: crypto.randomUUID(),
        name: `${s.firstName} ${s.lastName}`.trim(),
        initials: rosterInitials(s.firstName, s.lastName),
        status: "active",
      }));
      updateClass(classId, (cd) => ({ ...cd, students: [...students, ...cd.students] }));
    });

    onOpenChange(false);
    if (firstId) onDone?.(firstId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-5">
          <SectionIcon><GraduationCap /></SectionIcon>
          <DialogTitle className="min-w-0 flex-1 text-lg">{t("title")}</DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-1.5 shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </DialogClose>
        </div>

        {/* ── Tanlov ── */}
        {step === "choice" && (
          <div className="grid grid-cols-2 gap-3 p-6">
            {([
              ["paste", FileText, t("choicePasteTitle"), t("choicePasteDescription")],
              ["file", FileSpreadsheet, t("choiceFileTitle"), t("choiceFileDescription")],
            ] as const).map(([target, Icon, title, description]) => (
              <button
                key={target}
                type="button"
                onClick={() => setStep(target)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </span>
                <span className="text-sm font-semibold">{title}</span>
                <TypographyMuted className="text-xs leading-snug">{description}</TypographyMuted>
              </button>
            ))}
          </div>
        )}

        {/* ── Matn ── */}
        {step === "paste" && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-6 py-5">
              <label className="text-sm font-medium text-foreground">{t("pasteLabel")}</label>
              <Textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={CLASS_IMPORT_PLACEHOLDER}
                className="min-h-[240px] flex-1 resize-none leading-relaxed"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5 shrink-0" />
                <span>{t("pasteHint")}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setStep("choice")} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
              <div className="flex items-center gap-3">
                <TypographyMuted>
                  {previewCount > 0 ? t("pasteCountFound", { count: previewCount }) : t("pasteCountEmpty")}
                </TypographyMuted>
                <Button onClick={goReviewFromText} disabled={previewCount === 0} className="gap-1.5">
                  {t("review")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Fayl ── */}
        {step === "file" && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-foreground">{t("fileLabel")}</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadSampleClassCsv}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Download className="size-3.5" />
                  {t("sampleCsv")}
                </Button>
              </div>
              <div className="min-h-[280px] flex-1 rounded-xl border border-dashed border-border">
                <FileUploadStruc
                  accept={{
                    "text/csv": [".csv"],
                    "application/vnd.ms-excel": [".xls"],
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
                  }}
                  onChange={(uploaded) => {
                    const file = uploaded[0];
                    if (file) processFile(file);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("fileHint")}</p>
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setStep("choice")} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
            </div>
          </>
        )}

        {/* ── Koʻrib chiqish ──
            Xulosa ATAYLAB jadval tepasida: import qaytarib boʻlmaydigan
            amal emas, lekin «nechta yangi sinf ochilyapti» degan savolga
            tasdiqdan OLDIN javob berilishi kerak. */}
        {step === "review" && (
          <>
            <div className="shrink-0 space-y-1 border-b border-border px-6 py-3">
              <p className="text-sm font-medium text-foreground">
                {t("summaryNew", { count: newCount })}
                {existingCount > 0 && ` · ${t("summaryExisting", { count: existingCount })}`}
                {studentCount > 0 && ` · ${t("summaryStudents", { count: studentCount })}`}
              </p>
              {unassigned > 0 && (
                <p className="text-xs text-muted-foreground">{t("unassignedNote", { count: unassigned })}</p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-2 grid grid-cols-[1fr_auto_auto] items-center gap-3 px-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("columnClass")}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("columnStudents")}
                </span>
                <span className="w-9" />
              </div>
              <div className="space-y-2">
                {rows.map((r, i) => {
                  const exists = isExisting(r.name);
                  return (
                    <div key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                      <div className="relative">
                        <ClassSwatch
                          hex={CLASS_COLOR_HEX[PALETTE[i % PALETTE.length]]}
                          className="absolute left-3 top-1/2 size-2.5 -translate-y-1/2"
                        />
                        <Input
                          value={r.name}
                          onChange={(e) => renameRow(r.id, e.target.value)}
                          className="h-9 pl-8"
                        />
                      </div>
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
                        {exists ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{t("existsBadge")}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-primary">
                            <Plus className="size-3" />
                            {t("newBadge")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3.5" />
                          {r.students.length}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(r.id)}
                        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={t("removeRowAria")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setStep(source)} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
              <Button onClick={submit} disabled={validRows.length === 0} className="gap-1.5">
                <Plus className="size-4" />
                {t("submit", { count: validRows.length })}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
