"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore } from "@/lib/doska/store";
import { barIconButtonClass } from "./BarGroup";
import { IconMenu, IconTrash, IconAdd, IconHome, IconUsers } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA MENYUSI — yuqori oʻng burchakdagi ⋮ tugmasi.

   Tuzilma: sarlavha + holat belgisi → amallar roʻyxati → pastda
   taklif kartochkasi.

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

  const screenCount = deck.screens.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* Idish yoʻq — tugma `DoskaShell` dagi guruh ichida turadi. */}
        <button type="button" aria-label="Menyu" className={barIconButtonClass}>
          <IconMenu className="size-5" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="doska-bar w-72 p-0"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        {/* ── Sarlavha ── */}
        <div className="flex flex-col gap-1.5 border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <input
              value={deck.title}
              onChange={(e) => renameDeck(e.target.value)}
              aria-label="Ekran nomi"
              className="focus-visible:ring-ring/50 -mx-1.5 min-w-0 flex-1 rounded-md px-1.5 py-0.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
            />
            <span className="bg-warning/15 text-warning-foreground shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
              Saqlanmagan
            </span>
          </div>
          <p className="text-muted-foreground text-xs">
            {screenCount} ta ekran · faqat shu brauzerda
          </p>
        </div>

        {/* ── Amallar ── */}
        <div className="py-1">
          <MenuItem Icon={IconAdd} onClick={addScreen}>
            Yangi ekran
          </MenuItem>
          <MenuItem Icon={IconUsers} pro>
            Sinf roʻyxatini ulash
          </MenuItem>
          <MenuItem Icon={IconTrash} onClick={clearScreen}>
            Ekranni tozalash
          </MenuItem>
          {screenCount > 1 && (
            <MenuItem Icon={IconTrash} onClick={() => removeScreen(activeScreenId)}>
              Shu ekranni oʻchirish
            </MenuItem>
          )}

          <hr className="mx-4 my-1" />

          <MenuItem Icon={IconHome} href="/">
            Ustozona bosh sahifasi
          </MenuItem>
        </div>

        {/* ── Taklif ── */}
        <div className="p-3 pt-1">
          <div className="bg-accent flex flex-col gap-1.5 rounded-[calc(var(--radius)/1.4)] p-3.5">
            <p className="text-accent-foreground text-sm font-medium">
              Ishingizni saqlab qoʻying
            </p>
            <p className="text-accent-foreground/80 text-xs leading-relaxed">
              Ekranlaringiz hisobingizda saqlanadi, sinf roʻyxatingiz ulanadi va
              soʻralgan oʻquvchi jurnalga tushadi.
            </p>
            <Button asChild size="sm" className="mt-1.5 w-full">
              <Link href="/register">Imkoniyatlarni koʻrish</Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Pro belgisi — sariq doira ichida yulduzcha.
    Rang mavjud --warning tokenidan; yangi rang kiritilmaydi. */
function ProBadge() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-label="Pullik imkoniyat">
      <rect width="20" height="20" rx="10" fill="var(--warning)" />
      <path
        fill="#fff"
        d="m11.504 11.77-1.082 2.936a.45.45 0 0 1-.844 0L8.496 11.77a.45.45 0 0 0-.266-.267l-2.935-1.082a.45.45 0 0 1 0-.844L8.23 8.496a.45.45 0 0 0 .266-.266l1.082-2.935a.45.45 0 0 1 .844 0l1.082 2.935a.45.45 0 0 0 .267.266l2.934 1.082a.45.45 0 0 1 0 .844l-2.934 1.082a.45.45 0 0 0-.267.267Z"
      />
    </svg>
  );
}

const ITEM_CLASS =
  "hover:bg-muted flex w-full items-center gap-2.5 px-4 py-2 text-sm transition-colors";

function MenuItem({
  Icon,
  children,
  href,
  pro = false,
  ...props
}: React.ComponentProps<"button"> & {
  Icon: React.ComponentType<{ className?: string }>;
  href?: string;
  /** Pullik imkoniyat — yonida yulduzcha koʻrinadi. */
  pro?: boolean;
}) {
  const inner = (
    <>
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 text-left">{children}</span>
      {pro && <ProBadge />}
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
