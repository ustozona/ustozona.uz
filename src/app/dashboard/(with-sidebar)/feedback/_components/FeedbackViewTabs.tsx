"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { MessageSquare, Clock, CheckCircle2 } from "lucide-react";

export type FeedbackViewTab = "all" | "process" | "done";

/**
 * Yengil pill-tab bar — Statistika sahifasidagi `StatsTabs` bilan bir xil
 * vizual til (bg-primary faol pill, boshqasi text-muted-foreground hover),
 * lekin bu yerda har bir tab yonida sanoq badge ham bor.
 */
export function FeedbackViewTabs({
  value, onChange, counts,
}: {
  value: FeedbackViewTab;
  onChange: (v: FeedbackViewTab) => void;
  counts: Record<FeedbackViewTab, number>;
}) {
  const t = useTranslations("FeedbackPage");
  const tabs: { id: FeedbackViewTab; label: string; icon: typeof MessageSquare }[] = [
    { id: "all", label: t("tabs.all"), icon: MessageSquare },
    { id: "process", label: t("tabs.process"), icon: Clock },
    { id: "done", label: t("tabs.done"), icon: CheckCircle2 },
  ];

  return (
    <div role="tablist" className="flex items-center gap-1.5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                isActive ? "bg-primary-foreground/20" : "bg-foreground/10"
              )}
            >
              {counts[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
