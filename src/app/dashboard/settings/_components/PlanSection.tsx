"use client";

import * as React from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SettingsCard } from "./SettingsShared";

const FREE_FEATURES = [
  "Cheksiz sinf va oʻquvchi",
  "Jurnal, davomat va dars rejalari",
  "Maʼlumotlarni eksport qilish",
];

const PRO_FEATURES = [
  "AI dars rejasi va baholash yordamchisi",
  "Kengaytirilgan tahlil va hisobotlar",
  "Ota-onalar bilan aloqa kanali",
  "Ustuvor qoʻllab-quvvatlash",
];

export default function PlanSection() {
  const plan = useSettingsStore((s) => s.plan);

  return (
    <>
      <SettingsCard title="Joriy tarif" description="Hisobingizga biriktirilgan reja.">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                {plan === "pro" ? "Pro" : "Bepul"}
              </span>
              <Badge variant="secondary">Joriy</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Asosiy imkoniyatlar cheksiz va bepul.
            </span>
          </div>
        </div>

        <ul className="space-y-2 px-1">
          {FREE_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 shrink-0 text-success" />
              {f}
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Pro tarif"
        description="Koʻproq imkoniyat kerakmi?"
        action={<Badge variant="secondary">Tez orada</Badge>}
      >
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Ustozona Pro</span>
          </div>
          <ul className="mb-4 space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="size-4 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
          <Button className="w-full sm:w-auto" disabled>
            <Sparkles className="size-4" />
            Proʼga oʻtish
          </Button>
        </div>
      </SettingsCard>
    </>
  );
}
