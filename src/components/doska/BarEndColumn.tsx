"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { BarIconButton } from "./BarGroup";
import { useDockLayout } from "./dock";
import { IconChevronDown } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   PANELNING CHEKKA USTUNLARI — vidjet paneli va qoʻlyozma panelida bir xil.

   `BarColumn` — panel chetidagi tor ustun (pastki panelda tik, yon relsada
   gorizontal qator). `BarEndColumn` — oxirgi ustun: yigʻish (`B`).

   Bekor qilish va ekranlar bu yerda EMAS — ular `BarActions` da, doim
   koʻrinib turadi. ⋮ menyusi olib tashlandi: unda faqat «Panelni
   tahrirlash» qolgan edi, u esa «Hammasi» tugmasi bilan bir xil oynani ochadi.
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
}: {
  vertical: boolean;
  onHide: () => void;
}) {
  const { side } = useDockLayout();
  const t = useTranslations("Doska.bar");

  /* Yigʻish strelkasi panel KETADIGAN tomonga qaraydi: pastki panelda
     pastga, chap relsada chapga (pastga qaragan belgi soat mili boʻyicha
     90°), oʻng relsada oʻngga (teskari 90°). `side` — paneldan ochiladigan
     oynaning tomoni, yaʼni panelga qarama-qarshi chet. */
  const hideRotate = !vertical ? undefined : side === "right" ? "rotate-90" : "-rotate-90";

  return (
    <BarColumn vertical={vertical} className={vertical ? "pt-0" : "pl-0"}>
      <BarIconButton label={t("hideControls")} shortcut={["B"]} onClick={onHide} className="rounded-md">
        <IconChevronDown className={cn("size-5", hideRotate)} />
      </BarIconButton>
    </BarColumn>
  );
}
