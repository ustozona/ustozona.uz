import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   TUR SOʻROVI — "pull" kanal: GuideHub → TourProvider.

   Foydalanuvchi hub'dan qoʻllanma tanlaganda id shu yerga yoziladi;
   TourProvider mos route'ga yetganda (yoki allaqachon oʻsha sahifada
   boʻlsa darhol) turni ishga tushirib, soʻrovni tozalaydi. URL param
   emas — ayni sahifada turib replay qilishda pathname oʻzgarmaydi.

   Persist qilinmaydi: soʻrov faqat joriy sessiya ichida maʼnoga ega.
   ════════════════════════════════════════════════════════════════════ */

type TourRequestState = {
  requestedTourId: string | null;
  requestTour: (id: string) => void;
  clearRequest: () => void;
  /** Ayni damda ochiq tur id'si (TourProvider yozadi) — sahifalar shu
      orqali "tur rejimi"ni biladi (masalan, boʻsh panellarda demo
      maʼlumot koʻrsatish uchun). Store'larga hech narsa yozilmaydi. */
  activeTourId: string | null;
  setActiveTour: (id: string | null) => void;
};

export const useTourRequest = create<TourRequestState>((set) => ({
  requestedTourId: null,
  requestTour: (id) => set({ requestedTourId: id }),
  clearRequest: () => set({ requestedTourId: null }),
  activeTourId: null,
  setActiveTour: (id) => set({ activeTourId: id }),
}));
