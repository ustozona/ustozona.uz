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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettingsStore } from "@/store/useSettingsStore";
import QuickFeedback from "@/components/QuickFeedback";
import NotificationsBell from "@/components/NotificationsBell";
import { cn } from "@/lib/utils";
import { Search, ShieldCheck, Calendar, ChevronDown, Check } from "lucide-react";

const ACADEMIC_YEARS = ["2024–2025", "2025–2026", "2026–2027"];

const navLinks = [
  { href: "/dashboard", label: "Bosh sahifa", exact: true },
  { href: "/dashboard/help", label: "Yordam" },
];

export default function Header() {
  const pathname = usePathname();
  const academicYear = useSettingsStore((s) => s.academicYear);
  const setAcademicYear = useSettingsStore((s) => s.setAcademicYear);

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-2">
              <Calendar className="text-muted-foreground shrink-0 size-[14px]" strokeWidth={2} />
              <TypographySmall className="whitespace-nowrap">{academicYear}</TypographySmall>
              <ChevronDown className="text-muted-foreground shrink-0 size-[13px]" strokeWidth={2} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {ACADEMIC_YEARS.map((y) => (
              <DropdownMenuItem
                key={y}
                onClick={() => setAcademicYear(y)}
                className="justify-between"
              >
                {y}
                {y === academicYear && <Check className="size-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
