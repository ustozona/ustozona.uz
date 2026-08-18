"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown, ArrowUp, ArrowUpDown, EllipsisVertical, ExternalLink, FileText,
  LayoutGrid, Library, List, ListChecks, Plus, Search, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  panelCardClass, panelCardHeaderClass, withSidebarPageClass,
} from "@/components/DashboardPage";
import { classTints, type ClassColor } from "@/lib/class-colors";
import { timeAgoUz } from "@/lib/localization";
import { deleteSetAction } from "@/server/actions/assess";
import { useLessonStore } from "@/store/useLessonStore";
import { flushLessonsNow } from "@/components/sync/LessonsServerSync";
import type { LibraryItem, LibraryKind } from "@/lib/library-types";

/* Bitta koʻrinish, tur = FILTR (R226). Taqdimot va ish varagʻi obyekt
   sifatida paydo boʻlganda shu yerga bitta qator qoʻshiladi — sahifa
   qayta yozilmaydi.

   Jadval naqshi `ClassesTable` bilan bir xil (shadcn-space `table-01`
   oilasi): butun qator bosiladi, chapda ikonka + ikki qatorli asosiy
   katak, oʻngda amal menyusi.

   ⚠️ RANG = TUR, SINF EMAS. Bir muddat plitka sinf rangida chizilgan
   edi — bu xato: kutubxonaning butun maʼnosi materialni sinfdan
   AJRATISH, `classId` esa faqat «qayerda tuzilgan» degan ikkilamchi
   maʼlumot (`null` ham boʻlishi mumkin). Undan rang olish oʻsha
   ataylab pasaytirilgan maydonni qatordagi eng kuchli vizual belgiga
   aylantirardi.

   Sinf rangi bilan chalkashmaydi, chunki SHAKL ajratadi (dizayn tizimi,
   «Class swatch standard»): sinf = doira, tur = kvadrat plitka. Rang
   bazasi ham oʻsha OKLCH dvigatelidan (`makeColorTints`) — qotirilgan
   Tailwind klass yoʻq, dark mode avtomatik.

   RANG XARITASI Wayground'dan olingan va KELGUSI turlar uchun ham shu
   yerda band qilinadi — yangi tur qoʻshilganda rang tanlash bahsi
   qaytadan boshlanmasin:
     test (Assessment) → green    | taqdimot (Presentation) → orange
     matn (Passage)    → blue     | video (Video)           → rose
     kartochka (Flashcard) → violet
   «Dars» bizda toʻliq matnli hujjat, yaʼni Passage oilasidan — blue. */
const KIND_META: Record<
  LibraryKind,
  {
    label: string;
    icon: typeof FileText;
    color: ClassColor;
    href: (id: string) => string;
    /** Yangi material qayerda tuziladi — «Yaratish» menyusi shundan. */
    createHref: string;
  }
> = {
  test: {
    label: "Test",
    icon: ListChecks,
    color: "green",
    href: (id) => `/dashboard/assignments?setId=${id}`,
    createHref: "/dashboard/assignments",
  },
  lesson: {
    label: "Dars",
    icon: FileText,
    color: "blue",
    href: (id) => `/lessons/${id}`,
    createHref: "/dashboard/lessons",
  },
};

const ALL = "__all__";
/** Tur emas, HOLAT filtri — pastdagi izohga qarang. */
const DRAFT = "__draft__";

type SortKey = "updatedAt" | "title" | "lastUsedAt";
type ViewMode = "list" | "grid";

const SORT_LABEL: Record<SortKey, string> = {
  updatedAt: "Eng yangi",
  title: "Nom boʻyicha",
  lastUsedAt: "Yaqinda ishlatilgan",
};

