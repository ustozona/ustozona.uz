"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Doska.bar");

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

  useOpenSetFromUrl();

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
              <BarIconButton label={t("home")} asChild>
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
              <BarIconButton label={t("fullscreen")} onClick={toggleFullscreen}>
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
                    label={t("showControls")}
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
                      label={t("hideControls")}
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
                  label={t("prevScreen")}
                  disabled={!hasPrev}
                  onClick={() => hasPrev && setActiveScreen(deck.screens[index - 1].id)}
                >
                  <IconArrowLeft className="size-5" />
                </BarIconButton>

                <ScreenCounter current={index + 1} />

                <BarIconButton label={t("addScreen")} onClick={addScreen}>
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
  const t = useTranslations("Doska.bar");
  return (
    // Glif oʻzi bezak, lekin raqam maʼlumot — shuning uchun butun
    // boʻlak bitta nom bilan eʼlon qilinadi va ichi yashiriladi.
    <span
      role="img"
      aria-label={t("screenNumber", { n: current })}
      className="flex shrink-0 flex-col items-center gap-[3px] px-1.5"
    >
      <span className="bg-border h-px w-3 rounded-full" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="border-border text-muted-foreground min-w-6 rounded border px-1 text-center font-mono text-tag leading-4 font-medium"
      >
        {current}
      </span>
      <span className="bg-border h-px w-3 rounded-full" aria-hidden="true" />
    </span>
  );
}

/**
 * `/doska?setId=…` — Dashboard'dagi dars kartasidan «Taqdimotni boshlash»
 * (R278: oʻqituvchi dars paytida turgan joyidan boshlaydi, 6-qaror:
 * proyektor ekrani — Doska).
 *
 * Joriy ekranda Taqdimot vidjeti boʻlsa, uning toʻplami almashtiriladi
 * (ikkinchi nusxa tugʻilmaydi); boʻlmasa yangisi qoʻyiladi. Soʻng parametr
 * manzildan olib tashlanadi — aks holda sahifa yangilanganda oʻqituvchi
 * oʻtib boʻlgan taqdimot yana boshidan ochilardi.
 *
 * `useSearchParams` ATAYLAB yoʻq: u Suspense'siz prerender'da buzadi,
 * bu yerda esa parametr faqat bir marta, mount'dan keyin kerak.
 */
function useOpenSetFromUrl() {
  const hydrated = useDoskaStore((s) => s.hydrated);
  const done = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    const url = new URL(window.location.href);
    const setId = url.searchParams.get("setId");
    if (!setId) return;

    const { deck, activeScreenId, addWidget, patchWidgetState } = useDoskaStore.getState();
    const screen = deck.screens.find((s) => s.id === activeScreenId);
    // Jonli sessiyasi bor vidjetga TEGILMAYDI — aks holda eski sessiya yangi
    // toʻplamning qadamlari bilan boshqarilib qolardi. Unda yangi vidjet.
    const existing = screen?.widgets.find((w) => w.kind === "presentation.v1" && !w.state.live);
    // Dars kartasidan kelgan sinf — jonli sessiyada oldindan tanlangan boʻladi.
    const classId = url.searchParams.get("classId") ?? undefined;
    const state = { setId, index: 0, revealed: false, ...(classId ? { classId } : {}) };
    if (existing) patchWidgetState(existing.id, state);
    else addWidget("presentation.v1", undefined, state);

    url.searchParams.delete("setId");
    url.searchParams.delete("classId");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [hydrated]);
}
