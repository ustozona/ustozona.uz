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
  /** Joriy bosqichning `target` selektori — faqat hover'da chiqadigan
      elementlarni (masalan kun sozlamalari tugmasi) shu bosqich davomida
      majburan koʻrinadigan qilish uchun. */
  activeStepTarget: string | null;
  setActiveStepTarget: (target: string | null) => void;
  /** Joriy bosqichning `id`'si (TourStep.id) — target-siz (markaziy
      modal) qadamlarda ham sahifa holatini vaqtincha almashtirish uchun
      (masalan planner'da "oy" koʻrinishiga oʻtish). */
  activeStepId: string | null;
  setActiveStepId: (id: string | null) => void;
};

export const useTourRequest = create<TourRequestState>((set) => ({
  requestedTourId: null,
  requestTour: (id) => set({ requestedTourId: id }),
  clearRequest: () => set({ requestedTourId: null }),
  activeTourId: null,
  setActiveTour: (id) => set({ activeTourId: id }),
  activeStepTarget: null,
  setActiveStepTarget: (target) => set({ activeStepTarget: target }),
  activeStepId: null,
  setActiveStepId: (id) => set({ activeStepId: id }),
}));
