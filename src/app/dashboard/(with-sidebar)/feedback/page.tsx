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
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuItem, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Search, ArrowUpDown, ListFilter, Rows3, Loader2, CheckCircle2,
} from "lucide-react";
import {
  useFeedbackStore, initialsOf, upvoteCount,
  type FeedbackCategory, type FeedbackStatus, type ReplyQuote,
} from "@/store/useFeedbackStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import {
  CATEGORY_META, CATEGORY_ORDER, STATUS_META, STATUS_ORDER,
} from "./_components/feedback-meta";
import FeedbackComposer from "./_components/FeedbackComposer";
import FeedbackCard from "./_components/FeedbackCard";

type SortKey = "votes" | "new" | "replies";
type CatFilter = FeedbackCategory | "all";
type StatFilter = FeedbackStatus | "all";
/** Kanban emas, tab-uslub oqim: "Hammasi" (yangi ham shu yerda, badge
    orqali koʻrinadi) + Jarayonda + Bajarilgan. */
type ViewTab = "all" | "process" | "done";

const SORT_LABELS: Record<SortKey, string> = {
  votes: "Eng koʻp ovoz",
  new: "Eng yangi",
  replies: "Eng koʻp izoh",
};

/** Tab → holat: 4-bosqichli sodda model, "yangi" va "rad etilgan" hech
    qaysi tabga tegishli emas — faqat "Hammasi"da va Filtrda koʻrinadi. */
const TAB_META: Record<Exclude<ViewTab, "all">, { label: string; status: FeedbackStatus }> = {
  process: { label: "Jarayonda", status: "jarayonda" },
  done: { label: "Bajarilgan", status: "bajarildi" },
};

