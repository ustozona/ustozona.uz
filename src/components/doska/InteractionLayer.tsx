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

      const state = useDoskaStore.getState();
      const owner = target.closest<HTMLElement>(`[${ATTR_WIDGET}]`);

      if (!owner) {
        // Boʻsh kanvas bosildi — tanlov ham, tahrir ham yopiladi.
        if (target === root) {
          state.select(null);
          state.setEditing(null);
        }
        return;
      }

      const widgetId = owner.getAttribute(ATTR_WIDGET);
      if (!widgetId) return;

      // Vidjet ichidagi boshqaruv: matn maydoni, taymer tugmasi,
      // svetofor chirogʻi, oʻchirish tugmasi.
      const insideControl = target.closest(`[${ATTR_NO_DRAG}]`) !== null;

      // Tahrirdagi vidjetning MATN MAYDONI bosildi: kursor qoʻyish va
      // soʻz belgilash brauzerning ishi, aralashmaymiz.
      if (state.editingId === widgetId && insideControl) return;

      // ⚠️ Qolgan HAR QANDAY bosish ochiq tahrirni yopadi — tutqichdan
      // tortish va qogʻoz chekkasidan sudrash ham shunga kiradi.
      //
      // Bu tekshiruv tutqich qidiruvidan OLDIN «tahrirdagi vidjetga
      // umuman tegmaymiz» boʻlib turgan edi va natijada tahrirdagi
      // vidjetni na koʻchirib, na oʻlchab boʻlmasdi — u tom maʼnoda
      // qotib qolardi. Ajratuvchi shart aynan `insideControl`.
      if (state.editingId) state.setEditing(null);

      if (insideControl) return;

      const screen = state.deck.screens.find((s) => s.id === state.activeScreenId);
      const widget = screen?.widgets.find((w) => w.id === widgetId);
      if (!widget) return;

      const handle = target.closest<HTMLElement>(`[${ATTR_HANDLE}]`);
      const mode = (handle?.getAttribute(ATTR_HANDLE) as DragMode | null) ?? "move";

      // Tanlash `select()` dan OLDIN oʻqiladi — «qayta tegildi» sharti
      // shunga tayanadi (`endDrag`).
      const wasSelected = state.selectedId === widgetId;

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
        wasSelected,
        editable: widgetMeta(widget.kind).editable === true,
      };

      // ⚠️ Pointer ushlash BU YERDA QOʻYILMAYDI — u faqat haqiqiy
      // sudrash boshlanganda, ostona bosib oʻtilgach qoʻyiladi
      // (`onPointerMove`). Ushlash faol boʻlsa brauzer keyingi
      // `pointerup` ni ham kanvasga yoʻnaltiradi va «qayta tegildi»
      // hisobi buzilardi.
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!session || e.pointerId !== session.pointerId) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;

      if (!session.moved) {
        if (!passedThreshold(dx, dy)) return;
        session.moved = true;

        // Sudrash haqiqatan boshlandi — endi ushlaymiz. Shundan keyin
        // sichqoncha vidjetdan yoki oyna chetidan chiqib ketsa ham
        // hodisalar kelaveradi va sudrash uzilmaydi. Oddiy bosishda
        // esa ushlash umuman qoʻyilmaydi, shuning uchun keyingi
        // `pointerup` vidjetning oʻziga tushadi va «qayta tegildi»
        // hisobi (`endDrag`) toʻgʻri ishlaydi.
        root.setPointerCapture(session.pointerId);
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

      /**
       * TAHRIRGA KIRISH — tanlangan matnli vidjetga siljishsiz qayta
       * tegilsa.
       *
       * Sichqonchada bu ikki marta bosish (birinchi bosish tanlaydi,
       * ikkinchisi `wasSelected` ni koʻrib tahrirga kiradi), sensorli
       * ekranda ikki marta teginish — BITTA yoʻl, ikkalasida ham
       * ishlaydi. Ilgari faqat `dblclick` bor edi va u sensorli
       * ekranda ishlamasdi: vidjetdagi `touch-action: none` ikki
       * marta teginish jestini butunlay toʻsadi, shu bois planshetda
       * matn vidjetini bir marta qoʻygandan keyin qayta tahrirlab
       * boʻlmasdi.
       *
       * `!moved` — sudrash boʻlmagan; `mode === "move"` — tutqichdan
       * emas; `editable` — reyestr matn qabul qiladi degan.
       *
       * Fokus SHU YERDA, sinxron qoʻyiladi: iOS klaviaturasi faqat
       * foydalanuvchi jesti ichida ochiladi, React effektiga
       * qoldirilsa kech boʻlardi. `readOnly` textarea ham fokuslanadi;
       * `readOnly` ni React keyingi renderda oladi.
       */
      if (
        !session.moved &&
        session.mode === "move" &&
        session.wasSelected &&
        session.editable
      ) {
        useDoskaStore.getState().setEditing(session.widgetId);
        root
          .querySelector<HTMLTextAreaElement>(
            `[${ATTR_WIDGET}="${session.widgetId}"] textarea`,
          )
          ?.focus();
      }

      session = null;
    };

    /** Escape — tahrirdan chiqish, vidjet tanlangancha qoladi. */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const state = useDoskaStore.getState();
      if (state.editingId) state.setEditing(null);
    };

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", endDrag);
    root.addEventListener("pointercancel", endDrag);
    root.addEventListener("keydown", onKeyDown);

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", endDrag);
      root.removeEventListener("pointercancel", endDrag);
      root.removeEventListener("keydown", onKeyDown);
    };
  }, [rootRef]);
}
