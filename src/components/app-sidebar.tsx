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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskStore } from "@/store/useTaskStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { CLASS_COLOR_HEX, type ClassColor } from "@/lib/class-colors";
import {
  GraduationCap,
  LayoutGrid,
  Calendar,
  BookOpen,
  FileText,
  Users,
  BarChart2,
  CheckSquare,
  CheckCircle,
  Home,
  Target,
  BookMarked,
  Plus,
  MessagesSquare,
  Settings,
  HelpCircle,
  ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "tasks";
};

const topItems: NavItem[] = [
  { href: "/dashboard", label: "Bosh sahifa", icon: Home },
  { href: "/dashboard/students", label: "Oʻquvchilar", icon: Users },
];

const navSections: { section: string; items: NavItem[] }[] = [
  {
    section: "TAYYORGARLIK",
    items: [
      { href: "/dashboard/classes", label: "Mening sinflarim", icon: LayoutGrid },
      { href: "/dashboard/timetable", label: "Dars jadvali", icon: Calendar },
      { href: "/dashboard/planner", label: "Rejalashtiruvchi", icon: BookOpen },
      { href: "/dashboard/lessons", label: "Darslar", icon: FileText },
    ],
  },
  {
    section: "KUNDALIK ISH",
    items: [
      { href: "/dashboard/attendance", label: "Davomat", icon: CheckSquare },
      { href: "/dashboard/grades", label: "Jurnal", icon: BarChart2 },
      { href: "/dashboard/tasks", label: "Vazifalar", icon: CheckCircle, badgeKey: "tasks" },
    ],
  },
  {
    section: "BAHOLASH",
    items: [
      { href: "/dashboard/standards", label: "Standartlar", icon: Target },
    ],
  },
];

const createItems: { href: string; label: string; icon: LucideIcon; desc: string }[] = [];

const footerItems: NavItem[] = [
  { href: "/dashboard/feedback", label: "Fikr-mulohaza", icon: MessagesSquare },
  { href: "/dashboard/settings", label: "Sozlamalar", icon: Settings },
  { href: "/dashboard/help", label: "Yordam", icon: HelpCircle },
];

function useTaskCount() {
  const tasks = useTaskStore((s) => s.tasks);
  const hydrated = useTaskStore((s) => s._hasHydrated);
  return hydrated ? tasks.filter((t) => t.status === "todo").length : 0;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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

function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm hover:bg-sidebar-primary hover:opacity-90 hover:text-sidebar-primary-foreground active:bg-sidebar-primary active:text-sidebar-primary-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
        >
          <Plus />
          <span>Yaratish</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-60">
        <DropdownMenuLabel>Yangi yaratish</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {createItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="flex items-start gap-2.5 cursor-pointer">
              <item.icon className="size-4 mt-0.5 text-muted-foreground shrink-0" strokeWidth={2} />
              <span className="flex flex-col">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const taskCount = useTaskCount();
  const profile = useSettingsStore((s) => s.profile);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const name = hydrated ? profile.name : "Foydalanuvchi";
  const initials = hydrated ? initialsOf(profile.name) || "F" : "F";
  const avatarHex = hydrated
    ? CLASS_COLOR_HEX[(profile.avatarColor as ClassColor) ?? "orange"] ?? CLASS_COLOR_HEX.orange
    : undefined;

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

      <SidebarContent>
        {/* Yaratish + top-level */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <CreateMenu />
              </SidebarMenuItem>
              {topItems.map((item) => (
                <NavMenuItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {navSections.map((section) => (
          <SidebarGroup key={section.section}>
            <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <NavMenuItem
                    key={item.href}
                    item={item}
                    badge={item.badgeKey === "tasks" ? taskCount : undefined}
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
            <NavMenuItem key={item.href} item={item} />
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={`${name} · Oʻqituvchi`}>
              <Link href="/dashboard/settings">
                <span
                  className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-xs font-medium text-white"
                  style={avatarHex ? { background: avatarHex } : undefined}
                >
                  {initials}
                </span>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">Oʻqituvchi</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
