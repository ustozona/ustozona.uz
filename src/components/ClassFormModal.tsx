"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CLASS_COLOR_HEX, classColorHexDark, nextAutoClassColor, type ClassColor } from "@/lib/class-colors";
import { CLASS_ICONS, CLASS_ICON_KEYS, DEFAULT_CLASS_ICON, type ClassIconKey } from "@/lib/class-icons";
import { Dialog, DialogContent, DialogHeaderBar, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPickerButton } from "@/components/ui/color-picker-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDownIcon, GraduationCap } from "lucide-react";
import { COMMON_SECTIONS, SECTION_MAX_LENGTH, displayClassName } from "@/lib/class-naming";

export type ClassSlot = { day: string; start: string; end: string };
/** `name` YOʻQ — nom `grade`+`section`+`label` dan hisoblanadi (class-naming.ts).
    `slots` (haftalik jadval) modalda TAHRIRLANMAYDI — jadval "Dars jadvali"
    sahifasida tuziladi; bu yerda faqat oʻzgarishsiz oʻtkaziladi. */
export type ClassFormValues = { grade: number | null; section: string; label: string; subject: string; color: ClassColor; icon: ClassIconKey; slots: ClassSlot[] };

const GRADES = Array.from({ length: 11 }, (_, i) => i + 1);

/**
 * Sinf yaratish / tahrirlash uchun umumiy modal.
 * Timetable ("+", "Tahrirlash") va Classes ("Yangi sinf") sahifalari ishlatadi.
 *
 * Tuzilma — BIR USTUNLI (tadqiqotlar: bir ustunli forma koʻp ustunlidan tez
 * toʻldiriladi, koʻz yagona vertikal yoʻldan yuradi). Eng tepada identifikator
 * bloki: ikonka + hisoblangan nom + rang — Notion/Linear naqshi, ikonkaning
 * OʻZI tanlagich. Pastida atigi 2–3 maydon.
 */
