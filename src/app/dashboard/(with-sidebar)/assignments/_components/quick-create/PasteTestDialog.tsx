"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, ClipboardPaste, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import { PASTE_MAX_CHARS, parsePastedTest, type PastedTest } from "@/lib/paste-test";

/* ════════════════════════════════════════════════════════════════════
   MATNDAN TEST — tayyor testni nusxalab joylash (`lib/paste-test.ts`).

   AI emas: oʻqituvchining OʻZ testi (qoʻllanma, Word, Telegram guruhi)
   savollarga ajratiladi — internetsiz, kreditsiz. Natija oldindan
   koʻrsatiladi: nechta savol, qaysilarida toʻgʻri javob belgilanmagan.
   «Testga aylantirish» — toʻplam muharriri ochiladi, oʻqituvchi
   tekshiradi va saqlaydi.
   ════════════════════════════════════════════════════════════════════ */

export function PasteTestDialog({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (test: PastedTest) => void;
}) {
  const t = useTranslations("QuickCreate");
  const [text, setText] = useState("");
  const parsed = useMemo(() => parsePastedTest(text), [text]);
  const count = parsed.questions.length;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeaderBar icon={<ClipboardPaste aria-hidden />} title={t("paste.title")} description={t("paste.hint")} />
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={PASTE_MAX_CHARS}
            placeholder={t("paste.placeholder")}
            className="min-h-64 rounded-xl bg-muted/40 px-4 py-3 font-mono text-sm shadow-none"
          />
          {text.trim() && (
            <div className="flex flex-col gap-1.5" role="status">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CheckCircle2 className={count ? "size-4 text-success" : "size-4 text-muted-foreground"} />
                {t("paste.found", { count })}
              </p>
              {parsed.missingAnswers.length > 0 && (
                <p className="flex items-start gap-2 text-caption text-warning">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {t("paste.missing", { list: parsed.missingAnswers.slice(0, 15).join(", ") })}
                </p>
              )}
              {parsed.skipped > 0 && (
                <p className="text-caption text-muted-foreground">{t("paste.skipped", { count: parsed.skipped })}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" className="shadow-none" onClick={onClose}>{t("paste.cancel")}</Button>
          <Button disabled={!count} onClick={() => onImport(parsed)}>
            {t("paste.import", { count })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
