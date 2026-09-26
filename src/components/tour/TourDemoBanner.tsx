"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { InlineBanner } from "@/components/ui/inline-banner";
import { useTourRequest } from "./tour-request";

export function TourDemoBanner({ tourId, active = true }: { tourId: string; active?: boolean }) {
  const activeTourId = useTourRequest((s) => s.activeTourId);
  const requestDismiss = useTourRequest((s) => s.requestDismiss);

  if (activeTourId !== tourId || !active) return null;

  return (
    <InlineBanner variant="info" icon={Info} onDismiss={requestDismiss} dismissLabel="Turni yopish">
      Hozir namunaviy maʼlumotlarni koʻryapsiz. Bu faqat tur davomida koʻrsatiladi.
    </InlineBanner>
  );
}