export default function LibraryWorkspace({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const deleteLesson = useLessonStore((s) => s.deleteLesson);
  const lessonsHydrated = useLessonStore((s) => s._hasHydrated);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "updatedAt",
    dir: "desc",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const grades = useMemo(
    () =>
      [...new Set(items.map((i) => i.grade).filter((g): g is number => g !== null))].sort(
        (a, b) => a - b
      ),
    [items]
  );

  /** Matn va sinf filtri — tab filtridan OLDIN, chunki tab sonlari shu
      natijadan hisoblanadi (tab «Test (4)» deganda joriy qidiruv ichida
      4 ta demoqchi, umuman bazada emas). */
  const scoped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (grade !== ALL && String(item.grade ?? "") !== grade) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subject ?? "").toLowerCase().includes(q) ||
        (item.className ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, query, grade]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of scoped) {
      map.set(item.kind, (map.get(item.kind) ?? 0) + 1);
      if (item.isDraft) map.set(DRAFT, (map.get(DRAFT) ?? 0) + 1);
    }
    return map;
  }, [scoped]);

  const visible = useMemo(() => {
    const rows =
      tab === ALL
        ? scoped
        : tab === DRAFT
          ? scoped.filter((i) => i.isDraft)
          : scoped.filter((i) => i.kind === tab);
    const dirMul = sort.dir === "asc" ? 1 : -1;
    // Saralash roʻyxat NUSXASIDA — `items` prop, oʻzgartirilmaydi.
    return [...rows].sort((a, b) => {
      if (sort.key === "title") return a.title.localeCompare(b.title) * dirMul;
      if (sort.key === "lastUsedAt") {
        /* Hech qachon ishlatilmagan material har doim OXIRIDA — yoʻnalish
           qanday boʻlishidan qatʼi nazar. Aks holda «yaqinda ishlatilgan»
           roʻyxati boshida hech qachon ishlatilmaganlar turardi. */
        const av = a.lastUsedAt?.getTime();
        const bv = b.lastUsedAt?.getTime();
        if (av === undefined && bv === undefined) return 0;
        if (av === undefined) return 1;
        if (bv === undefined) return -1;
        return (av - bv) * dirMul;
      }
      return (a.updatedAt.getTime() - b.updatedAt.getTime()) * dirMul;
    });
  }, [scoped, tab, sort]);

  const rowKey = (item: LibraryItem) => `${item.kind}:${item.id}`;
  const selectedItems = visible.filter((i) => selected.has(rowKey(i)));
  const allVisibleSelected = visible.length > 0 && selectedItems.length === visible.length;

  function toggleOne(item: LibraryItem) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = rowKey(item);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map(rowKey)));
  }

  /**
   * Ommaviy oʻchirish — ikki turda ikki xil yoʻl:
   * test server amali (`deleteSetAction`), dars esa client store orqali
   * (`useLessonStore` diff'i sinxronizatsiyani oʻzi yuboradi).
   *
   * ⚠️ Ikkita tuzoq shu yerda yopiladi:
   * 1. Store hali gidratlanmagan boʻlsa `deleteLesson` BOʻSH roʻyxatda
   *    ishlaydi va hech narsa oʻchmaydi — diff yoʻqolgan id koʻrmaydi.
   *    Shuning uchun gidratsiya kutilmaguncha dars oʻchirilmaydi.
   * 2. Sinxronizatsiya kechiktirilgan (debounce). `router.refresh()` ni
   *    darhol chaqirsak, server hali oʻchmagan darsni qaytaradi va u
   *    roʻyxatda «tirilib» qoladi. `flushLessonsNow()` push'ni majburan
   *    yuboradi va shundan keyingina qayta oʻqiladi.
   */
  async function handleBulkDelete() {
    const tests = selectedItems.filter((i) => i.kind === "test");
    const lessons = selectedItems.filter((i) => i.kind === "lesson");

    if (lessons.length > 0 && !lessonsHydrated) {
      toast.error("Darslar hali yuklanmadi — bir lahzadan soʻng urinib koʻring");
      return;
    }

    setBusy(true);
    try {
      await Promise.all(tests.map((i) => deleteSetAction(i.id)));
      if (lessons.length > 0) {
        lessons.forEach((i) => deleteLesson(i.id));
        await flushLessonsNow();
      }
      toast.success(`${selectedItems.length} ta material oʻchirildi`);
      setSelected(new Set());
      setConfirmOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Oʻchirib boʻlmadi");
    } finally {
      setBusy(false);
    }
  }

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "title" ? "asc" : "desc" }
    );

  const SortHeader = ({
    label, sortKey, className,
  }: { label: string; sortKey: SortKey; className?: string }) => (
    <TableHead className={cn("px-3 py-3", className)}>
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {label}
        {sort.key === sortKey ? (
          sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
        ) : (
          <ArrowUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  return (
    /* `lg:pl-6` — `withSidebarPageClass` da `lg:pl-0` bor, chunki u
       sahifalar CHAPDA oʻz panelini (sinflar roʻyxati) chizadi va
       boʻshliqni oʻsha beradi. Materiallar bir panelli — usiz karta
       sidebar'ga yopishib qolardi. `flex-1 min-w-0` — qobiq qator-flex
       ichida ((with-sidebar)/layout.tsx), kenglik oʻz-oʻzidan toʻlmaydi. */
    <div className={cn(withSidebarPageClass, "min-w-0 flex-1 lg:pl-6")}>
      <Card className={cn("min-w-0", panelCardClass)}>
        <CardHeader className={cn(panelCardHeaderClass, "gap-3")}>
          <SectionIcon>
            <Library />
          </SectionIcon>
          <div className="min-w-0">
            <CardTitle>Materiallar</CardTitle>
            <TypographyMuted className="text-xs">
              {items.length} ta material · sinfdan qatʼi nazar
            </TypographyMuted>
          </div>
          <div className="ml-auto">
            <CreateMenu />
          </div>
        </CardHeader>

        {/* Toolbar qatori — header bilan bir xil oʻlchov: `px-5 py-4`
            (dizayn tizimi, «Gorizontal gutter — bitta qiymat»). Ichidagi
            boshqaruvlar 36px, demak qator ham header kabi 68px.

            Tanlov boʻlganda butun qator TANLOV PANELIGA almashadi (Gmail,
            Kahoot naqshi): filtrlarni ham, ommaviy amalni ham bir vaqtda
            koʻrsatish qatorni haddan tashqari toʻldirardi. */}
        {selectedItems.length > 0 ? (
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <span className="text-sm font-medium">
              {selectedItems.length} ta tanlandi
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Bekor qilish
            </Button>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive shadow-none"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" />
                Oʻchirish
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
            {/* TUR = TAB, select emas. «Barcha turlar» yopiq roʻyxatda
                turgani uchun oʻqituvchi nima filtrlanganini bilmaydi va
                qaysi tur nechta ekani koʻrinmaydi. Wayground `Created (18)
                / Draft (2)`, Kahoot `Recent / Drafts` — holat doim ochiq.

                ⚠️ «Qoralama» — TUR emas, HOLAT, va shu bir qatorda turadi.
                Ataylab: oʻqituvchi bitta savol beradi — «hozir nimaga
                qarayman?». Wayground/Kahoot ham Draft'ni kontent tablari
                yoniga qoʻyadi. Qoralama faqat darsda boʻladi
                (`lessons.status`), testda bunday holat yoʻq. */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value={ALL}>Hammasi ({scoped.length})</TabsTrigger>
                {Object.entries(KIND_META).map(([key, meta]) => (
                  <TabsTrigger key={key} value={key}>
                    {meta.label} ({counts.get(key) ?? 0})
                  </TabsTrigger>
                ))}
                <TabsTrigger value={DRAFT}>Qoralama ({counts.get(DRAFT) ?? 0})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="ml-auto flex items-center gap-2">
              {/* Qidiruv maydoni CHEKLANADI. `flex-1` da u 1000px+ ga
                  choʻzilib ketardi: keng input skanerlashni ogʻirlashtiradi.
                  Jahon amaliyoti (Linear, GitHub, Notion) — ~320–400px. */}
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom yoki sinf boʻyicha"
                  className="pl-9"
                />
              </div>

              {grades.length > 0 && (
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Barcha sinf</SelectItem>
                    {grades.map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {g}-sinf
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Saralash boshqaruvi IKKALA koʻrinish uchun bitta holatda:
                  katak koʻrinishida jadval sarlavhasi yoʻq, roʻyxatda esa
                  sarlavhani bosish ham shu holatni oʻzgartiradi. */}
              <Select
                value={sort.key}
                onValueChange={(v) =>
                  setSort({ key: v as SortKey, dir: v === "title" ? "asc" : "desc" })
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as ViewMode)}
                variant="outline"
              >
                <ToggleGroupItem value="list" aria-label="Roʻyxat koʻrinishi">
                  <List className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Katak koʻrinishi">
                  <LayoutGrid className="size-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        )}

        {visible.length === 0 ? (
          /* `flex-1` — boʻsh holat kartaning butun tanasini egallaydi va
             markazda turadi; usiz u tepaga yopishib qolardi. */
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Illustration name="empty" className="size-16" />
              </EmptyMedia>
              <EmptyTitle>
                {items.length === 0 ? "Hali material yoʻq" : "Hech narsa topilmadi"}
              </EmptyTitle>
              <EmptyDescription>
                {items.length === 0
                  ? "Tuzgan test va darslaringiz shu yerda toʻplanadi."
                  : "Qidiruv yoki filtrni oʻzgartirib koʻring."}
              </EmptyDescription>
            </EmptyHeader>
            {items.length === 0 && (
              <EmptyContent>
                <CreateMenu />
              </EmptyContent>
            )}
          </Empty>
        ) : view === "grid" ? (
          <div className="min-h-0 flex-1 overflow-auto" style={{ scrollbarGutter: "stable" }}>
            <div className="grid gap-4 p-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {visible.map((item) => (
                <LibraryCard
                  key={rowKey(item)}
                  item={item}
                  selected={selected.has(rowKey(item))}
                  onToggle={() => toggleOne(item)}
                  onOpen={() => router.push(KIND_META[item.kind].href(item.id))}
                />
              ))}
            </div>
          </div>
        ) : (
          /* `scrollbarGutter` — scroll paydo boʻlganda jadval siljib
             ketmasin va scrollbar `⋮` ustunini bosmasin. */
          <div className="min-h-0 flex-1 overflow-auto" style={{ scrollbarGutter: "stable" }}>
            {/* Ustun kengliklari FOIZDA. Piksel kenglik berilganda butun
                ortiqcha joy birinchi ustunga qoʻshilib, sarlavha bilan
                «Tur» orasida katta boʻsh tuynuk hosil boʻlardi. */}
            <table className="w-full min-w-2xl caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent!">
                  <TableHead className="w-12 py-3 pl-5 pr-0">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Hammasini tanlash"
                    />
                  </TableHead>
                  <SortHeader label="Material" sortKey="title" className="w-[54%]" />
                  <TableHead className="w-[14%] px-3 py-3">Tur</TableHead>
                  <SortHeader label="Oʻzgartirilgan" sortKey="updatedAt" className="w-[18%]" />
                  {/* Oʻng gutter `pr-5` — chapdagi `pl-5` bilan simmetrik
                      (dizayn tizimi: gorizontal gutter bitta qiymat). */}
                  <TableHead className="w-24 py-3 pl-3 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => (
                  <LibraryRow
                    key={rowKey(item)}
                    item={item}
                    selected={selected.has(rowKey(item))}
                    onToggle={() => toggleOne(item)}
                    onOpen={() => router.push(KIND_META[item.kind].href(item.id))}
                  />
                ))}
              </TableBody>
            </table>
          </div>
        )}
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedItems.length} ta material oʻchirilsinmi?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni qaytarib boʻlmaydi. Testdan chiqarilgan baholar jurnalda
              qoladi — faqat materialning oʻzi oʻchadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault(); // dialog amal tugagach yopiladi
                handleBulkDelete();
              }}
            >
              Oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** «Yaratish» — kutubxonadagi yagona kirish nuqtasi.

    Nega menyu, tugma emas: turlar roʻyxati `KIND_META` dan chiqadi, yaʼni
    yangi tur qoʻshilganda menyu oʻz-oʻzidan toʻldiriladi (Wayground
    `+ Add resource ▾` naqshi).

    ⚠️ Havolalar mavjud tuzish sirtlariga olib boradi (Topshiriqlar /
    Darslar), chunki ikkala muharrir ham SINF talab qiladi: test builder
    `classId` siz saqlay olmaydi. Kutubxonadan toʻgʻridan-toʻgʻri sinfsiz
    material tuzish — alohida ish, muharrirlarni oʻzgartirishni talab
    qiladi. */
function CreateMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Yaratish
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(KIND_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <DropdownMenuItem key={key} asChild>
              <a href={meta.createHref}>
                <Icon />
                {meta.label}
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Tur plitkasi — rang va shakl turdan (yuqoridagi izohga qarang). */
function KindTile({ kind, className }: { kind: LibraryKind; className?: string }) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", className)}
      style={classTints(meta.color).gradientTile}
    >
      <Icon className="size-[18px] text-white" />
    </span>
  );
}

/* Ikkinchi qator — material bilan BIRGA, ustunda emas. Kutubxonada bir
   xil nomli materiallar koʻp («Present simple» uch marta), ularni
   ajratuvchi yagona belgi sinf. U uzoqdagi ustunda turganda koʻz har
   qatorda ikki marta sakrardi. */
function subtitleOf(item: LibraryItem) {
  return [item.meta, item.subject, item.className ?? "sinfsiz"].filter(Boolean).join(" · ");
}

/** Sarlavha yonidagi belgilar — ikkala koʻrinishda bir xil. */
function ItemBadges({ item }: { item: LibraryItem }) {
  return (
    <>
      {item.isDraft && (
        <Badge variant="outline" className="shrink-0 text-[10px] text-warning">
          Qoralama
        </Badge>
      )}
      {/* «N marta» — alohida ustun emas, chip. Ustun boʻlganda darslarda
          har doim «—» turardi: 7 qatordan 7 tasi boʻsh ustun faqat joy
          yeydi. Wayground ham «3 plays» ni faqat oʻynalgan materialda
          koʻrsatadi. */}
      {item.usedCount !== null && item.usedCount > 0 && (
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          {item.usedCount} marta
        </Badge>
      )}
    </>
  );
}

