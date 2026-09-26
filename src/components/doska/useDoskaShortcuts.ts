"use client";

import * as React from "react";

import { useDoskaStore } from "@/lib/doska/store";
import { useInkTool, type InkMode } from "@/lib/doska/ink-tool";
import { playBell } from "./sounds";
import { hasSettings } from "./widgets";

/* ════════════════════════════════════════════════════════════════════
   KLAVIATURA YORLIQLARI — noutbuk va klaviaturali doska uchun.

   Asosiy qurilma sensorli doska, shuning uchun HAR amalning tugmasi
   bor; yorliq faqat tezlashtiradi, yagona yoʻl boʻlmaydi. Toʻplam sinf
   ekrani vositalaridagi odatiy yorliqlarga mos (docs/doska-ux-tadqiqot.md
   R313):

     Ctrl/⌘+Z · Ctrl+Y / ⌘+Shift+Z   bekor qilish / qaytadan bajarish
     Ctrl/⌘+D                         tanlangan vidjet nusxasi
     Delete · Backspace               tanlangan vidjetni oʻchirish
     Strelkalar (Shift — 10 px)       tanlangan vidjetni siljitish
     ← →  (tanlov yoʻq)               oldingi / keyingi ekran
     S                                tanlangan vidjet sozlamasi
     P · M · E · L                    qalam · marker · oʻchirgʻich · lazer
                                      (qayta bosilsa — tanlashga qaytish)
     Esc                              markazdan chiqish → yozishdan chiqish
                                      → sozlamani yopish → tanlovni yopish
                                      (shu tartibda)
     F · B                            toʻliq ekran · boshqaruvni yashirish
     1 · 2                            parda · qoʻngʻiroq

   ⚠️ Oynada tinglanadi, kanvasda emas: menyu yoki boshqaruv tugmasi
   fokusda boʻlsa ham yorliq ishlashi kerak. Shuning uchun yozish
   maydonida (matn vidjeti, ekran nomi) va ochiq popover/dialog ichida
   yorliqlar JIM — u yerda harf harf, strelka esa kursor.

   ⚠️ Vidjet klaviaturani OʻZI boshqarishi mumkin: taqdimot strelka va
   Enter bilan slayd almashtiradi (pult ham shu tugmalarni yuboradi).
   Shuning uchun:
     • fokus vidjet ICHIDA boʻlsa — STRELKALAR vidjetga qoldiriladi (Doska
       ularni ekran almashtirish va siljitish uchun ishlatadi). Qolgan
       yorliqlar ishlayveradi: taymerning ▶ tugmasini bosgandan keyin
       fokus oʻsha tugmada qoladi, `1` esa baribir pardani tushirsin;
     • vidjet oʻzi toʻliq ekranda boʻlsa — Doska yorliqlari umuman jim
       (parda ham: u Doska qobigʻida chiziladi va vidjetning toʻliq
       ekranida koʻrinmasdi).

   Tugma bosib turilsa (`repeat`) faqat strelkalar takrorlanadi —
   `1` ni biroz uzoq bosish pardani ochib-yopmasin, `2` qoʻngʻiroqni
   ketma-ket chalmasin.
   ════════════════════════════════════════════════════════════════════ */

/** Strelkalar ketma-ketligi shu oraliqda bitta harakat hisoblanadi (ms). */
const NUDGE_BURST_MS = 800;

