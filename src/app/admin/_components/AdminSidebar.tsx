"use client";

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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { BrandShield } from "@/assets/logo/brand-shield";
import {
  LayoutGrid,
  Users,
  Building2,
  MessagesSquare,
  ScrollText,
  Undo2,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { href: "/admin", label: "Boshqaruv", icon: LayoutGrid },
  { href: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { href: "/admin/schools", label: "Maktablar", icon: Building2 },
  { href: "/admin/feedback", label: "Fikrlar", icon: MessagesSquare },
  { href: "/admin/audit", label: "Audit jurnali", icon: ScrollText },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavMenuItem({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function AdminBrandHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild className="h-auto">
          <Link href="/admin">
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

export default function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AdminBrandHeader />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <NavMenuItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator className="mb-1" />
        <SidebarMenu>
          <NavMenuItem
            item={{
              href: "/dashboard",
              label: "Oʻqituvchi rejimiga qaytish",
              icon: Undo2,
            }}
          />
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
