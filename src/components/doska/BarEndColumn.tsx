"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { BarIconButton } from "./BarGroup";
import { useDockLayout } from "./dock";
import { MenuItem, MenuPopover } from "./MenuPopover";
import { IconCatalog, IconChevronDown, IconRedo, IconUndo } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   PANELNING CHEKKA USTUNLARI — vidjet paneli va qoʻlyozma panelida bir xil.

   `BarColumn` — panel chetidagi tor ustun (pastki panelda tik, yon relsada
   gorizontal qator). `BarEndColumn` — oxirgi ustun: ⋮ panel menyusi
   (bekor qilish, qaytadan bajarish, panelni tahrirlash) va yigʻish (`B`).

   ⚠️ Ikkala panelda ham turadi: qalam rejimida vidjet paneli oʻrnini
   qoʻlyozma paneli egallaydi, sensorli doskada esa klaviatura yoʻq —
   bekor qilish va yigʻish faqat shu ustundan topiladi.
   ════════════════════════════════════════════════════════════════════ */

export function BarColumn({
  vertical,
  className,
  children,
}: {
  vertical: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex shrink-0 justify-between gap-2 p-2", vertical ? "flex-row" : "flex-col", className)}>
      {children}
    </div>
  );
}

export function BarEndColumn({
  vertical,
  onHide,
  onEditBar,
}: {
  vertical: boolean;
  onHide: () => void;
  /**
   * «Panelni tahrirlash» — «Hammasi» oynasini ochadi. Qoʻlyozma panelida
   * «Hammasi» yoʻq, shuning uchun u yerda berilmaydi va band chiqmaydi.
   */
  onEditBar?: () => void;
}) {
  const undo = useDoskaStore((s) => s.undo);
  const redo = useDoskaStore((s) => s.redo);
  const canUndo = useDoskaStore((s) => s.past.length > 0);
  const canRedo = useDoskaStore((s) => s.future.length > 0);
  const { side } = useDockLayout();
  const t = useTranslations("Doska.bar");
  const [open, setOpen] = React.useState(false);

  /* Yigʻish strelkasi panel KETADIGAN tomonga qaraydi: pastki panelda
     pastga, chap relsada chapga (pastga qaragan belgi soat mili boʻyicha
     90°), oʻng relsada oʻngga (teskari 90°). `side` — paneldan ochiladigan
     oynaning tomoni, yaʼni panelga qarama-qarshi chet. */
  const hideRotate = !vertical ? undefined : side === "right" ? "rotate-90" : "-rotate-90";

  return (
    <BarColumn vertical={vertical} className={vertical ? "pt-0" : "pl-0"}>
      <MenuPopover
        label={t("barMenu")}
        open={open}
        onOpenChange={setOpen}
        side={side}
        align="end"
        sideOffset={12}
        className="w-60 py-1"
      >
        {/* Menyu ochiq qoladi: oʻqituvchi bir necha qadam orqaga qaytishi mumkin. */}
        <MenuItem Icon={IconUndo} shortcut={["Mod", "Z"]} disabled={!canUndo} onClick={undo}>
          {t("undo")}
        </MenuItem>
        <MenuItem Icon={IconRedo} shortcut={["Mod", "Y"]} disabled={!canRedo} onClick={redo}>
          {t("redo")}
        </MenuItem>
        {onEditBar && (
          <>
            <hr className="mx-4 my-1" />
            <MenuItem
              Icon={IconCatalog}
              onClick={() => {
                setOpen(false);
                onEditBar();
              }}
            >
              {t("editBar")}
            </MenuItem>
          </>
        )}
      </MenuPopover>
      <BarIconButton label={t("hideControls")} shortcut={["B"]} onClick={onHide} className="rounded-md">
        <IconChevronDown className={cn("size-5", hideRotate)} />
      </BarIconButton>
    </BarColumn>
  );
}
