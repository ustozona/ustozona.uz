"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSettingsStore } from "@/store/useSettingsStore";
import { tourForRoute, type TourDef } from "./tours";
import { useTourRequest } from "./tour-request";
import { TourOverlay } from "./TourOverlay";

/* ════════════════════════════════════════════════════════════════════
   TOUR PROVIDER — qaysi boʻlim turʼini qachon koʻrsatishni hal qiladi.

   Pull modeli: turlar foydalanuvchi soʻraganda (GuideHub → useTourRequest)
   ishga tushadi. Yagona istisno — "home" turʼi: onboarding sehrgari
   tugagach bosh sahifada BIR marta avtomatik koʻrsatiladi. Boshqa
   boʻlimlarga kirish hech qachon tur bilan toʻsilmaydi.

   Soʻralgan tur completedTours'dan qatʼi nazar ishlaydi (replay).
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
  const requestedTourId = useTourRequest((s) => s.requestedTourId);
  const clearRequest = useTourRequest((s) => s.clearRequest);

  const [active, setActive] = React.useState<TourDef | null>(null);
  const [stepIndex, setStepIndex] = React.useState(0);

  // Faol tur id'sini kanalga eʼlon qilamiz — sahifalar "tur rejimi"da
  // boʻsh panellarga demo maʼlumot chizish uchun oʻqiydi.
  const setActiveTour = useTourRequest((s) => s.setActiveTour);
  React.useEffect(() => {
    setActiveTour(active?.id ?? null);
    return () => setActiveTour(null);
  }, [active, setActiveTour]);

  // Route mos kelmasa ochiq turni darhol yopamiz — active tur hech qachon
  // joriy sahifaga tegishli boʻlmagan holda koʻrsatilmasligi kerak.
  React.useEffect(() => {
    if (active && active.route !== pathname) {
      setActive(null);
      setStepIndex(0);
      return;
    }
    if (!hydrated || !onboarded) return;
    const tour = tourForRoute(pathname);
    if (!tour) return;

    // Soʻrov yoʻli: hub'dan tanlangan tur mos sahifaga yetganda darhol
    // (ochiq tur boʻlsa ham almashtirib) ishga tushadi — replay shu.
    if (requestedTourId === tour.id) {
      clearRequest();
      setActive(tour);
      setStepIndex(0);
      return;
    }

    // Avto yoʻl: faqat "home" — sehrgardan keyingi birinchi tanishuv.
    if (active) return; // ochiq tur ustidan yozib yubormaslik
    if (tour.id !== "home" || completedTours.includes("home")) return;
    setActive(tour);
    setStepIndex(0);
    // completedTours qasddan bogʻlanmaydi — faqat route/tayyorlik/soʻrov oʻzgarganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hydrated, onboarded, active, requestedTourId]);

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
