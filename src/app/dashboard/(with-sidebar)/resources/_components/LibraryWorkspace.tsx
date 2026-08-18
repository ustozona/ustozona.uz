"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown, ArrowUp, ArrowUpDown, EllipsisVertical, ExternalLink,
  FileText, Library, ListChecks, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
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
import type { LibraryItem, LibraryKind } from "@/lib/library-types";

/* Bitta koʻrinish, tur = FILTR (R226). Taqdimot va ish varagʻi obyekt
   sifatida paydo boʻlganda shu yerga bitta qator qoʻshiladi — sahifa
   qayta yozilmaydi.

   Jadval naqshi `ClassesTable` bilan bir xil (shadcn-space `table-01`
   oilasi): butun qator bosiladi, chapda ikonka + ikki qatorli asosiy
   katak, oʻngda amal menyusi. Ichki scroll BITTA — jadval ustiga
   ScrollArea qoʻyilmaydi (ikkita ustma-ust scrollbar antipattern).

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
  { label: string; icon: typeof FileText; href: (id: string) => string; color: ClassColor }
> = {
  test: {
    label: "Test",
    icon: ListChecks,
    href: (id) => `/dashboard/assignments?setId=${id}`,
    color: "green",
  },
  lesson: {
    label: "Dars",
    icon: FileText,
    href: (id) => `/lessons/${id}`,
    color: "blue",
  },
};

const ALL = "__all__";

type SortKey = "title" | "updatedAt";

export default function LibraryWorkspace({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "updatedAt",
    dir: "desc",
  });

  const grades = useMemo(
    () =>
      [...new Set(items.map((i) => i.grade).filter((g): g is number => g !== null))].sort(
        (a, b) => a - b
      ),
    [items]
  );

  /** Matn va sinf filtri — TUR filtridan OLDIN, chunki tab sonlari shu
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

  const countByKind = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of scoped) map.set(item.kind, (map.get(item.kind) ?? 0) + 1);
    return map;
  }, [scoped]);

  const visible = useMemo(() => {
    const rows = kind === ALL ? scoped : scoped.filter((i) => i.kind === kind);
    const dirMul = sort.dir === "asc" ? 1 : -1;
    // Saralash roʻyxat NUSXASIDA — `items` prop, oʻzgartirilmaydi.
    return [...rows].sort((a, b) =>
      sort.key === "title"
        ? a.title.localeCompare(b.title) * dirMul
        : (a.updatedAt.getTime() - b.updatedAt.getTime()) * dirMul
    );
  }, [scoped, kind, sort]);

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
        </CardHeader>

        {/* Toolbar qatori — header bilan bir xil oʻlchov: `px-5 py-4`
            (dizayn tizimi, «Gorizontal gutter — bitta qiymat»). Ichidagi
            boshqaruvlar 36px, demak qator ham header kabi 68px. */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          {/* TUR = TAB, select emas. «Barcha turlar» yopiq roʻyxatda
              turgani uchun oʻqituvchi nima filtrlanganini bilmaydi va
              qaysi tur nechta ekani koʻrinmaydi. Wayground `Created (18)
              / Draft (2)`, Kahoot `Recent / Drafts` — holat doim ochiq.
              Bizda tur ikkita, tab ideal. */}
          <Tabs value={kind} onValueChange={setKind}>
            <TabsList>
              <TabsTrigger value={ALL}>Hammasi ({scoped.length})</TabsTrigger>
              {Object.entries(KIND_META).map(([key, meta]) => (
                <TabsTrigger key={key} value={key}>
                  {meta.label} ({countByKind.get(key) ?? 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-2">
            {/* Qidiruv maydoni CHEKLANADI. `flex-1` da u 1000px+ ga
                choʻzilib ketardi: keng input skanerlashni ogʻirlashtiradi.
                Jahon amaliyoti (Linear, GitHub, Notion) — ~320–400px. */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nom yoki sinf boʻyicha qidirish"
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
          </div>
        </div>

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
          </Empty>
        ) : (
          /* `scrollbarGutter` — scroll paydo boʻlganda jadval siljib
             ketmasin va scrollbar `⋮` ustunini bosmasin. */
          <div
            className="min-h-0 flex-1 overflow-auto"
            style={{ scrollbarGutter: "stable" }}
          >
            {/* Ustun kengliklari FOIZDA. Piksel kenglik berilganda butun
                ortiqcha joy birinchi ustunga qoʻshilib, sarlavha bilan
                «Tur» orasida katta boʻsh tuynuk hosil boʻlardi. */}
            <table className="w-full min-w-2xl caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent!">
                  <SortHeader label="Material" sortKey="title" className="w-[58%] pl-5" />
                  <TableHead className="w-[14%] px-3 py-3">Tur</TableHead>
                  <SortHeader label="Oʻzgartirilgan" sortKey="updatedAt" className="w-[20%]" />
                  {/* Oʻng gutter `pr-5` — chapdagi `pl-5` bilan simmetrik
                      (dizayn tizimi: gorizontal gutter bitta qiymat). */}
                  <TableHead className="w-24 py-3 pl-3 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((item) => (
                  <LibraryRow
                    key={`${item.kind}:${item.id}`}
                    item={item}
                    onOpen={() => router.push(KIND_META[item.kind].href(item.id))}
                  />
                ))}
              </TableBody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function LibraryRow({ item, onOpen }: { item: LibraryItem; onOpen: () => void }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  /* Ikkinchi qator — material bilan BIRGA, ustunda emas. Kutubxonada bir
     xil nomli materiallar koʻp («Present simple» uch marta), ularni
     ajratuvchi yagona belgi sinf. U uzoqdagi ustunda turganda koʻz har
     qatorda ikki marta sakrardi. */
  const subtitle = [item.meta, item.subject, item.className ?? "sinfsiz"]
    .filter(Boolean)
    .join(" · ");

  return (
    <TableRow className="group cursor-pointer" onClick={onOpen}>
      <TableCell className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          {/* Plitka = TUR (rang ham, shakl ham). Yuqoridagi izohga qarang. */}
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg"
            style={classTints(meta.color).gradientTile}
          >
            <Icon className="size-[18px] text-white" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h6 className="truncate text-sm font-medium">{item.title}</h6>
              {/* «N marta» — alohida ustun emas, chip. Ustun boʻlganda
                  darslarda har doim «—» turardi: 7 qatordan 7 tasi boʻsh
                  ustun faqat joy yeydi. Wayground ham «3 plays» ni faqat
                  oʻynalgan materialda koʻrsatadi. */}
              {item.usedCount !== null && item.usedCount > 0 && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {item.usedCount} marta
                </Badge>
              )}
            </div>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
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
        {/* Asosiy amal KOʻRINADI (hover'da), qolganlari `⋮` da. Faqat `⋮`
            boʻlganda oʻqituvchi qatordan nima qilish mumkinligini bilmaydi.
            v1 da yagona amal «Ochish»; nusxalash keyingi bosqichda — u har
            turda alohida server amali talab qiladi. */}
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
      </TableCell>
    </TableRow>
  );
}
