"use client";

import * as React from "react";

import { useDoskaStore } from "@/lib/doska/store";
import { deleteSelection, hasVisibleSelection, useInkTool, type InkMode } from "@/lib/doska/ink-tool";
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
     Delete · Backspace               tanlangan vidjetni (lassoda —
                                      belgilangan yozuvni) oʻchirish
     Strelkalar (Shift — 10 px)       tanlangan vidjetni siljitish
     ← →  (tanlov yoʻq)               oldingi / keyingi ekran
     PageUp · PageDown                oldingi / keyingi ekran — tanlov
                                      boʻlsa ham (taqdimot pulti shu
                                      tugmalarni yuboradi)
     S                                tanlangan vidjet sozlamasi
     P · M · E · L                    qalam · marker · oʻchirgʻich · lazer
                                      (qayta bosilsa — tanlashga qaytish)
     Esc                              markazdan chiqish → yozuv belgilashini
                                      bekor qilish → yozishdan chiqish
                                      → sozlamani yopish → tanlovni yopish
                                      (shu tartibda)
     F · B                            toʻliq ekran · boshqaruvni yashirish
     1 · 2                            parda · qoʻngʻiroq
     K · ?                            yorliqlar roʻyxati (DoskaShortcuts)

   Roʻyxat oynasidagi qatorlar shu toʻplamni takrorlaydi — yorliq
   qoʻshilsa yoki oʻzgarsa, `DoskaShortcuts.tsx` ham yangilanadi.

   ⚠️ HARF TUGMANING JOYI BOʻYICHA HAM TANILADI (`shortcutKey`). Rus yoki
   oʻzbek-kirill tartibida `e.key` kirill harf boʻladi: `P` — «з», Ctrl+Z
   da esa «я». Faqat `e.key` ga qaralsa, bunday kompyuterda qalam ham,
   bekor qilish ham ishlamaydi — Oʻzbekistonda koʻp kompyuterda rus
   tartibi yoqiq turadi (docs/doska-referens-koriklari.md R380). Lotin
   harfi kelsa esa `e.key` ning oʻzi olinadi: boshqa lotin tartibida
   (AZERTY va h.k.) yorliq tugmaga yozilgan harfga mos qoladi.

   ⚠️ Oynada tinglanadi, kanvasda emas: menyu yoki boshqaruv tugmasi
   fokusda boʻlsa ham yorliq ishlashi kerak. Shuning uchun yozish
   maydonida (matn vidjeti, ekran nomi) va ochiq popover/dialog ichida
   yorliqlar JIM — u yerda harf harf, strelka esa kursor.

   ⚠️ Vidjet klaviaturani OʻZI boshqarishi mumkin: taqdimot strelka va
   Enter bilan slayd almashtiradi (pult ham shu tugmalarni yuboradi).
   Shuning uchun:
     • fokus vidjet ICHIDA boʻlsa — STRELKALAR va PageUp/PageDown vidjetga
       qoldiriladi (Doska ularni ekran almashtirish va siljitish uchun
       ishlatadi). Qolgan
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

/**
 * Yorliq sifatida qaysi tugma bosildi.
 *
 * Nomli tugma (`Escape`, `ArrowLeft`, `PageDown`) oʻz nomida qaytadi.
 * Harf va raqam — kichik harfda: lotin harfi `e.key` dan, lotin
 * boʻlmagan harf (kirill) esa tugmaning joyidan (`KeyP` → `p`).
 * Raqam va belgilar (`?`) `e.key` ning oʻzi: raqam tartibdan qatʼi nazar
 * raqam boʻlib keladi, Shift+1 esa «!» boʻlib qoladi va parda tushmaydi.
 */
export function shortcutKey(e: Pick<KeyboardEvent, "key" | "code">): string {
  const { key, code } = e;
  if (key.length !== 1) return key;
  if (/^[a-z]$/i.test(key)) return key.toLowerCase();
  if (/^\p{L}$/u.test(key)) {
    const match = /^Key([A-Z])$/.exec(code);
    if (match) return match[1].toLowerCase();
  }
  return key;
}

