"use client";

import * as React from "react";
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
import {
  Bell, CheckCheck, Cake, ChevronDown, MessageSquare, Lightbulb, Activity, Info,
} from "lucide-react";
import {
  useNotificationsStore, type NotificationItem, type NotificationKind,
} from "@/store/useNotificationsStore";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMALAR QOʻNGʻIROGʻI.

   Satr anatomiyasi: [oʻqilmagan nuqta] [kind ikonkasi] [sarlavha /
   tavsif / vaqt] [ixtiyoriy holat pill'i]. Generic kind badge YOʻQ —
   ikonka turni allaqachon koʻrsatadi; badge faqat aniq holat berilganda
   (feedback STATUS_META) chiqadi.

   Bir kunda kelgan bir nechta tugʻilgan kun xabari BITTA yigʻma satrga
   yigʻiladi (`groupRows`) — yoyilganda har oʻquvchi alohida qator boʻlib,
   oʻz profiliga havola qiladi. Yigʻish faqat KOʻRSATISHDA: store'da
   yozuvlar oʻquvchi boʻyicha alohida qoladi, shuning uchun oʻqilgan
   holati va server sinxroni oʻzgarmaydi.
   ════════════════════════════════════════════════════════════════════ */

const KIND_ICON: Record<NotificationKind, React.ComponentType<{ className?: string }>> = {
  reply: MessageSquare,
  feedback: Lightbulb,
  status: Activity,
  system: Info,
  birthday: Cake,
};

const KIND_ICON_TONE: Record<NotificationKind, string> = {
  reply: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  feedback: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  status: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  system: "bg-muted text-muted-foreground",
  birthday: "bg-primary/10 text-primary",
};

type Row =
  | { type: "single"; item: NotificationItem }
  | { type: "birthdayGroup"; key: string; items: NotificationItem[] };

const dayKeyOf = (iso: string) => iso.slice(0, 10);

/** Bir kunlik tugʻilgan kun xabarlarini yigʻadi; tartib buzilmaydi. */
function groupRows(items: NotificationItem[]): Row[] {
  const byDay = new Map<string, NotificationItem[]>();
  for (const n of items) {
    if (n.kind !== "birthday") continue;
    const day = dayKeyOf(n.createdAt);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(n);
    else byDay.set(day, [n]);
  }

  const rows: Row[] = [];
  const emitted = new Set<string>();
  for (const n of items) {
    if (n.kind === "birthday") {
      const day = dayKeyOf(n.createdAt);
      const group = byDay.get(day);
      if (group && group.length > 1) {
        if (!emitted.has(day)) {
          emitted.add(day);
          rows.push({ type: "birthdayGroup", key: day, items: group });
        }
        continue;
      }
    }
    rows.push({ type: "single", item: n });
  }
  return rows;
}

/** "Ism — tugʻilgan kuni" sarlavhasidan faqat ismni ajratadi. */
function studentNameOf(item: NotificationItem): string {
  const dash = item.title.indexOf(" — ");
  return dash > 0 ? item.title.slice(0, dash) : item.title;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function KindIcon({ kind }: { kind: NotificationKind }) {
  const Icon = KIND_ICON[kind];
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full",
        KIND_ICON_TONE[kind]
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

function UnreadDot({ show }: { show: boolean }) {
  return (
    <span
      className={cn("mt-2 size-1.5 shrink-0 rounded-full", show && "bg-primary")}
      aria-hidden
    />
  );
}

export default function NotificationsBell() {
  const router = useRouter();
  const items = useNotificationsStore((s) => s.items);
  const hydrated = useNotificationsStore((s) => s._hasHydrated);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);

  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  const unread = hydrated ? items.filter((n) => !n.read).length : 0;
  const rows = React.useMemo(() => groupRows(items), [items]);

  const openItem = (id: string, href?: string) => {
    markRead(id);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  const toggleGroup = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <IconButton
              aria-label={
                unread > 0 ? `Bildirishnomalar — ${unread} ta oʻqilmagan` : "Bildirishnomalar"
              }
              className="relative text-muted-foreground"
            >
              <Bell className="size-[17px]" strokeWidth={2} />
              {unread > 0 && (
                <span
                  aria-live="polite"
                  className="absolute right-0.5 top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-bold leading-none text-white"
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </IconButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Bildirishnomalar</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        className="flex max-h-[min(480px,var(--radix-popover-content-available-height))] w-96 max-w-[calc(100vw-1.5rem)] flex-col p-0 shadow-lg"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
          <h3 className="heading-small">Bildirishnomalar</h3>
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
          <ScrollArea className="min-h-0 flex-1">
            <ul className="divide-y divide-border/60">
              {rows.map((row) => {
                if (row.type === "single") {
                  const n = row.item;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => openItem(n.id, n.href)}
                        className={cn(
                          "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                          !n.read && "bg-primary/[0.04]"
                        )}
                      >
                        <UnreadDot show={!n.read} />
                        <KindIcon kind={n.kind} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-sm text-foreground",
                                n.read ? "font-normal" : "font-medium"
                              )}
                            >
                              {n.title}
                            </span>
                            {n.badgeLabel && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 px-1.5 py-0 text-[10px] font-medium",
                                  n.badgeClassName
                                )}
                              >
                                {n.badgeLabel}
                              </Badge>
                            )}
                          </span>
                          {n.body && (
                            <span className="mt-0.5 line-clamp-2 block text-caption">{n.body}</span>
                          )}
                          <span className="mt-1 block text-caption">{timeAgoUz(n.createdAt)}</span>
                        </span>
                      </button>
                    </li>
                  );
                }

                const groupUnread = row.items.some((n) => !n.read);
                const isOpen = expanded.has(row.key);
                return (
                  <li key={`bday-${row.key}`}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => toggleGroup(row.key)}
                      className={cn(
                        "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        groupUnread && "bg-primary/[0.04]"
                      )}
                    >
                      <UnreadDot show={groupUnread} />
                      <KindIcon kind="birthday" />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm text-foreground",
                            groupUnread ? "font-medium" : "font-normal"
                          )}
                        >
                          {row.items.length} oʻquvchining tugʻilgan kuni
                        </span>
                        <span className="mt-1 block text-caption">
                          {timeAgoUz(row.items[0].createdAt)}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-fast ease-standard",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>

                    {isOpen && (
                      <ul className="border-t border-border/60 bg-muted/30">
                        {row.items.map((n) => {
                          const name = studentNameOf(n);
                          return (
                            <li key={n.id}>
                              <button
                                type="button"
                                onClick={() => openItem(n.id, n.href)}
                                className="flex w-full items-center gap-2.5 py-2 pl-[3.25rem] pr-4 text-left transition-colors hover:bg-muted/60"
                              >
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                                  {initialsOf(name)}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                  {name}
                                  {n.body && (
                                    <span className="text-muted-foreground"> · {n.body}</span>
                                  )}
                                </span>
                                {!n.read && (
                                  <span
                                    className="size-1.5 shrink-0 rounded-full bg-primary"
                                    aria-hidden
                                  />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
