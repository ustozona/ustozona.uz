"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { StudentProfile, AssignmentRow } from "@/lib/student-profile";
import { TOPIC_COLOR_HEX, type TopicColor } from "@/lib/grades-data";
import { cn } from "@/lib/utils";
import { gradeBadgeClass } from "@/lib/score-colors";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent,
  ContextMenuItem, ContextMenuLabel, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { TypographyMuted } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "sonner";
import {
  FileText, Search, ArrowDownUp, X, Minus, ListFilter,
  Pencil, ClipboardCheck, Trash2,
} from "lucide-react";

type SortKey = "order" | "high" | "low" | "title";
const SORT_LABELS: Record<SortKey, string> = {
  order: "Tartib boʻyicha",
  high: "Yuqori baho",
  low: "Past baho",
  title: "Nomi (A–Z)",
};

// Sessiya ichidagi baho oʻzgarishlari: assignmentId → yangi ball (null = baho oʻchirilgan)
type Overrides = Record<string, number | null>;

function applyOverride(r: AssignmentRow, ov: Overrides): AssignmentRow {
  if (!(r.assignment.id in ov)) return r;
  const score = ov[r.assignment.id];
  if (score === null) return { ...r, score: null, pct: null, status: "ungraded" };
  const pct = Math.round((score / r.assignment.maxScore) * 100);
  return { ...r, score, pct, status: "graded" };
}

