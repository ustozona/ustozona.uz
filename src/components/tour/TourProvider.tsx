"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/useSettingsStore";
import { tourForRoute, useTours, type TourDef } from "./tours";
import { useTourRequest } from "./tour-request";
import { TourOverlay } from "./TourOverlay";

/* ════════════════════════════════════════════════════════════════════
   TOUR PROVIDER — qaysi boʻlim turʼini qachon koʻrsatishni hal qiladi.

   Har bir boʻlimga BIRINCHI marta kirilganda (completedTours'da yoʻq
   boʻlsa) tur avtomatik ishga tushadi — foydalanuvchi kashf qilishini
   kutib oʻtirmaymiz. Qayta koʻrish GuideHub orqali istalgan payt mumkin
   (soʻrov yoʻli — completedTours'dan qatʼi nazar ishlaydi, replay shu).

   Yakun/Oʻtkazib yuborish → markTourCompleted(id) / dismissTour(id).

   Mount-gate: `_hasHydrated` boʻlmasa hech narsa render qilinmaydi
   (SSR mismatch + maʼlumotli hisobda «boʻsh» chaqnashning oldini olish).
   Dashboard layoutʼida OnboardingGate yonida turadi.
   ════════════════════════════════════════════════════════════════════ */

const MIN_TOUR_VIEWPORT = 1024;

export default function TourProvider() {
  const t = useTranslations("TourProvider");
  const tours = useTours();
  const pathname = usePathname();
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const completedTours = useSettingsStore((s) => s.completedTours);
  const dismissedTours = useSettingsStore((s) => s.dismissedTours);
  const abandonedTours = useSettingsStore((s) => s.abandonedTours);
  const autoToursEnabled = useSettingsStore((s) => s.autoToursEnabled);
  const markTourCompleted = useSettingsStore((s) => s.markTourCompleted);
  const dismissTour = useSettingsStore((s) => s.dismissTour);
  const incrementAbandon = useSettingsStore((s) => s.incrementAbandon);
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

  // Joriy bosqichning nishonini eʼlon qilamiz — hover'da chiqadigan
  // elementlarni (masalan kun sozlamalari tugmasi) shu bosqich davomida
  // majburan koʻrsatish uchun (sahifalar useTourRequest orqali oʻqiydi).
  const setActiveStepTarget = useTourRequest((s) => s.setActiveStepTarget);
  React.useEffect(() => {
    setActiveStepTarget(active?.steps[stepIndex]?.target ?? null);
    return () => setActiveStepTarget(null);
  }, [active, stepIndex, setActiveStepTarget]);

  const setActiveStepId = useTourRequest((s) => s.setActiveStepId);
  React.useEffect(() => {
    setActiveStepId(active?.steps[stepIndex]?.id ?? null);
    return () => setActiveStepId(null);
  }, [active, stepIndex, setActiveStepId]);

  // Route mos kelmasa ochiq turni darhol yopamiz
  React.useEffect(() => {
    if (active && active.route !== pathname) {
      incrementAbandon(active.id);
      setActive(null);
      setStepIndex(0);
      return;
    }
    if (!hydrated || !onboarded) return;
    const tour = tourForRoute(tours, pathname);
    if (!tour) return;

    // Soʻrov yoʻli: hub'dan tanlangan tur mos sahifaga yetganda darhol
    if (requestedTourId === tour.id) {
      clearRequest();
      if (window.innerWidth < MIN_TOUR_VIEWPORT) {
        toast.error(t("smallViewportError"));
        return;
      }
      setActive(tour);
      setStepIndex(0);
      return;
    }

    // Avto yoʻl
    if (active) return; 
    if (!autoToursEnabled) return;
    if (completedTours.includes(tour.id) || dismissedTours.includes(tour.id)) return;
    if ((abandonedTours[tour.id] ?? 0) >= 2) return;
    if (window.innerWidth < MIN_TOUR_VIEWPORT) return;

    // Kichik kechikish bilan koʻrsatish
    const tid = setTimeout(() => {
      setActive(tour);
      setStepIndex(0);
    }, 700);
    
    return () => clearTimeout(tid);
  }, [
    pathname, hydrated, onboarded, active, requestedTourId, completedTours,
    dismissedTours, abandonedTours, autoToursEnabled, clearRequest, incrementAbandon, tours, t
  ]);

  const complete = React.useCallback(() => {
    if (active) markTourCompleted(active.id);
    setActive(null);
    setStepIndex(0);
  }, [active, markTourCompleted]);

  const dismiss = React.useCallback(() => {
    if (active) dismissTour(active.id);
    setActive(null);
    setStepIndex(0);
  }, [active, dismissTour]);

  const next = React.useCallback(() => {
    if (!active) return;
    setStepIndex((i) => {
      if (i >= active.steps.length - 1) {
        complete();
        return i;
      }
      return i + 1;
    });
  }, [active, complete]);

  const prev = React.useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

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
      onPrev={prev}
      onSkip={dismiss}
    />
  );
}
