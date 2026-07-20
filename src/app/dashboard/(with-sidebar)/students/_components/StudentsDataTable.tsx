"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { scoreBarColor } from "@/lib/score-colors";
import { badgeBase, STATUS_META, type Status, type StudentRow } from "../page";
import {
  TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AttendanceRing } from "@/app/dashboard/(with-sidebar)/statistics/_components/AttendanceRing";
import { ArrowDown, ArrowUpDown, MoreHorizontal, Pen, Trash2 } from "lucide-react";

type SortKey = "name" | "grade" | "attendance";

interface StudentsDataTableProps {
  students: StudentRow[];
  selectedStudentId: string | null;
  onSelect: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  onToggleStatus: (id: string, current: Status) => void;
  onEdit: (student: StudentRow) => void;
  onDelete: (student: StudentRow) => void;
  hex: string;
}

/**
 * Sinflar sahifasidagi jadval bilan bir xil naqsh: checkbox doim koʻrinadi,
 * qatorga hover qilinganda oʻng chetda 3-nuqta menyu (Tahrirlash/Oʻchirish)
 * chiqadi, ustun sarlavhalari (Ism/Davomat/Baho) bosiladigan — Statistika
 * jadvali bilan bir xil naqsh, alohida "Saralash" tugmasi shart emas.
 * Holat pill bosilsa faol/taʼtilda almashadi (karta koʻrinishi bilan parity).
 */
export default function StudentsDataTable({
  students, selectedStudentId, onSelect,
  selectedIds, onToggleSelect, onToggleSelectAll,
  sortKey, onSortChange, onToggleStatus, onEdit, onDelete, hex,
}: StudentsDataTableProps) {
  const t = useTranslations("StudentsPage");
  const allSelected = students.length > 0 && selectedIds.size === students.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Sarlavha qatorini scroll konteynerga nisbatan qotiradi (Sinflar jadvali
  // bilan bir xil naqsh) — pastga siljitilganda ostidagi qator koʻrinmasin
  // deb har bir katakka alohida sticky+bg beriladi (faqat qatorga emas).
  const [scrolled, setScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    onScroll();
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  const stickyHead = cn(
    "sticky top-0 z-20 bg-card after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-linear-to-b after:from-black/4 after:to-transparent after:transition-opacity",
    scrolled ? "after:opacity-100" : "after:opacity-0"
  );

  const SortHead = ({
    label, colKey, className, center,
  }: { label: string; colKey: SortKey; className?: string; center?: boolean }) => (
    <TableHead className={cn(stickyHead, className)}>
      <button
        type="button"
        onClick={() => onSortChange(colKey)}
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors",
          center && "w-full justify-center"
        )}
      >
        {label}
        {sortKey === colKey ? <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3 opacity-40" />}
      </button>
    </TableHead>
  );

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-auto">
      <table className="w-full min-w-2xl caption-bottom text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent! border-b-0!">
            <TableHead className={cn(stickyHead, "w-11 px-4 py-3")}>
              <Checkbox
                checked={someSelected ? "indeterminate" : allSelected}
                onCheckedChange={onToggleSelectAll}
                aria-label={t("selectAllAria")}
                className="cursor-pointer"
              />
            </TableHead>
            <SortHead label={t("tableColName")} colKey="name" className="min-w-48 py-3 pr-3 pl-0" />
            <SortHead label={t("tableColAttendance")} colKey="attendance" className="w-20 px-3 py-3" center />
            <SortHead label={t("tableColGrade")} colKey="grade" className="w-40 px-3 py-3" />
            <TableHead className={cn(stickyHead, "w-36 px-3 py-3")}>{t("tableColStatus")}</TableHead>
            <TableHead className={cn(stickyHead, "w-10 px-4 py-3")} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const pill = STATUS_META[s.status];
            const scoreColor = scoreBarColor(s.grade);
            const isRowSelected = s.id === selectedStudentId;
            return (
              <TableRow
                key={s.id}
                className={cn(
                  "group cursor-pointer",
                  isRowSelected && "bg-primary/5",
                  selectedIds.has(s.id) && "bg-muted/40"
                )}
                onClick={() => onSelect(s.id)}
              >
                <TableCell className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => onToggleSelect(s.id)}
                    className="cursor-pointer"
                  />
                </TableCell>

                <TableCell className="whitespace-nowrap py-3.5 pr-3 pl-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: s.avatarColor ?? hex }}
                    >
                      {s.avatarImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.avatarImage} alt="" className="size-full object-cover" />
                      ) : (
                        s.initials
                      )}
                    </div>
                    <span className="truncate text-sm font-semibold text-foreground">{s.name}</span>
                  </div>
                </TableCell>

                <TableCell className="px-3 py-3.5">
                  <div className="flex justify-center">
                    <AttendanceRing pct={s.attendance} />
                  </div>
                </TableCell>

                <TableCell className="whitespace-nowrap px-3 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Progress
                      value={s.grade}
                      indicatorColor={scoreColor}
                      className="h-1.5 w-full max-w-24"
                      style={{ backgroundColor: `color-mix(in srgb, ${scoreColor} 16%, transparent)` }}
                    />
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{s.grade}%</span>
                  </div>
                </TableCell>

                <TableCell className="whitespace-nowrap px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(s.id, s.status)}
                    title={s.status === "active" ? t("markAway") : t("markActive")}
                    className={cn(badgeBase, "cursor-pointer transition-all hover:opacity-80 active:scale-95", pill.cls)}
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", pill.dot)} />
                    {t(`status.${s.status}`)}
                  </button>
                </TableCell>

                <TableCell className="px-4 py-3.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-black/5 hover:text-foreground group-hover:opacity-100 dark:hover:bg-white/10"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={(e) => { e.stopPropagation(); onEdit(s); }}>
                        <Pen className="size-4 text-muted-foreground" />
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onDelete(s); }}
                      >
                        <Trash2 className="size-4" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </table>
    </div>
  );
}
