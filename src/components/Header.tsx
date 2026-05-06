"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/sidebar-context";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Bosh sahifa", exact: true },
  { href: "/dashboard/help", label: "Yordam" },
];

export default function Header() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <header className="flex items-center border-b border-border bg-card shrink-0 z-20 h-[var(--top-header-height)]">
      {/* Logo + sidebar toggle — width syncs with sidebar */}
      <div
        className="hidden md:flex items-center shrink-0 pl-4 pr-2 group/logo"
      >
        <Link href="/dashboard" className="flex items-center gap-2 mr-auto">
          <div className="h-7 w-7 rounded-lg bg-[#2e3138] flex items-center justify-center shrink-0 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M22 10v6" />
              <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
            </svg>
          </div>
          <span className="text-[16px] font-bold text-foreground whitespace-nowrap" style={{ letterSpacing: "-0.04em" }}>
            <span style={{ letterSpacing: "-0.05em" }}>Murabbiyona</span>{" "}
            <span className="text-muted-foreground font-semibold">EMS</span>
          </span>
        </Link>
        <Tooltip>
          <TooltipTrigger
            onClick={toggle}
            aria-label={collapsed ? "Yon panelni ochish" : "Yon panelni yopish"}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m16 15-3-3 3-3" />
              </svg>
            )}
          </TooltipTrigger>
          <TooltipContent>{collapsed ? "Yon panelni ochish" : "Yon panelni yopish"}</TooltipContent>
        </Tooltip>
      </div>

      {/* Mobile: brand on the left */}
      <div className="md:hidden flex items-center gap-2 px-4">
        <div className="h-7 w-7 rounded-lg bg-[#2e3138] flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
            <path d="M22 10v6" />
            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
          </svg>
        </div>
        <span className="text-[15px] font-bold text-foreground" style={{ letterSpacing: "-0.04em" }}>
          Murabbiyona <span className="text-muted-foreground font-semibold">EMS</span>
        </span>
      </div>

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
      <div className="flex items-center gap-1 pr-3">
        <Tooltip>
          <TooltipTrigger
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.34-4.34" />
            </svg>
          </TooltipTrigger>
          <TooltipContent>Qidirish</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
              <path d="M12 8v6" /><path d="M9 11h6" />
            </svg>
            <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">1</span>
          </TooltipTrigger>
          <TooltipContent>Xabarlar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </TooltipTrigger>
          <TooltipContent>Xavfsizlik</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-border" />

        {/* Academic year selector — desktop only */}
        <button className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
            <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
          </svg>
          <span className="text-[13px] font-medium text-foreground whitespace-nowrap">2025–2026</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Account */}
        <Tooltip>
          <TooltipTrigger
            render={<Link href="/dashboard/settings" />}
            aria-label="Akkaunt"
            className="flex items-center gap-2 h-9 pl-1 pr-2 ml-1 rounded-lg hover:bg-muted transition-colors"
          >
            <span className="h-7 w-7 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white text-[11px] font-semibold ring-2 ring-card shrink-0">
              F
            </span>
            <span className="hidden xl:flex flex-col items-start min-w-0 leading-tight">
              <span className="text-[13px] font-semibold text-foreground truncate max-w-[140px]">Foydalanuvchi</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">Oʻqituvchi</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground hidden xl:block shrink-0">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </TooltipTrigger>
          <TooltipContent>Hisob · Foydalanuvchi</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
