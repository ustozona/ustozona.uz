"use client";

import * as React from "react";
import { Building2, Check, ChevronsUpDown, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { switchWorkspaceAction } from "@/server/actions/workspace";

export type WorkspaceOption = {
  id: string;
  name: string;
  /** personal | school */
  kind: string;
  /** owner | admin | teacher */
  role: string;
  isActive: boolean;
};

/**
 * ISH MAYDONI ALMASHTIRGICHI.
 *
 * ⭐ BITTA maydon boʻlsa UMUMAN koʻrsatilmaydi. Bu bezak qarori emas,
 * arxitektura qoidasi: "yakka oʻqituvchi — aʼzosi bitta maydon", va u
 * "maktab" degan tushunchani KOʻRMASLIGI kerak
 * (docs/ish-maydoni-arxitektura.md §1). Almashtirgich faqat almashadigan
 * narsa paydo boʻlgandagina maʼnoga ega.
 */
export function WorkspaceSwitcher({ workspaces }: { workspaces: WorkspaceOption[] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [pending, startTransition] = React.useTransition();

  if (workspaces.length < 2) return null;

  const active = workspaces.find((w) => w.isActive) ?? workspaces[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent"
              tooltip={collapsed ? active.name : undefined}
              disabled={pending}
            >
              {active.kind === "school" ? (
                <Building2 className="size-4 shrink-0" />
              ) : (
                <User className="size-4 shrink-0" />
              )}
              <span className="truncate">{active.name}</span>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-caption text-muted-foreground">
              Ish maydoni
            </DropdownMenuLabel>
            {workspaces.map((w) => (
              <DropdownMenuItem
                key={w.id}
                disabled={pending || w.id === active.id}
                onSelect={() =>
                  startTransition(async () => {
                    await switchWorkspaceAction({ workspaceId: w.id });
                  })
                }
              >
                {w.kind === "school" ? (
                  <Building2 className="size-4 shrink-0" />
                ) : (
                  <User className="size-4 shrink-0" />
                )}
                <span className="truncate">{w.name}</span>
                {w.id === active.id ? <Check className="ml-auto size-4 shrink-0" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
