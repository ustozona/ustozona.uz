"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { BarButton } from "./BarButton";
import { BarIconButton, BarSeparator, BarTextButton } from "./BarGroup";
import { IconAdd, IconArrowLeft, IconArrowRight, IconRedo, IconUndo } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   PANELNING AMALLAR BOʻLIMI — bekor qilish va ekranlar.

   Vidjet paneli ham, qoʻlyozma paneli ham shu boʻlimni oʻz oxirida
   (`BarEndColumn` oldidan) chizadi. Ilgari bular boshqa joyda edi:
   bekor qilish ⋮ menyusida (2 bosish, 26 px nishon), ekranlar esa pastki
   oʻng burchakda alohida orolda. Dars davomida kerak boʻladigan hamma
   narsa bitta panelda turishi uchun ikkalasi shu yerga olindi:

     • «Bekor» va «Qaytar» — yozuv va vidjet uchun eng koʻp bosiladigan
       amal, sensorli doskada klaviatura yoʻq. Yorliqli tugma, doim
       koʻrinib turadi; tarix boʻsh boʻlsa xira.
     • Ekranlar — ‹ n / N › va «Ekran» qoʻshish. Ekran bitta boʻlsa
       strelkalar va hisoblagich yashiriladi: ikkalasi ham nofaol turib
       joy egallardi, faqat «Ekran» qoladi.

   ⚠️ Pastki oʻng burchak endi boʻsh — u yerda tez-tez operatsion tizimning
   «faollashtirish» yozuvi turadi va ekran tugmalarini yopib qoʻyardi.
   ════════════════════════════════════════════════════════════════════ */

export function BarActions({ vertical }: { vertical: boolean }) {
  return (
    <>
      <BarSeparator vertical={vertical} />
      <UndoRedoButtons vertical={vertical} />
      <BarSeparator vertical={vertical} />
      <ScreenNav vertical={vertical} />
    </>
  );
}

/** «Bekor» / «Qaytar» — yon relsalarda (`EdgeRail`) ham shu tugmalar. */
export function UndoRedoButtons({ vertical }: { vertical: boolean }) {
  const t = useTranslations("Doska.bar");

  const undo = useDoskaStore((s) => s.undo);
  const redo = useDoskaStore((s) => s.redo);
  const canUndo = useDoskaStore((s) => s.past.length > 0);
  const canRedo = useDoskaStore((s) => s.future.length > 0);

  return (
    <div className={cn("flex shrink-0 items-center gap-0.5 p-1", vertical && "flex-col")}>
      <BarButton
        label={t("undoShort")}
        aria-label={t("undo")}
        disabled={!canUndo}
        onClick={undo}
        className="w-14"
      >
        <IconUndo className="size-6" />
      </BarButton>
      <BarButton
        label={t("redoShort")}
        aria-label={t("redo")}
        disabled={!canRedo}
        onClick={redo}
        className="w-14"
      >
        <IconRedo className="size-6" />
      </BarButton>
    </div>
  );
}

/** Ekranlar: ‹ n / N › va «Ekran» qoʻshish. */
export function ScreenNav({ vertical }: { vertical: boolean }) {
  const t = useTranslations("Doska.bar");

  // Butun `deck` ga EMAS, faqat son va oʻringa obuna — `DoskaShell` dagi
  // bilan bir xil sabab: deck taymerning har soniyasida yangilanadi.
  const screenCount = useDoskaStore((s) => s.deck.screens.length);
  const index = useDoskaStore((s) => s.deck.screens.findIndex((x) => x.id === s.activeScreenId));
  const addScreen = useDoskaStore((s) => s.addScreen);
  const setActiveScreen = useDoskaStore((s) => s.setActiveScreen);

  /** Qoʻshni ekranga oʻtish — `id` bosilgan paytda oʻqiladi. */
  const goTo = (offset: number) => {
    const target = useDoskaStore.getState().deck.screens[index + offset];
    if (target) setActiveScreen(target.id);
  };

  const many = screenCount > 1;

  return (
    <div
      role="group"
      aria-label={t("screensGroup")}
      className="flex shrink-0 flex-col items-center justify-center gap-1 p-2"
    >
      {many && (
        <div className={cn("flex items-center", vertical && "flex-col")}>
          <BarIconButton
            label={t("prevScreen")}
            shortcut={["←"]}
            disabled={index <= 0}
            onClick={() => goTo(-1)}
            className="rounded-md"
          >
            <IconArrowLeft className="size-5" />
          </BarIconButton>

          <span
            role="img"
            aria-label={t("screenNumber", { n: index + 1 })}
            className="text-foreground min-w-12 shrink-0 px-1 text-center text-sm font-semibold tabular-nums"
          >
            {index + 1} / {screenCount}
          </span>

          <BarIconButton
            label={t("nextScreen")}
            shortcut={["→"]}
            disabled={index + 1 >= screenCount}
            onClick={() => goTo(1)}
            className="rounded-md"
          >
            <IconArrowRight className="size-5" />
          </BarIconButton>
        </div>
      )}

      <BarTextButton
        label={t("addScreenShort")}
        aria-label={t("addScreen")}
        icon={<IconAdd className="size-5" />}
        onClick={addScreen}
        className="h-9 rounded-md"
      />
    </div>
  );
}
