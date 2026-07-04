"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/store/useSettingsStore";
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

  const [active, setActive] = React.useState<TourDef | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);

  // Route + tayyorlikka qarab turni faollashtirish. Har route uchun bir marta
  // baholaymiz; tur tugagach completedTours yangilanadi va qayta ochilmaydi.
  React.useEffect(() => {
    if (!hydrated || !onboarded) return;
    if (active) return; // ochiq tur ustidan yozib yubormaslik
    const tour = tourForRoute(pathname);
    if (tour && !completedTours.includes(tour.id)) {
      setActive(tour);
      setStepIndex(0);
    }
    // completedTours qasddan bogʻlanmaydi — faqat route/tayyorlik oʻzgarganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hydrated, onboarded]);

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
