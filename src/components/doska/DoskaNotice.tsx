"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";

/**
 * Xabar ekranda shuncha turadi (ms). Qaytarish tugmasini topib bosishga
 * yetadi, lekin sinf ekranida uzoq osilib qolmaydi.
 */
const NOTICE_MS = 6000;

/**
 * «QAYTARISH» XABARI — oʻchirilgan vidjet, tozalangan yoki oʻchirilgan
 * ekran haqida.
 *
 * Tasdiq oynasi oʻrniga: amal darhol bajariladi, xabar esa uni bir
 * bosishda bekor qiladi (docs/doska-ux-tadqiqot.md R312, A1–A2).
 * Tasdiq oynasi har safar ishni toʻxtatadi va oʻqituvchi uni oʻqimasdan
 * «Ha» ni bosishga oʻrganadi; qaytarish esa faqat kerak boʻlganda
 * ishlatiladi.
 *
 * Tugma umumiy `undo()` ni chaqiradi — bu xavfsiz, chunki store xabarni
 * keyingi har qanday yozilgan amalda yopadi (`DoskaNotice` turi izohi).
 */
export function DoskaNotice() {
  const notice = useDoskaStore((s) => s.notice);
  const undo = useDoskaStore((s) => s.undo);
  const dismiss = useDoskaStore((s) => s.dismissNotice);
  const t = useTranslations("Doska.notice");
  const tWidget = useTranslations("Doska.widgets");

  React.useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => dismiss(notice.id), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice, dismiss]);

  if (!notice) return null;

  const text =
    notice.kind === "widgetRemoved"
      ? t("widgetRemoved", { widget: tWidget(widgetMeta(notice.widgetKind).labelKey) })
      : t(notice.kind);

  return (
    <div
      role="status"
      className="doska-bar bg-background pointer-events-auto flex items-center gap-2 rounded-[var(--radius)] border py-1 pr-1 pl-4 text-sm shadow-md"
      style={{ zIndex: "var(--z-doska-context)" }}
    >
      <span>{text}</span>
      <button
        type="button"
        onClick={undo}
        className="text-primary hover:bg-muted focus-visible:ring-ring h-10 shrink-0 rounded-[calc(var(--radius)-2px)] px-3 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {t("undo")}
      </button>
    </div>
  );
}
