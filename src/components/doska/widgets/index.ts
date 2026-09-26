import type { ComponentType } from "react";

import type { DoskaWidget, WidgetKind } from "@/lib/doska/types";
import {
  IconClock,
  IconPresentation,
  IconShape,
  IconStickyNote,
  IconText,
  IconTimer,
  IconTrafficLight,
  IconWheel,
} from "../icons";
import { ClockSettings, ClockWidget } from "./ClockWidget";
import { PresentationWidget } from "./PresentationWidget";
import { ShapeSettings, ShapeWidget } from "./ShapeWidget";
import { StickyNoteWidget } from "./StickyNoteWidget";
import { TextWidget } from "./TextWidget";
import { TimerSettings, TimerWidget } from "./TimerWidget";
import { TrafficLightSettings, TrafficLightWidget } from "./TrafficLightWidget";
import { WheelWidget } from "./WheelWidget";

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
     2. shu fayl — ikona, ichki komponent va (boʻlsa) sozlama mazmuni
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
  "shape.v1": ShapeWidget,
  "presentation.v1": PresentationWidget,
  "wheel.v1": WheelWidget,
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
  "shape.v1": IconShape,
  "presentation.v1": IconPresentation,
  "wheel.v1": IconWheel,
};

/**
 * SOZLAMA KARTASI MAZMUNI — kind → komponent (docs/doska-ux-tadqiqot.md Q2).
 *
 * Karta idishi, sarlavha, yopish va joylashuv UMUMIY (`WidgetSettingsCard`);
 * vidjet faqat ichini beradi va uni `SettingsFields` qismlaridan quradi.
 * Roʻyxatda yoʻq vidjetda kontekst panelda «Sozlash» tugmasi chiqmaydi.
 */
export const WIDGET_SETTINGS: Partial<Record<WidgetKind, ComponentType<WidgetProps>>> = {
  "clock.v1": ClockSettings,
  "timer.v1": TimerSettings,
  "traffic-light.v1": TrafficLightSettings,
  "shape.v1": ShapeSettings,
};

/**
 * Sozlamasi vidjetning OʻZIDA ochiladigan vidjetlar — umumiy karta chizilmaydi,
 * vidjet `settingsId` ni oʻzi oʻqiydi.
 *
 * Gʻildirak: uning «roʻyxat tomoni» — ismlar (mazmun) va sinf roʻyxati; u matn
 * vidjetidagi yozuv kabi joyida tahrirlanadi va 320 px kartaga sigʻmaydi.
 * Kirish nuqtasi esa hammada bir xil — «Sozlash» yoki `S`.
 */
export const INLINE_SETTINGS: ReadonlySet<WidgetKind> = new Set<WidgetKind>(["wheel.v1"]);

/** Vidjetning sozlamasi bormi — «Sozlash» tugmasi va `S` yorligʻi uchun. */
export function hasSettings(kind: WidgetKind): boolean {
  return kind in WIDGET_SETTINGS || INLINE_SETTINGS.has(kind);
}
