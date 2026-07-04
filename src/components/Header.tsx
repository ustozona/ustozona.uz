"use client";

import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TypographySmall } from "@/components/ui/typography";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { isCalendarConfigured } from "@/lib/academic-calendar";
import QuickFeedback from "@/components/QuickFeedback";
import NotificationsBell from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export default function Header() {
  const calendar = useCalendarStore((s) => s.calendar);
  const calHydrated = useCalendarStore((s) => s._hasHydrated);
  const configured = isCalendarConfigured(calendar);

  return (
    <header className="flex items-center gap-1 border-b border-border bg-card shrink-0 z-20 h-[var(--top-header-height)] px-3">
      {/* Sidebar toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="size-8 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5">
          Yon panel
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
        </TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1 !h-6" />

      {/* Spacer — pushes actions to the right */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <span data-tour="header-feedback" className="inline-flex">
          <QuickFeedback />
        </span>

        <NotificationsBell />

        <Separator orientation="vertical" className="mx-1.5 !h-6" />

        {/* Oʻquv yili — jonli kalendardan (bitta joriy yil). Bosilsa
            Sozlamalar → "Oʻquv yili"ga oʻtadi; hali sozlanmagan boʻlsa
            sozlashga undaydi. Hydration tugamaguncha koʻrsatilmaydi
            (sozlangan yilda "sozlash" chaqnamasligi uchun). */}
        {calHydrated && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  "hidden lg:flex items-center gap-2",
                  !configured && "text-muted-foreground border-dashed"
                )}
              >
                <Link href="/dashboard/settings?section=oquv-yili">
                  <Calendar className="text-muted-foreground shrink-0 size-[14px]" strokeWidth={2} />
                  <TypographySmall className="whitespace-nowrap">
                    {configured ? calendar.yearLabel : "Oʻquv yilini sozlash"}
                  </TypographySmall>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {configured ? "Oʻquv yili sozlamalari" : "Oʻquv yili hali sozlanmagan"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
