"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
  Lightbulb,
  Info,
  Keyboard,
  Check,
  X,
  UserX,
  FileX,
  Eraser,
  ChevronRight,
  ArrowRight,
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLOR_HEX,
  classColor,
  type ClassData,
  type Grade,
} from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { scoreBarColor } from "@/lib/score-colors";
import { useClassStore } from "@/store/useClassStore";
import { formatByScaleKind, formatScore } from "@/lib/grade-scale";
import GradesSettingsModal from "./GradesSettingsModal";
import {
  calcAssignmentAverages,
  calcStudentTotals,
} from "./helpers";
import { UZ_COLLATOR, splitName, formatDueDate, pedagogikSignal } from "./grades-table-helpers";
import { classSummativeAverage, studentTrend, gradePercent, studentContributions } from "@/lib/grades-stats";
import { aggregateTrend, type DatedScore } from "@/lib/student-profile";
import { TrendChart } from "@/app/dashboard/(with-sidebar)/students/[id]/_components/charts";
import { SectionIcon } from "@/components/ui/section-icon";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  binary,
}: {
  percent: number;
  /** Ikkilik (Bajardi/Bajarmadi) toifa — berilsa yorliq bilan koʻrsatiladi (shkala emas). */
  binary?: { passLabel?: string; failLabel?: string };
}) {
  const journalScale = useClassStore((s) => s.journalScale);
  let primary: string;
  let secondary: string | undefined;
  if (binary) {
    // Ikkilik toifa — yagona shkaladan mustasno (tabiiy yorliq).
    primary = formatByScaleKind(percent, "pass_fail", binary);
    secondary = `${percent.toFixed(1)}%`;
  } else {
    // Holat / umumiy / ustun-oʻrtacha — YAGONA jurnal shkalasi: "4 (78%)".
    const f = formatScore(percent, journalScale);
    primary = f.label;
    secondary = journalScale.showPercent ? f.percent : undefined;
  }
  const color = scoreBarColor(percent);
  // "Bajardi/Bajarmadi" uzun — kichikroq shrift bilan.
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
/**
 * "Holat" ustunining ikkilamchi signali (burchakda).
 * showFormative=false → Trend ↗/↘, faqat |Δ| ±3pp deadband'dan oshganda
 *   (v1 SEM-proksisi: o‘lchash shovqinini neytral qoldiramiz).
 * showFormative=true → formativ signal foizi (diagnostik).
 */
function StatusBadge({
  showFormative,
  trend,
  formative,
  formativeCount,
}: {
  showFormative: boolean;
  trend: number | null;
  formative: number;
  formativeCount: number;
}) {
  if (showFormative) {
    if (formativeCount === 0) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold text-muted-foreground tabular-nums leading-none">
            {Math.round(formative)}%
          </span>
        </TooltipTrigger>
        <TooltipContent>Formativ signal (tushunish): {formative.toFixed(1)}%</TooltipContent>
      </Tooltip>
    );
  }
  if (trend === null) return null;
  const up = trend > 3;
  const down = trend < -3;
  if (!up && !down) return null; // deadband ichida — shovqin, ko‘rsatmaymiz
  const Icon = up ? TrendingUp : TrendingDown;
  const color = up ? "var(--success)" : "var(--destructive)";
  const label = `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Icon className="absolute bottom-0.5 right-1 size-3" style={{ color }} aria-label={`Trend ${label}`} />
      </TooltipTrigger>
      <TooltipContent>Trend: {label} (so‘nggi yarim vs oldingi yarim)</TooltipContent>
    </Tooltip>
  );
}

/** O‘quvchining sanali normallashgan baholari (formativ+summativ) — chart uchun. */
function buildDatedScores(
  studentId: string,
  assignments: ClassData["assignments"],
  grades: Grade[]
): DatedScore[] {
  const byKey = new Map<string, Grade>();
  grades.forEach((g) => {
    if (g.studentId === studentId) byKey.set(g.assignmentId, g);
  });
  const out: DatedScore[] = [];
  for (const a of assignments) {
    if (!a.date) continue;
    const pct = gradePercent(byKey.get(a.id), a);
    if (pct !== null) out.push({ date: new Date(a.date), pct });
  }
  return out;
}

function HolatStat({
  label,
  hint,
  children,
}: {
  label: string;
  /** ⓘ tooltip — metrikani qisqa tushuntiradi. */
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="size-3 cursor-help opacity-60 hover:opacity-100" aria-label={`${label} haqida`} />
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs leading-snug">{hint}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{children}</span>
    </div>
  );
}

/** Sinf bilan vizual solishtirish: o‘quvchi to‘ldirilishi + sinf o‘rtachasi belgisi. */
function LevelBar({ level, classAverage }: { level: number; classAverage: number }) {
  const delta = level - classAverage;
  const deltaColor =
    delta > 1 ? "var(--success)" : delta < -1 ? "var(--destructive)" : "var(--muted-foreground)";
  const deltaLabel = `${delta > 0 ? "+" : ""}${delta.toFixed(0)}% sinfdan`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Sinf bilan solishtirish</span>
        <span className="font-semibold tabular-nums" style={{ color: deltaColor }}>
          {deltaLabel}
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, level))}%`, backgroundColor: scoreBarColor(level) }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute -top-1 h-3.5 w-0.5 cursor-help rounded-full bg-foreground/70"
              style={{ left: `calc(${Math.min(100, Math.max(0, classAverage))}% - 1px)` }}
              aria-label="Sinf oʻrtachasi"
            />
          </TooltipTrigger>
          <TooltipContent className="text-xs">Sinf oʻrtachasi: {classAverage.toFixed(0)}%</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/**
 * Pedagogik signal — raqamlarni "qaror"ga aylantiruvchi yo‘naltiruvchi qator.
 * Daisy: tayyor "verdikt" emas (soxta aniqlik), ehtiyotkor til + o‘lchov xatosi (SEM).
 * Komil: buyruq emas, ishonchlilikni oshirishga qaratilgan "retsept".
 * Ustuvorlik: dalil yo‘q → kam dalil → transfer → pasayish → o‘sish → barqaror.
 */
