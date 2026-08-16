"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  ListFilter,
  Plus,
  ChevronUp,
  ChevronDown,
  Send,
  FileText,
  Copy,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  ArrowRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLOR_HEX,
  classColor,
  type ClassData,
  type Grade,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { scoreBarColor } from "@/lib/score-colors";
import { useClassStore, journalScaleFor } from "@/store/useClassStore";
import { formatScore } from "@/lib/grade-scale";
import GradesSettingsModal from "./GradesSettingsModal";
import {
  calcAssignmentAverages,
  calcStudentTotals,
} from "./helpers";
import { UZ_COLLATOR, splitName, formatDueDate } from "./grades-table-helpers";
import {
  classSummativeAverage,
  gradePercent,
  studentTrend,
  studentFormativeRecent,
  classFormativeRecent,
} from "@/lib/grades-stats";
import { SectionIcon } from "@/components/ui/section-icon";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  panelCardClass,
  panelCardContentClass,
  panelCardFooterClass,
  panelCardHeaderClass,
} from "@/components/DashboardPage";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function LetterAvg({
  percent,
  classId,
  hasData = true,
}: {
  percent: number;
  /** Sinfning yagona jurnal shkalasi (`journalScaleFor`) — barcha oʻrtachalar shunda. */
  classId?: string;
  /** Hali baho yoʻq boʻlsa (count=0) — 0% real natija emas, shkala labelini koʻrsatmaymiz. */
  hasData?: boolean;
}) {
  const journalScale = useClassStore((s) => (classId ? journalScaleFor(s, classId) : s.journalScale));
  if (!hasData) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span className="text-base font-semibold text-muted-foreground/40">—</span>
      </div>
    );
  }
  // Holat / umumiy / ustun-oʻrtacha — YAGONA jurnal shkalasi: "4 (78%)".
  const f = formatScore(percent, journalScale);
  const primary = f.label;
  const secondary = journalScale.showPercent ? f.percent : undefined;
  const color = scoreBarColor(percent);
  // Uzun yorliq (masalan soʻz uslubi) — kichikroq shrift bilan.
  const isLong = primary.length > 3;
  const primarySize = isLong ? "text-xs leading-tight" : "text-base";
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-0.5 p-1"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}
    >
      <span className={cn("font-bold text-center", primarySize)} style={{ color }}>
        {primary}
      </span>
      {secondary && (
        <TypographyMuted className="text-xs">{secondary}</TypographyMuted>
      )}
    </div>
  );
}

import AssignmentTooltip from "./AssignmentTooltip";
import AssignmentColumnMenu from "./AssignmentColumnMenu";

/**
 * Oʻquvchi nomi katagidagi hover-preview — shaxsga yoʻnaltirilgan (Holat hover'idan farqli).
 * Kim ekanini koʻrsatadi + profilga oʻtish tugmasi. Klik = navigatsiya (trigger Link).
 */
