"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useTaskStore } from "@/store/useTaskStore";
import {
  GraduationCap,
  LayoutGrid,
  Calendar,
  BookOpen,
  FileText,
  Users,
  BarChart2,
  ClipboardCheck,
  CheckCircle,
  Home,
  Target,
  BookMarked,
  MessagesSquare,
  Settings,
  Award,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "tasks";
};

/* Tartib QASDAN GuideHub "Boshlash" checklisti bilan bir xil — sidebar
   haqiqat manbai, [[../tour/tours.ts]] shu tartibga ergashadi. */
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: Home },
  { href: "/dashboard/classes", label: "Mening sinflarim", icon: LayoutGrid },
  { href: "/dashboard/students", label: "Oʻquvchilar", icon: Users },
  { href: "/dashboard/timetable", label: "Dars jadvali", icon: Calendar },
  { href: "/dashboard/planner", label: "Rejalashtiruvchi", icon: BookOpen },
  { href: "/dashboard/lessons", label: "Darslar", icon: FileText },
  { href: "/dashboard/attendance", label: "Davomat", icon: ClipboardCheck },
  { href: "/dashboard/behavior", label: "Xulq-atvor", icon: Award },
  { href: "/dashboard/grades", label: "Jurnal", icon: BarChart2 },
  { href: "/dashboard/standards", label: "Standartlar", icon: Target },
  { href: "/dashboard/tasks", label: "Vazifalar", icon: CheckCircle, badgeKey: "tasks" },
];

const footerItems: NavItem[] = [
  { href: "/dashboard/feedback", label: "Fikr-mulohaza", icon: MessagesSquare },
  { href: "/dashboard/settings", label: "Sozlamalar", icon: Settings },
];

function useTaskCount() {
  const tasks = useTaskStore((s) => s.tasks);
  const hydrated = useTaskStore((s) => s._hasHydrated);
  return hydrated ? tasks.filter((t) => t.status === "todo").length : 0;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavMenuItem({ item, badge }: { item: NavItem; badge?: number }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const showBadge = !!badge && badge > 0;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {showBadge && (
        <SidebarMenuBadge className="bg-sidebar-primary/10 text-sidebar-primary">
          {badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const taskCount = useTaskCount();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-white shadow-sm">
                  <GraduationCap className="size-4" strokeWidth={2.2} />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold" style={{ letterSpacing: "-0.04em" }}>
                    Ustozona
                  </span>
                  <span className="truncate text-xs text-muted-foreground">EMS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent data-tour="sidebar-nav">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavMenuItem
                  key={item.href}
                  item={item}
                  badge={item.badgeKey === "tasks" ? taskCount : undefined}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mb-1" />
        <SidebarMenu>
          {footerItems.map((item) => (
            <NavMenuItem key={item.href} item={item} />
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
