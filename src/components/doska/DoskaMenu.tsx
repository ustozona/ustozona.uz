"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { screenHasLocked, useDoskaStore } from "@/lib/doska/store";
import { downloadScreenPng, exportFileName } from "@/lib/doska/export";
import { DoskaAppearance } from "./DoskaAppearance";
import { DoskaTemplates } from "./DoskaTemplates";
import { MenuItem, MenuPopover } from "./MenuPopover";
import { playBell } from "./sounds";
import {
  IconTrash,
  IconAdd,
  IconHome,
  IconUsers,
  IconBell,
  IconCurtain,
  IconPalette,
  IconArrowRight,
  IconImageDownload,
  IconKeyboard,
  IconFullscreen,
  IconCopy,
  IconArrowLeft,
  IconCatalog,
} from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA MENYUSI — oʻng tepadagi ⋮ tugmasi (`DoskaShell`). Qolip —
   `MenuPopover`.

   Tuzilma: sarlavha + holat belgisi → sinf eʼtibori (parda, qoʻngʻiroq)
   → «Koʻrinish» (uslub, panel joyi — menyu ichida ochiladi), toʻliq
   ekran, yorliqlar → ekran amallari → pastda taklif kartochkasi.

   Parda va qoʻngʻiroq klaviaturada `1` va `2`, lekin asosiy qurilma
   sensorli doska — shuning uchun ular menyuda ham bor (tugmasiz amal
   boʻlmaydi, docs/doska-ux-tadqiqot.md Q3). Yorliq yonida koʻrsatiladi:
   noutbukdagi oʻqituvchi uni shu yerdan oʻrganadi.

   «Rasm qilib saqlash» — joriy ekran PNG boʻlib yuklanadi
   (lib/doska/export.ts). Menyu tayyor boʻlguncha ochiq qoladi: katta
   ekranda bir-ikki soniya ketadi va xato boʻlsa u shu bandning ostida
   yoziladi.

   «Ekranni tozalash» va «Shu ekranni oʻchirish» tasdiq soʻramaydi —
   ikkalasi ham «Qaytarish» xabari bilan qaytariladi (store, DoskaNotice).

   «Klaviatura yorliqlari» (`K`) roʻyxat oynasini ochadi — oyna
   `DoskaShell` da turadi, chunki `K` menyu yopiq paytda ham ishlaydi.

   ⚠️ BIZNES MODELI (2026-08-21 qarori):
     • Mehmon — doska toʻliq ishlaydi, ekran shu brauzerda qoladi
     • Pullik — hisobga saqlash (istalgan qurilmadan), sinf roʻyxatini
       ulash, ekranlar toʻplami

   Yaʼni bepul qismi ishlatishga toʻsiq qoʻymaydi, pullik qismi esa
   ishni SAQLAB QOLISH va jurnalga ULASH. Pro bandlari yonida yulduzcha
   belgisi turadi — bosilganda taklif ochiladi, band oʻchirilgan
   holatda emas: oʻchirilgan tugma sababini tushuntirmaydi
   (docs/design-system.md modal qoidasi).
   ════════════════════════════════════════════════════════════════════ */
