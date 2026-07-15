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
import { useChangelogUnseenCount } from "@/hooks/useChangelogSeen";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import {
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
  Megaphone,
  Settings,
  Award,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "tasks" | "changelog";
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
  { href: "/dashboard/changelog", label: "Yangilanishlar", icon: Megaphone, badgeKey: "changelog" },
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
  // Yangilanishlar — yangi kontent signali (Slack/GitHub uslubi): raqamli
  // chipdan tashqari, koʻrilmaguncha ikonka burchagida ping-nuqta pulslanadi.
  const showPing = showBadge && item.badgeKey === "changelog";
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <span className="relative inline-flex size-4 shrink-0">
            <item.icon className="size-4 shrink-0" />
            {showPing && (
              <span className="absolute -right-0.5 -top-0.5 flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-primary opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-sidebar-primary" />
              </span>
            )}
          </span>
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {showBadge && (
        <SidebarMenuBadge className="bg-sidebar-primary/10 text-sidebar-primary animate-in fade-in">
          {badge > 9 ? "9+" : badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const taskCount = useTaskCount();
  const changelogCount = useChangelogUnseenCount();
  const badgeCounts: Record<NonNullable<NavItem["badgeKey"]>, number> = {
    tasks: taskCount,
    changelog: changelogCount,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-auto">
              <Link href="/dashboard">
                <BrandWordmark
                  shieldClassName="size-[30px]"
                  textClassName="text-base"
                  gapClassName="gap-3"
                  rollerSize="base"
                />
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
                  badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
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
            <NavMenuItem
              key={item.href}
              item={item}
              badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
            />
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
