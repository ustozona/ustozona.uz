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

      {/* Toʻliq ekran toggle — telefonda maʼnosiz (brauzer chrome'i baribir
          oʻzi boshqaradi) va joyni yeydi, shuning uchun `md+` da chiqadi. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-8 text-muted-foreground md:inline-flex"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize /> : <Maximize />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isFullscreen ? t("exitFullscreen") : t("fullscreen")}</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className="mx-1 !h-6 hidden md:block" />

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
      {/* MOBIL: pill ATAYLAB yashiriladi. U absolyut markazda turadi va
          375px da breadcrumb hamda oʻng amallar ustiga chiqib ketardi;
          fokus taymeri esa desktop chuqur-ish vositasi. Sessiya
          `FocusEngine` da davom etaveradi, faqat koʻrsatkichi yoʻq. */}
      <div
        className="pointer-events-none absolute inset-y-0 hidden items-center md:flex"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      >
        <span className="pointer-events-auto">
          <FocusTimerPill />
        </span>
      </div>

      {/* Right actions — mantiqiy guruhlar whitespace bilan ajratilgan.
          MOBIL: uchalasi ham oʻz Popover/Dialog'ini ochadi, shuning uchun
          ular «Koʻproq» dropdown'iga SOLINMAYDI — Radix qatlamlarini
          ichma-ich joylash fokus va yopilishni buzadi. Oʻrniga eng kam
          kerakli bittasi (`QuickFeedback` — 560px lik fikr-mulohaza
          shakli, telefonga toʻgʻri kelmaydi) CSS bilan yashiriladi;
          qolgani 32px tugmalar boʻlib 375px ga sigʻadi. Fikr bildirish
          `/dashboard/feedback` sahifasida ochiq qoladi. */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1">
          <span className="hidden md:inline-flex">
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
