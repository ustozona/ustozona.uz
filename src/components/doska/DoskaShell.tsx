"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { STAGE_FONT_CLASS } from "@/components/stage/stage-font-faces";
import { flushDoskaPersist, useDoskaStore } from "@/lib/doska/store";
import { useDoskaPrefs, type DockSide } from "@/lib/doska/prefs";
import { useInkTool } from "@/lib/doska/ink-tool";
import { DoskaCanvas } from "./DoskaCanvas";
import { DoskaCurtain } from "./DoskaCurtain";
import { WidgetBar } from "./WidgetBar";
import { InkBar } from "./InkBar";
import { DoskaGuestNote } from "./DoskaGuestNote";
import { DoskaMenu } from "./DoskaMenu";
import { DoskaNotice } from "./DoskaNotice";
import { DoskaShortcuts } from "./DoskaShortcuts";
import { BarGroup, BarIconButton } from "./BarGroup";
import { DockContext, dockLayout } from "./dock";
import { useDoskaShortcuts } from "./useDoskaShortcuts";
import { DoskaRemote, requestOpenRemote } from "./remote/DoskaRemote";
import { DEFAULT_BACKGROUND_ID } from "@/lib/doska/backgrounds";
import { setLessonTitle, takeLessonHandoff } from "@/lib/doska/lesson-handoff";
import { IconFullscreen, IconAdd, IconArrowLeft, IconArrowRight, IconChevronUp, IconHome } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA QOBIGʻI — toʻliq ekran + ustidagi boshqaruv qatlami.

   ⚠️ Kanvas butun ekranni egallaydi, boshqaruv esa uning USTIDA suzadi.
   Panel oqimda joy egallasa, doska panel balandligicha kichrayadi va
   vidjetni pastga qoʻyib boʻlmaydi.

   JOYLASHUV (docs/doska-referens-koriklari.md §4 — referens koʻrinishi):
     chap tepa   — bosh sahifa
     oʻng tepa   — toʻliq ekran · menyu (har biri alohida idishda)
     vidjet paneli — «Panel joyi»ga koʻra: pastda markazda (standart)
                     yoki chap / oʻng relsada, oʻrtadan pastda; bekor
                     qilish uning ⋮ menyusida va Ctrl+Z da
     chap past   — «Qaytarish» xabari
     oʻng past   — ekranlar (‹ n/N › +)

   ⚠️ Ilgari tepada hech narsa yoʻq edi (docs/doska-ux-tadqiqot.md R319:
   75″ panelning tepasi poldan ≈ 1,8 m, bola yetmaydi). Foydalanuvchi
   referens joylashuvini tanladi (2026-10-02). Tepadagi uchala amal ham
   oʻqituvchiniki va kamdan-kam bosiladi; dars davomida bosiladigan
   hamma narsa (vidjetlar, qalam, ekranlar) pastda qoldi.

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
  // ⚠️ Butun `deck` ga EMAS, faqat son va oʻringa obuna: deck har chiziq
  // tugashida va ishlayotgan taymerning har soniyasida yangilanadi. Qobiq
  // unga obuna boʻlsa butun doska (hamma vidjet, panellar) qayta chizilib,
  // sensorli doskaning kuchsiz protsessorida qalam ostidagi siyoh
  // kechikardi — kompyuterda esa bu umuman sezilmaydi.
  const screenCount = useDoskaStore((s) => s.deck.screens.length);
  const index = useDoskaStore((s) => s.deck.screens.findIndex((x) => x.id === s.activeScreenId));
  const addScreen = useDoskaStore((s) => s.addScreen);
  const setActiveScreen = useDoskaStore((s) => s.setActiveScreen);
  const prefsReady = useDoskaPrefs((s) => s.hydrated);
  const dock = useDoskaPrefs((s) => s.dock);
  // Yozish rejimida vidjet paneli oʻrnini qoʻlyozma paneli egallaydi (InkBar).
  const inking = useInkTool((s) => s.mode !== null);
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
  /** Yorliqlar roʻyxati (`K`, menyu) — dars paytidagi holat, saqlanmaydi. */
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  /** Qoʻshni ekranga oʻtish — `id` bosilgan paytda oʻqiladi. */
  const goTo = (offset: number) => {
    const target = useDoskaStore.getState().deck.screens[index + offset];
    if (target) setActiveScreen(target.id);
  };

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
  useNoTranslate();
  useOpenSetFromUrl();
  useOpenLessonFromUrl();

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  };

  useDoskaShortcuts({
    onToggleFullscreen: toggleFullscreen,
    onToggleControls: () => setBarHidden((h) => !h),
    onToggleShortcuts: () => setShortcutsOpen((o) => !o),
  });

  const side = dock !== "bottom";

  return (
    // `delayDuration` 0 emas, 300: boshqaruv zich joylashgan va nol
    // kechikishda sichqoncha panel ustidan oʻtganda tooltipʼlar ketma-ket
    // chaqnab ketardi.
    <TooltipProvider delayDuration={300}>
      <DockContext.Provider value={dockLayout(dock)}>
        {/* `translate="no"` — serverdan kelgan HTML da ham (R381); menyu va
            kartalar `body` ga chiqadi, ularni `useNoTranslate` yopadi. */}
        <div className="doska-root fixed inset-0 overflow-hidden" translate="no">
          <DoskaCanvas />

          {/* Sozlama (uslub, panel joyi) oʻqilmaguncha boshqaruv chizilmaydi
              (oʻqish birinchi chizishdan oldin — `useDoskaStyle`). Aks holda
              «Oʻyinchoq» yoki chap relsani tanlagan oʻqituvchi har ochilishda
              panelning sakrashini koʻrardi. */}
          {prefsReady && (
            <>
              {/* ── Yuqori burchaklar: bosh sahifa · toʻliq ekran, menyu ──
                  Har biri alohida kichik idishda — bir-biriga bogʻliq
                  boʻlmagan amallar. «Boshqaruvni yashirish» (`B`) ularni
                  ham yashiradi: sinfga toza ekran koʻrsatiladi, ekranda
                  faqat «Koʻrsatish» tugmasi qoladi. */}
              {!barHidden && (
                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                  <BarGroup>
                    <BarIconButton label={t("home")} asChild>
                      <Link href="/">
                        <IconHome className="size-5" />
                      </Link>
                    </BarIconButton>
                  </BarGroup>

                  <div className="flex gap-2">
                    {/* Ustoz pulti — telefon QR bilan ulanadi (docs/ustoz-pulti-spec.md). */}
                    <BarGroup>
                      <DoskaRemote />
                    </BarGroup>
                    <BarGroup>
                      <BarIconButton label={t("fullscreen")} shortcut={["F"]} onClick={toggleFullscreen}>
                        <IconFullscreen className="size-5" />
                      </BarIconButton>
                    </BarGroup>
                    <BarGroup>
                      <DoskaMenu onShowShortcuts={() => setShortcutsOpen(true)} />
                    </BarGroup>
                  </div>
                </div>
              )}

              {side && (
                // Yon relsa — oʻrtadan pastda (yetish zonasi, R319): tepadan
                // ekranning 18% i boʻsh, pastda esa pastki qatorga joy.
                <div
                  className={cn(
                    "pointer-events-none absolute top-[18%] bottom-16 flex min-h-0 flex-col items-center justify-center gap-2",
                    dock === "left" ? "left-2" : "right-2",
                  )}
                >
                  {barHidden ? (
                    <DockToggle dock={dock} onShow={() => setBarHidden(false)} />
                  ) : inking ? (
                    <InkBar onHide={() => setBarHidden(true)} />
                  ) : (
                    <WidgetBar onHide={() => setBarHidden(true)} />
                  )}
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 p-2">
                {/* ── Chap: «Qaytarish» xabari ── */}
                <div className="flex min-w-0 grow basis-0 flex-col items-start gap-2">
                  <DoskaNotice />
                </div>

                {/* ── Markaz: vidjetlar (pastki panelda) ── */}
                <div className="pointer-events-auto flex min-w-0 flex-col items-center gap-2">
                  {!barHidden && <DoskaGuestNote />}

                  {!side &&
                    (barHidden ? (
                      <DockToggle dock={dock} onShow={() => setBarHidden(false)} />
                    ) : inking ? (
                      <InkBar onHide={() => setBarHidden(true)} />
                    ) : (
                      <WidgetBar onHide={() => setBarHidden(true)} />
                    ))}
                </div>

                {/* ── Oʻng: ekranlar ── */}
                <div className="flex min-w-0 grow basis-0 justify-end">
                  {!barHidden && (
                    <BarGroup layer="bar">
                      <BarIconButton
                        label={t("prevScreen")}
                        shortcut={["←"]}
                        disabled={index <= 0}
                        onClick={() => goTo(-1)}
                      >
                        <IconArrowLeft className="size-5" />
                      </BarIconButton>

                      <ScreenCounter current={index + 1} total={screenCount} />

                      <BarIconButton
                        label={t("nextScreen")}
                        shortcut={["→"]}
                        disabled={index + 1 >= screenCount}
                        onClick={() => goTo(1)}
                      >
                        <IconArrowRight className="size-5" />
                      </BarIconButton>

                      <BarIconButton label={t("addScreen")} onClick={addScreen}>
                        <IconAdd className="size-5" />
                      </BarIconButton>
                    </BarGroup>
                  )}
                </div>
              </div>
            </>
          )}

          <DoskaShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
          <DoskaCurtain />
        </div>
      </DockContext.Provider>
    </TooltipProvider>
  );
}

/**
 * Yigʻilgan panel oʻrnidagi yakka «Koʻrsatish» tugmasi. Yigʻish
 * tugmasining oʻzi panel ichida (oʻng ustun, `WidgetBar`); panel
 * yigʻilganda shu tugma OʻSHA joyda paydo boʻladi — oʻqituvchi uni
 * qayerda yashirgan boʻlsa, oʻsha yerdan qaytaradi. Strelka panel
 * chiqadigan tomonga qaraydi.
 */
function DockToggle({ dock, onShow }: { dock: DockSide; onShow: () => void }) {
  const t = useTranslations("Doska.bar");
  const Icon = dock === "bottom" ? IconChevronUp : dock === "left" ? IconArrowRight : IconArrowLeft;

  return (
    <BarGroup layer="bar" className="shrink-0">
      <BarIconButton label={t("showControls")} shortcut={["B"]} onClick={onShow}>
        <Icon className="size-5" />
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
 * Brauzer tarjimoni Doskaga tegmasin (docs/doska-referens-koriklari.md R381).
 *
 * Tarjimon matn tugunlarini oʻz elementlariga oʻraydi, React esa keyin
 * ularni topolmay qulaydi — dars oʻrtasida doska oq ekranga aylanadi.
 * Interfeys baribir 7 tilda, tarjima kerak emas. Oʻqituvchining oʻz
 * yozuvi (matn, stiker) ham boshqa tilga oʻgirilib ketmasin.
 *
 * `<html>` da, `.doska-root` da emas: menyu, sozlama kartasi va tanlash
 * oynalari `body` ga portal qilinadi. Serverdan kelgan HTML ni esa
 * `.doska-root` dagi atribut va sahifa metasi (`google: notranslate`)
 * yopadi — effekt ishlagunicha ham.
 */
function useNoTranslate() {
  React.useEffect(() => {
    const html = document.documentElement;
    const previous = html.getAttribute("translate");
    html.setAttribute("translate", "no");
    return () => {
      if (previous === null) html.removeAttribute("translate");
      else html.setAttribute("translate", previous);
    };
  }, []);
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
    /* `live=1` — Topshiriqlar → «Jonli dars» (bir bosish): vidjet jonli
       sessiyani O'ZI boshlaydi (`PresentationWidget` → `autoLive`).
       Sinfsiz maʼnosiz — sessiya sinf roʻyxatiga tayanadi. */
    const autoLive = url.searchParams.get("live") === "1" && Boolean(classId);
    const state = {
      setId,
      index: 0,
      revealed: false,
      ...(classId ? { classId } : {}),
      ...(autoLive ? { autoLive: true } : {}),
    };
    if (existing) patchWidgetState(existing.id, state);
    else addWidget("presentation.v1", undefined, state);

    url.searchParams.delete("setId");
    url.searchParams.delete("classId");
    url.searchParams.delete("live");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }, [hydrated]);
}

/**
 * `/doska?lesson=1` — Topshiriqlar → Dars studiyasi → «▶ Darsni boshlash»
 * (docs/ustoz-pulti-spec.md §3). Ssenariy `localStorage` orqali keladi
 * (`lib/doska/lesson-handoff.ts`): har blok — yangi ekran, mavjud
 * vidjetlardan (`addTemplateScreen`). Oldingi ekranlar OʻCHIRILMAYDI —
 * dars ekranlari ularning oxiriga qoʻshiladi va birinchisi ochiladi.
 *
 * Soʻng pult oynasi oʻzi ochiladi: darsni telefondan boshqarish — dars
 * rejimining asosiy yoʻli.
 */
function useOpenLessonFromUrl() {
  const hydrated = useDoskaStore((s) => s.hydrated);
  const done = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || done.current) return;
    done.current = true;
    const url = new URL(window.location.href);
    if (url.searchParams.get("lesson") !== "1") return;
    url.searchParams.delete("lesson");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);

    const handoff = takeLessonHandoff();
    if (!handoff || handoff.screens.length === 0) return;
    const store = useDoskaStore.getState();
    const before = new Set(store.deck.screens.map((s) => s.id));
    const background = store.deck.screens.find((s) => s.id === store.activeScreenId)?.background ?? DEFAULT_BACKGROUND_ID;
    handoff.screens.forEach((screen, i) =>
      store.addTemplateScreen({ id: `lesson-${i}`, background, widgets: screen.widgets }),
    );
    const first = useDoskaStore.getState().deck.screens.find((s) => !before.has(s.id));
    if (first) useDoskaStore.getState().setActiveScreen(first.id);
    setLessonTitle(handoff.title);
    requestOpenRemote();
  }, [hydrated]);
}
