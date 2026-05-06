"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/sidebar-context";
import { cn } from "@/lib/utils";

const navItems = [
  {
    section: "SINFLAR",
    items: [
      { href: "/dashboard/classes", label: "Mening sinflarim", icon: "grid" },
      { href: "/dashboard/timetable", label: "Dars jadvali", icon: "calendar" },
      { href: "/dashboard/planner", label: "Rejalashtiruvchi", icon: "book-open" },
    ],
  },
  {
    section: "REJALASHTIRISH",
    items: [
      { href: "/dashboard/lessons", label: "Darslar", icon: "file-text" },
      { href: "/dashboard/students", label: "Oʻquvchilar", icon: "users" },
      { href: "/dashboard/classwork", label: "Sinf ishlari", icon: "clipboard" },
    ],
  },
  {
    section: "BAHOLASH",
    items: [
      { href: "/dashboard/grades", label: "Jurnal", icon: "bar-chart-2" },
      { href: "/dashboard/attendance", label: "Davomat", icon: "check-square" },
      { href: "/dashboard/standards", label: "Standartlar", icon: "target" },
    ],
  },
  {
    section: "VAZIFALAR",
    items: [
      { href: "/dashboard/tasks", label: "Vazifalar", icon: "check-circle" },
    ],
  },
];

const iconPaths: Record<string, React.ReactElement> = {
  grid: <><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></>,
  calendar: <><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></>,
  "book-open": <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  "file-text": <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  clipboard: <><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></>,
  "bar-chart-2": <><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></>,
  "check-square": <><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
  "check-circle": <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></>,
  home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const paths = iconPaths[name];
  if (!paths) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      {paths}
    </svg>
  );
}

function NavLink({
  href,
  label,
  icon,
  collapsed,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  collapsed: boolean;
  active: boolean;
}) {
  const className = cn(
    "flex items-center rounded-lg h-9 text-sm font-medium transition-colors",
    collapsed ? "justify-center w-9 mx-auto" : "gap-3 px-2.5",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-semibold"
      : "text-sidebar-foreground hover:bg-sidebar-accent"
  );

  const inner = (
    <>
      <span className={cn(active ? "text-sidebar-primary-foreground" : "text-muted-foreground")}>
        <Icon name={icon} />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </>
  );

  if (!collapsed) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger render={<Link href={href} />} className={className}>
        {inner}
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={cn(
        "hidden md:flex flex-col h-full bg-white dark:bg-sidebar border-r border-sidebar-border overflow-hidden transition-[width] duration-200 ease-linear shrink-0",
        collapsed ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Home */}
      <div className={cn("pt-3 pb-1", collapsed ? "px-2" : "px-3")}>
        <NavLink
          href="/dashboard"
          label="Bosh sahifa"
          icon="home"
          collapsed={collapsed}
          active={pathname === "/dashboard"}
        />
      </div>

      {/* Nav sections */}
      <div className={cn("flex-1 overflow-y-auto scrollbar-thin pb-4", collapsed ? "px-2 space-y-1" : "px-3 space-y-3")}>
        {navItems.map((section) => (
          <div key={section.section}>
            {collapsed ? (
              <div className="my-2 mx-2 h-px bg-sidebar-border" />
            ) : (
              <p className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-1 mt-3">
                {section.section}
              </p>
            )}
            {section.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed}
                  active={active}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: AI Magic + Storage usage */}
      <div className={cn("shrink-0 border-t border-sidebar-border bg-white dark:bg-sidebar", collapsed ? "px-2 py-3 space-y-2" : "px-4 py-3 space-y-3")}>
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="mx-auto h-9 w-9 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                </svg>
              </TooltipTrigger>
              <TooltipContent side="right">AI Magic · 8 200 / 10 000 kredit (82%)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                type="button"
                className="mx-auto h-9 w-9 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
                </svg>
              </TooltipTrigger>
              <TooltipContent side="right">Xotira · 1.2 GB / 10 GB (12%)</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-sidebar-foreground">AI Magic</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">82%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground" style={{ width: "82%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">8 200 / 10 000 kredit</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-sidebar-foreground">Xotira</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">12%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground" style={{ width: "12%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">1.2 GB / 10 GB</p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
