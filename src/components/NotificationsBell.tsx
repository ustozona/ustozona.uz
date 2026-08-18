"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { timeAgoUz } from "@/lib/localization";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Bell, CheckCheck } from "lucide-react";
import {
  useNotificationsStore, type NotificationKind,
} from "@/store/useNotificationsStore";

const KIND_LABEL: Record<NotificationKind, string> = {
  reply: "Javob",
  feedback: "Fikr",
  status: "Holat",
  system: "Tizim",
};

const KIND_BADGE: Record<NotificationKind, string> = {
  reply: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  feedback: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  status: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  system: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

export default function NotificationsBell() {
  const router = useRouter();
  const items = useNotificationsStore((s) => s.items);
  const hydrated = useNotificationsStore((s) => s._hasHydrated);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const unread = hydrated ? items.filter((n) => !n.read).length : 0;

  const openItem = (id: string, href?: string) => {
    markRead(id);
    if (href) router.push(href);
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <IconButton aria-label="Bildirishnomalar" className="relative text-muted-foreground">
              <Bell className="size-[17px]" strokeWidth={2} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-bold leading-none text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </IconButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Bildirishnomalar</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-1.5rem)] p-0 shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-foreground">Bildirishnomalar</h3>
          {unread > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground"
                  onClick={markAllRead}
                >
                  <CheckCheck className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Barchasini oʻqilgan deb belgilash</TooltipContent>
            </Tooltip>
          )}
        </div>

        {items.length === 0 ? (
          <Empty className="p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Bell /></EmptyMedia>
              <EmptyTitle>Bildirishnoma yoʻq</EmptyTitle>
              <EmptyDescription>Yangi bildirishnomalar shu yerda koʻrinadi.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="max-h-[min(420px,60vh)]">
            <ul className="divide-y divide-border/60">
              {items.map((n) => {
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n.id, n.href)}
                      className={cn(
                        "flex w-full items-start px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read && "bg-primary/[0.04]"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 px-1.5 py-0 text-[10px] font-medium",
                              n.badgeClassName ?? KIND_BADGE[n.kind]
                            )}
                          >
                            {n.badgeLabel ?? KIND_LABEL[n.kind]}
                          </Badge>
                        </span>
                        {n.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-muted-foreground">{timeAgoUz(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
