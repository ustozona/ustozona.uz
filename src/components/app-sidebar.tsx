"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useChangelogUnseenCount } from "@/hooks/useChangelogSeen";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { BrandShield } from "@/assets/logo/brand-shield";
import {
  LayoutGrid,
  Calendar,
  BookOpen,
  FileText,
  Users,
  BarChart2,
  ClipboardCheck,
  Home,
  Target,
  BookMarked,
  MessagesSquare,
  Megaphone,
  Settings,
  Award,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badgeKey?: "changelog";
};

type NavGroup = {
  labelKey?: string;
  items: NavItem[];
};

/* Tartib QASDAN GuideHub "Boshlash" checklisti bilan bir xil — sidebar
   haqiqat manbai, [[../tour/tours.ts]] shu tartibga ergashadi. Guruhlash
   faqat vizual — item ketma-ketligi umumiy roʻyxatda oʻzgarmaydi. */
const navGroups: NavGroup[] = [
  {
    items: [{ href: "/dashboard", labelKey: "home", icon: Home }],
  },
  {
    labelKey: "groupTeaching",
    items: [
      { href: "/dashboard/timetable", labelKey: "timetable", icon: Calendar },
      { href: "/dashboard/classes", labelKey: "myClasses", icon: LayoutGrid },
      { href: "/dashboard/students", labelKey: "students", icon: Users },
      { href: "/dashboard/planner", labelKey: "planner", icon: BookOpen },
      { href: "/dashboard/lessons", labelKey: "lessons", icon: FileText },
    ],
  },
  {
    labelKey: "groupTracking",
    items: [
      { href: "/dashboard/attendance", labelKey: "attendance", icon: ClipboardCheck },
      { href: "/dashboard/behavior", labelKey: "behavior", icon: Award },
      { href: "/dashboard/grades", labelKey: "grades", icon: BarChart2 },
      { href: "/dashboard/standards", labelKey: "standards", icon: Target },
      { href: "/dashboard/statistics", labelKey: "statistics", icon: TrendingUp },
    ],
  },
];


const footerItems: NavItem[] = [
  { href: "/dashboard/changelog", labelKey: "changelog", icon: Megaphone, badgeKey: "changelog" },
  { href: "/dashboard/feedback", labelKey: "feedback", icon: MessagesSquare },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavMenuItem({ item, badge }: { item: NavItem; badge?: number }) {
  const t = useTranslations("AppSidebar");
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const showBadge = !!badge && badge > 0;
  // Yangilanishlar — yangi kontent signali (Slack/GitHub uslubi): raqamli
  // chipdan tashqari, koʻrilmaguncha ikonka burchagida ping-nuqta pulslanadi.
  const showPing = showBadge && item.badgeKey === "changelog";
  const label = t(item.labelKey);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={label}
        className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground data-[active=true]:[&>svg]:text-sidebar-primary-foreground"
      >
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
          <span>{label}</span>
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

function SidebarBrandHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="h-auto">
          <Link href="/dashboard">
            {collapsed ? (
              <BrandShield className="size-[30px] shrink-0" />
            ) : (
              <BrandWordmark
                shieldClassName="size-[30px]"
                textClassName="text-base"
                gapClassName="gap-3"
                rollerSize="base"
              />
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const t = useTranslations("AppSidebar");
  const changelogCount = useChangelogUnseenCount();
  const badgeCounts: Record<NonNullable<NavItem["badgeKey"]>, number> = {
    changelog: changelogCount,
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrandHeader />
      </SidebarHeader>

      <SidebarContent data-tour="sidebar-nav">
        {navGroups.map((group, i) => (
          <SidebarGroup key={group.labelKey ?? `group-${i}`}>
            {group.labelKey && <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <NavMenuItem
                    key={item.href}
                    item={item}
                    badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
