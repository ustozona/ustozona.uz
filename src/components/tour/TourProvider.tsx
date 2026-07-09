"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGradesStore } from "@/store/useGradesStore";
import { tourForRoute, type TourDef } from "./tours";
import { TourOverlay } from "./TourOverlay";

/* ════════════════════════════════════════════════════════════════════
   TOUR PROVIDER — qaysi boʻlim turʼini qachon koʻrsatishni hal qiladi.

   Shart: hydration tugagan + onboarding tugagan + shu route uchun tur
   bor + hali koʻrilmagan. Har boʻlimga birinchi kirilganda bir marta.
   Yakun/Oʻtkazib yuborish → markTourCompleted(id).

   Mount-gate: `_hasHydrated` boʻlmasa hech narsa render qilinmaydi
   (SSR mismatch + maʼlumotli hisobda «boʻsh» chaqnashning oldini olish).
   Dashboard layoutʼida OnboardingGate yonida turadi.
   ════════════════════════════════════════════════════════════════════ */

export default function TourProvider() {
  const pathname = usePathname();
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const completedTours = useSettingsStore((s) => s.completedTours);
  const markTourCompleted = useSettingsStore((s) => s.markTourCompleted);
  const classCount = useGradesStore((s) => Object.keys(s.classDataMap).length);

  const [active, setActive] = React.useState<TourDef | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);

  // Route + tayyorlikka qarab turni faollashtirish. Har route uchun bir marta
  // baholaymiz; tur tugagach completedTours yangilanadi va qayta ochilmaydi.
  //
  // Route mos kelmasa ochiq turni darhol yopamiz (masalan onboarding
  // sehrgari tugagan zahoti bir tick ichida eski pathname uchun tur
  // ishga tushib, keyingi navigatsiyadan keyin ham ekranda "osilib"
  // qolishining oldini oladi — active tur hech qachon joriy sahifaga
  // tegishli boʻlmagan holda koʻrsatilmasligi kerak).
  React.useEffect(() => {
    if (active && active.route !== pathname) {
      setActive(null);
      setStepIndex(0);
      return;
    }
    if (!hydrated || !onboarded) return;
    if (active) return; // ochiq tur ustidan yozib yubormaslik
    const tour = tourForRoute(pathname);
    if (!tour || completedTours.includes(tour.id)) return;
    // "home"dan boshqa hamma tur sinf-koʻlamli sahifalarga tegishli —
    // sinf boʻlmasa, nishonlanadigan target ham yoʻq (boʻsh holat CTA
    // yetarli, GettingStartedChecklist yoʻnaltiradi).
    if (tour.id !== "home" && classCount === 0) return;
    setActive(tour);
    setStepIndex(0);
    // completedTours qasddan bogʻlanmaydi — faqat route/tayyorlik oʻzgarganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hydrated, onboarded, active, classCount]);

  const finish = React.useCallback(() => {
    if (active) markTourCompleted(active.id);
    setActive(null);
    setStepIndex(0);
  }, [active, markTourCompleted]);

  const next = React.useCallback(() => {
    if (!active) return;
    setStepIndex((i) => {
      if (i >= active.steps.length - 1) {
        finish();
        return i;
      }
      return i + 1;
    });
  }, [active, finish]);

  if (!hydrated || !onboarded || !active) return null;
  const step = active.steps[stepIndex];
  if (!step) return null;

  return (
    <TourOverlay
      key={`${active.id}-${stepIndex}`}
      step={step}
      index={stepIndex}
      total={active.steps.length}
      onNext={next}
      onSkip={finish}
    />
  );
}