function StudentNamePreview({
  student,
  classLabel,
  classHex,
  level,
  trend,
}: {
  student: { id: string; name: string; initials: string };
  classLabel: string;
  classHex: string;
  level: number;
  trend: number | null;
}) {
  const t = useTranslations("GradesTable");
  const journalScale = useClassStore((s) => s.journalScale);
  const levelDisplay = formatScore(level, journalScale).display;
  const up = trend !== null && trend > 3;
  const down = trend !== null && trend < -3;
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;
  const trendColor = up ? "var(--success)" : down ? "var(--destructive)" : "var(--muted-foreground)";
  const trendDisplay =
    trend === null ? "—" : up || down ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%` : t("stable");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarFallback
            className="font-semibold text-white text-sm"
            style={{ backgroundColor: classHex }}
          >
            {student.initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{student.name}</p>
          <Badge variant="secondary" className="mt-1 text-[10px]">
            {classLabel}
          </Badge>
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("masteryLabel")}</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{levelDisplay}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("dynamicsLabel")}</p>
          <p
            className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: trendColor }}
          >
            <TrendIcon className="size-3.5" />
            {trendDisplay}
          </p>
        </div>
      </div>
      <Button asChild size="sm" className="w-full font-semibold">
        <Link href={`/dashboard/students/${encodeURIComponent(student.id)}`}>
          {t("openProfile")}
          <ArrowRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

type Props = {
  classData: ClassData;
  onCellEdit: (studentId: string, assignmentId: string, score: number | null) => void;
  onReturnAll: () => void;
  onCreateAssignmentClick: () => void;
  onReuseClick: () => void;
  onTopicClick: () => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onPublishAssignment: (assignmentId: string) => void;
  onFillColumn: (assignmentId: string, score: number) => void;
  onMarkRemaining: (assignmentId: string) => void;
  onEditAssignment: (assignmentId: string) => void;
  onCellMark: (studentId: string, assignmentId: string, mark: "absent" | "unsubmitted" | null) => void;
  onPasteColumn: (startStudentId: string, assignmentId: string, orderedStudentIds: string[], values: number[]) => void;
  /** Arxiv yilni koʻrayotganda (bugun faol yildan tashqarida) toʻldiriladi:
      yangi topshiriq yaratish yumshoq bloklanadi (default sana bugun boʻlgani
      uchun koʻrilayotgan yil oynasiga tushmaydi). null = joriy yil, blok yoʻq. */
  archiveNotice?: string | null;
};

/**
 * Saralash maydoni. Ism/familiya — matn boʻyicha; qolgani RAQAM boʻyicha
 * (`a:<assignmentId>` — bitta topshiriq ustuni). Bahosi yoʻq oʻquvchi
 * yoʻnalishdan qatʼi nazar HAR DOIM oxirida turadi — aks holda "eng past
 * natijalar" roʻyxati boʻsh kataklar bilan boshlanib, maʼnosini yoʻqotadi.
 */
type SortField = "firstName" | "lastName" | "formative" | "summative" | `a:${string}`;
type SortDir = "asc" | "desc";
type Move = "down" | "up" | "left" | "right" | null;

export default function GradesTable({
  classData,
  onCellEdit,
  onReturnAll,
  onCreateAssignmentClick,
  onReuseClick,
  onTopicClick,
  onDeleteAssignment,
  onPublishAssignment,
  onFillColumn,
  onMarkRemaining,
  onEditAssignment,
  onCellMark,
  onPasteColumn,
  archiveNotice,
}: Props) {
  const t = useTranslations("GradesTable");
  const { students, assignments, grades, topics } = classData;
  const classHex = CLASS_COLOR_HEX[classColor(classData.info)];
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ s: string; a: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>("firstName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState<"all" | "formative" | "summative">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const topicMap = useMemo(() => {
    const m = new Map<string, (typeof topics)[number]>();
    topics.forEach((topic) => m.set(topic.id, topic));
    return m;
  }, [topics]);

  const gradeMap = useMemo(() => {
    const m = new Map<string, Grade>();
    grades.forEach((g) => m.set(`${g.studentId}:${g.assignmentId}`, g));
    return m;
  }, [grades]);

  const rawTotals = useMemo(
    () => calcStudentTotals(students, grades, assignments, topics),
    [students, grades, assignments, topics]
  );

  const totalsById = useMemo(
    () => new Map(rawTotals.map((t) => [t.student.id, t])),
    [rawTotals]
  );

  // Ustunlar: maqsad bo‘yicha filtr + Topic bo‘yicha guruhlash (ichida sana).
  const orderedAssignments = useMemo(() => {
    const topicIdx = new Map(topics.map((t, i) => [t.id, i]));
    return assignments
      .filter((a) =>
        colFilter === "all"
          ? true
          : (topicMap.get(a.topicId ?? "")?.purpose ?? "summative") === colFilter
      )
      .slice()
      .sort((a, b) => {
        const ti = (topicIdx.get(a.topicId ?? "") ?? 99) - (topicIdx.get(b.topicId ?? "") ?? 99);
        if (ti !== 0) return ti;
        return (a.date ?? a.id).localeCompare(b.date ?? b.id);
      });
  }, [assignments, topics, topicMap, colFilter]);

  const assignmentAverages = useMemo(
    () => calcAssignmentAverages(orderedAssignments, grades),
    [orderedAssignments, grades]
  );
  const classAverage = useMemo(
    () => classSummativeAverage(students, assignments, grades, topics),
    [students, assignments, grades, topics]
  );
  // Formativ ustuni — har oʻquvchining oxirgi 3 formativ ishi mediani.
  const formativeById = useMemo(() => {
    const m = new Map<string, number | null>();
    students.forEach((s) =>
      m.set(s.id, studentFormativeRecent(s.id, assignments, grades, topics))
    );
    return m;
  }, [students, assignments, grades, topics]);
  const classFormative = useMemo(
    () => classFormativeRecent(students, assignments, grades, topics),
    [students, assignments, grades, topics]
  );
  /** Ustun boʻyicha saralash: yangi ustun → oʻsish; oʻsha ustun → yoʻnalish teskari. */
  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return;
      }
      setSortField(field);
      setSortDir("asc");
    },
    [sortField]
  );

  /** Raqamli saralash kaliti (null = baho yoʻq → doim oxirida). */
  const sortValue = useCallback(
    (studentId: string): number | null => {
      if (sortField === "formative") return formativeById.get(studentId) ?? null;
      if (sortField === "summative") {
        const tot = totalsById.get(studentId);
        return tot && tot.summary.summativeCount > 0 ? tot.percent : null;
      }
      if (sortField.startsWith("a:")) {
        const aid = sortField.slice(2);
        const a = assignments.find((x) => x.id === aid);
        return a ? gradePercent(gradeMap.get(`${studentId}:${aid}`), a) : null;
      }
      return null;
    },
    [sortField, formativeById, totalsById, assignments, gradeMap]
  );

  const sortedStudents = useMemo(() => {
    const byName = sortField === "firstName" || sortField === "lastName";
    return [...students].sort((a, b) => {
      if (byName) {
        const na = splitName(a.name);
        const nb = splitName(b.name);
        const ka = sortField === "lastName" ? na.last || na.first : na.first;
        const kb = sortField === "lastName" ? nb.last || nb.first : nb.first;
        const cmp = UZ_COLLATOR.compare(ka, kb);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const va = sortValue(a.id);
      const vb = sortValue(b.id);
      // Baho yoʻq — yoʻnalishdan qatʼi nazar oxirida.
      if (va === null && vb === null) return UZ_COLLATOR.compare(a.name, b.name);
      if (va === null) return 1;
      if (vb === null) return -1;
      const cmp = va - vb;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, sortField, sortDir, sortValue]);

  // Qidiruv bo‘yicha filtrlangan qatorlar.
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedStudents;
    return sortedStudents.filter((s) => s.name.toLowerCase().includes(q));
  }, [sortedStudents, search]);

  const draftCount = grades.filter((g) => g.isDraft).length;
  const draftAssignmentCount = useMemo(
    () => new Set(grades.filter((g) => g.isDraft).map((g) => g.assignmentId)).size,
    [grades]
  );

  // Baho kiritgandan keyin keyingi katakka o‘tish (klaviatura navigatsiyasi).
  function moveEditing(curS: string, curA: string, move: Move) {
    if (!move) {
      setEditingCell(null);
      return;
    }
    const sIdx = filteredStudents.findIndex((x) => x.id === curS);
    const aIdx = orderedAssignments.findIndex((x) => x.id === curA);
    if (sIdx === -1 || aIdx === -1) {
      setEditingCell(null);
      return;
    }
    let ns = sIdx,
      na = aIdx;
    if (move === "down") ns = Math.min(sIdx + 1, filteredStudents.length - 1);
    if (move === "up") ns = Math.max(sIdx - 1, 0);
    if (move === "right") na = Math.min(aIdx + 1, orderedAssignments.length - 1);
    if (move === "left") na = Math.max(aIdx - 1, 0);
    setEditingCell({ s: filteredStudents[ns].id, a: orderedAssignments[na].id });
  }

  function handleCreate(type: "assignment" | "reuse" | "topic") {
    setCreateOpen(false);
    // Arxiv yilda yangi topshiriq yaratish yumshoq bloklangan (menyu bandi ham
    // disabled) — sana default bugun boʻlib, koʻrilayotgan yilga tushmaydi.
    if (type === "assignment") {
      if (archiveNotice) return;
      onCreateAssignmentClick();
    } else if (type === "reuse") onReuseClick();
    else onTopicClick();
  }

  return (
    <Card className={cn("min-w-0", panelCardClass)}>
      {/* Sarlavha qatori */}
      <CardHeader className={cn(panelCardHeaderClass, "justify-between pt-4! pb-4!")}>
        <div className="flex items-center gap-3 shrink-0">
          <SectionIcon>
            <ClipboardList />
          </SectionIcon>
          <CardTitle>{t("assignments")}</CardTitle>
          <TypographyMuted className="shrink-0 text-sm">
            ({assignments.length})
          </TypographyMuted>
          {draftCount > 0 && (
            <Badge className="ml-1 border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400" aria-hidden="true" />
              {t("draftCount", { count: draftCount })}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {searchOpen && (
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearch("");
                  setSearchOpen(false);
                }
              }}
              placeholder={t("searchStudentPlaceholder")}
              className="h-9 w-44 text-sm"
            />
          )}
          <IconButton
            aria-label={t("search")}
            className="size-9"
            active={searchOpen}
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen) setSearch("");
            }}
          >
            <Search className="size-4 text-muted-foreground" />
          </IconButton>
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <IconButton aria-label={t("filter")} className="size-9" active={colFilter !== "all"}>
                <ListFilter className="size-4 text-muted-foreground" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
              {([
                ["all", t("filterAll")],
                ["summative", t("filterSummativeOnly")],
                ["formative", t("filterFormativeOnly")],
              ] as const).map(([val, label]) => (
                <DropdownMenuItem
                  key={val}
                  className="cursor-pointer justify-between rounded-md px-3 py-2 text-sm"
                  onClick={() => setColFilter(val)}
                >
                  <span className={cn(colFilter === val && "font-semibold")}>{label}</span>
                  {colFilter === val && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu open={createOpen} onOpenChange={setCreateOpen}>
              <DropdownMenuTrigger asChild>
                <Button className="ml-1 gap-2 font-semibold">
                  <Plus className="size-4" />
                  {t("create")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={archiveNotice ? "w-60" : "w-44"}>
                <DropdownMenuItem
                  onClick={() => handleCreate("assignment")}
                  disabled={!!archiveNotice}
                >
                  <FileText />
                  {t("assignment")}
                </DropdownMenuItem>
                {archiveNotice && (
                  <div className="px-2 pb-1.5 pt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {archiveNotice}
                  </div>
                )}
                <DropdownMenuItem onClick={() => handleCreate("reuse")}>
                  <Copy />
                  {t("reuse")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleCreate("topic")}>
                  <Tag />
                  {t("category")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          <GradesSettingsModal />
        </div>
      </CardHeader>

      {/* Jadval */}
      <CardContent className={cn(panelCardContentClass, "overflow-auto scrollbar-thin [&_div[data-slot=table-container]]:overflow-visible [&_div[data-slot=table-container]]:h-full")}>
        {students.length === 0 ? (
          <GradesEmptyState />
        ) : (
        <Table
          className="w-full"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          <TableHeader className="sticky top-0 z-30 bg-card" data-tour="grades-topics">
            <TableRow>
              <TableHead
                className="sticky left-0 z-40 border-r border-b border-border min-w-[260px] w-[260px] h-[176px]"
                style={{ backgroundColor: EMPTY_BG }}
              />
              <ColHeader
                label={t("formativeColumn")}
                stick="left"
                bg="var(--card)"
                active={sortField === "formative"}
                dir={sortDir}
                onSort={() => toggleSort("formative")}
              />
              {orderedAssignments.map((a) => {
                const topic = topicMap.get(a.topicId ?? "");
                const hex = topic ? TOPIC_COLOR_HEX[topic.color] : null;
                const draftCount = grades.filter((g) => g.assignmentId === a.id && g.isDraft).length;
                const ungradedCount = students.filter((s) => {
                  const gg = gradeMap.get(`${s.id}:${a.id}`);
                  return !gg || (gg.score === null && !gg.missing);
                }).length;
                return (
                  <TableHead
                    key={a.id}
                    className="border-b border-r border-border p-0 w-16 min-w-16 h-44 text-center align-bottom relative"
                    style={
                      hex
                        ? { backgroundColor: `color-mix(in srgb, ${hex} 8%, var(--card))` }
                        : undefined
                    }
                  >
                    <AssignmentColumnMenu
                      maxScore={a.maxScore}
                      draftCount={draftCount}
                      ungradedCount={ungradedCount}
                      onFillColumn={(score) => onFillColumn(a.id, score)}
                      onMarkRemaining={() => onMarkRemaining(a.id)}
                      onPublish={() => onPublishAssignment(a.id)}
                    >
                    <HoverCard openDelay={150} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-full w-full flex flex-col items-center justify-end p-2 pb-0 cursor-pointer relative outline-none rounded-none hover:bg-transparent hover:bg-muted/20"
                        >
                          <div
                            title={a.title}
                            className="font-semibold text-[11px] whitespace-nowrap flex-1 flex items-start justify-center text-foreground max-h-[150px] overflow-hidden text-ellipsis"
                            style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                            }}
                          >
                            {a.title}
                          </div>
                          <div className="flex items-center justify-center py-1 mb-1">
                            <SortChevrons
                              active={sortField === `a:${a.id}`}
                              dir={sortDir}
                              onClick={() => toggleSort(`a:${a.id}`)}
                              label={t("sortByColumn", { label: a.title })}
                            />
                          </div>
                          {hex && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-1 rounded-t"
                              style={{ backgroundColor: hex }}
                            />
                          )}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64 p-0" align="start">
                        <AssignmentTooltip
                          assignment={a}
                          topic={topic}
                          dueDate={formatDueDate(a)}
                          onEdit={() => onEditAssignment(a.id)}
                          onDelete={() => {
                            onDeleteAssignment(a.id);
                          }}
                        />
                      </HoverCardContent>
                    </HoverCard>
                    </AssignmentColumnMenu>
                  </TableHead>
                );
              })}
              <TableHead className="sticky top-0 z-20 bg-card border-b border-l border-r border-border w-16 min-w-16 p-0 align-bottom h-[176px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={archiveNotice ? undefined : onCreateAssignmentClick}
                      aria-disabled={archiveNotice ? true : undefined}
                      aria-label={t("addAssignment")}
                      className={cn(
                        "w-full h-full flex items-center justify-center transition-colors rounded-none min-h-0",
                        archiveNotice
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-muted/40 cursor-pointer"
                      )}
                    >
                      <Plus className="size-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{archiveNotice ?? t("addAssignment")}</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead
                className="sticky top-0 z-20 border-b border-border"
                style={{ backgroundColor: EMPTY_BG }}
              />
              {/* Summativ (yakuniy natija) — oʻng chekkada qotirilgan. */}
              <ColHeader
                label={t("statusColumn")}
                stick="right"
                active={sortField === "summative"}
                dir={sortDir}
                onSort={() => toggleSort("summative")}
              />
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Oʻrtachalar qatori — sticky tagida thead */}
            <TableRow className="sticky z-20 bg-card" style={{ top: "176px" }}>
              <TableCell className="sticky left-0 z-30 bg-card border-r border-b-2 border-border p-4 w-[260px] min-w-[260px] max-w-[260px] h-16">
                <div className="relative">
                  <div className="flex items-center justify-center gap-2 w-full">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort(sortField === "firstName" ? "lastName" : "firstName")}
                          className="text-xs font-bold uppercase tracking-wider text-foreground hover:text-foreground/70 transition-colors h-auto min-h-0 p-0 hover:bg-transparent"
                        >
                          {t("student")}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{sortField === "firstName" ? t("sortByLastName") : t("sortByFirstName")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SortChevrons
                            active={sortField === "firstName" || sortField === "lastName"}
                            dir={sortDir}
                            onClick={() =>
                              toggleSort(sortField === "lastName" ? "lastName" : "firstName")
                            }
                            label={sortDir === "asc" ? t("sortDescending") : t("sortAscending")}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{sortDir === "asc" ? t("sortDescending") : t("sortAscending")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TableCell>
              <TableCell className="sticky left-[260px] z-30 bg-card border-b-2 border-r border-border p-0 w-16 min-w-16 max-w-16 h-16">
                <FormativeCell percent={classFormative} />
              </TableCell>
              {assignmentAverages.map((aa) => (
                // Ustun oʻrtachasi — toifa shkalasida EMAS, sinfning yagona
                // jurnal shkalasida (topshiriq "Bajardi/Bajarmadi" boʻlsa ham
                // oʻrtacha baho shkala boʻyicha oʻqiladi).
                <TableCell
                  key={aa.assignment.id}
                  className="bg-card border-b-2 border-r border-border p-0 w-16 min-w-16 h-16 text-center"
                >
                  <LetterAvg
                    percent={aa.percent}
                    classId={classData.info.id}
                    hasData={aa.count > 0}
                  />
                </TableCell>
              ))}
              <TableCell className="bg-card border-b-2 border-r border-border w-16 min-w-16" />
              <TableCell className="border-b-2 border-border" style={{ backgroundColor: EMPTY_BG }} />
              <TableCell
                className="sticky right-0 z-30 border-b-2 border-l border-border p-0 w-16 min-w-16 max-w-16 h-16"
                style={{ backgroundColor: HOLAT_BG }}
              >
                <LetterAvg
                  percent={classAverage}
                  classId={classData.info.id}
                  hasData={rawTotals.some((t) => t.summary.summativeCount > 0)}
                />
              </TableCell>
            </TableRow>

            {filteredStudents.map((s) => {
              const total = totalsById.get(s.id)!;
              const trend = studentTrend(s.id, assignments, grades);
              return (
                <TableRow key={s.id} className="group hover:bg-muted/30 transition-colors h-16">
                  <TableCell className="sticky left-0 z-10 bg-card group-hover:bg-muted border-r border-b border-border p-0 w-[260px] min-w-[260px] max-w-[260px]">
                    <HoverCard openDelay={250} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <Link
                          href={`/dashboard/students/${encodeURIComponent(s.id)}`}
                          className="group/name flex h-full w-full items-center gap-3 px-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        >
                          <Avatar className="size-7">
                            <AvatarFallback
                              className="font-semibold text-white text-xs"
                              style={{ backgroundColor: classHex }}
                            >
                              {s.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold decoration-muted-foreground/40 underline-offset-4 group-hover/name:underline">
                            {s.name}
                          </span>
                          <ChevronRight className="size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover/name:translate-x-0 group-hover/name:opacity-100" />
                        </Link>
                      </HoverCardTrigger>
                      <HoverCardContent align="start" side="right" className="w-72">
                        <StudentNamePreview
                          student={s}
                          classLabel={classData.info.name}
                          classHex={classHex}
                          level={total.percent}
                          trend={trend}
                        />
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>

                  <TableCell className="sticky left-[260px] z-10 bg-card group-hover:bg-muted border-b border-r border-border p-0 w-16 min-w-16 max-w-16 h-16">
                    <FormativeCell percent={formativeById.get(s.id) ?? null} />
                  </TableCell>

                  {orderedAssignments.map((a) => {
                    const g = gradeMap.get(`${s.id}:${a.id}`);
                    const isEditing = editingCell?.s === s.id && editingCell?.a === a.id;
                    const hasScore = g?.score !== null && g?.score !== undefined;

                    return (
                      <TableCell
                        key={a.id}
                        onClick={() => setEditingCell({ s: s.id, a: a.id })}
                        className="border-b border-r border-border p-0 w-16 min-w-16 h-16 text-center cursor-pointer group/cell hover:ring-1 hover:ring-inset hover:ring-foreground/30 hover:bg-muted/40 transition-colors"
                      >
                        {isEditing ? (
                          <CellEditor
                            initial={hasScore ? g!.score! : null}
                            maxScore={a.maxScore}
                            onCommit={(val, move) => {
                              onCellEdit(s.id, a.id, val);
                              moveEditing(s.id, a.id, move);
                            }}
                            onMark={(mark, move) => {
                              onCellMark(s.id, a.id, mark);
                              moveEditing(s.id, a.id, move);
                            }}
                            onPaste={(values) =>
                              onPasteColumn(s.id, a.id, filteredStudents.map((x) => x.id), values)
                            }
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : (
                          <GradeCell
                            grade={g}
                            maxScore={a.maxScore}
                          />
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell className="border-b border-r border-border bg-card group-hover:bg-muted w-16 min-w-16" />
                  <TableCell className="border-b border-border" style={{ backgroundColor: EMPTY_BG }} />
                  <TableCell
                    className="sticky right-0 z-10 border-b border-l border-border p-0 w-16 min-w-16 max-w-16 h-16"
                    style={{ backgroundColor: HOLAT_BG }}
                  >
                    <LetterAvg
                      percent={total.percent}
                      classId={classData.info.id}
                      hasData={total.summary.summativeCount > 0}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </CardContent>

      {draftCount > 0 && (
        <CardFooter className={cn(panelCardFooterClass, "flex items-center justify-between")}>
          <div>
            <TypographySmall className="text-foreground">
              {t("draftNotReturned", { count: draftCount })}
            </TypographySmall>
            <TypographyMuted className="mt-0.5 text-xs">
              {t("draftHiddenNote")}
            </TypographyMuted>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="gap-2 font-semibold">
                <Send className="size-4" />
                {t("returnAll")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("publishGradesTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("publishGradesDescription", { assignmentCount: draftAssignmentCount, gradeCount: draftCount })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={onReturnAll}>{t("publish")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

function GradesEmptyState() {
  const t = useTranslations("GradesTable");
  return (
    <Empty className="min-h-[50vh]">
      <EmptyHeader>
        <EmptyMedia><Illustration name="15" className="h-32 text-black dark:text-white" /></EmptyMedia>
        <EmptyTitle>{t("noStudentsTitle")}</EmptyTitle>
        <EmptyDescription>{t("noStudentsDescription")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// Holat ustuni — oq rangga yaqin kulrang fon (yengil ajratish uchun).
const HOLAT_BG = "color-mix(in srgb, var(--muted) 35%, var(--card))";
// Boʻsh struktura kataklari (chap-yuqori burchak + oʻngdagi boʻsh maydon) — sal koʻproq kulrang.
const EMPTY_BG = "color-mix(in srgb, var(--muted) 60%, var(--card))";

/**
 * Formativ ustuni katagi — oxirgi 3 formativ ishning MEDIANI (foiz).
 * Ataylab jurnal shkalasiga oʻgirilmaydi: bu rasmiy baho emas, "hozir qayerda"
 * signali. Foiz koʻrinishi uni "Summativ" ustunidan darrov ajratib turadi.
 */
function FormativeCell({ percent }: { percent: number | null }) {
  const t = useTranslations("GradesTable");
  if (percent === null) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span className="text-base font-semibold text-muted-foreground/40">—</span>
      </div>
    );
  }
  const color = scoreBarColor(percent);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="h-full w-full flex items-center justify-center cursor-default"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)` }}
        >
          <span className="font-bold text-base font-mono" style={{ color }}>
            {Math.round(percent)}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[220px] text-xs leading-snug">
        {t("formativeColumnHint")}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Ustun sarlavhasidagi saralash chevronlari — faol yoʻnalish toʻq rangda.
 * Bosilganda: boshqa ustun edi → shu ustun boʻyicha oʻsish; shu ustun edi →
 * yoʻnalish teskarisiga.
 */
