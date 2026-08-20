"use client";

import * as React from "react";
import { useEffect, useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useChangelogUnseenCount } from "@/hooks/useChangelogSeen";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { BrandShield } from "@/assets/logo/brand-shield";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Library,
  Calendar,
  BookOpen,
  FileText,
  ClipboardList,
  Users,
  BarChart2,
  ClipboardCheck,
  Home,
  Target,
  BookMarked,
  Newspaper,
  MessagesSquare,
  Megaphone,
  Settings,
  Award,
  TrendingUp,
  ListTodo,
  ChevronDown,
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
    items: [
      { href: "/dashboard", labelKey: "home", icon: Home },
      { href: "/dashboard/tasks", labelKey: "tasks", icon: ListTodo },
    ],
  },
  {
    labelKey: "groupTeaching",
    items: [
      { href: "/dashboard/timetable", labelKey: "timetable", icon: Calendar },
      { href: "/dashboard/classes", labelKey: "myClasses", icon: LayoutGrid },
      { href: "/dashboard/students", labelKey: "students", icon: Users },
      { href: "/dashboard/planner", labelKey: "planner", icon: BookOpen },
      { href: "/dashboard/lessons", labelKey: "lessons", icon: FileText },
      { href: "/dashboard/assignments", labelKey: "assignments", icon: ClipboardList },
      { href: "/dashboard/resources", labelKey: "resources", icon: Library },
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


/* Blog — /dashboard ICHIDA EMAS (bu EMS funksiyasi emas, alohida mahsulot;
   lesson-editor bilan bir xil sabab). Sidebar ochiq /blog'ga olib boradi;
   yozish esa oʻsha yerdagi "Yozish" tugmasi orqali /blog/studio'ga. */
const footerItems: NavItem[] = [
  { href: "/dashboard/changelog", labelKey: "changelog", icon: Megaphone, badgeKey: "changelog" },
  { href: "/blog", labelKey: "blog", icon: Newspaper },
  { href: "/dashboard/feedback", labelKey: "feedback", icon: MessagesSquare },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
];

const GROUP_OPEN_KEY_PREFIX = "sidebar-group-open:";

/** Guruh yigʻish holati — localStorage'da qurilma-lokal saqlanadi.
    SSR bilan mos kelishi uchun sukut boʻyicha ochiq, mount'dan keyin
    localStorage'dan oʻqiladi (bir martalik "flash" xavfsiz). */
function useGroupOpen(labelKey: string) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GROUP_OPEN_KEY_PREFIX + labelKey);
      if (stored !== null) setOpen(stored === "1");
    } catch {
      // Shaxsiy rejimda localStorage yopiq boʻlishi mumkin — ochiq holat zaxira variant.
    }
  }, [labelKey]);
  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(GROUP_OPEN_KEY_PREFIX + labelKey, next ? "1" : "0");
      } catch {
        // yuqoridagi bilan bir xil — indamay eʼtiborsiz qoldiriladi.
      }
      return next;
    });
  };
  return [open, toggle] as const;
}

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

/** Yorliqli guruh — bosilganda yigʻiladi/ochiladi (holat localStorage'da).
    Ikonka rejimida (`state === "collapsed"`) yorliq koʻrinmagani uchun
    doim ochiq hisoblanadi — foydalanuvchining ilgari yopgan holati
    ikonka-qatorni yashirmasin. */
function CollapsibleNavGroup({
  group,
  badgeCounts,
}: {
  group: NavGroup & { labelKey: string };
  badgeCounts: Record<NonNullable<NavItem["badgeKey"]>, number>;
}) {
  const t = useTranslations("AppSidebar");
  const { state } = useSidebar();
  const iconOnly = state === "collapsed";
  const [open, toggle] = useGroupOpen(group.labelKey);
  const effectiveOpen = iconOnly ? true : open;

  return (
    <Collapsible open={effectiveOpen} onOpenChange={iconOnly ? undefined : toggle}>
      <SidebarGroup className="p-1">
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="cursor-pointer justify-between hover:text-sidebar-foreground">
            {t(group.labelKey)}
            <ChevronDown className={cn("size-3.5 shrink-0 transition-transform duration-fast", !effectiveOpen && "-rotate-90")} />
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {group.items.map((item) => (
                <NavMenuItem key={item.href} item={item} badge={item.badgeKey ? badgeCounts[item.badgeKey] : undefined} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
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
    // `data-tour="sidebar-nav"` — butun panelda (header+content+footer),
    // faqat SidebarContent'da EMAS: tur matni yuqoridagi yigʻish tugmasiga
    // (Header'dagi SidebarTrigger — bu yerdan tashqarida, lekin viewport
    // jihatidan panelning tepasiga yaqin) ishora qiladi, shuning uchun
    // butun panel yoritilishi kerak (2026-08-18).
    <Sidebar collapsible="icon" data-tour="sidebar-nav">
      <SidebarHeader>
        <SidebarBrandHeader />
      </SidebarHeader>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <SidebarContent className="gap-1">
          {navGroups.map((group, i) =>
            group.labelKey ? (
              <CollapsibleNavGroup key={group.labelKey} group={group as NavGroup & { labelKey: string }} badgeCounts={badgeCounts} />
            ) : (
              <SidebarGroup key={`group-${i}`} className="p-1">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
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
            )
          )}
        </SidebarContent>
        <ScrollFade position="bottom" className="from-sidebar" />
      </div>

      <SidebarFooter>
        <SidebarSeparator className="mb-1" />
        <SidebarMenu className="gap-0.5">
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