function RowActions({ onOpen }: { onOpen: () => void }) {
  return (
    /* Asosiy amal KOʻRINADI (hover'da), qolganlari `⋮` da. Faqat `⋮`
       boʻlganda oʻqituvchi qatordan nima qilish mumkinligini bilmaydi.
       v1 da yagona amal «Ochish»; nusxalash keyingi bosqichda — u har
       turda alohida server amali talab qiladi. */
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="outline"
        className="opacity-0 shadow-none transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        Ochish
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <span className="flex cursor-pointer items-center justify-center rounded-full p-2 hover:bg-muted">
            <EllipsisVertical className="size-4" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={onOpen}>
            <ExternalLink />
            Ochish
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function LibraryRow({
  item, selected, onToggle, onOpen,
}: {
  item: LibraryItem;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const meta = KIND_META[item.kind];

  return (
    <TableRow
      className={cn("group cursor-pointer", selected && "bg-muted/50")}
      onClick={onOpen}
    >
      <TableCell className="py-3 pl-5 pr-0" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={item.title} />
      </TableCell>

      <TableCell className="py-3 pl-3 pr-3">
        <div className="flex items-center gap-3">
          <KindTile kind={item.kind} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h6 className="truncate text-sm font-medium">{item.title}</h6>
              <ItemBadges item={item} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{subtitleOf(item)}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="whitespace-nowrap px-3">
        <Badge variant="outline" className="text-[10px]">
          {meta.label}
        </Badge>
      </TableCell>

      <TableCell
        className="whitespace-nowrap px-3 text-sm text-muted-foreground"
        title={item.updatedAt.toLocaleDateString("uz-UZ")}
      >
        {timeAgoUz(item.updatedAt)}
      </TableCell>

      <TableCell className="py-3 pl-3 pr-5">
        <RowActions onOpen={onOpen} />
      </TableCell>
    </TableRow>
  );
}

/** Katak koʻrinishi — MUQOVASIZ.

    Kahoot/Wayground kataklari rasm ustiga quriladi; bizda muqova yoʻq va
    yaqin rejada ham koʻzlanmagan. Shuning uchun katak rasm oʻrnini boʻsh
    kulrang kvadrat bilan toʻldirmaydi: tur plitkasi kattaroq chiziladi
    va qolgan joy MATNGA beriladi. Natijada katak «buzuq rasm» emas,
    kompakt pasport boʻlib koʻrinadi. */
function LibraryCard({
  item, selected, onToggle, onOpen,
}: {
  item: LibraryItem;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const meta = KIND_META[item.kind];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-card border border-border p-4 transition-colors hover:bg-muted/40",
        selected && "border-primary bg-muted/50"
      )}
    >
      <div className="flex items-start gap-3">
        <KindTile kind={item.kind} className="size-11 [&_svg]:size-5" />
        <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={item.title} />
        </div>
      </div>

      <div className="min-w-0">
        <h6 className="line-clamp-2 text-sm font-medium">{item.title}</h6>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{subtitleOf(item)}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px]">
          {meta.label}
        </Badge>
        <ItemBadges item={item} />
        <span
          className="ml-auto text-xs text-muted-foreground"
          title={item.updatedAt.toLocaleDateString("uz-UZ")}
        >
          {timeAgoUz(item.updatedAt)}
        </span>
      </div>
    </div>
  );
}
