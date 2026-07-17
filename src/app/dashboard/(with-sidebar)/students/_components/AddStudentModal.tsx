"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { uz } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MONTHS_UZ, DAYS_UZ_SUN_SHORT } from "@/lib/localization";
import { classColor } from "@/lib/grades-data";
import { useLiveClassInfo } from "@/hooks/useLiveClasses";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { ClassSwatch } from "@/components/ClassSwatch";
import {
  type ParsedStudent, parseText, parseSpreadsheetFile, downloadSampleCsv, IMPORT_PLACEHOLDER,
} from "./import-students-utils";
import type { Gender, NewStudentInput } from "./CreateStudentModal";
import { FileUploadStruc } from "@/components/shadcn-space/file-upload/file-upload-01";
import {
  Users, UserPlus, ArrowLeft, ChevronDown, Camera, X, CalendarDays,
  Mars, Venus, Trash2, FileText, Repeat, Download, ChevronRight, FileSpreadsheet,
} from "lucide-react";

type Step = "choice" | "single" | "paste" | "file" | "review";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClassId: string;
  onCreate: (data: NewStudentInput) => void;
  onImport: (students: { firstName: string; lastName: string }[]) => void;
};

function initialsOf(first: string, last: string): string {
  const a = first.trim()[0] ?? "";
  const b = last.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
function fromISO(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatBirth(s: string): string {
  const d = fromISO(s);
  if (!d) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

/** Yagona modal — "Yangi oʻquvchi" tanlov ekrani + bitta yaratish + roʻyxatdan import,
 *  hammasi bitta oyna doirasida (Orqaga bilan) — typing.com "Add or Create Students" naqshi. */
export default function AddStudentModal({ open, onOpenChange, defaultClassId, onCreate, onImport }: Props) {
  const t = useTranslations("AddStudentModal");
  const [step, setStep] = useState<Step>("choice");

  // ── Bitta oʻquvchi ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [birthDate, setBirthDate] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [avatarDragActive, setAvatarDragActive] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Import ──
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedStudent[]>([]);
  const [importFileError, setImportFileError] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<"paste" | "file">("paste");

  const selectedClass = useLiveClassInfo(defaultClassId);
  const classHex = selectedClass ? CLASS_COLOR_HEX[classColor(selectedClass)] : CLASS_COLOR_HEX.blue;

  useEffect(() => {
    if (open) {
      setStep("choice");
      setFirstName(""); setLastName(""); setGender(""); setBirthDate("");
      setParentName(""); setParentPhone(""); setStudentPhone(""); setAvatarImage(null);
      setShowMore(false);
      setText(""); setRows([]); setImportFileError(null); setImportSource("paste");
    }
  }, [open]);

  const fullName = `${firstName} ${lastName}`.trim();
  const canSubmitSingle = firstName.trim().length > 0 || lastName.trim().length > 0;

  const readAvatarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setAvatarImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    readAvatarFile(file);
  };

  const handleAvatarDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setAvatarDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readAvatarFile(file);
  };

  const submitSingle = () => {
    if (!canSubmitSingle) return;
    onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      classId: defaultClassId,
      gender: gender || undefined,
      birthDate: birthDate || undefined,
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      studentPhone: studentPhone.trim() || undefined,
      avatarColor: classHex,
      avatarImage: avatarImage ?? undefined,
    });
    onOpenChange(false);
  };

  const processImportFile = async (file: File) => {
    setImportFileError(null);
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (parsed.length === 0) {
        setImportFileError(t("fileErrorEmpty"));
        return;
      }
      setImportSource("file");
      setRows(parsed);
      setStep("review");
    } catch {
      setImportFileError(t("fileErrorParse"));
    }
  };

  const previewCount = useMemo(() => parseText(text).length, [text]);

  const goReview = () => {
    const parsed = parseText(text);
    if (parsed.length === 0) return;
    setImportSource("paste");
    setRows(parsed);
    setStep("review");
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const updateRow = (id: string, field: "firstName" | "lastName", value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const flipNames = () =>
    setRows((prev) => prev.map((r) => ({ ...r, firstName: r.lastName, lastName: r.firstName })));
  const validRows = rows.filter((r) => r.firstName.trim() || r.lastName.trim());

  const submitImport = () => {
    if (validRows.length === 0) return;
    onImport(validRows.map((r) => ({ firstName: r.firstName.trim(), lastName: r.lastName.trim() })));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[88vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* ── Umumiy sarlavha ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-5">
          <SectionIcon><Users /></SectionIcon>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <DialogTitle className="text-lg">{t("title")}</DialogTitle>
              {selectedClass && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <ClassSwatch hex={classHex} className="size-2.5" />
                  {selectedClass.name}
                </span>
              )}
            </div>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" className="-mr-1.5 shrink-0 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">{t("close")}</span>
            </Button>
          </DialogClose>
        </div>

        {/* ── Bosqich: tanlov ── */}
        {step === "choice" && (
          <div className="grid grid-cols-3 gap-3 p-6">
            <button
              type="button"
              onClick={() => setStep("single")}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserPlus className="size-6" />
              </span>
              <span className="text-sm font-semibold">{t("choiceSingleTitle")}</span>
              <TypographyMuted className="text-xs leading-snug">
                {t("choiceSingleDescription")}
              </TypographyMuted>
            </button>

            <button
              type="button"
              onClick={() => setStep("paste")}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="size-6" />
              </span>
              <span className="text-sm font-semibold">{t("choicePasteTitle")}</span>
              <TypographyMuted className="text-xs leading-snug">
                {t("choicePasteDescription")}
              </TypographyMuted>
            </button>

            <button
              type="button"
              onClick={() => setStep("file")}
              className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileSpreadsheet className="size-6" />
              </span>
              <span className="text-sm font-semibold">{t("choiceFileTitle")}</span>
              <TypographyMuted className="text-xs leading-snug">
                {t("choiceFileDescription")}
              </TypographyMuted>
            </button>
          </div>
        )}

        {/* ── Bosqich: bitta oʻquvchi ── */}
        {step === "single" && (
          <form className="contents" onSubmit={(e) => { e.preventDefault(); submitSingle(); }}>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5 flex justify-center">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setAvatarDragActive(true); }}
                    onDragLeave={() => setAvatarDragActive(false)}
                    onDrop={handleAvatarDrop}
                    aria-label={t("avatarUploadAria")}
                    className={cn(
                      "group flex size-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-dashed text-center transition-colors",
                      avatarDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
                    )}
                  >
                    {avatarImage ? (
                      <div className="relative size-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarImage} alt="" className="size-full object-cover" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="size-5 text-white" />
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm">
                          <UserPlus className="size-5 text-muted-foreground" />
                        </span>
                        <span className="px-4 text-sm leading-snug text-muted-foreground">
                          {t("avatarDropHint")}
                        </span>
                      </>
                    )}
                  </button>
                  {avatarImage && (
                    <button
                      type="button"
                      onClick={() => setAvatarImage(null)}
                      aria-label={t("avatarRemoveAria")}
                      className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-sm font-medium">{t("firstName")}</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("firstNamePlaceholder")} autoFocus />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm font-medium">{t("lastName")}</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t("lastNamePlaceholder")} />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t("nameHint")}</p>

              <button
                type="button"
                onClick={() => setShowMore((v) => !v)}
                className="mt-5 flex w-full items-center justify-between rounded-md py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("moreInfo")}
                <ChevronDown className={cn("size-4 transition-transform duration-fast ease-standard", showMore && "rotate-180")} />
              </button>

              {showMore && (
                <div className="mt-3 grid gap-4 border-t border-border pt-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium">{t("gender")}</Label>
                      <div className="flex gap-2">
                        {([
                          ["male", t("genderMale"), Mars, "sky"],
                          ["female", t("genderFemale"), Venus, "pink"],
                        ] as [Gender, string, typeof Mars, "sky" | "pink"][]).map(([val, lbl, Icon, tone]) => {
                          const active = gender === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setGender(active ? "" : val)}
                              className={cn(
                                "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border text-sm font-medium transition-colors",
                                active
                                  ? tone === "sky"
                                    ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400"
                                    : "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400"
                                  : "border-input text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <Icon className="size-4" />
                              {lbl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium">{t("birthDate")}</Label>
                      <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start font-normal shadow-xs", !birthDate && "text-muted-foreground")}>
                            <CalendarDays className="mr-2 size-4 shrink-0 text-muted-foreground" />
                            {birthDate ? formatBirth(birthDate) : t("birthDatePlaceholder")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <Calendar
                            mode="single"
                            locale={uz}
                            formatters={{
                              formatMonthDropdown: (date) => MONTHS_UZ[date.getMonth()],
                              formatWeekdayName: (date) => DAYS_UZ_SUN_SHORT[date.getDay()],
                            }}
                            selected={fromISO(birthDate)}
                            defaultMonth={fromISO(birthDate) ?? new Date(2012, 0)}
                            captionLayout="dropdown"
                            startMonth={new Date(2000, 0)}
                            endMonth={new Date(2027, 11)}
                            onSelect={(d) => { setBirthDate(d ? toISO(d) : ""); setDateOpen(false); }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-sm font-medium">{t("parentName")}</Label>
                    <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder={t("parentNamePlaceholder")} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium">{t("parentPhone")}</Label>
                      <Input type="tel" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder={t("parentPhonePlaceholder")} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-sm font-medium">{t("studentPhone")}</Label>
                      <Input type="tel" value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)} placeholder={t("studentPhonePlaceholder")} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setStep("choice")} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
              <Button type="submit" disabled={!canSubmitSingle} className="gap-2">
                <UserPlus className="size-4" />
                {t("add")}
              </Button>
            </div>
          </form>
        )}

        {/* ── Bosqich: roʻyxatdan import — nusxa koʻchirish ── */}
        {step === "paste" && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-6 py-5">
              <label className="text-sm font-medium text-foreground">{t("pasteLabel")}</label>
              <Textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={IMPORT_PLACEHOLDER}
                className="min-h-[240px] flex-1 resize-none leading-relaxed"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5 shrink-0" />
                <span>{t("pasteHint")}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setStep("choice")} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
              <div className="flex items-center gap-3">
                <TypographyMuted>
                  {previewCount > 0 ? t("pasteCountFound", { count: previewCount }) : t("pasteCountEmpty")}
                </TypographyMuted>
                <Button onClick={goReview} disabled={previewCount === 0} className="gap-1.5">
                  {t("review")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Bosqich: roʻyxatdan import — CSV/Excel fayl ── */}
        {step === "file" && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-foreground">{t("fileLabel")}</label>
                <Button type="button" variant="ghost" size="sm" onClick={downloadSampleCsv} className="gap-1.5 text-muted-foreground">
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
                    if (file) processImportFile(file);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("fileHint")}</p>

              {importFileError && <p className="text-xs text-destructive">{importFileError}</p>}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setStep("choice")} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
            </div>
          </>
        )}

        {/* ── Bosqich: import — koʻrib chiqish ── */}
        {step === "review" && (
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-6 py-3">
              <p className="text-sm font-medium text-foreground">{t("reviewReady", { count: validRows.length })}</p>
              <Button variant="outline" size="sm" onClick={flipNames} className="gap-1.5 shadow-none">
                <Repeat className="size-3.5" />
                {t("swapNames")}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <div className="mb-2 grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("columnFirstName")}</span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("columnLastName")}</span>
                <span className="w-9" />
              </div>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
                    <Input value={r.firstName} onChange={(e) => updateRow(r.id, "firstName", e.target.value)} className="h-9" />
                    <Input value={r.lastName} onChange={(e) => updateRow(r.id, "lastName", e.target.value)} className="h-9" />
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
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setStep(importSource)} className="gap-1.5">
                <ArrowLeft className="size-4" />
                {t("back")}
              </Button>
              <Button onClick={submitImport} disabled={validRows.length === 0} className="gap-1.5">
                <UserPlus className="size-4" />
                {t("submitImport", { count: validRows.length })}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
