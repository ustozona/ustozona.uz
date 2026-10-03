"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { useInkTool } from "@/lib/doska/ink-tool";
import {
  IconAdd,
  IconArrowLeft,
  IconArrowRight,
  IconEraser,
  IconPen,
  IconRedo,
  IconUndo,
} from "./icons";

/* ════════════════════════════════════════════════════════════════════
   TEZKOR MENYU — boʻsh joyni bosib turganda (yoki sichqonchaning oʻng
   tugmasi bilan) bosilgan nuqtada doira boʻlib ochiladi.

   Nega: 75″ doskada oʻqituvchi panelga yurishi shart emas — qalam,
   oʻchirgʻich, bekor qilish va ekran almashtirish qoʻl ostida. Panel
   oʻrnini BOSMAYDI: u yashirin ishora, birinchi kuni hech kim bilmaydi,
   shuning uchun tezkor yoʻl sifatida qoʻshimcha.

   Qoidalar:
     • faqat «tanlash» rejimida (qoʻlyozma rejimida bosib turish — bu
       chizish: qalam ushlab turilgan nuqta menyuga aylanib ketmasin);
     • faqat BOʻSH kanvasda (`target === root`) — vidjet ustida emas;
     • 500 ms, 10 px dan koʻp siljisa bekor (sudrash menyu emas);
     • chetdan 150 px ichkarida ochiladi — doira ekrandan chiqmasin;
     • tashqariga bosish, `Esc` yoki amal — yopadi.

   Bosilgan nuqta kanvas oʻlchamiga bogʻliq emas: menyu `fixed`.
   ════════════════════════════════════════════════════════════════════ */

const HOLD_MS = 500;
const MOVE_TOLERANCE_PX = 10;
const RADIUS_PX = 104;
const EDGE_PX = 150;

type Spot = { x: number; y: number };

export function DoskaRadialMenu() {
  const [spot, setSpot] = React.useState<Spot | null>(null);

  React.useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-doska-canvas]");
    if (!root) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let start: Spot | null = null;

    const allowed = (e: Event) => {
      if (e.target !== root) return false;
      if (useInkTool.getState().mode !== null) return false;
      const s = useDoskaStore.getState();
      return !s.spotlightId && !s.editingId;
    };

    const cancel = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      start = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cancel);
      window.removeEventListener("pointercancel", cancel);
    };

    const onMove = (e: PointerEvent) => {
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_TOLERANCE_PX) cancel();
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !allowed(e)) return;
      cancel();
      const at = { x: e.clientX, y: e.clientY };
      start = at;
      timer = setTimeout(() => {
        cancel();
        setSpot(at);
      }, HOLD_MS);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", cancel);
      window.addEventListener("pointercancel", cancel);
    };

    // Sichqonchaning oʻng tugmasi va sensorli ekranda brauzerning oʻz
    // «uzoq bosish» hodisasi: ikkalasi ham menyuni ochadi va brauzer
    // menyusini oʻchiradi.
    const onContextMenu = (e: MouseEvent) => {
      if (!allowed(e)) return;
      e.preventDefault();
      cancel();
      setSpot({ x: e.clientX, y: e.clientY });
    };

    root.addEventListener("pointerdown", onDown);
    root.addEventListener("contextmenu", onContextMenu);
    return () => {
      cancel();
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  if (!spot) return null;
  return <RadialDisc spot={spot} onClose={() => setSpot(null)} />;
}

function RadialDisc({ spot, onClose }: { spot: Spot; onClose: () => void }) {
  const t = useTranslations("Doska.bar");
  const tInk = useTranslations("Doska.ink");

  const undo = useDoskaStore((s) => s.undo);
  const redo = useDoskaStore((s) => s.redo);
  const canUndo = useDoskaStore((s) => s.past.length > 0);
  const canRedo = useDoskaStore((s) => s.future.length > 0);
  const addScreen = useDoskaStore((s) => s.addScreen);
  const setActiveScreen = useDoskaStore((s) => s.setActiveScreen);
  const screenCount = useDoskaStore((s) => s.deck.screens.length);
  const index = useDoskaStore((s) => s.deck.screens.findIndex((x) => x.id === s.activeScreenId));

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const goTo = (offset: number) => {
    const target = useDoskaStore.getState().deck.screens[index + offset];
    if (target) setActiveScreen(target.id);
  };

  const items: {
    key: string;
    label: string;
    showLabel: boolean;
    Icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
    run: () => void;
  }[] = [
    {
      key: "pen",
      label: tInk("pen"),
      showLabel: true,
      Icon: IconPen,
      run: () => useInkTool.getState().setMode(useInkTool.getState().lastTool),
    },
    { key: "eraser", label: tInk("eraser"), showLabel: true, Icon: IconEraser, run: () => useInkTool.getState().setMode("eraser") },
    { key: "undo", label: t("undoShort"), showLabel: true, Icon: IconUndo, disabled: !canUndo, run: undo },
    { key: "redo", label: t("redoShort"), showLabel: true, Icon: IconRedo, disabled: !canRedo, run: redo },
    { key: "add", label: t("addScreenShort"), showLabel: true, Icon: IconAdd, run: addScreen },
    {
      key: "next",
      label: t("nextScreen"),
      showLabel: false,
      Icon: IconArrowRight,
      disabled: index + 1 >= screenCount,
      run: () => goTo(1),
    },
    {
      key: "prev",
      label: t("prevScreen"),
      showLabel: false,
      Icon: IconArrowLeft,
      disabled: index <= 0,
      run: () => goTo(-1),
    },
  ];

  // Doira ekrandan chiqib ketmasin.
  const x = Math.min(Math.max(spot.x, EDGE_PX), window.innerWidth - EDGE_PX);
  const y = Math.min(Math.max(spot.y, EDGE_PX), window.innerHeight - EDGE_PX);

  return (
    <>
      {/* Tashqariga bosish — yopish. Shaffof, kanvasga hech narsa oʻtmaydi. */}
      <div
        aria-hidden="true"
        className="fixed inset-0"
        style={{ zIndex: "var(--z-doska-context)" }}
        onPointerDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        role="menu"
        aria-label={t("quickMenu")}
        className="doska-bar doska-sheet pointer-events-auto fixed size-72"
        style={{
          left: x,
          top: y,
          translate: "-50% -50%",
          borderRadius: "50%",
          zIndex: "var(--z-doska-context)",
        }}
      >
        <span className="text-muted-foreground text-tag absolute inset-0 grid place-items-center px-24 text-center leading-tight">
          {t("quickMenu")}
        </span>
        {items.map((item, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / items.length;
          return (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              aria-label={item.label}
              disabled={item.disabled}
              onClick={() => {
                item.run();
                onClose();
              }}
              className={cn(
                "hover:bg-muted focus-visible:ring-ring absolute flex size-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-30",
              )}
              style={{
                left: `calc(50% + ${Math.cos(angle) * RADIUS_PX}px)`,
                top: `calc(50% + ${Math.sin(angle) * RADIUS_PX}px)`,
              }}
            >
              <item.Icon className="size-7" />
              {item.showLabel && <span className="text-tag w-full truncate text-center leading-tight font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}