/**
 * "Holat" katagiga hover — diagnostika xonasi: oʻzlashtirish darajasi, oʻzgarish
 * dinamikasi, kundalik tushunish, summativ dalil, grafik va pedagogik signal.
 * `student` berilmasa (sinf qatori) — grafik va sinf solishtiruvi koʻrsatilmaydi.
 */
function HolatHover({
  name,
  level,
  trend,
  formative,
  formativeCount,
  summativeCount,
  classAverage,
  student,
  assignments,
  grades,
  children,
}: {
  name: string;
  level: number;
  trend: number | null;
  formative: number;
  formativeCount: number;
  summativeCount: number;
  /** Sinf oʻrtachasi — solishtirish uchun (sinf qatorida berilmaydi). */
  classAverage?: number;
  student?: { id: string } | null;
  assignments: ClassData["assignments"];
  grades: Grade[];
  children: React.ReactNode;
}) {
  const journalScale = useClassStore((s) => s.journalScale);
  // Yagona jurnal shkalasi: "4 (78%)" (yoki yorliq === foiz boʻlsa, faqat bittasi).
  const levelDisplay = formatScore(level, journalScale).display;
  const points = useMemo(
    () => (student ? aggregateTrend(buildDatedScores(student.id, assignments, grades), "monthly") : []),
    [student, assignments, grades]
  );
  const up = trend !== null && trend > 3;
  const down = trend !== null && trend < -3;
  // Daisy: deadband ichidagi o‘zgarishni rang bilan belgilamaymiz — "Barqaror".
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;
  const trendColor = up ? "var(--success)" : down ? "var(--destructive)" : "var(--muted-foreground)";
  const trendDisplay =
    trend === null ? "—" : up || down ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%` : "Barqaror";
  const signal = pedagogikSignal({ level, formative, formativeCount, summativeCount, up, down });

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <TypographyMuted className="text-xs">Holat tafsiloti</TypographyMuted>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HolatStat
            label="Oʻzlashtirish"
            hint="Oʻquvchining rasmiy oʻzlashtirish darajasi — summativ (xulosalovchi) baholar asosida. Yakuniy bahoga teng."
          >
            {levelDisplay}
          </HolatStat>
          <HolatStat
            label="Dinamika"
            hint="Soʻnggi baholar oldingilarga nisbatan oʻsdimi yoki pasaydimi. Kichik oʻzgarishlar oʻlchov shovqini boʻlishi mumkin."
          >
            <span className="inline-flex items-center gap-1" style={{ color: trendColor }}>
              <TrendIcon className="size-3.5" />
              {trendDisplay}
            </span>
          </HolatStat>
          <HolatStat
            label="Formativ baho"
            hint="Mashq/jarayon davomidagi baholarning oʻrtachasi. Yakuniy bahoga kirmaydi — tushunish signali."
          >
            {formativeCount > 0 ? `${formative.toFixed(0)}%` : "—"}
          </HolatStat>
          <HolatStat
            label="Summativ ishlar"
            hint="Yakuniy bahoga asos boʻlgan summativ (nazorat) ishlari soni. 3 tadan kam boʻlsa baho ishonchliligi past."
          >
            <span className={cn(summativeCount > 0 && summativeCount < 3 && "text-warning")}>
              {summativeCount} ta
            </span>
          </HolatStat>
        </div>
        {classAverage != null && <LevelBar level={level} classAverage={classAverage} />}
        {student && points.length >= 2 && (
          <div>
            <TypographyMuted className="mb-1 text-[10px] uppercase tracking-wide">
              Baho dinamikasi (oylik)
            </TypographyMuted>
            <div className="h-28 w-full">
              <TrendChart points={points} color={scoreBarColor(level)} />
            </div>
          </div>
        )}
        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5">
          <Lightbulb className="mt-0.5 size-3.5 shrink-0" style={{ color: signal.tone }} aria-hidden />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pedagogik signal</p>
            <p className="text-xs leading-snug text-foreground">{signal.text}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

import AssignmentTooltip from "./AssignmentTooltip";

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
  const journalScale = useClassStore((s) => s.journalScale);
  const levelDisplay = formatScore(level, journalScale).display;
  const up = trend !== null && trend > 3;
  const down = trend !== null && trend < -3;
  const TrendIcon = up ? TrendingUp : down ? TrendingDown : Minus;
  const trendColor = up ? "var(--success)" : down ? "var(--destructive)" : "var(--muted-foreground)";
  const trendDisplay =
    trend === null ? "—" : up || down ? `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%` : "Barqaror";

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
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Oʻzlashtirish</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{levelDisplay}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Dinamika</p>
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
          Profilni ochish
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
};

type SortField = "firstName" | "lastName";
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
}: Props) {
  const { students, assignments, grades, topics } = classData;
  const classHex = CLASS_COLOR_HEX[classColor(classData.info)];
  const [createOpen, setCreateOpen] = useState(false);
  const [showWeights, setShowWeights] = useState(false);
  // Holat ustunining ikkilamchi qatori: false = Trend (default), true = Formativ signal.
  const [showFormative, setShowFormative] = useState(false);
  const [editingCell, setEditingCell] = useState<{ s: string; a: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>("firstName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [colFilter, setColFilter] = useState<"all" | "formative" | "summative">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const topicMap = useMemo(() => {
    const m = new Map<string, (typeof topics)[number]>();
    topics.forEach((t) => m.set(t.id, t));
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

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const na = splitName(a.name);
      const nb = splitName(b.name);
      const ka = sortField === "lastName" ? na.last || na.first : na.first;
      const kb = sortField === "lastName" ? nb.last || nb.first : nb.first;
      const cmp = UZ_COLLATOR.compare(ka, kb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, sortField, sortDir]);

  const totalsById = useMemo(
    () => new Map(rawTotals.map((t) => [t.student.id, t])),
    [rawTotals]
  );

  // Qidiruv bo‘yicha filtrlangan qatorlar.
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedStudents;
    return sortedStudents.filter((s) => s.name.toLowerCase().includes(q));
  }, [sortedStudents, search]);

  // Ustunlar: maqsad bo‘yicha filtr + Topic bo‘yicha guruhlash (ichida sana).
  const orderedAssignments = useMemo(() => {
    const topicIdx = new Map(topics.map((t, i) => [t.id, i]));
    return assignments
      .filter((a) =>
        colFilter === "all"
          ? true
          : (topicMap.get(a.topicId)?.purpose ?? "summative") === colFilter
      )
      .slice()
      .sort((a, b) => {
        const ti = (topicIdx.get(a.topicId) ?? 99) - (topicIdx.get(b.topicId) ?? 99);
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
  // Sinf formativ o‘rtachasi (signal) — ball olganlar bo‘yicha.
  const classFormative = useMemo(() => {
    const f = rawTotals.filter((t) => t.summary.formativeCount > 0);
    return f.length ? f.reduce((s, t) => s + t.summary.formative, 0) / f.length : null;
  }, [rawTotals]);
  // Sinf trendi = ball olgan o‘quvchilar trendlarining o‘rtachasi (yo‘nalish signali).
  const classTrend = useMemo(() => {
    const ds = students
      .map((s) => studentTrend(s.id, assignments, grades))
      .filter((d): d is number => d !== null);
    return ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : null;
  }, [students, assignments, grades]);
  const draftCount = grades.filter((g) => g.isDraft).length;
  const draftAssignmentCount = useMemo(
    () => new Set(grades.filter((g) => g.isDraft).map((g) => g.assignmentId)).size,
    [grades]
  );

  // Vaznli foiz rejimi: har o‘quvchining baholarining "Jami"ga hissasi.
  const contributionsByStudent = useMemo(() => {
    if (!showWeights) return null;
    const m = new Map<string, Map<string, number>>();
    students.forEach((s) =>
      m.set(s.id, studentContributions(s.id, assignments, grades, topics))
    );
    return m;
  }, [showWeights, students, assignments, grades, topics]);

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
    if (type === "assignment") onCreateAssignmentClick();
    else if (type === "reuse") onReuseClick();
    else onTopicClick();
  }

  return (
    <Card className={cn("min-w-0 rounded-xl", panelCardClass)}>
      {/* Sarlavha qatori */}
      <CardHeader className={cn(panelCardHeaderClass, "justify-between py-5!")}>
        <div className="flex items-center gap-3 shrink-0">
          <SectionIcon>
            <ClipboardList />
          </SectionIcon>
          <CardTitle>Topshiriqlar</CardTitle>
          <TypographyMuted className="shrink-0 text-sm">
            ({assignments.length})
          </TypographyMuted>
          {draftCount > 0 && (
            <Badge className="ml-1 border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400" aria-hidden="true" />
              {draftCount} qoralama
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
              placeholder="Oʻquvchi qidirish…"
              className="h-9 w-44 text-sm"
            />
          )}
          <IconButton
            aria-label="Qidirish"
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
              <IconButton aria-label="Filter" className="size-9" inactiveVariant="outline" active={colFilter !== "all"}>
                <ListFilter className="size-4 text-muted-foreground" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5">
              {([
                ["all", "Barchasi"],
                ["summative", "Faqat summativ"],
                ["formative", "Faqat formativ"],
              ] as const).map(([val, label]) => (
                <DropdownMenuItem
                  key={val}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm"
                  onClick={() => setColFilter(val)}
                >
                  <span className={cn(colFilter === val && "font-semibold")}>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <IconButton aria-label="Tezkor tugmalar" className="size-9">
                    <Keyboard className="size-4 text-muted-foreground" />
                  </IconButton>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Tezkor tugmalar</TooltipContent>
            </Tooltip>
            <PopoverContent align="end" className="w-72 p-0">
              <div className="border-b border-border px-4 py-3">
                <TypographySmall className="font-semibold text-foreground">
                  Tezkor kiritish
                </TypographySmall>
              </div>
              <div className="flex flex-col gap-2.5 p-4 text-sm">
                {([
                  ["Katakni tahrirlash", "Enter / klik"],
                  ["Pastga / oʻngga oʻtish", "Enter / Tab"],
                  ["Oldingi katak", "Shift + Tab"],
                  ["Qoʻshni katakka oʻtish", "← ↑ → ↓"],
                  ["Qatnashmadi deb belgilash", "q"],
                  ["Topshirmadi deb belgilash", "t"],
                  ["Ustunni toʻldirish (paste)", "Ctrl + V"],
                  ["Bekor qilish", "Esc"],
                ] as const).map(([label, keys]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <TypographyMuted>{label}</TypographyMuted>
                    <KbdGroup className="shrink-0">
                      {keys.split(" + ").map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </KbdGroup>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu open={createOpen} onOpenChange={setCreateOpen}>
              <DropdownMenuTrigger asChild>
                <Button className="ml-1 gap-2 font-semibold">
                  <Plus className="size-4" />
                  Yaratish
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => handleCreate("assignment")}>
                  <FileText />
                  Topshiriq
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreate("reuse")}>
                  <Copy />
                  Qayta ishlatish
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleCreate("topic")}>
                  <Tag />
                  Toifa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          <GradesSettingsModal
            showWeights={showWeights}
            onShowWeightsChange={setShowWeights}
            showFormative={showFormative}
            onShowFormativeChange={setShowFormative}
          />
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
              <ColHeader label="Holat" stickyLeft />
              {orderedAssignments.map((a) => {
                const topic = topicMap.get(a.topicId);
                const hex = topic ? TOPIC_COLOR_HEX[topic.color] : null;
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
                          <div className="flex items-center justify-center gap-0.5 py-1 mb-1 text-muted-foreground/60">
                            <ChevronUp className="size-3" />
                            <ChevronDown className="size-3" />
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
                          draftCount={grades.filter((g) => g.assignmentId === a.id && g.isDraft).length}
                          ungradedCount={students.filter((s) => {
                            const gg = gradeMap.get(`${s.id}:${a.id}`);
                            return !gg || (gg.score === null && !gg.missing);
                          }).length}
                          onEdit={() => onEditAssignment(a.id)}
                          onDelete={() => {
                            onDeleteAssignment(a.id);
                          }}
                          onPublish={() => onPublishAssignment(a.id)}
                          onFillColumn={(score) => onFillColumn(a.id, score)}
                          onMarkRemaining={() => onMarkRemaining(a.id)}
                        />
                      </HoverCardContent>
                    </HoverCard>
                  </TableHead>
                );
              })}
              <TableHead className="sticky top-0 z-20 bg-card border-b border-l border-r border-border w-16 min-w-16 p-0 align-bottom h-[176px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={onCreateAssignmentClick}
                      aria-label="Topshiriq qoʻshish"
                      className="w-full h-full flex items-center justify-center hover:bg-muted/40 transition-colors cursor-pointer rounded-none min-h-0"
                    >
                      <Plus className="size-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Topshiriq qoʻshish</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead
                className="sticky top-0 z-20 border-b border-border"
                style={{ backgroundColor: EMPTY_BG }}
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
                          onClick={() => setSortField((f) => f === "firstName" ? "lastName" : "firstName")}
                          className="text-xs font-bold uppercase tracking-wider text-foreground hover:text-foreground/70 transition-colors h-auto min-h-0 p-0 hover:bg-transparent"
                        >
                          Oʻquvchi
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{sortField === "firstName" ? "Familiya boʻyicha tartiblash" : "Ism boʻyicha tartiblash"}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                          className="flex flex-col -space-y-1 hover:opacity-80 transition-opacity h-auto min-h-0 w-auto p-0 hover:bg-transparent"
                        >
                          <ChevronUp className={cn("size-3", sortDir === "asc" ? "text-foreground" : "text-muted-foreground/30")} />
                          <ChevronDown className={cn("size-3", sortDir === "desc" ? "text-foreground" : "text-muted-foreground/30")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{sortDir === "asc" ? "Z→A tartibga oʻtish" : "A→Z tartibga oʻtish"}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TableCell>
              <TableCell
                className="sticky left-[260px] z-30 border-b-2 border-r border-border p-0 w-16 min-w-16 max-w-16 h-16"
                style={{ backgroundColor: HOLAT_BG }}
              >
                <HolatHover
                  name="Sinf oʻrtachasi"
                  level={classAverage}
                  trend={classTrend}
                  formative={classFormative ?? 0}
                  formativeCount={classFormative !== null ? 1 : 0}
                  summativeCount={rawTotals.filter((t) => t.summary.summativeCount > 0).length}
                  student={null}
                  assignments={assignments}
                  grades={grades}
                >
                  <div className="relative h-full w-full cursor-default">
                    <LetterAvg percent={classAverage} />
                    <StatusBadge
                      showFormative={showFormative}
                      trend={classTrend}
                      formative={classFormative ?? 0}
                      formativeCount={classFormative !== null ? 1 : 0}
                    />
                  </div>
                </HolatHover>
              </TableCell>
              {assignmentAverages.map((aa) => {
                const t = topicMap.get(aa.assignment.topicId);
                return (
                  <TableCell
                    key={aa.assignment.id}
                    className="bg-card border-b-2 border-r border-border p-0 w-16 min-w-16 h-16 text-center"
                  >
                    <LetterAvg
                      percent={aa.percent}
                      binary={
                        t?.inputMode === "select"
                          ? { passLabel: t.passLabel, failLabel: t.failLabel }
                          : undefined
                      }
                    />
                  </TableCell>
                );
              })}
              <TableCell className="bg-card border-b-2 border-r border-border w-16 min-w-16" />
              <TableCell className="border-b-2 border-border" style={{ backgroundColor: EMPTY_BG }} />
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
                    <HolatHover
                      name={s.name}
                      level={total.percent}
                      trend={trend}
                      formative={total.summary.formative}
                      formativeCount={total.summary.formativeCount}
                      summativeCount={total.summary.summativeCount}
                      classAverage={classAverage}
                      student={s}
                      assignments={assignments}
                      grades={grades}
                    >
                      <div className="relative h-full w-full cursor-default">
                        <LetterAvg percent={total.percent} />
                        <StatusBadge
                          showFormative={showFormative}
                          trend={trend}
                          formative={total.summary.formative}
                          formativeCount={total.summary.formativeCount}
                        />
                        {total.summary.summativeCount > 0 && total.summary.summativeCount < 3 && (
                          <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-warning/15 text-[9px] font-bold text-warning">
                            !
                          </span>
                        )}
                      </div>
                    </HolatHover>
                  </TableCell>

                  {orderedAssignments.map((a) => {
                    const g = gradeMap.get(`${s.id}:${a.id}`);
                    const topic = topicMap.get(a.topicId);
                    const isSelect = topic?.inputMode === "select";
                    const isEditing = editingCell?.s === s.id && editingCell?.a === a.id;
                    const hasScore = g?.score !== null && g?.score !== undefined;

                    return (
                      <TableCell
                        key={a.id}
                        onClick={isSelect ? undefined : () => setEditingCell({ s: s.id, a: a.id })}
                        className="border-b border-r border-border p-0 w-16 min-w-16 h-16 text-center cursor-pointer group/cell hover:ring-1 hover:ring-inset hover:ring-foreground/30 hover:bg-muted/40 transition-colors"
                      >
                        {isSelect ? (
                          <BinaryCell
                            grade={g}
                            maxScore={a.maxScore}
                            topic={topic}
                            weight={contributionsByStudent?.get(s.id)?.get(a.id) ?? null}
                            onSet={(pass) => onCellEdit(s.id, a.id, pass ? a.maxScore : 0)}
                            onMark={(mark) => onCellMark(s.id, a.id, mark)}
                            onClear={() => onCellEdit(s.id, a.id, null)}
                          />
                        ) : isEditing ? (
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
                            topic={topic}
                            weight={contributionsByStudent?.get(s.id)?.get(a.id) ?? null}
                          />
                        )}
                      </TableCell>
                    );
                  })}

                  <TableCell className="border-b border-r border-border bg-card group-hover:bg-muted w-16 min-w-16" />
                  <TableCell className="border-b border-border" style={{ backgroundColor: EMPTY_BG }} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </CardContent>

      {draftCount > 0 && (
        <CardFooter className={cn(panelCardFooterClass, "flex items-center justify-between bg-card")}>
          <div>
            <TypographySmall className="text-foreground">
              {draftCount} qoralama baho hali qaytarilmagan
            </TypographySmall>
            <TypographyMuted className="mt-0.5 text-xs">
              Talabalar siz qaytargunga qadar bahoni koʻra olmaydi.
            </TypographyMuted>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="gap-2 font-semibold">
                <Send className="size-4" />
                Hammasini qaytarish
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Baholarni nashr qilish</AlertDialogTitle>
                <AlertDialogDescription>
                  {draftAssignmentCount} ta topshiriqdagi jami {draftCount} ta baho oʻquvchilarga ochiladi. Bu amaldan soʻng ular bahosini koʻra oladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction onClick={onReturnAll}>Nashr qilish</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}

function GradesEmptyState() {
  return (
    <Empty className="min-h-[50vh]">
      <EmptyHeader>
        <EmptyMedia><Illustration name="15" className="h-32 text-black dark:text-white" /></EmptyMedia>
        <EmptyTitle>Sinfda oʻquvchi yoʻq</EmptyTitle>
        <EmptyDescription>Baholarni kuzatishni boshlash uchun bu sinfga oʻquvchi qoʻshing.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

// Holat ustuni — oq rangga yaqin kulrang fon (yengil ajratish uchun).
const HOLAT_BG = "color-mix(in srgb, var(--muted) 35%, var(--card))";
// Boʻsh struktura kataklari (chap-yuqori burchak + oʻngdagi boʻsh maydon) — sal koʻproq kulrang.
const EMPTY_BG = "color-mix(in srgb, var(--muted) 60%, var(--card))";

function ColHeader({ label, stickyLeft = false }: { label: string; stickyLeft?: boolean }) {
  return (
    <TableHead
      className={cn(
        "sticky top-0 bg-card border-b border-border w-[68px] min-w-[68px] px-1 align-bottom h-[176px]",
        stickyLeft ? "left-[260px] z-40 border-r" : "z-20"
      )}
      style={{ backgroundColor: HOLAT_BG }}
    >
      <div className="flex flex-col items-center justify-end h-full pb-2">
        <div
          className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </div>
        <div className="flex flex-col gap-0.5 text-muted-foreground mt-2">
          <ChevronUp className="size-3" />
          <ChevronDown className="size-3" />
        </div>
      </div>
    </TableHead>
  );
}



function GradeCell({
  grade,
  maxScore,
  topic,
  weight,
}: {
  grade: Grade | undefined;
  maxScore: number;
  topic?: ClassData["topics"][number];
  /** Vaznli foiz rejimi yoqilgan bo‘lsa — bahoning "Jami"ga hissasi (foiz punkt). */
  weight?: number | null;
}) {
  if (!grade || grade.score === null) {
    const missing = grade?.missing ?? (grade?.isMissing ? "absent" : undefined);
    if (missing) {
      // Q = Qatnashmadi (absent), T = Topshirmadi (unsubmitted).
      // Ikkalasi ham o‘rtachadan chiqarilgan — neytral rangda.
      const letter = missing === "absent" ? "Q" : "T";
      const label = missing === "absent" ? "Qatnashmadi" : "Topshirmadi";
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
  // Tanlash (select) toifa — ball oʻrniga toifa yorligʻini koʻrsatamiz.
  const isSelect = topic?.inputMode === "select";
  const selectLabel = isSelect
    ? percent >= 50
      ? topic?.passLabel ?? "Bajardi"
      : topic?.failLabel ?? "Bajarmadi"
    : null;
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center py-3 px-2 group-hover/cell:ring-1 group-hover/cell:ring-inset group-hover/cell:ring-foreground/30 transition-shadow"
      style={{ backgroundColor: `color-mix(in srgb, ${scoreBarColor(percent)} 8%, transparent)` }}
    >
      {grade.isDraft && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-muted-foreground" />
      )}
      {isSelect ? (
        <span
          className="flex size-6 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${scoreBarColor(percent)} 16%, transparent)` }}
          title={selectLabel ?? undefined}
          aria-label={selectLabel ?? undefined}
        >
          {percent >= 50 ? (
            <Check className="size-4" strokeWidth={3} style={{ color: scoreBarColor(percent) }} />
          ) : (
            <X className="size-4" strokeWidth={3} style={{ color: scoreBarColor(percent) }} />
          )}
        </span>
      ) : (
        <>
          <span className="text-base font-bold tabular-nums leading-none text-foreground">
            {grade.score}
          </span>
          <span className="absolute bottom-1 right-1.5 text-[10px] text-muted-foreground tabular-nums leading-none">
            /{maxScore}
          </span>
          {weight != null && (
            <span
              className="absolute top-1 left-1.5 text-[10px] font-semibold tabular-nums leading-none"
              style={{ color: scoreBarColor(percent) }}
              title="Yakuniy bahoga hissa"
            >
              {weight.toFixed(1)}%
            </span>
          )}
        </>
      )}
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