function SortChevrons({
  active,
  dir,
  onClick,
  label,
}: {
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  label: string;
}) {
  // ⚠️ `<button>` EMAS: topshiriq sarlavhasida bu element hover-kartani ochuvchi
  // tugma ICHIDA turadi — ichma-ich tugma yaroqsiz HTML va hidratsiya xatosi.
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="flex cursor-pointer flex-col -space-y-1 rounded transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ChevronUp
        className={cn("size-3", active && dir === "asc" ? "text-foreground" : "text-muted-foreground/30")}
      />
      <ChevronDown
        className={cn("size-3", active && dir === "desc" ? "text-foreground" : "text-muted-foreground/30")}
      />
    </span>
  );
}

function ColHeader({
  label,
  stick,
  bg = HOLAT_BG,
  active,
  dir,
  onSort,
}: {
  label: string;
  /** Qaysi chekkaga qotiriladi: chapda ism ustunidan keyin yoki oʻng chekkada. */
  stick?: "left" | "right";
  bg?: string;
  active: boolean;
  dir: SortDir;
  onSort: () => void;
}) {
  const t = useTranslations("GradesTable");
  return (
    <TableHead
      className={cn(
        "sticky top-0 bg-card border-b border-border w-[68px] min-w-[68px] px-1 align-bottom h-[176px]",
        stick === "left" && "left-[260px] z-40 border-r",
        stick === "right" && "right-0 z-40 border-l",
        !stick && "z-20"
      )}
      style={{ backgroundColor: bg }}
    >
      <div className="flex flex-col items-center justify-end h-full pb-2">
        <div
          className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="mt-2">
              <SortChevrons
                active={active}
                dir={dir}
                onClick={onSort}
                label={t("sortByColumn", { label })}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{t("sortByColumn", { label })}</TooltipContent>
        </Tooltip>
      </div>
    </TableHead>
  );
}



