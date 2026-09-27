"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarSync, TriangleAlert, X } from "lucide-react";
import { dateKeyToDate } from "@/lib/date-keys";
import { minToHHMM } from "@/lib/calendar-core/date-math";
import { useCalendarFormat } from "@/components/calendar/format";
import type { LessonSession } from "@/lib/lessons-data";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ════════════════════════════════════════════════════════════════════
   DARS OQIMI — OLDINDAN KOʻRISH

   Koʻp dars koʻchsa (> 5), biror dars jadvalga sigʻmay qolsa yoki
   sanalar avvaldan tartibga mos boʻlmasa, surish darhol qoʻllanmaydi —
   shu oyna eski → yangi sanani koʻrsatadi. Ikkinchi tugma chaqiruvchiga
   qarab: amal qoladi, sanalarga tegilmaydi; yoki amal bekor qilinib,
   oʻrniga faqat shu dars koʻchiriladi. ✕ / Esc — «Bekor qilish».
   ════════════════════════════════════════════════════════════════════ */

export type FlowPreviewRow = {
  key: string;
  title: string;
  /** Koʻp sinfli surishda — sinf nomi. */
  classLabel?: string;
  before: LessonSession;
  after: LessonSession | null;
};

export function LessonFlowPreview({
  open, rows, overflow, mismatch, declineLabel, onConfirm, onDecline, onClose,
}: {
  open: boolean;
  rows: FlowPreviewRow[];
  overflow: number;
  /** Sanalar avvaldan tartibga mos emas edi — hammasi qayta joylanadi. */
  mismatch: boolean;
  declineLabel: string;
  onConfirm: () => void;
  onDecline: () => void;
  /** ✕ / Esc / tashqariga bosish. */
  onClose: () => void;
}) {
  const t = useTranslations("LessonFlow");
  const locale = useLocale();
  const cal = useCalendarFormat();
  // Oʻzbek imlosi: kun va oy chiziqcha bilan («5-sen»); oy nomi — kalendar tarjimasidan.
  const fmt = (s: LessonSession) => {
    const d = dateKeyToDate(s.date);
    const sep = locale.startsWith("uz") ? "-" : " ";
    return `${d.getDate()}${sep}${cal.monthShort(d.getMonth())}, ${minToHHMM(s.startMin)}`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-lg gap-0 overflow-hidden p-0 bg-card top-[12vh] translate-y-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <SectionIcon className="shrink-0">
              <CalendarSync />
            </SectionIcon>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <DialogTitle asChild>
                <CardTitle>{t("previewTitle", { count: rows.length })}</CardTitle>
              </DialogTitle>
              <DialogDescription className="text-caption">{t("previewDescription")}</DialogDescription>
            </div>
          </div>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <X className="size-4" />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto scrollbar-thin scrollbar-hover p-5">
          {mismatch && (
            <p className="flex items-start gap-1.5 text-caption text-muted-foreground">
              <CalendarSync className="mt-0.5 size-3.5 shrink-0" />
              {t("previewMismatch")}
            </p>
          )}
          {overflow > 0 && (
            <p className="flex items-start gap-1.5 text-caption text-amber-600 dark:text-amber-500">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {t("previewOverflow", { count: overflow })}
            </p>
          )}
          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-foreground">{r.title}</span>
                  {r.classLabel && <span className="block truncate text-caption text-muted-foreground">{r.classLabel}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-caption tabular-nums">
                  <span className="text-muted-foreground">{fmt(r.before)}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  {r.after
                    ? <span className="font-medium text-foreground">{fmt(r.after)}</span>
                    : <span className="font-medium text-amber-600 dark:text-amber-500">{t("noSlot")}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onDecline}>{declineLabel}</Button>
          <Button onClick={onConfirm}>{t("apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
