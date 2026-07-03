"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bell, CheckCheck, MessageSquare, Sparkles, Lightbulb, Tag,
  type LucideIcon,
} from "lucide-react";
import {
  useNotificationsStore, type NotificationKind,
} from "@/store/useNotificationsStore";

const KIND_ICON: Record<NotificationKind, LucideIcon> = {
  reply: MessageSquare,
  feedback: Lightbulb,
  status: Tag,
  system: Sparkles,
};

/** ISO → "hozir / 5 daq / 3 soat / 2 kun / 12 iyun". */
const MONTHS_SHORT = [
  "yan", "fev", "mar", "apr", "may", "iyun",
  "iyul", "avg", "sen", "okt", "noy", "dek",
];
function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "hozir";
  if (min < 60) return `${min} daq`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} kun`;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

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
            <IconButton aria-label="Xabarlar" className="relative text-muted-foreground">
              <Bell className="size-[17px]" strokeWidth={2} />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-bold leading-none text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </IconButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Xabarlar</TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-1.5rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h3 className="text-sm font-semibold text-foreground">Xabarlar</h3>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              <CheckCheck className="size-3.5" />
              Barchasini oʻqildi
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell className="size-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Xabarlar yoʻq</p>
            <p className="text-xs text-muted-foreground">Yangi xabarlar shu yerda koʻrinadi.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[min(420px,60vh)]">
            <ul className="divide-y divide-border/60">
              {items.map((n) => {
                const Icon = KIND_ICON[n.kind];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openItem(n.id, n.href)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        !n.read && "bg-primary/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                          {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                        </span>
                        {n.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                            {n.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
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
