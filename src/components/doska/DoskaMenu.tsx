"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { screenHasLocked, useDoskaStore } from "@/lib/doska/store";
import { barIconButtonClass } from "./BarGroup";
import { DoskaAppearance } from "./DoskaAppearance";
import { ProBadge } from "./ProBadge";
import { playBell } from "./sounds";
import {
  IconMenu,
  IconTrash,
  IconAdd,
  IconHome,
  IconUsers,
  IconBell,
  IconCurtain,
  IconPalette,
  IconArrowRight,
} from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA MENYUSI — pastki oʻng guruhdagi ⋮ tugmasi.

   Tuzilma: sarlavha + holat belgisi → sinf eʼtibori (parda, qoʻngʻiroq)
   → «Koʻrinish» (uslub, panel joyi — menyu ichida ochiladi) → ekran
   amallari → pastda taklif kartochkasi.

   Parda va qoʻngʻiroq klaviaturada `1` va `2`, lekin asosiy qurilma
   sensorli doska — shuning uchun ular menyuda ham bor (tugmasiz amal
   boʻlmaydi, docs/doska-ux-tadqiqot.md Q3). Yorliq yonida koʻrsatiladi:
   noutbukdagi oʻqituvchi uni shu yerdan oʻrganadi.

   «Ekranni tozalash» va «Shu ekranni oʻchirish» tasdiq soʻramaydi —
   ikkalasi ham «Qaytarish» xabari bilan qaytariladi (store, DoskaNotice).

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
export function DoskaMenu() {
  const deck = useDoskaStore((s) => s.deck);
  const activeScreenId = useDoskaStore((s) => s.activeScreenId);
  const renameDeck = useDoskaStore((s) => s.renameDeck);
  const clearScreen = useDoskaStore((s) => s.clearScreen);
  const removeScreen = useDoskaStore((s) => s.removeScreen);
  const addScreen = useDoskaStore((s) => s.addScreen);
  const setCurtain = useDoskaStore((s) => s.setCurtain);
  // Qulflangan vidjeti bor ekran oʻchirilmaydi (store: `removeScreen`) —
  // band yashirilmaydi, sababi bilan nofaol koʻrsatiladi.
  const screenLocked = useDoskaStore((s) => screenHasLocked(s.deck, s.activeScreenId));
  const t = useTranslations("Doska.bar");
  const tm = useTranslations("Doska.menu");
  const [open, setOpen] = React.useState(false);
  /** Menyu ichidagi boʻlim. Yopilganda doim bosh roʻyxatga qaytadi. */
  const [view, setView] = React.useState<"main" | "appearance">("main");

  const screenCount = deck.screens.length;
  /** Amal bajarilgach menyu yopiladi — natija (parda, xabar) koʻrinsin. */
  const run = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setView("main");
      }}
    >
      <PopoverTrigger asChild>
        {/* Idish yoʻq — tugma `DoskaShell` dagi guruh ichida turadi. */}
        <button type="button" aria-label={t("menu")} className={barIconButtonClass}>
          <IconMenu className="size-6" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        collisionPadding={12}
        className="doska-bar doska-sheet max-h-[calc(100vh-6rem)] w-80 overflow-y-auto overscroll-contain p-0"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        {view === "appearance" ? (
          <DoskaAppearance onBack={() => setView("main")} />
        ) : (
          <>
          {/* ── Sarlavha ── */}
          <div className="flex flex-col gap-1.5 border-b px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <input
                value={deck.title}
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
          </div>

          {/* ── Amallar ── */}
          <div className="py-1">
            <MenuItem Icon={IconAdd} onClick={run(addScreen)}>
              {tm("newScreen")}
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
      </PopoverContent>
    </Popover>
  );
}

const ITEM_CLASS =
  "hover:bg-muted flex min-h-11 w-full items-center gap-2 px-4 py-2 text-sm transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent";

function MenuItem({
  Icon,
  children,
  href,
  pro = false,
  shortcut,
  hint,
  next = false,
  ...props
}: React.ComponentProps<"button"> & {
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
  /** Pullik imkoniyat — yonida yulduzcha koʻrinadi. */
  pro?: boolean;
  /** Klaviatura yorligʻi — faqat koʻrsatish uchun. */
  shortcut?: string;
  /** Band ostidagi izoh — masalan nega nofaol ekani. */
  hint?: string;
  /** Band menyu ichida yangi boʻlim ochadi — oʻngda strelka. */
  next?: boolean;
}) {
  const inner = (
    <>
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 text-left">
        {children}
        {hint && <span className="text-muted-foreground block text-xs">{hint}</span>}
      </span>
      {pro && <ProBadge />}
      {shortcut && (
        <kbd className="text-muted-foreground rounded border px-1.5 font-mono text-xs leading-5">
          {shortcut}
        </kbd>
      )}
      {next && <IconArrowRight className="text-muted-foreground size-4 shrink-0" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={ITEM_CLASS}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={ITEM_CLASS} {...props}>
      {inner}
    </button>
  );
}