export function DoskaMenu({
  onShowShortcuts,
  onToggleFullscreen,
}: {
  onShowShortcuts: () => void;
  onToggleFullscreen: () => void;
}) {
  // Butun `deck` ga emas: u har chiziqda va taymerning har soniyasida yangilanadi.
  const title = useDoskaStore((s) => s.deck.title);
  const screenCount = useDoskaStore((s) => s.deck.screens.length);
  const activeScreenId = useDoskaStore((s) => s.activeScreenId);
  const renameDeck = useDoskaStore((s) => s.renameDeck);
  const clearScreen = useDoskaStore((s) => s.clearScreen);
  const removeScreen = useDoskaStore((s) => s.removeScreen);
  const addScreen = useDoskaStore((s) => s.addScreen);
  const duplicateScreen = useDoskaStore((s) => s.duplicateScreen);
  const moveScreen = useDoskaStore((s) => s.moveScreen);
  const screenIndex = useDoskaStore((s) => s.deck.screens.findIndex((x) => x.id === s.activeScreenId));
  const setCurtain = useDoskaStore((s) => s.setCurtain);
  // Qulflangan vidjeti bor ekran oʻchirilmaydi (store: `removeScreen`) —
  // band yashirilmaydi, sababi bilan nofaol koʻrsatiladi.
  const screenLocked = useDoskaStore((s) => screenHasLocked(s.deck, s.activeScreenId));
  const t = useTranslations("Doska.bar");
  const tm = useTranslations("Doska.menu");
  const [open, setOpen] = React.useState(false);
  /** Menyu ichidagi boʻlim. Yopilganda doim bosh roʻyxatga qaytadi. */
  const [view, setView] = React.useState<"main" | "appearance" | "templates">("main");
  const [exporting, setExporting] = React.useState<"idle" | "busy" | "failed">("idle");

  const saveImage = async () => {
    if (exporting === "busy") return;
    setExporting("busy");
    try {
      const { deck } = useDoskaStore.getState();
      const number = deck.screens.findIndex((x) => x.id === activeScreenId) + 1;
      await downloadScreenPng(exportFileName(deck.title, number));
      setExporting("idle");
      setOpen(false);
    } catch (err) {
      console.error("[doska] ekranni rasmga saqlab boʻlmadi", err);
      setExporting("failed");
    }
  };

  /** Amal bajarilgach menyu yopiladi — natija (parda, xabar) koʻrinsin. */
  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <MenuPopover
      label={t("menu")}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setView("main");
          if (exporting === "failed") setExporting("idle");
        }
      }}
      side="bottom"
      align="end"
      className="max-h-[calc(100vh-6rem)] w-80 overflow-y-auto overscroll-contain"
    >
      {view === "appearance" ? (
        <DoskaAppearance onBack={() => setView("main")} />
      ) : view === "templates" ? (
        <DoskaTemplates
          onBack={() => setView("main")}
          onDone={() => {
            setOpen(false);
            setView("main");
          }}
        />
      ) : (
        <>
        {/* ── Sarlavha ── */}
        <div className="flex flex-col gap-1.5 border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <input
              value={title}
              onChange={(e) => renameDeck(e.target.value)}
              aria-label={tm("deckName")}
              className="focus-visible:ring-ring/50 -mx-1.5 min-w-0 flex-1 rounded-md px-1.5 py-0.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
            />
            <span className="bg-warning/15 text-warning-foreground shrink-0 rounded-full px-2 py-0.5 text-tag font-medium">
              {tm("unsaved")}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">{tm("localOnly", { n: screenCount })}</p>
        </div>

        {/* ── Sinf eʼtibori ── */}
        <div className="border-b py-1">
          <MenuItem Icon={IconCurtain} shortcut="1" onClick={run(() => setCurtain(true))}>
            {tm("curtain")}
          </MenuItem>
          <MenuItem Icon={IconBell} shortcut="2" onClick={() => playBell()}>
            {tm("bell")}
          </MenuItem>
        </div>

        {/* ── Koʻrinish ── */}
        <div className="border-b py-1">
          <MenuItem Icon={IconPalette} next onClick={() => setView("appearance")}>
            {tm("appearance")}
          </MenuItem>
          <MenuItem Icon={IconFullscreen} shortcut="F" onClick={run(onToggleFullscreen)}>
            {t("fullscreen")}
          </MenuItem>
          <MenuItem Icon={IconKeyboard} shortcut="K" onClick={run(onShowShortcuts)}>
            {tm("shortcuts")}
          </MenuItem>
        </div>

        {/* ── Amallar ── */}
        <div className="py-1">
          <MenuItem Icon={IconAdd} onClick={run(addScreen)}>
            {tm("newScreen")}
          </MenuItem>
          <MenuItem Icon={IconCatalog} next onClick={() => setView("templates")}>
            {tm("templates")}
          </MenuItem>
          <MenuItem Icon={IconCopy} onClick={run(duplicateScreen)}>
            {tm("duplicateScreen")}
          </MenuItem>
          {/* Tartib — dars bosqichlari ketma-ketligi (R399). Menyu ochiq
              qoladi: oʻqituvchi ekranni bir necha qadam sura oladi. */}
          {screenCount > 1 && (
            <>
              <MenuItem Icon={IconArrowLeft} disabled={screenIndex <= 0} onClick={() => moveScreen(-1)}>
                {tm("moveScreenEarlier")}
              </MenuItem>
              <MenuItem Icon={IconArrowRight} disabled={screenIndex >= screenCount - 1} onClick={() => moveScreen(1)}>
                {tm("moveScreenLater")}
              </MenuItem>
            </>
          )}
          <MenuItem
            Icon={IconImageDownload}
            disabled={exporting === "busy"}
            hint={exporting === "busy" ? tm("savingImage") : exporting === "failed" ? tm("saveImageFailed") : undefined}
            onClick={saveImage}
          >
            {tm("saveImage")}
          </MenuItem>
          <MenuItem Icon={IconUsers} pro>
            {tm("connectClass")}
          </MenuItem>
          <MenuItem Icon={IconTrash} onClick={run(clearScreen)}>
            {tm("clearScreen")}
          </MenuItem>
          {screenCount > 1 && (
            <MenuItem
              Icon={IconTrash}
              disabled={screenLocked}
              hint={screenLocked ? tm("removeScreenLocked") : undefined}
              onClick={run(() => removeScreen(activeScreenId))}
            >
              {tm("removeScreen")}
            </MenuItem>
          )}

          <hr className="mx-4 my-1" />

          <MenuItem Icon={IconHome} href="/">
            {t("home")}
          </MenuItem>
        </div>

        {/* ── Taklif ── */}
        <div className="p-3 pt-1">
          <div className="bg-accent flex flex-col gap-1.5 rounded-[calc(var(--radius)/1.4)] p-3">
            <p className="text-accent-foreground text-sm font-medium">{tm("promoTitle")}</p>
            <p className="text-accent-foreground/80 text-xs leading-relaxed">{tm("promoBody")}</p>
            <Button asChild size="sm" className="mt-1.5 w-full">
              <Link href="/register">{tm("promoCta")}</Link>
            </Button>
          </div>
        </div>
        </>
      )}
    </MenuPopover>
  );
}

