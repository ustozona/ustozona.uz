"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { STAGE_FONT_CLASS } from "@/components/stage/stage-font-faces";
import { flushDoskaPersist, useDoskaStore } from "@/lib/doska/store";
import { useDoskaPrefs, type DockSide } from "@/lib/doska/prefs";
import { DoskaCanvas } from "./DoskaCanvas";
import { DoskaCurtain } from "./DoskaCurtain";
import { WidgetBar } from "./WidgetBar";
import { DoskaGuestNote } from "./DoskaGuestNote";
import { DoskaMenu } from "./DoskaMenu";
import { DoskaNotice } from "./DoskaNotice";
import { BarDivider, BarGroup, BarIconButton } from "./BarGroup";
import { DockContext, dockLayout } from "./dock";
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

   ⚠️ BUTUN boshqaruv PASTDA yoki YON RELSADA, tepada hech narsa yoʻq:
     chap past  — bekor qilish / qaytadan bajarish + «Qaytarish» xabari
     vidjet paneli — «Panel joyi»ga koʻra: pastda markazda (standart)
                     yoki chap / oʻng relsada, oʻrtadan pastda
     oʻng past  — ekranlar (‹ n/N › +), toʻliq ekran, menyu
   Asosiy qurilma — sensorli doska. 75″ panelning tepasi poldan ≈ 1,8 m,
   86″ niki ≈ 1,9 m: u yerdagi tugmaga oʻqituvchi qoʻlini toʻliq choʻzib
   yetadi, bola umuman yetmaydi (docs/doska-ux-tadqiqot.md R319, A6).
   Bosh sahifa havolasi menyuda.

   USLUB (Sokin / Oʻyinchoq / Doska) — `<html data-doska-style>` va
   sahna shriftlari klasslari shu yerda qoʻyiladi, sahifadan chiqqanda
   olinadi. `<html>` da, chunki menyu va tanlash oynalari `body` ga
   portal qilinadi va ular ham uslubni olishi kerak (src/styles/doska.css
   sarlavhasi, qoida 3).

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
  const prefsReady = useDoskaPrefs((s) => s.hydrated);
  const dock = useDoskaPrefs((s) => s.dock);
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

  useDoskaStyle();
  useOpenSetFromUrl();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  useDoskaShortcuts({
    onToggleFullscreen: toggleFullscreen,
    onToggleControls: () => setBarHidden((h) => !h),
  });

  const side = dock !== "bottom";

  return (
    // `delayDuration` 0 emas, 300: boshqaruv zich joylashgan va nol
    // kechikishda sichqoncha panel ustidan oʻtganda tooltipʼlar ketma-ket
    // chaqnab ketardi.
    <TooltipProvider delayDuration={300}>
      <DockContext.Provider value={dockLayout(dock)}>
        <div className="doska-root fixed inset-0 overflow-hidden">
          <DoskaCanvas />

          {/* Sozlama (uslub, panel joyi) oʻqilmaguncha boshqaruv chizilmaydi
              (oʻqish birinchi chizishdan oldin — `useDoskaStyle`). Aks holda
              «Oʻyinchoq» yoki chap relsani tanlagan oʻqituvchi har ochilishda
              panelning sakrashini koʻrardi. */}
          {prefsReady && (
            <>
              {side && (
                // Yon relsa — oʻrtadan pastda (yetish zonasi, R319): tepadan
                // ekranning 18% i boʻsh, pastda esa pastki qatorga joy.
                <div
                  className={cn(
                    "pointer-events-none absolute top-[18%] bottom-24 flex min-h-0 flex-col items-center justify-center gap-2",
                    dock === "left" ? "left-3" : "right-3",
                  )}
                >
                  {!barHidden && <WidgetBar />}
                  <DockToggle dock={dock} hidden={barHidden} onToggle={() => setBarHidden((h) => !h)} />
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 p-3">
                {/* ── Chap: bekor qilish ──
                    Chap relsada xabar «Qaytarish» tugmasi YONIDA, ustida
                    emas: yuqoridagi joy relsaniki, xabar uni yopib qoʻyardi. */}
                <div
                  className={cn(
                    "flex min-w-0 grow basis-0 gap-2",
                    dock === "left" ? "flex-row-reverse items-end justify-end" : "flex-col items-start",
                  )}
                >
                  <DoskaNotice />

                  {!barHidden && (
                    <BarGroup layer="bar">
                      <BarIconButton label={t("undo")} disabled={!canUndo} onClick={undo}>
                        <IconUndo className="size-6" />
                      </BarIconButton>
                      <BarIconButton label={t("redo")} disabled={!canRedo} onClick={redo}>
                        <IconRedo className="size-6" />
                      </BarIconButton>
                    </BarGroup>
                  )}
                </div>

                {/* ── Markaz: vidjetlar (pastki panelda) ── */}
                <div className="pointer-events-auto flex min-w-0 flex-col items-center gap-2">
                  {!barHidden && <DoskaGuestNote />}

                  {!side && (
                    <div className="flex max-w-full min-w-0 items-end gap-2">
                      {!barHidden && <WidgetBar />}
                      <DockToggle dock={dock} hidden={barHidden} onToggle={() => setBarHidden((h) => !h)} />
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
                        <IconArrowLeft className="size-6" />
                      </BarIconButton>

                      <ScreenCounter current={index + 1} total={deck.screens.length} />

                      <BarIconButton
                        label={t("nextScreen")}
                        disabled={!next}
                        onClick={() => next && setActiveScreen(next.id)}
                      >
                        <IconArrowRight className="size-6" />
                      </BarIconButton>

                      <BarIconButton label={t("addScreen")} onClick={addScreen}>
                        <IconAdd className="size-6" />
                      </BarIconButton>

                      {/* Toʻliq ekran va menyu bitta guruhda ekranlar bilan:
                          hammasi butun doskaga tegishli amal. */}
                      <BarDivider />

                      <BarIconButton label={t("fullscreen")} onClick={toggleFullscreen}>
                        <IconFullscreen className="size-6" />
                      </BarIconButton>
                      <DoskaMenu />
                    </BarGroup>
                  )}
                </div>
              </div>
            </>
          )}

          <DoskaCurtain />
        </div>
      </DockContext.Provider>
    </TooltipProvider>
  );
}

/**
 * Panelni yigʻish / ochish tugmasi — panel yonida turadi va yigʻilganda
 * oʻsha joyda qoladi: oʻqituvchi uni qayerda yashirgan boʻlsa, oʻsha
 * yerdan qaytaradi. Strelka panel ketadigan tomonga qaraydi.
 */
function DockToggle({ dock, hidden, onToggle }: { dock: DockSide; hidden: boolean; onToggle: () => void }) {
  const t = useTranslations("Doska.bar");
  const Icon =
    dock === "bottom"
      ? hidden
        ? IconChevronUp
        : IconChevronDown
      : (dock === "left") === hidden
        ? IconArrowRight
        : IconArrowLeft;

  return (
    <BarGroup layer="bar" className="shrink-0">
      <BarIconButton label={hidden ? t("showControls") : t("hideControls")} onClick={onToggle}>
        <Icon className="size-6" />
      </BarIconButton>
    </BarGroup>
  );
}

/**
 * Uslub va sahna shriftlarini `<html>` ga qoʻyadi, sahifadan chiqqanda
 * olib tashlaydi. Sozlama shu yerda — mount'dan keyin — oʻqiladi
 * (`prefs.ts`, `skipHydration`).
 *
 * `useLayoutEffect`: sozlama oʻqilgach birinchi chizishdan OLDIN atribut
 * qoʻyiladi — aks holda doska bir kadr «Sokin» koʻrinib, keyin
 * tanlangan uslubga sakrardi.
 */
function useDoskaStyle() {
  const style = useDoskaPrefs((s) => s.style);
  const ready = useDoskaPrefs((s) => s.hydrated);

  // `useLayoutEffect`, `useEffect` emas: `localStorage` sinxron, shuning
  // uchun sozlama birinchi chizishdan OLDIN oʻqiladi — vidjetlar ham bir
  // kadr «Sokin» boʻlib koʻrinmaydi (boshqaruv esa `hydrated` ni kutadi).
  //
  // ⚠️ `localStorage` yopiq boʻlsa (sandbox iframe, sayt maʼlumoti
  // taqiqlangan) zustand `persist` APIʼsini UMUMAN qoʻshmaydi — tipda
  // bor, amalda yoʻq. Unda standart sozlama bilan ishlaymiz; aks holda
  // `hydrated` hech qachon `true` boʻlmay, boshqaruv chizilmasdi.
  React.useLayoutEffect(() => {
    const api: typeof useDoskaPrefs.persist | undefined = useDoskaPrefs.persist;
    if (api) void api.rehydrate();
    else useDoskaPrefs.setState({ hydrated: true });
  }, []);

  // Shrift klasslari `--font-stage-*` ni eʼlon qiladi; uslub tokeni
  // `--doska-font` ular bilan BIR elementda boʻlishi shart (doska.css).
  // Fayllar `preload: false` — brauzer faqat ishlatilgan shriftni oladi.
  React.useEffect(() => {
    const html = document.documentElement;
    const classes = STAGE_FONT_CLASS.split(" ");
    html.classList.add(...classes);
    return () => html.classList.remove(...classes);
  }, []);

  React.useLayoutEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    html.dataset.doskaStyle = style;
    return () => {
      delete html.dataset.doskaStyle;
    };
  }, [style, ready]);
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
      className="text-muted-foreground min-w-12 shrink-0 px-1 text-center text-xs font-medium tabular-nums"
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
