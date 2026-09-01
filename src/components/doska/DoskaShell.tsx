"use client";

import * as React from "react";
import Link from "next/link";

import { TooltipProvider } from "@/components/ui/tooltip";
import { flushDoskaPersist, useDoskaStore } from "@/lib/doska/store";
import { DoskaCanvas } from "./DoskaCanvas";
import { WidgetBar } from "./WidgetBar";
import { DoskaGuestNote } from "./DoskaGuestNote";
import { DoskaMenu } from "./DoskaMenu";
import { BarDivider, BarGroup, BarIconButton } from "./BarGroup";
import {
  IconHome,
  IconFullscreen,
  IconAdd,
  IconArrowLeft,
  IconChevronDown,
  IconChevronUp,
} from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA QOBIGʻI — toʻliq ekran + ustidagi boshqaruv qatlami.

   ⚠️ Kanvas butun ekranni egallaydi, boshqaruv esa uning USTIDA suzadi.
   Panel oqimda joy egallasa, doska panel balandligicha kichrayadi va
   vidjetni pastga qoʻyib boʻlmaydi.

   Qatlam `pointer-events-none`, faqat tugmalar `auto` — shunda
   boshqaruv qatlami kanvasga bosishni toʻsmaydi.

   Z-tartib (docs/doska-dizayn-tizimi.md §5): kanvas → tanlov → panel
   → kontekst → yuqori tugmalar.
   ════════════════════════════════════════════════════════════════════ */
export function DoskaShell() {
  const deck = useDoskaStore((s) => s.deck);
  const activeScreenId = useDoskaStore((s) => s.activeScreenId);
  const addScreen = useDoskaStore((s) => s.addScreen);
  const setActiveScreen = useDoskaStore((s) => s.setActiveScreen);

  /**
   * Panel yigʻilganmi.
   *
   * ⚠️ Storeʼda EMAS, yaʼni saqlanmaydi. Sabab: yashirish dars paytiga
   * tegishli qaror («hozir sinf ekranga qarasin»), keyingi darsga emas.
   * Saqlansa oʻqituvchi ertasi kuni doskani ochib boshqaruvni
   * topolmaydi va ilova buzilgan deb oʻylaydi.
   */
  const [barHidden, setBarHidden] = React.useState(false);

  const index = deck.screens.findIndex((s) => s.id === activeScreenId);
  const hasPrev = index > 0;

  // Ekran holati kechiktirilib saqlanadi (store.ts). Sahifa yopilishi
  // yoki tab almashishida kutilayotgan yozuvni darhol tushiramiz —
  // aks holda oxirgi 350 ms ichidagi oʻzgarish yoʻqolardi. Listener
  // SHU YERDA: faqat komponent effektida toza `removeEventListener` bor.
  React.useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushDoskaPersist();
    };
    window.addEventListener("pagehide", flushDoskaPersist);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flushDoskaPersist);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  return (
    // `delayDuration` 0 emas, 300: boshqaruv zich joylashgan va nol
    // kechikishda sichqoncha panel ustidan oʻtganda tooltipʼlar ketma-ket
    // chaqnab ketardi.
    <TooltipProvider delayDuration={300}>
      <div className="fixed inset-0 overflow-hidden">
        <DoskaCanvas />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-2 p-3">
          {/* ── Yuqori qator ── */}
          <div className="flex items-start gap-2">
            <BarGroup>
              <BarIconButton label="Ustozona bosh sahifasi" asChild>
                <Link href="/">
                  <IconHome className="size-5" />
                </Link>
              </BarIconButton>
            </BarGroup>

            <div className="grow" />

            {/* Toʻliq ekran va menyu bitta guruhda: ikkalasi ham butun
                ekranga tegishli amal, ikki alohida kartochka esa
                burchakda ortiqcha shovqin edi. */}
            <BarGroup>
              <BarIconButton label="Toʻliq ekran" onClick={toggleFullscreen}>
                <IconFullscreen className="size-5" />
              </BarIconButton>
              <BarDivider />
              <DoskaMenu />
            </BarGroup>
          </div>

          {/* ── Pastki qator ── */}
          <div className="flex items-end gap-2">
            <div className="grow basis-0" />

            <div className="pointer-events-auto flex flex-col items-center gap-2">
              {!barHidden && <DoskaGuestNote />}

              {barHidden ? (
                <BarGroup layer="bar">
                  <BarIconButton
                    label="Boshqaruvni koʻrsatish"
                    onClick={() => setBarHidden(false)}
                  >
                    <IconChevronUp className="size-5" />
                  </BarIconButton>
                </BarGroup>
              ) : (
                <div className="flex items-end gap-2">
                  <WidgetBar />
                  <BarGroup layer="bar">
                    <BarIconButton
                      label="Boshqaruvni yashirish"
                      onClick={() => setBarHidden(true)}
                    >
                      <IconChevronDown className="size-5" />
                    </BarIconButton>
                  </BarGroup>
                </div>
              )}
            </div>

            <div className="flex grow basis-0 justify-end">
              <BarGroup layer="bar">
                <BarIconButton
                  label="Oldingi ekran"
                  disabled={!hasPrev}
                  onClick={() => hasPrev && setActiveScreen(deck.screens[index - 1].id)}
                >
                  <IconArrowLeft className="size-5" />
                </BarIconButton>

                <ScreenCounter current={index + 1} />

                <BarIconButton label="Ekran qoʻshish" onClick={addScreen}>
                  <IconAdd className="size-5" />
                </BarIconButton>
              </BarGroup>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Ekran hisoblagichi — raqam ustida va ostida qisqa chiziq.
 *
 * Yalangʻoch ramkali raqam «1» yonidagi strelkalar bilan birga sahifa
 * raqamiga ham, vidjet soniga ham, ekran raqamiga ham oʻxshardi. Ikki
 * chiziq uni TAXLAM boʻlagi qilib koʻrsatadi: ustida ham, ostida ham
 * boshqa ekran bor degan maʼno.
 *
 * Chiziqlar raqamdan tor (12px va 20px) — teng boʻlsa shakl uch qavatli
 * jadvalga aylanadi.
 */
function ScreenCounter({ current }: { current: number }) {
  return (
    // Glif oʻzi bezak, lekin raqam maʼlumot — shuning uchun butun
    // boʻlak bitta nom bilan eʼlon qilinadi va ichi yashiriladi.
    <span
      role="img"
      aria-label={`${current}-ekran`}
      className="flex shrink-0 flex-col items-center gap-[3px] px-1.5"
    >
      <span className="bg-border h-px w-3 rounded-full" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="border-border text-muted-foreground min-w-6 rounded border px-1 text-center font-mono text-[11px] leading-4 font-medium"
      >
        {current}
      </span>
      <span className="bg-border h-px w-3 rounded-full" aria-hidden="true" />
    </span>
  );
}