function GradeCell({
  grade,
  maxScore,
}: {
  grade: Grade | undefined;
  maxScore: number;
}) {
  const t = useTranslations("GradesTable");
  if (!grade || grade.score === null) {
    const missing = grade?.missing ?? (grade?.isMissing ? "absent" : undefined);
    if (missing) {
      // Q = Qatnashmadi (absent), T = Topshirmadi (unsubmitted).
      // Ikkalasi ham o‘rtachadan chiqarilgan — neytral rangda.
      const letter = missing === "absent" ? t("absentLetter") : t("unsubmittedLetter");
      const label = missing === "absent" ? t("absent") : t("unsubmitted");
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center py-3 px-2"
          title={label}
        >
          <span className="text-base font-bold text-muted-foreground">{letter}</span>
        </div>
      );
    }
    return <div className="w-full h-full min-h-[52px]" />;
  }
  const percent = maxScore > 0 ? (grade.score / maxScore) * 100 : 0;
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center py-3 px-2 group-hover/cell:ring-1 group-hover/cell:ring-inset group-hover/cell:ring-foreground/30 transition-shadow"
      style={{ backgroundColor: `color-mix(in srgb, ${scoreBarColor(percent)} 8%, transparent)` }}
    >
      {grade.isDraft && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-muted-foreground" />
      )}
      <span className="text-base font-bold tabular-nums leading-none text-foreground">
        {grade.score}
      </span>
      <span className="absolute bottom-1 right-1.5 text-[10px] text-muted-foreground tabular-nums leading-none">
        /{maxScore}
      </span>
    </div>
  );
}

