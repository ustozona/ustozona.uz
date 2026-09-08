"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { timeAgoUz, formatDayLabelUz } from "@/lib/localization";
import { dateToKey, todayKey, addDaysKey } from "@/lib/date-keys";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import {
  Bell, CheckCheck, ChevronDown, MessageSquare, Lightbulb, Activity, Info, Trash2,
} from "lucide-react";
import { AppleEmojiSprite } from "@/components/ui/apple-emoji";
import {
  useNotificationsStore, type NotificationItem, type NotificationKind,
} from "@/store/useNotificationsStore";

/* ════════════════════════════════════════════════════════════════════
   BILDIRISHNOMALAR QOʻNGʻIROGʻI.

   Satr anatomiyasi: [oʻqilmagan nuqta] [kind ikonkasi] [sarlavha /
   tavsif / vaqt] [ixtiyoriy holat pill'i]. Generic kind badge YOʻQ —
   ikonka turni allaqachon koʻrsatadi; badge faqat aniq holat berilganda
   (feedback STATUS_META) chiqadi.

   Roʻyxat KUN boʻyicha boʻlinadi (yopishqoq sarlavha: Bugun / Kecha /
   hafta kuni + sana) — takrorlanuvchi "3 kun oldin" satrlari orasidan
   koʻz ilashadigan yagona nuqta shu. Sarlavhadagi segment «Barchasi /
   Oʻqilmagan» ni almashtiradi.

   Bir kunda kelgan bir nechta tugʻilgan kun xabari BITTA yigʻma satrga
   yigʻiladi (`groupRows`) — yoyilganda har oʻquvchi alohida qator boʻlib,
   oʻz profiliga havola qiladi. Yigʻish faqat KOʻRSATISHDA: store'da
   yozuvlar oʻquvchi boʻyicha alohida qoladi, shuning uchun oʻqilgan
   holati va server sinxroni oʻzgarmaydi.
   ════════════════════════════════════════════════════════════════════ */

const KIND_ICON: Record<
  Exclude<NotificationKind, "birthday">,
  React.ComponentType<{ className?: string }>
> = {
  reply: MessageSquare,
  feedback: Lightbulb,
  status: Activity,
  system: Info,
};

const KIND_ICON_TONE: Record<NotificationKind, string> = {
  reply: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  feedback: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  status: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  system: "bg-muted text-muted-foreground",
  birthday: "bg-primary/10 text-primary",
};

/* Tugʻilgan kun — yagona "insoniy" xabar turi: qolganlari tizim hodisasi
   (javob, holat, fikr), bu esa tabrik. Shuning uchun lucide glifi emas,
   emoji sprite'i — `StudentRiskCard` dagi bilan bir xil naqsh. Emoji
   baribir oʻsha 28px iconbox ichida turadi, ya'ni satr anatomiyasi
   boshqa turlar bilan bir xil qoladi. */
const BIRTHDAY_EMOJI = "🎂";

/** Eski yozuvlar `kind: "system"` bilan saqlangan — sarlavhasidan
 *  tanib olamiz, aks holda ular hech qachon yangi koʻrinishga oʻtmasdi. */
function effectiveKind(n: NotificationItem): NotificationKind {
  if (n.kind === "birthday") return "birthday";
  return n.title.endsWith("tugʻilgan kuni") ? "birthday" : n.kind;
}

type Filter = "all" | "unread";

const FILTER_OPTIONS = [
  { value: "all" as const, label: "Barchasi" },
  { value: "unread" as const, label: "Oʻqilmagan" },
];

type Row =
  | { type: "single"; item: NotificationItem }
  | { type: "birthdayGroup"; key: string; items: NotificationItem[] };

type Section = { dayKey: string; label: string; rows: Row[] };

/** ISO → mahalliy `yyyy-mm-dd` (UTC kesish emas — kech kelgan xabar
 *  ertangi kunga tushib qolmasin). */
const dayKeyOf = (iso: string) => dateToKey(new Date(iso));

function dayLabel(key: string): string {
  const today = todayKey();
  if (key === today) return "Bugun";
  if (key === addDaysKey(today, -1)) return "Kecha";
  return formatDayLabelUz(key);
}

