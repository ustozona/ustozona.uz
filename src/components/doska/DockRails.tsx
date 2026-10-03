"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { BarEndColumn } from "./BarEndColumn";
import { ScreenNav, UndoRedoButtons } from "./BarActions";
import { BarGroup, BarSeparator } from "./BarGroup";
import { DockContext, dockLayout } from "./dock";
import { ModeSwitch } from "./ModeSwitch";
import { ToolCatalog, useToolCounts } from "./ToolCatalog";

/* ════════════════════════════════════════════════════════════════════
   «IKKI CHETDA» — chap va oʻng relsa bir vaqtda (`dock: "both"`).

   Katta doskada oʻqituvchi chetda turadi; oʻrtaga chiqsa sinfga toʻsiq.
   Shuning uchun oʻsha boshqaruv ikkala chetda takrorlanadi va qaysi
   tomonda tursa, oʻsha yerdan oladi:

     rels:  Qalam · Oʻchirgʻich · Tanlash │ Bekor · Qaytar │ Vidjetlar │ ⌄
     past:  ‹ n / N › Ekran                      (yoki qoʻlyozma paneli)

   • Vidjetlar bitta tugma ortida — «Hammasi» oynasi (toʻliq roʻyxat,
     qadash bilan). Qadalgan vositalar qatori yon relsaga sigʻmaydi:
     ikkita tik qator boʻlib 75″ doskada ham ekranni yeb qoʻyardi.
     Bu variantning narxi — vidjet qoʻshish ikki bosish.
   • Ekranlar pastda alohida qatorda: ikkala relsada takrorlansa
     hisoblagich ikki joyda boʻlib qolardi.
   • Qoʻlyozma rejimida relslar qoladi (rejim va bekor qilish yonida),
     qalam sozlamalari esa pastda (`InkBar`).
   • Yigʻish tugmasi ikkala relsada ham bor — ikkalasi bir holatni
     boshqaradi (`DoskaShell`).

   Relsa oʻz oynalarini ichkariga ochadi: chapdagisi oʻngga, oʻngdagisi
   chapga — shuning uchun har relsa oʻz `DockContext` ini beradi.
   ════════════════════════════════════════════════════════════════════ */

export function EdgeRail({ side, onHide }: { side: "left" | "right"; onHide: () => void }) {
  const t = useTranslations("Doska.bar");
  const onScreen = useToolCounts();
  const [catalogOpen, setCatalogOpen] = React.useState(false);

  return (
    <DockContext.Provider value={dockLayout(side)}>
      <BarGroup variant="padded" layer="bar" orientation="vertical" className="max-h-full min-h-0 items-stretch gap-0 p-0">
        <div className="flex min-h-0 flex-col items-center overflow-y-auto overscroll-y-contain px-1">
          <ModeSwitch vertical />
          <BarSeparator vertical />
          <UndoRedoButtons vertical />
          <BarSeparator vertical />
          <ToolCatalog
            onScreen={onScreen}
            open={catalogOpen}
            onOpenChange={setCatalogOpen}
            label={t("widgetsButton")}
          />
        </div>
        <BarEndColumn vertical onHide={onHide} />
      </BarGroup>
    </DockContext.Provider>
  );
}

/** Pastki qator — «Ikki chetda» da ekranlar (qoʻlyozma rejimida oʻrnini `InkBar` oladi). */
export function ScreenStrip() {
  return (
    <BarGroup variant="padded" layer="bar" className={cn("items-center")}>
      <ScreenNav vertical={false} />
    </BarGroup>
  );
}