function CellEditor({
  initial,
  maxScore,
  onCommit,
  onMark,
  onPaste,
  onCancel,
}: {
  initial: number | null;
  maxScore: number;
  onCommit: (val: number | null, move: Move) => void;
  onMark: (mark: "absent" | "unsubmitted", move: Move) => void;
  onPaste: (values: number[]) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial?.toString() ?? "");
  const ref = useRef<HTMLInputElement>(null);
  // Enter/Tab katakni siljitganda onBlur takror commit qilmasligi uchun.
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function commit(move: Move) {
    if (done.current) return;
    const trimmed = val.trim().toLowerCase();
    // q = qatnashmadi, t = topshirmadi (bilim emas — dalil yo‘qligi).
    if (trimmed === "q") {
      done.current = true;
      onMark("absent", move);
      return;
    }
    if (trimmed === "t") {
      done.current = true;
      onMark("unsubmitted", move);
      return;
    }
    done.current = true;
    if (trimmed === "") {
      onCommit(null, move);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n)) {
      onCancel();
      return;
    }
    onCommit(Math.max(0, Math.min(maxScore, n)), move);
  }

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
      <Input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => commit(null)}
        onClick={(e) => e.stopPropagation()}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (/[\n\t]/.test(text.trim())) {
            e.preventDefault();
            const values = text
              .split(/[\n\t]+/)
              .map((x) => Number(x.trim()))
              .filter((x) => !Number.isNaN(x))
              .map((x) => Math.max(0, Math.min(maxScore, x)));
            done.current = true;
            onPaste(values);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit("down");
          } else if (e.key === "Tab") {
            e.preventDefault();
            commit(e.shiftKey ? "left" : "right");
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="w-12 h-6 px-1 text-center text-base font-semibold text-foreground tabular-nums bg-card border-foreground/40 rounded-md outline-none"
      />
      <span className="text-xs text-muted-foreground tabular-nums">
        /{maxScore}
      </span>
    </div>
  );
}

