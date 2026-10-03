"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Download, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import {
  ishlanmaBody, ishlanmaFileName, ishlanmaWordHtml,
  type IshlanmaInput, type IshlanmaLabels,
} from "@/lib/lesson-ishlanma";
import { useGameLabel } from "./StudioAdviceColumn";

/* ════════════════════════════════════════════════════════════════════
   DARS ISHLANMASI — koʻrish, chop etish va Word.

   Reja tayyor boʻlsa oʻqituvchi qogʻoz ishlanmani qoʻlda yozmaydi:
   studiya uni rasmiy jadval koʻrinishida yigʻadi (`lib/lesson-ishlanma.ts`).
     • «Chop etish / PDF» — brauzer chop etish oynasi. Faqat hujjat
       chiqadi: nusxasi `.a4-print` bilan <body> ga qoʻyiladi
       (globals.css: chop etishda qolgan hamma narsa yashirinadi).
     • «Word'da yuklab olish» — `.doc` (Word HTML ni tahrirlanadigan
       hujjat sifatida ochadi): oʻqituvchi oʻz uslubiga moslaydi.
   Hujjat qogʻoz — qora rejimda ham oq varaq (koʻrinish chop etilgandek).
   ════════════════════════════════════════════════════════════════════ */

export function IshlanmaDialog({ input, onClose }: { input: IshlanmaInput; onClose: () => void }) {
  const t = useTranslations("LessonStudio");
  const gameLabel = useGameLabel();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const labels = useMemo<IshlanmaLabels>(
    () => ({
      heading: t("ishlanma.heading"),
      subject: t("ishlanma.subject"),
      className: t("ishlanma.className"),
      date: t("ishlanma.date"),
      topic: t("ishlanma.topic"),
      model: t("ishlanma.model"),
      duration: t("ishlanma.duration"),
      minutes: (count) => t("minutes", { count }),
      objective: t("ishlanma.objective"),
      criteria: t("ishlanma.criteria"),
      standards: t("ishlanma.standards"),
      equipment: t("ishlanma.equipment"),
      flow: t("ishlanma.flow"),
      colNo: "№",
      colStage: t("ishlanma.colStage"),
      colGoal: t("ishlanma.colGoal"),
      colTeacher: t("ishlanma.colTeacher"),
      colStudents: t("ishlanma.colStudents"),
      colActivities: t("ishlanma.colActivities"),
      assessment: t("ishlanma.assessment"),
      homework: t("ishlanma.homework"),
      reflection: t("ishlanma.reflection"),
      signature: t("ishlanma.signature"),
      none: "—",
      eqBoard: t("ishlanma.eqBoard"),
      eqScreen: t("ishlanma.eqScreen"),
      eqPrinter: t("ishlanma.eqPrinter"),
      eqPhones: t("ishlanma.eqPhones"),
      eqPult: t("ishlanma.eqPult"),
      eqInternet: t("ishlanma.eqInternet"),
      kind: (b) => t(`kind.${b.kind}`),
      method: (b) => (b.method && (b.kind === "check" || b.kind === "exit") ? t(`method.${b.method}`) : null),
      game: (b) => (b.kind === "game" && b.game ? gameLabel(b.game) : null),
    }),
    [t, gameLabel],
  );

  const html = useMemo(() => ishlanmaBody(input, labels), [input, labels]);

  function download() {
    // BOM — Word kirill va ʻ/ʼ harflarini toʻgʻri oʻqisin.
    const blob = new Blob(["﻿", ishlanmaWordHtml(input, labels)], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ishlanmaFileName(labels.heading, input.topic);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  return (
    <>
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent showCloseButton={false} className="flex max-h-[92svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
          <DialogHeaderBar icon={<FileText aria-hidden />} title={t("ishlanma.title")} description={t("ishlanma.hint")} />
          <div className="min-h-0 flex-1 overflow-y-auto bg-muted px-3 py-4 sm:px-6">
            {/* Qogʻoz koʻrinishi — chop etilgandek, mavzudan qatʼi nazar oq. */}
            <div
              className="mx-auto w-full max-w-[210mm] overflow-x-auto rounded-md bg-white p-6 text-black shadow-sm sm:p-10"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="outline" className="shadow-none" onClick={onClose}>{t("ishlanma.close")}</Button>
            <Button variant="outline" className="gap-1.5 shadow-none" onClick={download}>
              <Download className="size-4" /> {t("ishlanma.word")}
            </Button>
            <Button className="gap-1.5" onClick={() => window.print()}>
              <Printer className="size-4" /> {t("ishlanma.print")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Chop etiladigan nusxa — ekranda yashirin, chop etishda yagona koʻrinadigan qism. */}
      {mounted &&
        createPortal(<div className="a4-print hidden print:block" dangerouslySetInnerHTML={{ __html: html }} />, document.body)}
    </>
  );
}
