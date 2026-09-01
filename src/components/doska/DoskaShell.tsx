"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { flushDoskaPersist, useDoskaStore } from "@/lib/doska/store";
import { DoskaCanvas } from "./DoskaCanvas";
import { WidgetBar } from "./WidgetBar";
import { DoskaGuestNote } from "./DoskaGuestNote";
import { DoskaMenu } from "./DoskaMenu";
import { IconHome, IconFullscreen, IconAdd, IconArrowLeft } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   DOSKA QOBIGʻI — toʻliq ekran + ustidagi boshqaruv qatlami.

   ⚠️ Kanvas butun ekranni egallaydi, boshqaruv esa uning USTIDA suzadi
   (classroomscreen naqshi). Panel oqimda joy egallasa, doska panel
   balandligicha kichrayadi va vidjetni pastga qoʻyib boʻlmaydi.

   Qatlam `pointer-events-none`, faqat tugmalar `auto` — shunda
   boshqaruv qatlami kanvasga bosishni toʻsmaydi.

   Z-tartib (docs/doska-dizayn-tizimi.md §5): kanvas → tanlov → panel.
   ════════════════════════════════════════════════════════════════════ */
export function DoskaShell() {
  const deck = useDoskaStore((s) => s.deck);
  const activeScreenId = useDoskaStore((s) => s.activeScreenId);
  const addScreen = useDoskaStore((s) => s.addScreen);
  const setActiveScreen = useDoskaStore((s) => s.setActiveScreen);

  const index = deck.screens.findIndex((s) => s.id === activeScreenId);
  const hasPrev = index > 0;

  // Ekran holati kechiktirilib saqlanadi (store.ts). Sahifa yopilishi
  // yoki tab almashishida kutilayotgan yozuvni darhol tushiramiz —
  // aks holda oxirgi 350 ms ичidagi oʻzgarish yoʻqolardi. Listener
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
    <div className="fixed inset-0 overflow-hidden">
      <DoskaCanvas />

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-2 p-3">
        {/* ── Yuqori qator ── */}
        <div className="flex items-start gap-2">
          <ShellButton asChild label="Ustozona">
            <Link href="/">
              <IconHome className="size-5" />
            </Link>
          </ShellButton>

          <div className="grow" />

          <ShellButton label="Toʻliq ekran" onClick={toggleFullscreen}>
            <IconFullscreen className="size-5" />
          </ShellButton>
          <DoskaMenu />
        </div>

        {/* ── Pastki qator ── */}
        <div className="flex items-end gap-2">
          <div className="grow basis-0" />

          <div className="pointer-events-auto">
            <div className="flex flex-col items-center gap-2">
              <DoskaGuestNote />
              <WidgetBar />
            </div>
          </div>

          <div className="flex grow basis-0 justify-end">
            <div className="doska-bar bg-background pointer-events-auto flex items-center gap-1 rounded-[var(--radius)] border p-1 shadow-lg">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => hasPrev && setActiveScreen(deck.screens[index - 1].id)}
                title="Oldingi ekran"
                className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <IconArrowLeft className="size-5" />
              </button>

              <span className="text-muted-foreground border-border min-w-7 rounded border px-1.5 text-center text-xs font-medium">
                {index + 1}
              </span>

              <button
                type="button"
                onClick={addScreen}
                title="Ekran qoʻshish"
                className="text-muted-foreground hover:bg-muted hover:text-foreground grid size-8 place-items-center rounded-md transition-colors"
              >
                <IconAdd className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Qobiq tugmasi — yuqori burchaklardagi yakka boshqaruv.
 *
 * Panel tugmasidan farq qiladi: bu yerda nom yoʻq, faqat ikona, va u
 * doim oq kartochkada turadi — chunki fon istalgan rangda boʻlishi
 * mumkin va ikona yoʻqolib qolmasligi kerak.
 */
function ShellButton({
  label,
  children,
  asChild = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { label: string; asChild?: boolean }) {
  const shell = cn(
    "doska-bar bg-background text-muted-foreground hover:text-foreground pointer-events-auto grid size-10 place-items-center rounded-[var(--radius)] border shadow-md transition-colors",
    className,
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      className: shell,
      title: label,
      "aria-label": label,
    });
  }

  return (
    <button type="button" title={label} aria-label={label} className={shell} {...props}>
      {children}
    </button>
  );
}