/** Bir kunlik tugʻilgan kun xabarlarini yigʻadi; tartib buzilmaydi. */
function groupRows(items: NotificationItem[]): Row[] {
  const byDay = new Map<string, NotificationItem[]>();
  for (const n of items) {
    if (effectiveKind(n) !== "birthday") continue;
    const day = dayKeyOf(n.createdAt);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(n);
    else byDay.set(day, [n]);
  }

  const rows: Row[] = [];
  const emitted = new Set<string>();
  for (const n of items) {
    if (effectiveKind(n) === "birthday") {
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

/** Satrlarni kun boʻyicha boʻladi — store tartibi (yangi → eski) saqlanadi. */
function toSections(rows: Row[]): Section[] {
  const sections: Section[] = [];
  for (const row of rows) {
    const key = row.type === "single" ? dayKeyOf(row.item.createdAt) : row.key;
    const last = sections[sections.length - 1];
    if (last && last.dayKey === key) last.rows.push(row);
    else sections.push({ dayKey: key, label: dayLabel(key), rows: [row] });
  }
  return sections;
}

/** Sarlavhadan ism va sinfni ajratadi. Ikki format qoʻllab-quvvatlanadi:
 *  yangi — "Azizbek Muhiddinovning (7-A) tugʻilgan kuni", eski —
 *  "Azizbek Muhiddinov — tugʻilgan kuni" (sinfsiz). */
function studentOf(item: NotificationItem): { name: string; className?: string } {
  const modern = /^(.+)ning \((.+)\) tugʻilgan kuni$/.exec(item.title);
  if (modern) return { name: modern[1], className: modern[2] };
  const dash = item.title.indexOf(" — ");
  return { name: dash > 0 ? item.title.slice(0, dash) : item.title };
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
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full",
        KIND_ICON_TONE[kind]
      )}
    >
      {kind === "birthday" ? (
        <AppleEmojiSprite emoji={BIRTHDAY_EMOJI} className="size-4" />
      ) : (
        React.createElement(KIND_ICON[kind], { className: "size-4" })
      )}
    </span>
  );
}

/* Oʻqilmagan nishoni satrning OʻNG chekkasida, vertikal markazda.
   Avval u chapda, ikonkadan oldin turardi — oʻqilgan satrlarda oʻsha
   ustun boʻsh spacer boʻlib qolar va butun roʻyxat chapdan keraksiz
   choʻzilardi. Oʻngda esa oʻqilgan satr ustunni umuman talab qilmaydi:
   joy faqat nishon bor satrda band boʻladi (gap-2.5 + size-2), matn
   boshlanishi ikkala holatda ham bir xil. */
function UnreadDot({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="size-2 shrink-0 self-center rounded-full bg-primary"
      aria-label="Oʻqilmagan"
    />
  );
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
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const [confirmClear, setConfirmClear] = React.useState(false);

  const unread = hydrated ? items.filter((n) => !n.read).length : 0;
  const sections = React.useMemo(() => {
    const visible = filter === "unread" ? items.filter((n) => !n.read) : items;
    return toSections(groupRows(visible));
  }, [items, filter]);

  /* Panel yopilganda boshlangʻich holatga qaytadi — keyingi ochilishda
     eski filtr yoki yarim ochiq guruh qolib ketmasin. */
  React.useEffect(() => {
    if (open) return;
    setFilter("all");
    setExpanded(new Set());
    setConfirmClear(false);
  }, [open]);

  const openItem = (id: string, href?: string) => {
    markRead(id);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  /* Yoyish = koʻrish: guruh ochilganda ichidagi barcha xabarlar oʻqilgan
     deb belgilanadi. Aks holda yigʻma satr bosilsa ham oʻqilmaganlar soni
     qotib qolardi — boshqa satrlarning hammasi bosilganda tozalanadi. */
  const toggleGroup = (key: string, groupItems: NotificationItem[]) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    if (!expanded.has(key)) {
      for (const n of groupItems) if (!n.read) markRead(n.id);
    }
  };

  const emptyState =
    filter === "unread" ? (
      <Empty className="p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon"><CheckCheck /></EmptyMedia>
          <EmptyTitle>Oʻqilmagan xabar yoʻq</EmptyTitle>
          <EmptyDescription>Hammasi oʻqilgan — «Barchasi» ga oʻting.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ) : (
      <Empty className="p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon"><Bell /></EmptyMedia>
          <EmptyTitle>Bildirishnoma yoʻq</EmptyTitle>
          <EmptyDescription>Yangi bildirishnomalar shu yerda koʻrinadi.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );

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
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
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
          emptyState
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            {sections.map((section) => (
              <section key={section.dayKey}>
                <h4 className="sticky top-0 z-10 border-b border-border/60 bg-popover/95 px-4 py-1.5 text-label backdrop-blur-sm">
                  {section.label}
                </h4>
                <ul className="divide-y divide-border/60">
                  {section.rows.map((row) => {
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
                            <KindIcon kind={effectiveKind(n)} />
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
                                <span className="mt-0.5 line-clamp-2 block text-caption">
                                  {n.body}
                                </span>
                              )}
                              <span className="mt-1 block text-caption">
                                {timeAgoUz(n.createdAt)}
                              </span>
                            </span>
                            <UnreadDot show={!n.read} />
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
                          onClick={() => toggleGroup(row.key, row.items)}
                          className={cn(
                            "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                            groupUnread && "bg-primary/[0.04]"
                          )}
                        >
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
                          <UnreadDot show={groupUnread} />
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
                              const { name, className } = studentOf(n);
                              return (
                                <li key={n.id}>
                                  <button
                                    type="button"
                                    onClick={() => openItem(n.id, n.href)}
                                    className="flex w-full items-center gap-2.5 py-2 pl-12 pr-4 text-left transition-colors hover:bg-muted/60"
                                  >
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                                      {initialsOf(name)}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                                      {name}
                                      {className && (
                                        <span className="text-muted-foreground"> · {className}</span>
                                      )}
                                    </span>
                                    <UnreadDot show={!n.read} />
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
              </section>
            ))}
          </ScrollArea>
        )}

        {items.length > 0 && (
          <div className="flex shrink-0 justify-end border-t border-border px-2 py-1.5">
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