function isTypingTarget(el: HTMLElement | null): boolean {
  if (!el) return false;
  if (el.isContentEditable) return true;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

/** Fokus popover, menyu yoki dialog ichida — ular oʻz klaviaturasini boshqaradi. */
function isInsideOverlay(el: HTMLElement | null): boolean {
  return !!el?.closest('[data-radix-popper-content-wrapper], [role="dialog"], [role="menu"]');
}

/** Fokus vidjet ichida (masalan taqdimot tugmasi) — oddiy tugmalar vidjetniki. */
function isInsideWidget(el: HTMLElement | null): boolean {
  return !!el?.closest("[data-doska-widget]");
}

/** Sahifa emas, vidjetning oʻzi toʻliq ekranda (taqdimot). */
function widgetOwnsFullscreen(): boolean {
  const fs = document.fullscreenElement;
  return !!fs && fs !== document.documentElement;
}

export function useDoskaShortcuts({
  onToggleFullscreen,
  onToggleControls,
}: {
  onToggleFullscreen: () => void;
  onToggleControls: () => void;
}) {
  // Callbacklar ref orqali: effekt bir marta ulanadi, har renderda
  // listener olib tashlanib-qoʻyilmaydi.
  const handlers = React.useRef({ onToggleFullscreen, onToggleControls });
  React.useLayoutEffect(() => {
    handlers.current = { onToggleFullscreen, onToggleControls };
  });

  React.useEffect(() => {
    let lastNudge = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const target = e.target as HTMLElement | null;
      if (isTypingTarget(target) || isInsideOverlay(target)) return;
      if (widgetOwnsFullscreen()) return;

      const s = useDoskaStore.getState();
      const key = e.key.toLowerCase();

      if (e.ctrlKey || e.metaKey) {
        if (e.altKey) return;
        if (key === "z" && !e.shiftKey) {
          e.preventDefault();
          s.undo();
        } else if ((key === "z" && e.shiftKey) || key === "y") {
          e.preventDefault();
          s.redo();
        } else if (key === "d" && s.selectedId) {
          // Brauzerning «xatchoʻp» yorligʻi oʻrniga — faqat vidjet
          // tanlangan boʻlsa; aks holda brauzer oʻz ishini qiladi.
          e.preventDefault();
          s.duplicateWidget(s.selectedId);
        }
        return;
      }
      if (e.altKey) return;
      // Strelkalar vidjet ichidagi fokusda vidjetniki (taqdimot slaydlari).
      if (e.key.startsWith("Arrow") && isInsideWidget(target)) return;
      if (e.repeat && !e.key.startsWith("Arrow")) return;

      const selected = s.selectedId && !s.editingId ? s.selectedId : null;

      switch (e.key) {
        case "Escape":
          // Eng ichki holatdan tashqariga: bitta bosish — bitta qadam.
          if (s.spotlightId) s.setSpotlight(null);
          else if (useInkTool.getState().mode) useInkTool.getState().setMode(null);
          else if (s.settingsId) s.closeSettings();
          else if (s.selectedId) s.select(null);
          return;

        case "s":
        case "S": {
          const w = selected && s.deck.screens
            .find((x) => x.id === s.activeScreenId)
            ?.widgets.find((x) => x.id === selected);
          if (!w || !hasSettings(w.kind)) return;
          e.preventDefault();
          s.toggleSettings(w.id);
          return;
        }

        case "p":
        case "P":
        case "m":
        case "M":
        case "e":
        case "E":
        case "l":
        case "L": {
          if (s.spotlightId) return;
          e.preventDefault();
          const next: InkMode =
            key === "p" ? "pen" : key === "m" ? "marker" : key === "l" ? "laser" : "eraser";
          const ink = useInkTool.getState();
          ink.setMode(ink.mode === next ? null : next);
          return;
        }

        case "1":
          e.preventDefault();
          s.setCurtain(true);
          return;

        case "2":
          e.preventDefault();
          playBell();
          return;

        case "Delete":
        case "Backspace":
          if (!selected || s.spotlightId) return;
          e.preventDefault();
          s.removeWidget(selected);
          return;

        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown": {
          if (s.spotlightId) return;
          if (selected) {
            e.preventDefault();
            const screen = s.deck.screens.find((x) => x.id === s.activeScreenId);
            const w = screen?.widgets.find((x) => x.id === selected);
            // Qulflangan vidjet strelka bilan ham siljimaydi.
            if (!w || w.locked) return;

            // Ketma-ket bosishlar tarixda bitta qadam — aks holda 40 px
            // siljitishni qaytarish uchun 40 marta Ctrl+Z kerak boʻlardi.
            const now = Date.now();
            if (now - lastNudge > NUDGE_BURST_MS) s.beginGesture();
            lastNudge = now;

            const step = e.shiftKey ? 10 : 1;
            const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
            const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
            s.moveWidget(w.id, Math.max(0, w.x + dx), Math.max(0, w.y + dy));
            return;
          }

          // Tanlov yoʻq — chap/oʻng ekranlar orasida yuradi.
          if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
          const index = s.deck.screens.findIndex((x) => x.id === s.activeScreenId);
          const next = s.deck.screens[index + (e.key === "ArrowRight" ? 1 : -1)];
          if (!next) return;
          e.preventDefault();
          s.setActiveScreen(next.id);
          return;
        }

        case "f":
        case "F":
          handlers.current.onToggleFullscreen();
          return;

        case "b":
        case "B":
          handlers.current.onToggleControls();
          return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
