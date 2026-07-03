"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { Users, ArrowLeft, ArrowRight, UserPlus, Trash2, FileText, Repeat } from "lucide-react";

// Bitta tahrirlanadigan oʻquvchi qatori
export type ParsedStudent = { id: string; firstName: string; lastName: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string; // joriy sinf nomi (sarlavhada koʻrsatiladi)
  onImport: (students: { firstName: string; lastName: string }[]) => void;
};

let uid = 0;
const nextId = () => `imp-${Date.now()}-${uid++}`;

/** Bir qatorni ism/familiyaga ajratish.
 *  "Familiya, Ism" (vergulli) yoki "Ism Familiya ..." (boʻsh joy/tab). */
function parseLine(raw: string): { firstName: string; lastName: string } | null {
  const line = raw.trim();
  if (!line) return null;

  if (line.includes(",")) {
    const [a, b] = line.split(",", 2).map((s) => s.trim());
    // "Familiya, Ism" → birinchi ism, qolgani familiya
    return { firstName: b || a, lastName: b ? a : "" };
  }

  const parts = line.split(/[\s\t]+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function parseText(text: string): ParsedStudent[] {
  const out: ParsedStudent[] = [];
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const p = parseLine(line);
    if (!p) continue;
    const key = `${p.firstName} ${p.lastName}`.trim().toLowerCase();
    if (seen.has(key)) continue; // dublikatlarni tozalaymiz
    seen.add(key);
    out.push({ id: nextId(), ...p });
  }
  return out;
}

const PLACEHOLDER = `Har qatorda bitta oʻquvchi yozing. Masalan:

Aliyev Alisher
Karimova Dilnoza
Toshmatov, Bobur`;

export default function ImportStudentsModal({ open, onOpenChange, className, onImport }: Props) {
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedStudent[]>([]);

  useEffect(() => {
    if (open) {
      setStep("paste");
      setText("");
      setRows([]);
    }
  }, [open]);

  // Matndan nechta oʻquvchi chiqishini oldindan koʻrsatamiz
  const previewCount = useMemo(() => parseText(text).length, [text]);

  const goReview = () => {
    const parsed = parseText(text);
    if (parsed.length === 0) return;
    setRows(parsed);
    setStep("review");
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const updateRow = (id: string, field: "firstName" | "lastName", value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const flipNames = () =>
    setRows((prev) => prev.map((r) => ({ ...r, firstName: r.lastName, lastName: r.firstName })));

  const validRows = rows.filter((r) => r.firstName.trim() || r.lastName.trim());

  const handleImport = () => {
    if (validRows.length === 0) return;
    onImport(validRows.map((r) => ({ firstName: r.firstName.trim(), lastName: r.lastName.trim() })));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {/* ── Sarlavha ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-5">
          <SectionIcon><Users /></SectionIcon>
          <div className="min-w-0">
            <DialogTitle className="text-lg">Roʻyxatdan import qilish</DialogTitle>
            <TypographyMuted className="mt-0.5 truncate">{className}</TypographyMuted>
          </div>
        </div>

        {step === "paste" ? (
          /* ─── Bosqich 1: Paste ─── */
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-2 px-6 py-5">
              <label className="text-sm font-medium text-foreground">Oʻquvchilar roʻyxati</label>
              <Textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER}
                className="min-h-[280px] flex-1 resize-none leading-relaxed"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5 shrink-0" />
                <span>Word yoki Excelʼdan ham nusxa koʻchirib qoʻyishingiz mumkin. Dublikatlar avtomatik tozalanadi.</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <TypographyMuted>
                {previewCount > 0 ? `${previewCount} ta oʻquvchi aniqlandi` : "Hali hech narsa kiritilmadi"}
              </TypographyMuted>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Bekor qilish</Button>
                <Button onClick={goReview} disabled={previewCount === 0} className="gap-1.5">
                  Koʻrib chiqish
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* ─── Bosqich 2: Koʻrib chiqish ─── */
          <>
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-6 py-3">
              <p className="text-sm font-medium text-foreground">
                {validRows.length} ta oʻquvchi tayyor
              </p>
              <Button variant="outline" size="sm" onClick={flipNames} className="gap-1.5 shadow-none">
                <Repeat className="size-3.5" />
                Ism/familiyani almashtirish
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {/* Ustun sarlavhalari */}
              <div className="mb-2 grid grid-cols-[1fr_1fr_auto] items-center gap-3 px-1">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ism</span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Familiya</span>
                <span className="w-9" />
              </div>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
                    <Input
                      value={r.firstName}
                      onChange={(e) => updateRow(r.id, "firstName", e.target.value)}
                      className="h-9"
                    />
                    <Input
                      value={r.lastName}
                      onChange={(e) => updateRow(r.id, "lastName", e.target.value)}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(r.id)}
                      className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Olib tashlash"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-6 py-4">
              <Button variant="outline" onClick={() => setStep("paste")} className="gap-1.5">
                <ArrowLeft className="size-4" />
                Orqaga
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0} className="gap-1.5">
                <UserPlus className="size-4" />
                {validRows.length} ta oʻquvchini qoʻshish
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
