"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSettingsStore } from "@/store/useSettingsStore";
import { SettingsCard } from "./SettingsShared";

export default function PlanSection() {
  const t = useTranslations("PlanSection");
  const plan = useSettingsStore((s) => s.plan);

  const FREE_FEATURES = [t("freeFeature1"), t("freeFeature2"), t("freeFeature3")];
  const PRO_FEATURES = [t("proFeature1"), t("proFeature2"), t("proFeature3"), t("proFeature4")];

  return (
    <>
      <SettingsCard title={t("currentPlanTitle")} description={t("currentPlanDescription")}>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-foreground">
                {plan === "pro" ? t("planPro") : t("planFree")}
              </span>
              <Badge variant="secondary">{t("currentBadge")}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {t("freeNote")}
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
        title={t("proSectionTitle")}
        description={t("proSectionDescription")}
        action={<Badge variant="secondary">{t("comingSoon")}</Badge>}
      >
        <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{t("proCardTitle")}</span>
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
            {t("upgradeButton")}
          </Button>
        </div>
      </SettingsCard>
    </>
  );
}