export default function AssignmentsTab({ profile }: { profile: StudentProfile }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editRow, setEditRow] = useState<AssignmentRow | null>(null);
  const [removeRow, setRemoveRow] = useState<AssignmentRow | null>(null);

  // Mavjud baholash turlari (Grade Topic) — takrorsiz
  const topics = useMemo(() => {
    const map = new Map<string, { id: string; name: string; color: TopicColor }>();
    for (const r of profile.assignments) {
      if (!map.has(r.topic.id)) map.set(r.topic.id, r.topic);
    }
    return [...map.values()];
  }, [profile.assignments]);

  const rows = useMemo(() => {
    let list = profile.assignments.map((r) => applyOverride(r, overrides));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.assignment.title.toLowerCase().includes(q));
    if (topicFilter !== "all") list = list.filter((r) => r.topic.id === topicFilter);
    if (sortKey === "high") list.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
    else if (sortKey === "low") list.sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
    else if (sortKey === "title")
      list.sort((a, b) => a.assignment.title.localeCompare(b.assignment.title, "uz"));
    return list;
  }, [profile.assignments, overrides, search, sortKey, topicFilter]);

  const saveGrade = (id: string, score: number) =>
    setOverrides((cur) => ({ ...cur, [id]: score }));
  const removeGrade = (id: string) => setOverrides((cur) => ({ ...cur, [id]: null }));

  return (
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0">
      {/* Toolbar — qotib turadi */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 p-4">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Topshiriq nomi boʻyicha qidirish…"
            className="h-9 pl-9"
          />
        </div>

        {/* Baholash turi boʻyicha filtr */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "size-9 shrink-0 shadow-none",
                topicFilter !== "all" && "border-foreground/30 bg-muted"
              )}
              aria-label="Baholash turi boʻyicha filtrlash"
            >
              <ListFilter className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <DropdownMenuLabel>Baholash turi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={topicFilter} onValueChange={setTopicFilter}>
              <DropdownMenuRadioItem value="all">Barcha turlar</DropdownMenuRadioItem>
              {topics.map((t) => (
                <DropdownMenuRadioItem key={t.id} value={t.id}>
                  <span
                    className="mr-2 size-2 rounded-full"
                    style={{ backgroundColor: topicHex(t.color) }}
                  />
                  {t.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saralash */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9 shrink-0 px-4 font-semibold shadow-none">
              <ArrowDownUp className="mr-2 size-4" />
              {SORT_LABELS[sortKey]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Saralash</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <DropdownMenuRadioItem value="order">Tartib boʻyicha</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="high">Yuqori baho</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="low">Past baho</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="title">Nomi (A–Z)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Roʻyxat — faqat shu qism scroll boʻladi */}
      {rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><FileText /></EmptyMedia>
            <EmptyTitle>Mos topshiriq topilmadi</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-2 p-3">
            {rows.map((r) => (
              <AssignmentItem
                key={r.assignment.id}
                row={r}
                selected={selectedId === r.assignment.id}
                onSelect={() =>
                  setSelectedId((cur) => (cur === r.assignment.id ? null : r.assignment.id))
                }
                onEdit={() => setEditRow(r)}
                onRemove={() => setRemoveRow(r)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Bahoni tahrirlash / qoʻyish modali */}
      <EditGradeDialog
        row={editRow}
        onOpenChange={(open) => !open && setEditRow(null)}
        onSave={(score) => {
          if (editRow) {
            saveGrade(editRow.assignment.id, score);
            toast.success("Baho saqlandi");
            setEditRow(null);
          }
        }}
      />

      {/* Bahoni oʻchirish tasdigʻi */}
      <AlertDialog open={!!removeRow} onOpenChange={(open) => !open && setRemoveRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bahoni oʻchirish</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{removeRow?.assignment.title}</span>{" "}
              uchun baho oʻchirilsinmi? Topshiriq «baholanmagan» holatiga oʻtadi. Bu
              topshiriqning oʻzini oʻchirmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={() => {
                if (removeRow) {
                  removeGrade(removeRow.assignment.id);
                  toast.success("Baho oʻchirildi");
                }
              }}
            >
              Bahoni oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function AssignmentItem({
  row,
  selected,
  onSelect,
  onEdit,
  onRemove,
}: {
  row: AssignmentRow;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { assignment, topic, score, pct, status } = row;
  const accent = topicHex(topic.color);
  const graded = status === "graded";
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          data-active={selected || undefined}
          style={
            {
              ["--card-accent"]: accent,
              ...(selected
                ? { backgroundColor: `color-mix(in oklch, ${accent} 7%, var(--card))` }
                : {}),
            } as CSSProperties
          }
          className="list-card group flex cursor-pointer items-center gap-3.5 p-3 outline-none"
        >
          <div
            className="list-card-icon flex size-11 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)` }}
          >
            <FileText className="size-5" style={{ color: accent }} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="heading-small truncate">{assignment.title}</h4>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} />
              {topic.name}
            </div>
          </div>
          {graded ? (
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {score}/{assignment.maxScore}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums",
                  gradeBadgeClass(pct as number)
                )}
              >
                {pct}%
              </span>
            </div>
          ) : status === "missing" ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <X className="size-3.5" /> Topshirilmagan
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Minus className="size-3.5" /> Baholanmagan
            </span>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuLabel className="truncate">{assignment.title}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onEdit}>
          {graded ? (
            <>
              <Pencil className="size-4 text-muted-foreground" />
              Bahoni tahrirlash
            </>
          ) : (
            <>
              <ClipboardCheck className="size-4 text-muted-foreground" />
              Baho qoʻyish
            </>
          )}
        </ContextMenuItem>
        {graded && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2 className="size-4" />
              Bahoni oʻchirish
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function EditGradeDialog({
  row,
  onOpenChange,
  onSave,
}: {
  row: AssignmentRow | null;
  onOpenChange: (open: boolean) => void;
  onSave: (score: number) => void;
}) {
  const max = row?.assignment.maxScore ?? 100;
  const [value, setValue] = useState("");

  // Modal ochilganda joriy bahoni koʻrsatish
  const open = !!row;
  const shownFor = useMemo(() => row?.assignment.id, [row]);
  // har yangi qator uchun inputni boshlangʻich qiymatga oʻrnatamiz
  const [lastId, setLastId] = useState<string | undefined>(undefined);
  if (open && shownFor !== lastId) {
    setLastId(shownFor);
    setValue(row?.score != null ? String(row.score) : "");
  }
  if (!open && lastId !== undefined) setLastId(undefined);

  const num = value === "" ? null : Math.max(0, Math.min(max, Number(value)));
  const pct = num == null ? null : Math.round((num / max) * 100);
  const valid = num != null && Number.isFinite(num);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row?.score != null ? "Bahoni tahrirlash" : "Baho qoʻyish"}</DialogTitle>
          <DialogDescription>{row?.assignment.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label htmlFor="grade-score">Ball ({max} dan)</Label>
          <Input
            id="grade-score"
            type="number"
            min={0}
            max={max}
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) onSave(num as number);
            }}
          />
          <TypographyMuted className="tabular-nums">{pct == null ? "—" : `${pct}%`}</TypographyMuted>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Bekor qilish</Button>
          </DialogClose>
          <Button disabled={!valid} onClick={() => valid && onSave(num as number)}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// topic.color → hex (grades-data TOPIC_COLOR_HEX bilan bir xil)
function topicHex(c: TopicColor) {
  return TOPIC_COLOR_HEX[c];
}
