"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Library, ListChecks, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { panelCardClass, panelHeaderClass, withSidebarPageClass } from "@/components/DashboardPage";
import type { LibraryItem, LibraryKind } from "@/lib/library-types";

/* Bitta koʻrinish, tur = FILTR (R226). Taqdimot va ish varagʻi obyekt
   sifatida paydo boʻlganda shu jadvalga bitta qator qoʻshiladi —
   sahifa qayta yozilmaydi. */
const KIND_META: Record<
  LibraryKind,
  { label: string; icon: typeof FileText; href: (id: string) => string }
> = {
  test: { label: "Test", icon: ListChecks, href: (id) => `/dashboard/assignments?setId=${id}` },
  lesson: { label: "Dars", icon: FileText, href: (id) => `/lessons/${id}` },
};

const ALL = "__all__";

type SortKey = "recent" | "title" | "used";

export default function LibraryWorkspace({ items }: { items: LibraryItem[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);
  const [sort, setSort] = useState<SortKey>("recent");

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
    // Saralash roʻyxat NUSXASIDA — `items` prop, oʻzgartirilmaydi.
    return [...rows].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "used") return (b.usedCount ?? -1) - (a.usedCount ?? -1);
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [items, query, kind, grade, sort]);

  return (
    <div className={withSidebarPageClass}>
      <div className={cn(panelCardClass, "min-h-0 flex-1")}>
        <div className={cn(panelHeaderClass, "items-center gap-3")}>
          <SectionIcon>
            <Library />
          </SectionIcon>
          <div className="min-w-0">
            <CardTitle>Materiallar</CardTitle>
            <TypographyMuted className="text-xs">
              {items.length} ta material · sinfdan qatʼi nazar
            </TypographyMuted>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, fan yoki sinf boʻyicha qidirish"
              className="pl-9"
            />
          </div>

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

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Eng yangi</SelectItem>
              <SelectItem value="title">Nom boʻyicha</SelectItem>
              <SelectItem value="used">Koʻp ishlatilgan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {visible.length === 0 ? (
            <Empty className="py-16">
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
            <ul className="divide-y divide-border">
              {visible.map((item) => (
                <LibraryRow key={`${item.kind}:${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

/* Amal tili har turda BIR XIL — oʻqituvchi test bilan darsni bir xil
   qoʻl harakati bilan boshqaradi. v1 da "Ochish"; nusxalash keyingi
   bosqichda, chunki u har turda alohida server amali talab qiladi. */
function LibraryRow({ item }: { item: LibraryItem }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;
  const facets = [
    item.subject,
    item.grade !== null ? `${item.grade}-sinf` : null,
    item.className,
  ].filter(Boolean) as string[];

  return (
    <li className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
      <SectionIcon size="sm">
        <Icon />
      </SectionIcon>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.title}</span>
          <Badge variant="outline" className="text-[10px]">
            {meta.label}
          </Badge>
          {item.classId === null && (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              sinfsiz
            </Badge>
          )}
        </div>
        <TypographyMuted className="truncate text-xs">
          {[item.meta, ...facets].join(" · ")}
        </TypographyMuted>
      </div>

      {item.usedCount !== null && item.usedCount > 0 && (
        <TypographyMuted className="hidden text-xs sm:block">
          {item.usedCount} marta
        </TypographyMuted>
      )}
      <TypographyMuted className="hidden w-24 text-right text-xs md:block">
        {item.updatedAt.toLocaleDateString("uz-UZ")}
      </TypographyMuted>

      <Button asChild size="sm" variant="outline">
        <Link href={meta.href(item.id)}>Ochish</Link>
      </Button>
    </li>
  );
}
