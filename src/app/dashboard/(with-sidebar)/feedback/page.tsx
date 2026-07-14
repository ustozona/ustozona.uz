"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Search, ArrowUpDown, ListFilter, ChevronDown,
} from "lucide-react";
import {
  useFeedbackStore, initialsOf, totalReactions,
  type FeedbackCategory, type FeedbackStatus, type ReplyQuote,
} from "@/store/useFeedbackStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import {
  CATEGORY_META, CATEGORY_ORDER, STATUS_META, STATUS_ORDER, ONGOING_STATUSES,
} from "./_components/feedback-meta";
import { excerptOf } from "./_components/QuoteBlock";
import FeedbackComposer from "./_components/FeedbackComposer";
import FeedbackCard from "./_components/FeedbackCard";

type SortKey = "votes" | "new" | "replies";
type CatFilter = FeedbackCategory | "all";
type StatFilter = FeedbackStatus | "all";
type ViewTab = "feed" | "ongoing";

const SORT_LABELS: Record<SortKey, string> = {
  votes: "Eng koʻp reaksiya",
  new: "Eng yangi",
  replies: "Eng koʻp izoh",
};

export default function FeedbackPage() {
  const items = useFeedbackStore((s) => s.items);
  const hydrated = useFeedbackStore((s) => s._hasHydrated);
  const toggleReaction = useFeedbackStore((s) => s.toggleReaction);
  const toggleReplyReaction = useFeedbackStore((s) => s.toggleReplyReaction);
  const addReply = useFeedbackStore((s) => s.addReply);
  const setStatus = useFeedbackStore((s) => s.setStatus);
  const deleteFeedback = useFeedbackStore((s) => s.deleteFeedback);
  const restoreFeedback = useFeedbackStore((s) => s.restoreFeedback);

  const notify = useNotificationsStore((s) => s.notify);
  const searchParams = useSearchParams();

  const profile = useSettingsStore((s) => s.profile);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const userName = settingsHydrated ? profile.name : "Siz";
  const userInitials = settingsHydrated ? initialsOf(profile.name) : "S";

  const [tab, setTab] = useState<ViewTab>("feed");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("votes");
  const [catFilter, setCatFilter] = useState<CatFilter>("all");
  const [statFilter, setStatFilter] = useState<StatFilter>("all");
  const [mineOnly, setMineOnly] = useState(false);

  // ── Deep-link: ?item=<id> → oʻsha fikrga scroll + flash (bildirishnomadan) ──
  const jumpId = searchParams.get("item");
  const jumpedRef = useRef<string | null>(null);
  const [flashItemId, setFlashItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated || !jumpId || jumpedRef.current === jumpId) return;
    jumpedRef.current = jumpId;
    if (items.some((it) => it.id === jumpId)) {
      // Karta filtr yoki boshqa tab ortida qolib ketmasin.
      setTab("feed");
      setCatFilter("all");
      setStatFilter("all");
      setMineOnly(false);
      setSearch("");
      setFlashItemId(jumpId);
      // setTimeout + instant scroll (rAF/smooth emas): yashirin tab yoki fon
      // oynada rAF otilmaydi va smooth animatsiya siljimaydi.
      window.setTimeout(() => {
        document
          .getElementById(`msg-${jumpId}`)
          ?.scrollIntoView({ block: "center" });
      }, 80);
    }
    // Paramni tozalaymiz — refresh'da qayta flash boʻlmasin. router.replace
    // EMAS: u loading.tsx (Suspense) orqali sahifani remount qilib, scroll
    // va flash holatini yoʻqotadi; replaceState Next'ga tegmaydi.
    window.history.replaceState(null, "", "/dashboard/feedback");
  }, [hydrated, jumpId, items]);

  // Sanoqlar (filtr menyusi uchun)
  const catCounts = useMemo(() => {
    const map = { all: items.length } as Record<CatFilter, number>;
    for (const c of CATEGORY_ORDER) map[c] = 0;
    for (const it of items) map[it.category]++;
    return map;
  }, [items]);

  const statCounts = useMemo(() => {
    const map = { all: items.length } as Record<StatFilter, number>;
    for (const s of STATUS_ORDER) map[s] = 0;
    for (const it of items) map[it.status]++;
    return map;
  }, [items]);

  const ongoingCount = useMemo(
    () => items.filter((it) => ONGOING_STATUSES.includes(it.status)).length,
    [items]
  );

  const sortItems = useMemo(() => {
    return (list: typeof items) => {
      const sorted = [...list];
      if (sortKey === "votes") sorted.sort((a, b) => totalReactions(b) - totalReactions(a));
      else if (sortKey === "new") sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      else sorted.sort((a, b) => b.replies.length - a.replies.length);
      return sorted;
    };
  }, [sortKey]);

  const filtered = useMemo(() => {
    let list = items;
    // isMine — asosiy belgi; eski yozuvlar uchun ism boʻyicha fallback.
    if (mineOnly) list = list.filter((it) => it.isMine ?? it.author === userName);
    if (catFilter !== "all") list = list.filter((it) => it.category === catFilter);
    if (statFilter !== "all") list = list.filter((it) => it.status === statFilter);
    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (it) =>
          it.body.toLowerCase().includes(q) ||
          it.author.toLowerCase().includes(q) ||
          it.replies.some(
            (r) => r.body.toLowerCase().includes(q) || r.author.toLowerCase().includes(q)
          )
      );
    return list;
  }, [items, mineOnly, userName, catFilter, statFilter, search]);

  const feedList = useMemo(() => sortItems(filtered), [filtered, sortItems]);

  // Ongoing: faol holatlar boʻyicha guruhlangan
  const ongoingGroups = useMemo(() => {
    return ONGOING_STATUSES.map((st) => ({
      status: st,
      items: sortItems(filtered.filter((it) => it.status === st)),
    })).filter((g) => g.items.length > 0);
  }, [filtered, sortItems]);

  const filterActive =
    catFilter !== "all" || statFilter !== "all" || mineOnly || search.trim().length > 0;
  const filterCount =
    (catFilter !== "all" ? 1 : 0) + (statFilter !== "all" ? 1 : 0) + (mineOnly ? 1 : 0);

  // ── Amallar ──
  // Yangi fikr yuborilgach (addFeedback + toast FeedbackForm ichida):
  // filtrlarni tozalaymiz — yangi fikr roʻyxatda darhol koʻrinsin.
  const handleSubmitted = () => {
    setCatFilter("all");
    setStatFilter("all");
    setMineOnly(false);
    setSearch("");
    setTab("feed");
  };

  /** Javob: asTeam — rasmiy (Ustozona jamoasi) yoki oddiy foydalanuvchi nomidan. */
  const handleReply = (
    id: string,
    body: string,
    asTeam: boolean,
    quote?: ReplyQuote,
    parentId?: string,
  ) => {
    const item = items.find((it) => it.id === id);
    addReply(id, {
      body,
      author: asTeam ? "Ustozona jamoasi" : userName,
      isOfficial: asTeam,
      quote,
      parentId,
    });
    if (asTeam) {
      // Fikr egasiga bildirishnoma (header qoʻngʻiroqda koʻrinadi).
      notify({
        kind: "reply",
        title: "Fikringizga javob keldi",
        body: `Ustozona jamoasi: “${body.length > 90 ? `${body.slice(0, 90)}…` : body}”`,
        href: `/dashboard/feedback?item=${id}`,
      });
      toast.success("Javob yuborildi", {
        description: item ? `${item.author}ga bildirishnoma yuborildi.` : undefined,
      });
    } else {
      toast.success("Javob yuborildi");
    }
  };

  /** Holat oʻzgarishi — fikr egasiga bildirishnoma (doskaning eng qimmatli xabari). */
  const handleSetStatus = (id: string, status: FeedbackStatus) => {
    const item = items.find((it) => it.id === id);
    if (!item || item.status === status) return;
    setStatus(id, status);
    notify({
      kind: "status",
      title: "Fikringiz holati yangilandi",
      body: `«${excerptOf(item.body, 70)}» — endi ${STATUS_META[status].label}`,
      href: `/dashboard/feedback?item=${id}`,
    });
    toast.success(`Holat: ${STATUS_META[status].label}`, {
      description: `${item.author}ga bildirishnoma yuborildi.`,
    });
  };

  /** Oʻchirish — darhol, lekin toast orqali qaytarib olsa boʻladi (undo). */
  const handleDelete = (id: string) => {
    const index = items.findIndex((it) => it.id === id);
    const item = items[index];
    if (!item) return;
    deleteFeedback(id);
    toast("Fikr oʻchirildi", {
      action: {
        label: "Qaytarish",
        onClick: () => restoreFeedback(item, index),
      },
    });
  };

  const renderCard = (it: (typeof items)[number], i: number) => (
    <FeedbackCard
      key={it.id}
      item={it}
      index={i}
      flashOnMount={flashItemId === it.id}
      userInitials={userInitials}
      onToggleReaction={(emoji) => toggleReaction(it.id, emoji)}
      onToggleReplyReaction={(replyId, emoji) => toggleReplyReaction(it.id, replyId, emoji)}
      onSetStatus={(s) => handleSetStatus(it.id, s)}
      onAddReply={(body, asTeam, quote, parentId) => handleReply(it.id, body, asTeam, quote, parentId)}
      onDelete={() => handleDelete(it.id)}
    />
  );

  return (
    <ScrollArea className="h-full min-h-0 flex-1">
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
        {/* Sarlavha */}
        <div className="flex items-center gap-2.5">
          <h1 className="heading-page text-foreground">Fikr-mulohaza</h1>
        </div>
        <TypographyMuted className="-mt-2.5 text-sm">
          Ustozona haqidagi taklif, xato, savol va maqtovlaringiz — biz oʻqiymiz va ovoz bera olasiz.
        </TypographyMuted>

        {/* Umumiy card: kompozer + toolbar + lenta */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-elevation">
          {/* Inline kompozer */}
          <div className="border-b border-border p-3 md:p-4">
            <FeedbackComposer userInitials={userInitials} onSubmitted={handleSubmitted} />
          </div>

          {/* Tablar + toolbar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 md:px-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
            <TabsList>
              <TabsTrigger value="feed" className="gap-1.5">
                Lenta
                <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                  {items.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="gap-1.5">
                Jarayonda
                <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                  {ongoingCount}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Qidirish — desktop'da doimiy inline maydon */}
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Qidirish…"
                className="h-9 w-48 pl-9"
              />
            </div>
            {/* Qidirish — tor ekranda popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Qidirish"
                  className={cn(
                    "size-9 shadow-none md:hidden",
                    search.trim() && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <Search className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Fikrlar ichidan qidirish…"
                    className="h-9 pl-9"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtr (turkum + holat) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("h-9 gap-2 px-3 font-medium shadow-none", filterActive && "border-primary/40 text-primary")}>
                  <ListFilter className="size-4" />
                  Filtr
                  {filterCount > 0 && (
                    <span className="rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold tabular-nums text-primary">
                      {filterCount}
                    </span>
                  )}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuCheckboxItem checked={mineOnly} onCheckedChange={(v) => setMineOnly(v === true)}>
                  Faqat meniki
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Turkum</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={catFilter === "all"} onCheckedChange={() => setCatFilter("all")}>
                  Hammasi <span className="ml-auto text-xs text-muted-foreground">{catCounts.all}</span>
                </DropdownMenuCheckboxItem>
                {CATEGORY_ORDER.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c}
                    checked={catFilter === c}
                    onCheckedChange={() => setCatFilter(catFilter === c ? "all" : c)}
                  >
                    {CATEGORY_META[c].label}
                    <span className="ml-auto text-xs text-muted-foreground">{catCounts[c]}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Holat</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={statFilter === "all"} onCheckedChange={() => setStatFilter("all")}>
                  Hammasi <span className="ml-auto text-xs text-muted-foreground">{statCounts.all}</span>
                </DropdownMenuCheckboxItem>
                {STATUS_ORDER.map((s) => (
                  <DropdownMenuCheckboxItem
                    key={s}
                    checked={statFilter === s}
                    onCheckedChange={() => setStatFilter(statFilter === s ? "all" : s)}
                  >
                    {STATUS_META[s].label}
                    <span className="ml-auto text-xs text-muted-foreground">{statCounts[s]}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                {filterActive && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => { setCatFilter("all"); setStatFilter("all"); setMineOnly(false); }}>
                      Filtrni tozalash
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Saralash */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 px-3 font-medium shadow-none">
                  <ArrowUpDown className="size-4" />
                  <span className="hidden sm:inline">{SORT_LABELS[sortKey]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Saralash</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <DropdownMenuRadioItem value="votes">Eng koʻp reaksiya</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="new">Eng yangi</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="replies">Eng koʻp izoh</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

          {/* Kontent */}
          {!hydrated ? (
            <div className="flex h-40 items-center justify-center">
              <TypographyMuted>Yuklanmoqda…</TypographyMuted>
            </div>
          ) : tab === "feed" ? (
            feedList.length === 0 ? (
              <div className="p-4 md:p-5">
                <EmptyState filterActive={filterActive} />
              </div>
            ) : (
              <div className="space-y-3 bg-muted/25 p-3 md:p-4">{feedList.map(renderCard)}</div>
            )
          ) : ongoingGroups.length === 0 ? (
            <div className="p-4 md:p-5">
              <EmptyState filterActive={filterActive} ongoing />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ongoingGroups.map((g) => {
                const m = STATUS_META[g.status];
                return (
                  <Collapsible key={g.status} defaultOpen>
                    <CollapsibleTrigger className="group flex w-full items-center gap-2.5 bg-muted/30 px-4 py-2.5 text-left">
                      <span className={cn("size-2 shrink-0 rounded-full", m.dot)} />
                      <span className="text-sm font-semibold text-foreground">{m.label}</span>
                      <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {g.items.length}
                      </span>
                      <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform duration-fast ease-standard group-data-[state=closed]:-rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 bg-muted/25 p-3">
                      {g.items.map(renderCard)}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

function EmptyState({ filterActive, ongoing }: { filterActive: boolean; ongoing?: boolean }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia><Illustration name="4" className="h-32 text-black dark:text-white" /></EmptyMedia>
        <EmptyTitle>
          {ongoing ? "Jarayonda fikr yoʻq" : filterActive ? "Mos fikr topilmadi" : "Hali fikr yoʻq"}
        </EmptyTitle>
        <EmptyDescription>
          {ongoing
            ? "Koʻrilayotgan yoki rejalashtirilgan fikrlar shu yerda koʻrinadi."
            : filterActive
            ? "Filtr yoki qidiruvni oʻzgartirib koʻring."
            : "Birinchi boʻlib taklif yoki fikr bildiring."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
