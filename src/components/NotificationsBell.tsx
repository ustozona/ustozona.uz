"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDayLabelUz } from "@/lib/localization";
import { dateToKey, todayKey, addDaysKey } from "@/lib/date-keys";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { useNotificationsStore, type NotificationItem } from "@/store/useNotificationsStore";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMALAR QOʻNGʻIROGʻI.

   Panel — uch qavat: qotgan sarlavha (segment + «hammasini oʻqilgan»),
   skroll qilinadigan roʻyxat, qotgan footer (tozalash). Roʻyxatning
   qurilish birligi — `NotificationCard`; bu fayl faqat KUN boʻlimlariga
   ajratadi va filtrni boshqaradi.

   ⚠️ Skroll balandligi kartalar konteynerining OʻZIDA (`max-h`), `flex-1`
   da emas: `PopoverContent` da `max-height` bor-u, `height` yoʻq —
   bunday konteyner bolaga aniq balandlik bermaydi, `flex-1` auto boʻlib
   qoladi va roʻyxat skroll oʻrniga kesilib ketardi.
   ════════════════════════════════════════════════════════════════════ */

type Filter = "all" | "unread";

const FILTER_OPTIONS = [
  { value: "all" as const, label: "Barchasi" },
  { value: "unread" as const, label: "Oʻqilmagan" },
];

type Section = { dayKey: string; label: string; items: NotificationItem[] };

/** ISO → mahalliy `yyyy-mm-dd` (UTC kesish emas — kech kelgan xabar
 *  ertangi kunga tushib qolmasin). */
const dayKeyOf = (iso: string) => dateToKey(new Date(iso));

function dayLabel(key: string): string {
  const today = todayKey();
  if (key === today) return "Bugun";
  if (key === addDaysKey(today, -1)) return "Kecha";
  return formatDayLabelUz(key);
}

/** Kun boʻyicha boʻlaklar — store tartibi (yangi → eski) saqlanadi. */
function toSections(items: NotificationItem[]): Section[] {
  const sections: Section[] = [];
  for (const item of items) {
    const key = dayKeyOf(item.createdAt);
    const last = sections[sections.length - 1];
    if (last && last.dayKey === key) last.items.push(item);
    else sections.push({ dayKey: key, label: dayLabel(key), items: [item] });
  }
  return sections;
}

export default function NotificationsBell() {
  const router = useRouter();
  const items = useNotificationsStore((s) => s.items);
  const hydrated = useNotificationsStore((s) => s._hasHydrated);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [confirmClear, setConfirmClear] = React.useState(false);

  const unread = hydrated ? items.filter((n) => !n.read).length : 0;
  const sections = React.useMemo(
    () => toSections(filter === "unread" ? items.filter((n) => !n.read) : items),
    [items, filter]
  );

  /* Panel yopilganda boshlangʻich holatga qaytadi — keyingi ochilishda
     eski filtr yoki yarim bosilgan tasdiq qolib ketmasin. */
  React.useEffect(() => {
    if (open) return;
    setFilter("all");
    setConfirmClear(false);
  }, [open]);

  const openItem = (id: string, href?: string) => {
    markRead(id);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

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

      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-1.5rem)] p-0 shadow-lg">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <h3 className="heading-small">Bildirishnomalar</h3>
          <div className="flex items-center gap-1">
            <SegmentedToggle
              value={filter}
              onValueChange={setFilter}
              options={FILTER_OPTIONS}
              variant="pill"
              className="gap-0.5 p-0.5 [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs"
            />
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
        </div>

        {sections.length === 0 ? (
          <Empty className="p-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {filter === "unread" ? <CheckCheck /> : <Bell />}
              </EmptyMedia>
              <EmptyTitle>
                {filter === "unread" ? "Oʻqilmagan xabar yoʻq" : "Bildirishnoma yoʻq"}
              </EmptyTitle>
              <EmptyDescription>
                {filter === "unread"
                  ? "Hammasi oʻqilgan — «Barchasi» ga oʻting."
                  : "Yangi bildirishnomalar shu yerda koʻrinadi."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="max-h-[min(380px,calc(var(--radix-popover-content-available-height)-6rem))] bg-muted/30">
            <div className="space-y-3 px-2.5 py-2.5">
              {sections.map((section) => (
                <section key={section.dayKey}>
                  <h4 className="px-1 pb-1.5 text-label">{section.label}</h4>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <NotificationCard key={item.id} item={item} onOpen={openItem} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </ScrollArea>
        )}

        {items.length > 0 && (
          <div className="flex justify-end border-t border-border px-2 py-1.5">
            {/* Ikki qadamli tasdiq — tozalash qaytarilmaydi, lekin popover
                ichida dialog ochilsa popover yopilib ketardi. */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1.5 text-xs",
                confirmClear
                  ? "text-destructive hover:text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  return;
                }
                clearAll();
                setConfirmClear(false);
              }}
            >
              <Trash2 className="size-3.5" />
              {confirmClear ? "Tasdiqlang — hammasi oʻchadi" : "Hammasini tozalash"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
