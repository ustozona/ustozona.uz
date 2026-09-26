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
  const saveFailed = useDoskaStore((s) => s.saveFailed);
  return (
    <>
      {saveFailed && <SaveFailedNotice />}
      <UndoNotice />
    </>
  );
}

/**
 * «SAQLANMAYAPTI» — brauzer xotirasi toʻlgan (store.ts, `saveFailed`).
 *
 * Qaytarish xabaridan farqli: oʻzi yopilmaydi va tugmasi yoʻq — holat
 * keyingi muvaffaqiyatli saqlashda oʻzi tushadi. Oʻqituvchiga nima
 * qilish kerakligi aytiladi: yozuvni tozalash yoki eski ekranni oʻchirish.
 */
function SaveFailedNotice() {
  const t = useTranslations("Doska.notice");
  return (
    <div
      role="alert"
      className="doska-bar doska-ctl pointer-events-auto max-w-sm px-4 py-3 text-sm"
      style={{ zIndex: "var(--z-doska-context)" }}
    >
      <span className="text-destructive font-medium">{t("saveFailed")}</span>{" "}
      <span className="text-muted-foreground">{t("saveFailedHint")}</span>
    </div>
  );
}

function UndoNotice() {
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
      className="doska-bar doska-ctl pointer-events-auto flex items-center gap-2 py-1 pr-1 pl-4 text-sm"
      style={{ zIndex: "var(--z-doska-context)" }}
    >
      <span>{text}</span>
      <button
        type="button"
        onClick={undo}
        className="text-primary hover:bg-muted focus-visible:ring-ring h-11 shrink-0 rounded-lg px-3 font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {t("undo")}
      </button>
    </div>
  );
}