/**
 * Ikkilik (Bajardi/Bajarmadi) toifa katagi — tahrir popup'i YOʻQ.
 * Chap-klik holatni aylantiradi: boʻsh → Bajardi (100%) → Bajarmadi (0%) → boʻsh.
 * Oʻng-klik → toʻliq menyu (Bajardi/Bajarmadi/Qatnashmadi/Topshirmadi/Tozalash).
 */
function BinaryCell({
  grade,
  maxScore,
  topic,
  weight,
  onSet,
  onMark,
  onClear,
}: {
  grade: Grade | undefined;
  maxScore: number;
  topic?: ClassData["topics"][number];
  weight?: number | null;
  onSet: (pass: boolean) => void;
  onMark: (mark: "absent" | "unsubmitted") => void;
  onClear: () => void;
}) {
  const passLabel = topic?.passLabel ?? "Bajardi";
  const failLabel = topic?.failLabel ?? "Bajarmadi";
  const hasScore = grade?.score !== null && grade?.score !== undefined;
  const pass = hasScore && maxScore > 0 ? (grade!.score! / maxScore) * 100 >= 50 : null;

  function cycle() {
    if (pass === true) onSet(false); // Bajardi → Bajarmadi
    else if (pass === false) onClear(); // Bajarmadi → boʻsh
    else onSet(true); // boʻsh / Q / T → Bajardi
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={(e) => {
            e.stopPropagation();
            cycle();
          }}
          className="h-full w-full"
        >
          <GradeCell grade={grade} maxScore={maxScore} topic={topic} weight={weight} />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="w-48"
        onKeyDown={(e) => {
          // Tezkor klavishlar: menyu ochiqligida bitta harf bosib amalni bajarish.
          const k = e.key.toLowerCase();
          const actions: Record<string, () => void> = {
            b: () => onSet(true),
            x: () => onSet(false),
            q: () => onMark("absent"),
            t: () => onMark("unsubmitted"),
            ...(hasScore ? { z: onClear } : {}),
          };
          if (actions[k]) {
            e.preventDefault();
            actions[k]();
          }
        }}
      >
        <ContextMenuItem onClick={() => onSet(true)}>
          <Check className="text-success" />
          {passLabel}
          <ContextMenuShortcut>B</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onSet(false)}>
          <X className="text-destructive" />
          {failLabel}
          <ContextMenuShortcut>X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onMark("absent")}>
          <UserX className="text-muted-foreground" />
          Qatnashmadi
          <ContextMenuShortcut>Q</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onMark("unsubmitted")}>
          <FileX className="text-muted-foreground" />
          Topshirmadi
          <ContextMenuShortcut>T</ContextMenuShortcut>
        </ContextMenuItem>
        {hasScore && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onClear}>
              <Eraser className="text-muted-foreground" />
              Tozalash
              <ContextMenuShortcut>Z</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
