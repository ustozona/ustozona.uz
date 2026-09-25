"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { TooltipProvider } from "@/components/ui/tooltip";
import { flushDoskaPersist, useDoskaStore } from "@/lib/doska/store";
import { DoskaCanvas } from "./DoskaCanvas";
import { DoskaCurtain } from "./DoskaCurtain";
import { WidgetBar } from "./WidgetBar";
import { DoskaGuestNote } from "./DoskaGuestNote";
import { DoskaMenu } from "./DoskaMenu";
import { DoskaNotice } from "./DoskaNotice";
import { BarDivider, BarGroup, BarIconButton } from "./BarGroup";
import { useDoskaShortcuts } from "./useDoskaShortcuts";
import {
  IconFullscreen,
  IconAdd,
  IconArrowLeft,
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconRedo,
  IconUndo,
} from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA QOBIGʻI — toʻliq ekran + ustidagi boshqaruv qatlami.

   ⚠️ Kanvas butun ekranni egallaydi, boshqaruv esa uning USTIDA suzadi.
   Panel oqimda joy egallasa, doska panel balandligicha kichrayadi va
   vidjetni pastga qoʻyib boʻlmaydi.

   ⚠️ BUTUN boshqaruv PASTKI qatorda, tepada hech narsa yoʻq:
     chap   — bekor qilish / qaytadan bajarish + «Qaytarish» xabari
     markaz — vidjet paneli
     oʻng   — ekranlar (‹ n/N › +), toʻliq ekran, menyu
   Asosiy qurilma — sensorli doska. 75″ panelning tepasi poldan ≈ 1,8 m,
   86″ niki ≈ 1,9 m: u yerdagi tugmaga oʻqituvchi qoʻlini toʻliq choʻzib
   yetadi, bola umuman yetmaydi (docs/doska-ux-tadqiqot.md R319, A6).
   Bosh sahifa havolasi menyuda.

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
  const undo = useDoskaStore((s) => s.undo);
  const redo = useDoskaStore((s) => s.redo);
  const canUndo = useDoskaStore((s) => s.past.length > 0);
  const canRedo = useDoskaStore((s) => s.future.length > 0);
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
  const prev = deck.screens[index - 1];
  const next = deck.screens[index + 1];

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

  useDoskaShortcuts({
    onToggleFullscreen: toggleFullscreen,
    onToggleControls: () => setBarHidden((h) => !h),
  });

  return (
    // `delayDuration` 0 emas, 300: boshqaruv zich joylashgan va nol
    // kechikishda sichqoncha panel ustidan oʻtganda tooltipʼlar ketma-ket
    // chaqnab ketardi.
    <TooltipProvider delayDuration={300}>
      <div className="fixed inset-0 overflow-hidden">
        <DoskaCanvas />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 p-3">
          {/* ── Chap: bekor qilish ── */}
          <div className="flex min-w-0 grow basis-0 flex-col items-start gap-2">
            <DoskaNotice />

            {!barHidden && (
              <BarGroup layer="bar">
                <BarIconButton label={t("undo")} disabled={!canUndo} onClick={undo}>
                  <IconUndo className="size-5" />
                </BarIconButton>
                <BarIconButton label={t("redo")} disabled={!canRedo} onClick={redo}>
                  <IconRedo className="size-5" />
                </BarIconButton>
              </BarGroup>
            )}
          </div>

          {/* ── Markaz: vidjetlar ── */}
          <div className="pointer-events-auto flex min-w-0 flex-col items-center gap-2">
            {!barHidden && <DoskaGuestNote />}

            {barHidden ? (
              <BarGroup layer="bar">
                <BarIconButton label={t("showControls")} onClick={() => setBarHidden(false)}>
                  <IconChevronUp className="size-5" />
                </BarIconButton>
              </BarGroup>
            ) : (
              <div className="flex max-w-full min-w-0 items-end gap-2">
                <WidgetBar />
                <BarGroup layer="bar">
                  <BarIconButton label={t("hideControls")} onClick={() => setBarHidden(true)}>
                    <IconChevronDown className="size-5" />
                  </BarIconButton>
                </BarGroup>
              </div>
            )}
          </div>

          {/* ── Oʻng: ekranlar, toʻliq ekran, menyu ── */}
          <div className="flex min-w-0 grow basis-0 justify-end">
            {!barHidden && (
              <BarGroup layer="bar">
                <BarIconButton
                  label={t("prevScreen")}
                  disabled={!prev}
                  onClick={() => prev && setActiveScreen(prev.id)}
                >
                  <IconArrowLeft className="size-5" />
                </BarIconButton>

                <ScreenCounter current={index + 1} total={deck.screens.length} />

                <BarIconButton
                  label={t("nextScreen")}
                  disabled={!next}
                  onClick={() => next && setActiveScreen(next.id)}
                >
                  <IconArrowRight className="size-5" />
                </BarIconButton>

                <BarIconButton label={t("addScreen")} onClick={addScreen}>
                  <IconAdd className="size-5" />
                </BarIconButton>

                {/* Toʻliq ekran va menyu bitta guruhda ekranlar bilan:
                    hammasi butun doskaga tegishli amal. */}
                <BarDivider />

                <BarIconButton label={t("fullscreen")} onClick={toggleFullscreen}>
                  <IconFullscreen className="size-5" />
                </BarIconButton>
                <DoskaMenu />
              </BarGroup>
            )}
          </div>
        </div>

        <DoskaCurtain />
      </div>
    </TooltipProvider>
  );
}

/**
 * Ekran hisoblagichi — «2 / 3».
 *
 * Ilgari faqat joriy raqam bor edi (ustida va ostida chiziq bilan) va
 * «keyingi» tugmasi yoʻq edi: oʻqituvchi nechta ekran borligini ham,
 * oldinga qanday oʻtishni ham bilmasdi. Jami son ikkalasini hal qiladi.
 */
function ScreenCounter({ current, total }: { current: number; total: number }) {
  const t = useTranslations("Doska.bar");
  return (
    <span
      role="img"
      aria-label={t("screenNumber", { n: current })}
      className="text-muted-foreground min-w-12 shrink-0 px-1 text-center font-mono text-xs font-medium tabular-nums"
    >
      {current} / {total}
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
