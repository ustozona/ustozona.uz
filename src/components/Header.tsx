"use client";

import * as React from "react";
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
import GuideHub from "@/components/onboarding/GuideHub";
import HeaderThemeToggle from "@/components/HeaderThemeToggle";
import HeaderLanguageMenu from "@/components/HeaderLanguageMenu";
import HeaderAccountMenu from "@/components/HeaderAccountMenu";
import { cn } from "@/lib/utils";
import { Calendar, Maximize, Minimize } from "lucide-react";

/** Butun oyna (tarayvcher) toʻliq ekran rejimini boshqaradi. */
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = React.useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  return { isFullscreen, toggle };
}

export default function Header() {
  const calendar = useCalendarStore((s) => s.calendar);
  const calHydrated = useCalendarStore((s) => s._hasHydrated);
  const configured = isCalendarConfigured(calendar);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

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

      {/* Toʻliq ekran toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize /> : <Maximize />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isFullscreen ? "Toʻliq ekrandan chiqish" : "Toʻliq ekran"}</TooltipContent>
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
        <span data-tour="header-guide" className="inline-flex">
          <GuideHub />
        </span>

        <Separator orientation="vertical" className="mx-1.5 !h-6" />

        <HeaderThemeToggle />
        <HeaderLanguageMenu />

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

        <Separator orientation="vertical" className="mx-1.5 !h-6" />
        <HeaderAccountMenu />
      </div>
    </header>
  );
}
