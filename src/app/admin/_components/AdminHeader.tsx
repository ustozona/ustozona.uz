"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import HeaderBreadcrumb from "@/components/HeaderBreadcrumb";
import HeaderAccountMenu from "@/components/HeaderAccountMenu";
import NotificationsBell from "@/components/NotificationsBell";
import { ShieldCheck } from "lucide-react";

/* Header'ning yengil kloni: GuideHub/QuickFeedback yoʻq (oʻqituvchi
   store'lariga bogʻliq). Bell esa BOR — admin layout NotificationsServerSync'ni
   mount qiladi, yangi fikr/javob xabari shu yerda koʻrinadi. */

export default function AdminHeader() {
  return (
    <header className="flex items-center gap-1 border-b border-border bg-card shrink-0 z-20 h-[var(--top-header-height)] px-3">
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

      <HeaderBreadcrumb />

      <div className="flex-1 min-w-2" />

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1 font-medium">
          <ShieldCheck className="size-3.5" />
          Admin
        </Badge>
        <NotificationsBell />
        <HeaderAccountMenu />
      </div>
    </header>
  );
}