export function ClassFormModal({
  mode,
  initial,
  onSubmit,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Partial<ClassFormValues>;
  onSubmit: (values: ClassFormValues) => void;
  onClose: () => void;
}) {
  const t = useTranslations("ClassFormModal");
  const classColorOrder = (Object.keys(CLASS_COLOR_HEX) as ClassColor[]).filter((n) => n !== "gray");

  const [section, setSection] = useState(initial?.section ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [grade, setGrade] = useState<number | null>(initial?.grade ?? null);
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [selectedColor, setSelectedColor] = useState<ClassColor>(initial?.color ?? nextAutoClassColor);
  const [selectedIcon, setSelectedIcon] = useState<ClassIconKey>(initial?.icon ?? DEFAULT_CLASS_ICON);
  const selectedHex = CLASS_COLOR_HEX[selectedColor];
  const selectedHexDark = classColorHexDark(selectedColor);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isSectionPickerOpen, setIsSectionPickerOpen] = useState(false);
  const SelectedIcon = CLASS_ICONS[selectedIcon];

  // Daraja va erkin nom OʻZARO INKOR: daraja tanlansa nom "5-A" dan hosil
  // boʻladi, shu bois erkin nom tozalanadi — aks holda u jimgina ustun turib,
  // oʻqituvchi tanlagan darajani nomda koʻrmay qolardi.
  const handleGradeChange = (val: string) => {
    const next = val ? Number(val) : null;
    setGrade(next);
    if (next !== null) setLabel("");
    else setSection("");
  };

  // Koʻrsatiladigan nom jonli hisoblanadi — oʻqituvchi natijani darhol koʻradi.
  const previewName = displayClassName({ grade, section, label });
  const canSubmit = previewName.length > 0;
  // Tugma DISABLED qilinmaydi: sababsiz oʻlik CTA — anti-naqsh. Bosilganda
  // yetishmayotgani aytiladi va xato aynan tegishli qatorda koʻrsatiladi.
  const [attempted, setAttempted] = useState(false);
  const showError = attempted && !canSubmit;

  const submit = () => {
    if (!canSubmit) {
      setAttempted(true);
      return;
    }
    onSubmit({
      grade,
      section: section.trim().toUpperCase(),
      label: label.trim(),
      subject: subject.trim(),
      color: selectedColor,
      icon: selectedIcon,
      // Jadval bu modalda tahrirlanmaydi — mavjud slotlar oʻzgarishsiz qaytadi.
      slots: initial?.slots ?? [],
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[440px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeaderBar
          icon={<GraduationCap className="size-[18px]" aria-hidden />}
          title={mode === "create" ? t("createTitle") : t("editTitle", { name: previewName ? `: ${previewName}` : "" })}
          description={mode === "create" ? t("createDescription") : t("editDescription")}
        />

        <ScrollArea className="flex-1">
          <div className="space-y-4 p-5 pt-4">
            {/* IDENTIFIKATOR BLOKI — ikonka + hisoblangan nom + rang. Ikonkaning
                OʻZI tanlagich tugmasi (Notion/Linear naqshi), shu bois alohida
                "ikonka tanlash" tugmasi kerak emas. */}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
              <Popover open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
                <PopoverTrigger asChild>
                  {/* hover: faqat fon toʻqroq boʻladi. Fon inline `style` emas, CSS
                      oʻzgaruvchisi orqali — inline style hover klassidan ustun turadi. */}
                  <button
                    type="button"
                    aria-label={t("pickIcon")}
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-colors bg-[var(--btn-bg)] hover:bg-[var(--btn-hover-bg)]"
                    style={{
                      ["--btn-bg" as string]: selectedHex,
                      ["--btn-hover-bg" as string]: selectedHexDark,
                    }}
                  >
                    <SelectedIcon className="size-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[300px] p-2">
                  <ScrollArea className="h-[244px]">
                    <div
                      className="grid grid-cols-6 gap-1.5 pr-3"
                      // Popover dialog portalidan tashqarida — Dialog scroll-lock gʻildirakni
                      // bloklaydi; shuning uchun viewport'ni qoʻlda skroll qilamiz.
                      onWheel={(e) => {
                        const vp = e.currentTarget.closest("[data-radix-scroll-area-viewport]");
                        if (vp) vp.scrollTop += e.deltaY;
                      }}
                    >
                      {CLASS_ICON_KEYS.map((key) => {
                        const Icon = CLASS_ICONS[key];
                        const active = key === selectedIcon;
                        return (
                          <button
                            key={key}
                            type="button"
                            aria-label={key}
                            aria-pressed={active}
                            onClick={() => { setSelectedIcon(key); setIsIconPickerOpen(false); }}
                            className={cn(
                              "flex items-center justify-center aspect-square rounded-md border transition-colors",
                              active ? "border-transparent text-white" : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                            style={active ? { backgroundColor: selectedHex } : undefined}
                          >
                            <Icon className="size-[18px]" />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold", !previewName && "font-normal text-muted-foreground")}>
                  {previewName || t("namePreviewExample", { example: "5-A" })}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {subject.trim() || t("previewNoSubject")}
                </p>
              </div>

              <ColorPickerButton
                value={selectedColor}
                onChange={setSelectedColor}
                colors={classColorOrder}
                hexOf={(c) => CLASS_COLOR_HEX[c]}
                ariaLabel={t("pickColor")}
              />
            </div>

            {/* Sinf: daraja + parallel harfi. Ikkalasi BITTA maydonning boʻlaklari
                (bitta yorliq ostida), shu bois bir qatorda — ikki ustunli forma emas. */}
            <div className="space-y-2">
              <Label>{t("classIdentity")}</Label>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex min-w-0 flex-1 items-center justify-between gap-1 rounded-md border border-border px-3 h-9 text-sm bg-card hover:bg-accent/50 transition-colors">
                    <span className={cn("truncate", grade === null && "text-muted-foreground")}>
                      {grade === null ? t("noGrade") : t("gradeValue", { grade })}
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[180px] max-h-[260px] overflow-y-auto">
                    <DropdownMenuRadioGroup value={grade === null ? "" : String(grade)} onValueChange={handleGradeChange}>
                      {/* "Darajasiz" — holat emas, TANLOV: toʻgarak kabi guruhlar. */}
                      <DropdownMenuRadioItem value="">{t("noGrade")}</DropdownMenuRadioItem>
                      {GRADES.map((g) => <DropdownMenuRadioItem key={g} value={String(g)}>{t("gradeValue", { grade: g })}</DropdownMenuRadioItem>)}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Harf FAQAT daraja tanlanganda — "Darajasiz + A" maʼnosiz. */}
                {grade !== null && (
                  <Popover open={isSectionPickerOpen} onOpenChange={setIsSectionPickerOpen}>
                    <PopoverTrigger className="flex w-[104px] shrink-0 items-center justify-between rounded-md border border-border px-3 h-9 text-sm bg-card hover:bg-accent/50 transition-colors">
                      <span className={cn("truncate", !section && "text-muted-foreground")}>
                        {section || t("sectionShort")}
                      </span>
                      <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[212px] space-y-2 p-2">
                      <div className="grid grid-cols-5 gap-1">
                        {COMMON_SECTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            aria-pressed={section === s}
                            onClick={() => { setSection(s); setIsSectionPickerOpen(false); }}
                            className={cn(
                              "flex h-8 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                              section === s
                                ? "border-transparent bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={section}
                        onChange={(e) => setSection(e.target.value.toUpperCase())}
                        maxLength={SECTION_MAX_LENGTH}
                        placeholder={t("sectionCustomPlaceholder")}
                        aria-label={t("sectionLabel")}
                        className="h-8 text-center"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {showError && <p className="pl-1 text-xs text-destructive">{t("identityRequired")}</p>}
            </div>

            {/* Erkin nom — FAQAT darajasiz guruh uchun (toʻgarak, kurs). Daraja
                tanlansa nom darajadan hosil boʻladi va bu maydon yoʻqoladi. */}
            {grade === null && (
              <div className="space-y-2">
                <Label htmlFor="cfm-label">{t("customLabel")}</Label>
                <Input id="cfm-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("customLabelPlaceholder")} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cfm-subject">{t("subject")}</Label>
              <Input id="cfm-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("subjectPlaceholder")} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 gap-2 border-t bg-muted/20 px-5 py-4 sm:justify-between">
          {/* Shart tugma yonida — foydalanuvchi bosishdan OLDIN nima yetishmayotganini
              koʻradi; tugmaning oʻzi hech qachon sababsiz oʻlik boʻlmaydi. */}
          <span className={cn("text-xs", showError ? "text-destructive" : "text-muted-foreground")}>
            {canSubmit ? "" : t("identityRequired")}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={submit}>{mode === "create" ? t("create") : t("save")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
