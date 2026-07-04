"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Separator } from "@/components/ui/separator";
import { TypographySmall } from "@/components/ui/typography";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useCalendarStore } from "@/store/useCalendarStore";
import { isCalendarConfigured } from "@/lib/academic-calendar";
import QuickFeedback from "@/components/QuickFeedback";
import NotificationsBell from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";
import { Search, ShieldCheck, Calendar } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Bosh sahifa", exact: true },
  { href: "/dashboard/help", label: "Yordam" },
];

export default function Header() {
  const pathname = usePathname();
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

      {/* Center nav */}
      <div className="flex-1 flex justify-center px-2">
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-foreground text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <QuickFeedback />

        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton className="text-muted-foreground">
              <Search className="size-[17px]" strokeWidth={2} />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Qidirish</TooltipContent>
        </Tooltip>

        <NotificationsBell />

        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton className="text-muted-foreground">
              <ShieldCheck className="size-[17px]" strokeWidth={2} />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent>Xavfsizlik</TooltipContent>
        </Tooltip>

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
