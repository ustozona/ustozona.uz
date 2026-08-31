"use client";

import * as React from "react";

import { useDoskaStore } from "@/lib/doska/store";
import { widgetMeta } from "@/lib/doska/registry";
import {
  applyDrag,
  passedThreshold,
  ATTR_HANDLE,
  ATTR_NO_DRAG,
  ATTR_WIDGET,
  type DragMode,
  type DragSession,
} from "@/lib/doska/interaction";

/* ════════════════════════════════════════════════════════════════════
   INTERAKTSIYA QATLAMI — BITTA global dispatcher (R135).

   Ilgari har `WidgetFrame` oʻz pointer listenerini qoʻyardi, ustiga
   har tutqich yana toʻrttadan. 25 vidjetli ekranda bu yuzlab listener
   demakdir. Endi kanvasda **bitta** toʻplam turadi va nima bosilgani
   hodisa nishonidagi `data-*` atributlardan oʻqiladi.

   Natijada vidjetlar ham, ramka ham SOQOV: ular faqat chizadi. Yangi
   vidjet qoʻshilganda bu fayl umuman oʻzgarmaydi.

   ⚠️ Nega komponent emas, hook: bu qatlam hech narsa CHIZMAYDI —
   u faqat kanvas elementiga hodisa ulaydi. Ko'rinadigan tanlov
   chegarasi va tutqichlar alohida faylda (`SelectionOverlay`).
   Fayl nomi `docs/ost-loyihalar-arxitektura.md` R135 dagi yoʻl bilan
   bir xil saqlangan.

   ⚠️ Store'ga `useDoskaStore.getState()` orqali murojaat qilinadi,
   hook orqali EMAS: aks holda har sudrashda store yangilanib, effekt
   qayta ishga tushar va listenerlar sudrash oʻrtasida uzilib qolardi.
   ════════════════════════════════════════════════════════════════════ */
export function useDoskaInteraction(rootRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let session: DragSession | null = null;

    const onPointerDown = (e: PointerEvent) => {
      // Faqat asosiy tugma; oʻng tugma kontekst menyusiga tegmaymiz.
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Vidjet ichidagi boshqaruv — taymer tugmasi, svetofor chirogʻi,
      // oʻchirish tugmasi. Sudrash boshlanmaydi, bosish oʻz ishini
      // qiladi.
      if (target.closest(`[${ATTR_NO_DRAG}]`)) return;

      const owner = target.closest<HTMLElement>(`[${ATTR_WIDGET}]`);
      if (!owner) {
        // Boʻsh kanvas bosildi — tanlov bekor qilinadi.
        if (target === root) useDoskaStore.getState().select(null);
        return;
      }

      const widgetId = owner.getAttribute(ATTR_WIDGET);
      if (!widgetId) return;

      const state = useDoskaStore.getState();
      const screen = state.deck.screens.find((s) => s.id === state.activeScreenId);
      const widget = screen?.widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      const handle = target.closest<HTMLElement>(`[${ATTR_HANDLE}]`);
      const mode = (handle?.getAttribute(ATTR_HANDLE) as DragMode | null) ?? "move";

      state.select(widgetId);
      // Oʻlchayotganda tartib oʻzgarmaydi — vidjet allaqachon tanlangan
      // va uni tepaga chiqarish kutilmagan sakrash beradi.
      if (mode === "move") state.bringToFront(widgetId);

      session = {
        widgetId,
        mode,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origin: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
        min: widgetMeta(widget.kind).minSize,
        moved: false,
      };

      // Ushlash KANVASDA: sichqoncha vidjetdan yoki oynadan chiqib
      // ketsa ham hodisalar shu yerga kelaveradi, sudrash uzilmaydi.
      root.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!session || e.pointerId !== session.pointerId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;

      if (!session.moved) {
        if (!passedThreshold(dx, dy)) return;
        session.moved = true;
      }

      const rect = applyDrag(session, dx, dy);
      const state = useDoskaStore.getState();

      if (session.mode === "move") {
        state.moveWidget(session.widgetId, rect.x, rect.y);
      } else {
        state.resizeWidget(session.widgetId, rect.w, rect.h, rect.x, rect.y);
      }
    };

    const endDrag = (e: PointerEvent) => {
      if (!session || e.pointerId !== session.pointerId) return;
      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      session = null;
    };

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", endDrag);
      root.removeEventListener("pointercancel", endDrag);
    };
  }, [rootRef]);
}
