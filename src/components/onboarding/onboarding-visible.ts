import { create } from "zustand";

/* ════════════════════════════════════════════════════════════════════
   SEHRGAR EKRANDAMI — "e'lon" kanali (TourProvider'dagi `activeTourId`
   bilan bir xil naqsh, `tour/tour-request.ts`).

   NEGA ALOHIDA SIGNAL, `onboardingCompleted` NING O'ZI EMAS
   ---------------------------------------------------------
   Sehrgarni ko'rsatish qarori `OnboardingGate` da LATCH qilinadi va u
   `onboardingCompleted` dan KO'RA torroq: hisobda allaqachon sinf bo'lsa
   sehrgar `onboardingCompleted=false` bo'lsa ham ochilmaydi.

   Boshqa darvozalar shunchaki `onboardingCompleted` ga qarasa, o'sha
   eski hisoblar uchun ular ABADIY yopiq qolardi — LessonLab bog'lash
   darvozasi uchun bu jim teshik bo'lardi (majburiy bog'lash hech qachon
   so'ralmaydi). Shuning uchun kanal "sehrgar HOZIR ekrandami" degan
   aniq faktni uzatadi.

   Persist QILINMAYDI — faqat joriy sessiya ichida ma'noga ega.
   ════════════════════════════════════════════════════════════════════ */

type OnboardingVisibleState = {
  /** `OnboardingWizard` ayni damda render qilinayaptimi. */
  open: boolean;
  setOpen: (v: boolean) => void;
};

export const useOnboardingVisible = create<OnboardingVisibleState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