/** Oldinga/orqaga shuncha ekran — chetda boʻlsa hech narsa qilmaydi. */
function stepScreen(offset: number): boolean {
  const s = useDoskaStore.getState();
  const index = s.deck.screens.findIndex((x) => x.id === s.activeScreenId);
  const next = s.deck.screens[index + offset];
  if (!next) return false;
  s.setActiveScreen(next.id);
  return true;
}

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
  onToggleShortcuts,
}: {
  onToggleFullscreen: () => void;
  onToggleControls: () => void;
  onToggleShortcuts: () => void;
}) {
  // Callbacklar ref orqali: effekt bir marta ulanadi, har renderda
  // listener olib tashlanib-qoʻyilmaydi.
  const handlers = React.useRef({ onToggleFullscreen, onToggleControls, onToggleShortcuts });
  React.useLayoutEffect(() => {
    handlers.current = { onToggleFullscreen, onToggleControls, onToggleShortcuts };
  });

  React.useEffect(() => {
    let lastNudge = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const target = e.target as HTMLElement | null;
      if (isTypingTarget(target) || isInsideOverlay(target)) return;
      if (widgetOwnsFullscreen()) return;

      const s = useDoskaStore.getState();
      const key = shortcutKey(e);

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
        } else if (key === "c" && s.selectedId && !window.getSelection()?.toString()) {
          // Belgilangan matn boʻlsa — brauzer oʻzi nusxalaydi.
          e.preventDefault();
          s.copyWidget(s.selectedId);
        } else if (key === "v" && s.clipboard) {
          e.preventDefault();
          s.pasteWidget();
        }
        return;
      }
      if (e.altKey) return;
      // Strelka va pult tugmalari vidjet ichidagi fokusda vidjetniki
      // (taqdimot slaydlari).
      const paging = e.key.startsWith("Arrow") || e.key === "PageUp" || e.key === "PageDown";
      if (paging && isInsideWidget(target)) return;
      if (e.repeat && !e.key.startsWith("Arrow")) return;

      const selected = s.selectedId && !s.editingId ? s.selectedId : null;

      switch (key) {
        case "Escape":
          // Eng ichki holatdan tashqariga: bitta bosish — bitta qadam.
          if (s.spotlightId) s.setSpotlight(null);
          else if (hasVisibleSelection()) useInkTool.getState().setSelection([]);
          else if (useInkTool.getState().mode) useInkTool.getState().setMode(null);
          else if (s.settingsId) s.closeSettings();
          else if (s.selectedId) s.select(null);
          return;

        case "s": {
          const w = selected && s.deck.screens
            .find((x) => x.id === s.activeScreenId)
            ?.widgets.find((x) => x.id === selected);
          if (!w || !hasSettings(w.kind)) return;
          e.preventDefault();
          s.toggleSettings(w.id);
          return;
        }

        case "p":
        case "m":
        case "e":
        case "l": {
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
          if (s.spotlightId) return;
          if (hasVisibleSelection()) {
            e.preventDefault();
            deleteSelection();
            return;
          }
          if (!selected) return;
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
          if (stepScreen(e.key === "ArrowRight" ? 1 : -1)) e.preventDefault();
          return;
        }

        // Pult: tanlangan vidjet boʻlsa ham ekran almashadi — bu
        // tugmalarning vidjet uchun maʼnosi yoʻq, oʻqituvchi esa dars
        // paytida vidjetni bosib qoʻygan boʻlishi mumkin.
        case "PageUp":
        case "PageDown":
          if (s.spotlightId) return;
          // Sahifa aylanmasin — chetdagi ekranda ham.
          e.preventDefault();
          stepScreen(e.key === "PageDown" ? 1 : -1);
          return;

        case "f":
          handlers.current.onToggleFullscreen();
          return;

        case "b":
          handlers.current.onToggleControls();
          return;

        case "k":
        case "?":
          e.preventDefault();
          handlers.current.onToggleShortcuts();
          return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