export default function FeedbackPage() {
  const items = useFeedbackStore((s) => s.items);
  const hydrated = useFeedbackStore((s) => s._hasHydrated);
  const toggleReaction = useFeedbackStore((s) => s.toggleReaction);
  const toggleReplyReaction = useFeedbackStore((s) => s.toggleReplyReaction);
  const addReply = useFeedbackStore((s) => s.addReply);
  const editFeedback = useFeedbackStore((s) => s.editFeedback);
  const deleteFeedback = useFeedbackStore((s) => s.deleteFeedback);

  const notify = useNotificationsStore((s) => s.notify);
  const searchParams = useSearchParams();

  const profile = useSettingsStore((s) => s.profile);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const userName = settingsHydrated ? profile.name : "Siz";
  const userInitials = settingsHydrated ? initialsOf(profile.name) : "S";
  const userAvatarUrl = settingsHydrated ? profile.avatarUrl || undefined : undefined;

  const [tab, setTab] = useState<ViewTab>("all");
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
      setTab("all");
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

  const tabCounts = useMemo(
    () => ({
      process: items.filter((it) => it.status === TAB_META.process.status).length,
      done: items.filter((it) => it.status === TAB_META.done.status).length,
    }),
    [items]
  );

  const sortItems = useMemo(() => {
    return (list: typeof items) => {
      const sorted = [...list];
      if (sortKey === "votes") sorted.sort((a, b) => upvoteCount(b) - upvoteCount(a));
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

  // Joriy tab roʻyxati — "Hammasi" toʻliq lenta, qolganlari bosqich
  // boʻyicha filtrlangan (Kanban/accordion emas, oddiy tab-uslub oqim).
  const tabList = useMemo(() => {
    if (tab === "all") return feedList;
    return sortItems(filtered.filter((it) => it.status === TAB_META[tab].status));
  }, [tab, feedList, filtered, sortItems]);

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
    setTab("all");
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

  /** Oʻchirish — FeedbackCard'dagi AlertDialog tasdigʻidan keyin chaqiriladi. */
  const handleDelete = (id: string) => {
    deleteFeedback(id);
    toast.success("Fikr oʻchirildi");
  };

  const handleEdit = (id: string, body: string) => {
    editFeedback(id, body);
    toast.success("Fikr tahrirlandi");
  };

  const renderCard = (it: (typeof items)[number], i: number) => (
    <FeedbackCard
      key={it.id}
      item={it}
      index={i}
      flashOnMount={flashItemId === it.id}
      userInitials={userInitials}
      userAvatarUrl={userAvatarUrl}
      onToggleReaction={(emoji) => toggleReaction(it.id, emoji)}
      onToggleReplyReaction={(replyId, emoji) => toggleReplyReaction(it.id, replyId, emoji)}
      onAddReply={(body, asTeam, quote, parentId) => handleReply(it.id, body, asTeam, quote, parentId)}
      onEdit={(body) => handleEdit(it.id, body)}
      onDelete={() => handleDelete(it.id)}
      tourTarget={i === 0 && tab === "all"}
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
          <div className="border-b border-border p-3 md:p-4" data-tour="feedback-composer">
            <FeedbackComposer
              userInitials={userInitials}
              userAvatarUrl={userAvatarUrl}
              onSubmitted={handleSubmitted}
            />
          </div>

          {/* Tablar + toolbar */}
          <div
            className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 md:px-4"
            data-tour="feedback-toolbar"
          >
          <Tabs value={tab} onValueChange={(v) => setTab(v as ViewTab)}>
            <TabsList variant="line">
              <TabsTrigger value="all" className="gap-1.5">
                <Rows3 className="size-3.5" />
                Hammasi
                <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                  {items.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="process" className="gap-1.5">
                <Loader2 className="size-3.5" />
                Jarayonda
                <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                  {tabCounts.process}
                </span>
              </TabsTrigger>
              <TabsTrigger value="done" className="gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Bajarilgan
                <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                  {tabCounts.done}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Qidirish — icon-only, popover ichida (barcha ekranlarda bir xil) */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Qidirish"
                      className={cn(
                        "size-9 shadow-none",
                        search.trim() && "border-primary/40 text-primary"
                      )}
                    >
                      <Search className="size-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Qidirish</TooltipContent>
              </Tooltip>
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

            {/* Filtr (turkum + holat) — icon-only */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        "relative size-9 shadow-none",
                        filterActive && "border-primary/40 text-primary"
                      )}
                    >
                      <ListFilter className="size-4" />
                      {filterCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold tabular-nums text-primary-foreground">
                          {filterCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Filtr</TooltipContent>
              </Tooltip>
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

            {/* Saralash — icon-only */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="size-9 shadow-none">
                      <ArrowUpDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Saralash: {SORT_LABELS[sortKey]}</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Saralash</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <DropdownMenuRadioItem value="votes">Eng koʻp ovoz</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="new">Eng yangi</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="replies">Eng koʻp izoh</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

          {/* Kontent */}
          {!hydrated ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <Spinner className="size-6 text-muted-foreground" />
              <TypographyMuted>Yuklanmoqda…</TypographyMuted>
            </div>
          ) : tabList.length === 0 ? (
            <div className="p-4 md:p-5">
              <EmptyState filterActive={filterActive} tab={tab} />
            </div>
          ) : (
            <div className="space-y-3 bg-muted/25 p-3 md:p-4">{tabList.map(renderCard)}</div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

const EMPTY_TAB_COPY: Record<Exclude<ViewTab, "all">, { title: string; desc: string }> = {
  process: { title: "Jarayonda fikr yoʻq", desc: "Koʻrib chiqilayotgan yoki ish boshlangan fikrlar shu yerda koʻrinadi." },
  done: { title: "Hali bajarilgan fikr yoʻq", desc: "Amalga oshirilgan taklif va tuzatilgan xatolar shu yerda koʻrinadi." },
};

function EmptyState({ filterActive, tab }: { filterActive: boolean; tab: ViewTab }) {
  const copy = tab !== "all" ? EMPTY_TAB_COPY[tab] : null;
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia><Illustration name="4" className="h-32 text-black dark:text-white" /></EmptyMedia>
        <EmptyTitle>
          {copy ? copy.title : filterActive ? "Mos fikr topilmadi" : "Hali fikr yoʻq"}
        </EmptyTitle>
        <EmptyDescription>
          {copy
            ? copy.desc
            : filterActive
            ? "Filtr yoki qidiruvni oʻzgartirib koʻring."
            : "Birinchi boʻlib taklif yoki fikr bildiring."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
