"use client";

import * as React from "react";
import { Info, X } from "lucide-react";
import { useTourRequest } from "./tour-request";

export function TourDemoBanner({ tourId, active = true }: { tourId: string; active?: boolean }) {
  const activeTourId = useTourRequest((s) => s.activeTourId);

  if (activeTourId !== tourId || !active) return null;

  return (
    <div className="flex w-full items-center justify-between gap-4 bg-primary/10 px-4 py-3 text-sm text-primary border-b border-primary/20 shrink-0">
      <div className="flex items-center gap-3">
        <Info className="size-5 shrink-0" />
        <p className="font-medium">
          Hozir namunaviy maʼlumotlarni koʻryapsiz. Bu faqat tur davomida koʻrsatiladi.
        </p>
      </div>
    </div>
  );
}
