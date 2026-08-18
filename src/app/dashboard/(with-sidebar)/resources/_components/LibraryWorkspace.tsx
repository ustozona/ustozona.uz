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
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
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
import type { LibraryItem, LibraryKind } from "@/lib/library-types";

/* Bitta koʻrinish, tur = FILTR (R226). Taqdimot va ish varagʻi obyekt
   sifatida paydo boʻlganda shu jadvalga bitta qator qoʻshiladi —
   sahifa qayta yozilmaydi.

   Jadval naqshi `ClassesTable` bilan bir xil (shadcn-space `table-01`
   oilasi): butun qator bosiladi, chapda ikonka + ikki qatorli asosiy
   katak, oʻngda amal menyusi. Ichki scroll BITTA — jadval ustiga
   ScrollArea qoʻyilmaydi (ikkita ustma-ust scrollbar antipattern). */
const KIND_META: Record<
  LibraryKind,
  { label: string; icon: typeof FileText; href: (id: string) => string }
> = {
  test: { label: "Test", icon: ListChecks, href: (id) => `/dashboard/assignments?setId=${id}` },
  lesson: { label: "Dars", icon: FileText, href: (id) => `/lessons/${id}` },
};

const ALL = "__all__";

type SortKey = "title" | "used" | "updatedAt";

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = items.filter((item) => {
      if (kind !== ALL && item.kind !== kind) return false;
      if (grade !== ALL && String(item.grade ?? "") !== grade) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.subject ?? "").toLowerCase().includes(q) ||
        (item.className ?? "").toLowerCase().includes(q)
      );
    });
    const dirMul = sort.dir === "asc" ? 1 : -1;
    // Saralash roʻyxat NUSXASIDA — `items` prop, oʻzgartirilmaydi.
    return [...rows].sort((a, b) => {
      if (sort.key === "title") return a.title.localeCompare(b.title) * dirMul;
      if (sort.key === "used") return ((a.usedCount ?? -1) - (b.usedCount ?? -1)) * dirMul;
      return (a.updatedAt.getTime() - b.updatedAt.getTime()) * dirMul;
    });
  }, [items, query, kind, grade, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "title" ? "asc" : "desc" }
    );

  const SortHeader = ({
    label, sortKey, className, align = "left",
  }: { label: string; sortKey: SortKey; className?: string; align?: "left" | "center" }) => (
    <TableHead className={cn("px-3 py-3", align === "center" && "text-center", className)}>
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
          align === "center" && "justify-center"
        )}
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
    /* `flex-1 min-w-0` — sahifa qobigʻi qator-flex ichida yashaydi
       ((with-sidebar)/layout.tsx `flex gap-6`), shuning uchun kenglik
       oʻz-oʻzidan toʻlmaydi: usiz karta kontent kengligida qolib, oʻngda
       sahifa foni koʻrinib turadi. */
    <div className={cn(withSidebarPageClass, "min-w-0 flex-1")}>
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
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
          {/* Qidiruv maydoni CHEKLANADI. `flex-1` da u 1000px+ ga choʻzilib
              ketardi: keng input skanerlashni ogʻirlashtiradi va yozuv
              boshi bilan oxiri orasida koʻz sakraydi. Jahon amaliyoti
              (Linear, GitHub, Notion) — qidiruv ~320–400px, filtrlar
              oʻng chetga suriladi. */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, fan yoki sinf boʻyicha qidirish"
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Barcha turlar</SelectItem>
              {Object.entries(KIND_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
              markazda turadi; usiz u tepaga yopishib, ostida katta boʻsh
              maydon qolardi. */
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
                «Tur» orasida ~600px boʻsh tuynuk hosil boʻlardi. Foiz
                ortiqchani hamma ustunga taqsimlaydi. */}
            <table className="w-full min-w-3xl caption-bottom text-sm">
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent!">
                  <SortHeader label="Material" sortKey="title" className="w-[38%] pl-5" />
                  <TableHead className="w-[10%] px-3 py-3">Tur</TableHead>
                  <TableHead className="w-[20%] px-3 py-3">Fan va sinf</TableHead>
                  <SortHeader label="Ishlatilgan" sortKey="used" className="w-[12%]" align="center" />
                  <SortHeader label="Oʻzgartirilgan" sortKey="updatedAt" className="w-[16%]" />
                  {/* Oʻng gutter `pr-5` — chapdagi `pl-5` bilan simmetrik
                      (dizayn tizimi: gorizontal gutter bitta qiymat, 20px). */}
                  <TableHead className="w-16 py-3 pl-3 pr-5" />
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
  const facets = [
    item.subject,
    item.grade !== null ? `${item.grade}-sinf` : null,
    item.className,
  ].filter(Boolean) as string[];

  return (
    <TableRow className="group cursor-pointer" onClick={onOpen}>
      <TableCell className="py-3 pl-5 pr-3">
        <div className="flex items-center gap-3">
          <SectionIcon className="shrink-0">
            <Icon />
          </SectionIcon>
          <div className="min-w-0">
            <h6 className="truncate text-sm font-medium">{item.title}</h6>
            <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="whitespace-nowrap px-3">
        <Badge variant="outline" className="text-[10px]">
          {meta.label}
        </Badge>
      </TableCell>

      <TableCell className="px-3">
        <span className="block truncate text-sm text-muted-foreground">
          {facets.length > 0 ? facets.join(" · ") : "—"}
        </span>
        {/* Sinfsiz toʻplam kutubxonada yashaydi — sinf oʻchirilgan yoki
            material umuman sinfsiz tuzilgan boʻlishi mumkin. */}
        {item.classId === null && (
          <span className="text-xs text-muted-foreground/70">sinfsiz</span>
        )}
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 text-center text-sm text-muted-foreground">
        {item.usedCount === null ? "—" : `${item.usedCount} marta`}
      </TableCell>

      <TableCell className="whitespace-nowrap px-3 text-sm text-muted-foreground">
        {item.updatedAt.toLocaleDateString("uz-UZ")}
      </TableCell>

      <TableCell className="pl-3 pr-5">
        {/* Amal tili har turda BIR XIL. v1 da faqat "Ochish"; nusxalash
            keyingi bosqichda — u har turda alohida server amali talab
            qiladi (test uchun `activities` ham koʻchiriladi). */}
        <div className="flex justify-end">
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
