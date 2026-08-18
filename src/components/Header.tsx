"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import QuickFeedback from "@/components/QuickFeedback";
import HeaderBreadcrumb from "@/components/HeaderBreadcrumb";
import GlobalCommandPalette from "@/components/GlobalCommandPalette";
import NotificationsBell from "@/components/NotificationsBell";
import FocusTimerPill from "@/components/tasks/FocusTimerPill";
import GuideHub from "@/components/onboarding/GuideHub";
import HeaderAccountMenu from "@/components/HeaderAccountMenu";
import { Maximize, Minimize } from "lucide-react";

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
  const t = useTranslations("Header");
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  return (
    <header className="relative flex items-center gap-1 border-b border-border bg-card shrink-0 z-20 h-[var(--top-header-height)] px-3">
      {/* Sidebar toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="size-8 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent className="flex items-center gap-1.5">
          {t("sidebar")}
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
        <TooltipContent>{isFullscreen ? t("exitFullscreen") : t("fullscreen")}</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1 !h-6" />

      <HeaderBreadcrumb />

      {/* Spacer — pushes actions to the right */}
      <div className="flex-1 min-w-2" />

      {/* Fokus taymeri — headerning aynan oʻrtasida, tomonlar kengligidan mustaqil.
          DIQQAT: markazlash ATAYLAB inline `style` orqali, Tailwind klass bilan
          emas. Bu build'da `md:left-1/2` kabi variant+kasr inset klassi
          generatsiya qilinmaydi; natijada `absolute` qolib `left` yoʻqoladi va
          flex-konteynerning absolyut bolasi oʻzining "static position"iga —
          yaʼni headerning CHAP burchagiga — tushib, breadcrumb ustiga chiqadi.
          Shu bois `left`/`transform` faqat inline style'da. */}
      <div
        className="pointer-events-none absolute inset-y-0 flex items-center"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        <span className="pointer-events-auto">
          <FocusTimerPill />
        </span>
      </div>

      {/* Right actions — mantiqiy guruhlar whitespace bilan ajratilgan */}
      <div className="flex items-center gap-3">
        {/* Tez-tez ishlatiladigan ish vositalari */}
        <div className="flex items-center gap-1">
          <span className="inline-flex">
            <QuickFeedback />
          </span>
          <GlobalCommandPalette />
          <NotificationsBell />
          <GuideHub />
        </div>

        {/* Profil — Mavzu, Til va akkaunt bandlari ichida */}
        <HeaderAccountMenu />
      </div>
    </header>
  );
}
