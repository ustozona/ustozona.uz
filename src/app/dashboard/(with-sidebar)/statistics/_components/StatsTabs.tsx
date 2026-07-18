"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatsTabItem = { id: string; label: string; icon: LucideIcon };

/**
 * Yengil pill-tab bar (shadcn "Tabs 02 - Transition" naqshiga asoslangan,
 * lekin faqat rang almashinuvi — layoutId/spring animatsiyasiz). Konteyner
 * `px-2` + tugma `px-3` = 20px chap boʻshliq — panel kartalarining `px-5`
 * sarlavha inseti bilan bir xil (piksel darajasida moslashtirilgan).
 */
export function StatsTabs({
  tabs, value, onChange,
}: { tabs: StatsTabItem[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="tablist" className="flex items-center gap-1.5 px-2 py-2.5">
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
          </button>
        );
      })}
    </div>
  );
}
