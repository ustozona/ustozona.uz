import type { ComponentType } from "react";

import type { DoskaWidget, WidgetKind } from "@/lib/doska/types";
import { IconClock, IconStickyNote, IconText, IconTimer, IconTrafficLight } from "../icons";
import { ClockWidget } from "./ClockWidget";
import { StickyNoteWidget } from "./StickyNoteWidget";
import { TextWidget } from "./TextWidget";
import { TimerWidget } from "./TimerWidget";
import { TrafficLightWidget } from "./TrafficLightWidget";

/* ════════════════════════════════════════════════════════════════════
   VIDJETNING REACT TOMONI — kind → komponent va kind → ikona.

   ⚠️ HAR VIDJET UCHUN ALOHIDA TUGMA KOMPONENTI YOZILMAYDI
   (`<ClockButton/>`, `<TimerButton/>` va h.k. — YOʻQ). Tugma, nom,
   ramka, koʻchirish, oʻlcham oʻzgartirish — hammasi UMUMIY: `BarButton`
   va `WidgetFrame` buni maʼlumotdan chizadi. 20 ta deyarli bir xil
   komponent boʻlsa, panel oraligʻini oʻzgartirish uchun 20 fayl
   tahrirlanadi va ular asta-sekin bir-biridan farq qila boshlaydi.

   Vidjetga XOS boʻlgan yagona narsa — uning ICHI (soat siferblati,
   taymer hisobi). U alohida komponent, va u shu yerda roʻyxatga
   olinadi.

   Yaʼni yangi vidjet qoʻshish IKKI joyga tegadi:
     1. `lib/doska/registry.ts` — nom, tus, oʻlcham, boshlangʻich holat
     2. shu fayl — ikona va ichki komponent
   Boshqa hech qayerda oʻzgarish kerak emas.

   Nega ikkiga boʻlingan: `registry.ts` React'ga bogʻlanmagan sof
   maʼlumot boʻlib qolishi kerak (server tomonda ham oʻqiladi), ikona
   va komponent esa React. Shuning uchun ikona xaritasi `WidgetBar`
   ichida emas, aynan shu yerda — komponent yonida.

   Vidjet `.v2` ga oʻtganda `.v1` shu yerda QOLADI — eski ekranlar eski
   renderer bilan chizilishda davom etadi (R131).
   ════════════════════════════════════════════════════════════════════ */

export type WidgetProps = { widget: DoskaWidget };

export const WIDGET_COMPONENTS: Record<WidgetKind, ComponentType<WidgetProps>> = {
  "clock.v1": ClockWidget,
  "timer.v1": TimerWidget,
  "traffic-light.v1": TrafficLightWidget,
  "text.v1": TextWidget,
  "sticky-note.v1": StickyNoteWidget,
};

export const WIDGET_ICONS: Record<
  WidgetKind,
  ComponentType<{ className?: string }>
> = {
  "clock.v1": IconClock,
  "timer.v1": IconTimer,
  "traffic-light.v1": IconTrafficLight,
  "text.v1": IconText,
  "sticky-note.v1": IconStickyNote,
};
