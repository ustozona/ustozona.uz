"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import {
  ClipboardList,
  Search,
  ListFilter,
  EyeOff,
  Plus,
  ChevronUp,
  ChevronDown,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOPIC_COLORS,
  getLetterGrade,
  type ClassData,
  type Grade,
} from "@/lib/grades-data";
import {
  calcAssignmentAverages,
  calcStudentTotals,
  topicHex,
} from "./helpers";

const LETTER_RGB: Record<string, string> = {
  A: "34, 197, 94",
  B: "132, 204, 22",
  C: "234, 179, 8",
  D: "249, 115, 22",
  F: "239, 68, 68",
};

function LetterAvg({ percent }: { percent: number }) {
  const { letter } = getLetterGrade(percent);
  const base = letter[0];
  const rgb = LETTER_RGB[base] ?? LETTER_RGB.F;
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center gap-0.5 p-1"
      style={{ backgroundColor: `rgba(${rgb}, 0.082)` }}
    >
      <span className="text-base font-bold" style={{ color: `rgb(${rgb})` }}>
        {letter}
      </span>
      <span className="text-[10px] text-muted-foreground">
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}
import CreateMenu from "./CreateMenu";
import AssignmentTooltip from "./AssignmentTooltip";

type Props = {
  classData: ClassData;
  onCellEdit: (studentId: string, assignmentId: string, score: number | null) => void;
  onReturnAll: () => void;
  onCreateAssignmentClick: () => void;
  onReuseClick: () => void;
  onTopicClick: () => void;
  onDeleteAssignment: (assignmentId: string) => void;
};

type SortField = "firstName" | "lastName";
type SortDir = "asc" | "desc";

const UZ_COLLATOR = new Intl.Collator("uz", { sensitivity: "base" });

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? { first: parts[0], last: parts.slice(1).join(" ") }
    : { first: parts[0] ?? "", last: "" };
}

export default function GradesTable({
  classData,
  onCellEdit,
  onReturnAll,
  onCreateAssignmentClick,
  onReuseClick,
  onTopicClick,
  onDeleteAssignment,
}: Props) {
  const { students, assignments, grades, topics } = classData;
  const [createOpen, setCreateOpen] = useState(false);
  const [hideDrafts, setHideDrafts] = useState(false);
  const [tooltipFor, setTooltipFor] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("firstName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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
    () => calcStudentTotals(students, grades),
    [students, grades]
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

  const studentTotals = useMemo(() => {
    const totalMap = new Map(rawTotals.map((t) => [t.student.id, t]));
    return sortedStudents.map((s) => totalMap.get(s.id)!);
  }, [sortedStudents, rawTotals]);
  const assignmentAverages = useMemo(
    () => calcAssignmentAverages(assignments, grades),
    [assignments, grades]
  );
  const classAverage =
    rawTotals.reduce((sum, s) => sum + s.percent, 0) /
    Math.max(rawTotals.length, 1);
  const draftCount = grades.filter((g) => g.isDraft).length;

  function handleCreate(type: "assignment" | "reuse" | "topic") {
    setCreateOpen(false);
    if (type === "assignment") onCreateAssignmentClick();
    else if (type === "reuse") onReuseClick();
    else onTopicClick();
  }

  return (
    <div className="flex flex-col min-w-0 min-h-0 h-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Sarlavha qatori */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-muted flex items-center justify-center">
            <ClipboardList className="size-5 text-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Topshiriqlar</h2>
          <span className="text-2xl font-bold text-muted-foreground">
            ({assignments.length})
          </span>
          {draftCount > 0 && (
            <span className="ml-1 inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
              {draftCount} qoralama
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <IconBtn ariaLabel="Qidirish">
            <Search className="size-4 text-muted-foreground" />
          </IconBtn>
          <IconBtn ariaLabel="Filter" bordered>
            <ListFilter className="size-4 text-muted-foreground" />
          </IconBtn>
          <IconBtn
            ariaLabel="Qoralamalarni yashirish"
            onClick={() => setHideDrafts((v) => !v)}
            active={hideDrafts}
          >
            <EyeOff className="size-4 text-muted-foreground" />
          </IconBtn>

          <div className="relative ml-1">
            <button
              onClick={() => setCreateOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 h-9 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Plus className="size-4" />
              Yaratish
            </button>
            {createOpen && (
              <CreateMenu
                onSelect={handleCreate}
                onClose={() => setCreateOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Jadval */}
      <div className="flex-1 overflow-auto scrollbar-thin min-h-0">
        <table
          className="w-full"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          <thead className="sticky top-0 z-30 bg-card">
            <tr>
              <th className="sticky left-0 z-40 bg-card border-r border-b border-border min-w-[260px] w-[260px] h-[140px]" />
              <ColHeader label="Jami" />
              {assignments.map((a) => {
                const topic = topicMap.get(a.topicId);
                const tc = topic ? TOPIC_COLORS[topic.color] : null;
                const hex = tc ? topicHex(topic!.color) : null;
                return (
                  <th
                    key={a.id}
                    className="border-b border-r border-border p-0 w-16 min-w-16 h-36 text-center align-bottom relative"
                    style={
                      hex
                        ? { backgroundColor: `color-mix(in srgb, ${hex} 8%, var(--card))` }
                        : undefined
                    }
                  >
                    <button
                      onClick={() =>
                        setTooltipFor(tooltipFor === a.id ? null : a.id)
                      }
                      className="h-full w-full flex flex-col items-center justify-end p-2 pb-0 cursor-pointer relative"
                    >
                      <div
                        className="font-semibold text-xs whitespace-nowrap flex-1 flex items-start justify-center text-foreground"
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
                    </button>
                    {tooltipFor === a.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setTooltipFor(null)}
                        />
                        <AssignmentTooltip
                          assignment={a}
                          topic={topic}
                          dueDate={fakeDueDate(a.id)}
                          onEdit={() => setTooltipFor(null)}
                          onDelete={() => {
                            setTooltipFor(null);
                            onDeleteAssignment(a.id);
                          }}
                        />
                      </>
                    )}
                  </th>
                );
              })}
              <th className="sticky top-0 z-20 bg-card border-b border-border w-[68px] min-w-[68px] px-1 align-bottom h-[140px]">
                <button
                  onClick={onCreateAssignmentClick}
                  className="w-full h-full flex flex-col items-center justify-center pb-2 gap-1.5 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <Plus className="size-4 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Qo&apos;shish
                  </span>
                </button>
              </th>
              <th className="sticky top-0 z-20 bg-card border-b border-border" />
            </tr>
          </thead>

          <tbody>
            {/* O'rtachalar qatori — sticky tagida thead */}
            <tr className="sticky z-20 bg-muted" style={{ top: "140px" }}>
              <td className="sticky left-0 z-30 bg-muted border-r border-b border-border p-4 w-[260px] min-w-[260px] max-w-[260px] h-16">
                <div className="relative">
                  <div className="flex items-center justify-center gap-1.5 w-full">
                    <button
                      onClick={() => setSortField((f) => f === "firstName" ? "lastName" : "firstName")}
                      className="text-[10px] font-bold uppercase tracking-wider text-foreground hover:text-foreground/70 transition-colors"
                      title={sortField === "firstName" ? "Familiya bo'yicha tartiblash" : "Ism bo'yicha tartiblash"}
                    >
                      O'quvchi
                    </button>
                    <button
                      onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
                      className="flex flex-col -space-y-1 hover:opacity-80 transition-opacity"
                      title={sortDir === "asc" ? "Z→A tartibga o'tish" : "A→Z tartibga o'tish"}
                    >
                      <ChevronUp className={cn("size-3", sortDir === "asc" ? "text-foreground" : "text-muted-foreground/30")} />
                      <ChevronDown className={cn("size-3", sortDir === "desc" ? "text-foreground" : "text-muted-foreground/30")} />
                    </button>
                  </div>
                </div>
              </td>
              <td className="bg-muted border-b border-r border-border p-0 w-16 min-w-16 h-16">
                <LetterAvg percent={classAverage} />
              </td>
              {assignmentAverages.map((aa) => (
                <td
                  key={aa.assignment.id}
                  className="bg-muted border-b border-r border-border p-0 w-16 min-w-16 h-16 text-center"
                >
                  <LetterAvg percent={aa.percent} />
                </td>
              ))}
              <td className="bg-muted border-b border-r border-border" />
              <td className="bg-muted border-b border-border" />
            </tr>

            {sortedStudents.map((s, idx) => {
              const total = studentTotals[idx];
              return (
                <tr key={s.id} className="group hover:bg-muted/30 transition-colors h-16">
                  <td className="sticky left-0 z-10 bg-card group-hover:bg-muted border-r border-b border-border p-3 w-[260px] min-w-[260px] max-w-[260px]">
                    <div className="flex items-center gap-3">
                      <div
                        className="rounded-full flex items-center justify-center font-semibold text-white shrink-0 size-7 text-xs"
                        style={{ backgroundColor: "rgb(74, 222, 128)" }}
                      >
                        {s.initials}
                      </div>
                      <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {s.name}
                      </span>
                    </div>
                  </td>

                  <td className="sticky left-[260px] z-10 bg-card group-hover:bg-muted border-b border-r border-border p-0 w-16 min-w-16 max-w-16 h-16">
                    <LetterAvg percent={total.percent} />
                  </td>

                  {assignments.map((a) => {
                    const g = gradeMap.get(`${s.id}:${a.id}`);
                    const cellKey = `${s.id}:${a.id}`;
                    const isEditing = editingCell === cellKey;
                    const hasScore = g?.score !== null && g?.score !== undefined;

                    return (
                      <td
                        key={a.id}
                        onClick={() => setEditingCell(cellKey)}
                        className="border-b border-r border-border p-0 w-16 min-w-16 h-16 text-center cursor-pointer group/cell hover:ring-1 hover:ring-inset hover:ring-foreground/30 hover:bg-muted/40 transition-colors"
                      >
                        {isEditing ? (
                          <CellEditor
                            initial={hasScore ? g!.score! : null}
                            maxScore={a.maxScore}
                            onSave={(val) => {
                              onCellEdit(s.id, a.id, val);
                              setEditingCell(null);
                            }}
                            onCancel={() => setEditingCell(null)}
                          />
                        ) : (
                          <GradeCell
                            grade={g}
                            maxScore={a.maxScore}
                            hidden={hideDrafts && g?.isDraft}
                          />
                        )}
                      </td>
                    );
                  })}

                  <td className="border-b border-border bg-card" />
                  <td className="border-b border-border bg-card" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {draftCount > 0 && (
        <div className="flex items-center justify-between border-t border-border px-5 py-3 shrink-0 bg-card">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {draftCount} qoralama baho hali qaytarilmagan
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Talabalar siz qaytargunga qadar bahoni ko&apos;ra olmaydi.
            </p>
          </div>
          <button
            onClick={onReturnAll}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-3.5 h-9 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Send className="size-4" />
            Hammasini qaytarish
          </button>
        </div>
      )}
    </div>
  );
}

function ColHeader({ label }: { label: string }) {
  return (
    <th className="sticky top-0 z-20 bg-card border-b border-border w-[68px] min-w-[68px] px-1 align-bottom h-[140px]">
      <div className="flex flex-col items-center justify-end h-full pb-2">
        <div
          className="text-xs font-semibold text-muted-foreground tracking-wide"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {label}
        </div>
        <div className="flex flex-col gap-0.5 text-muted-foreground mt-2">
          <ChevronUp className="size-3" />
          <ChevronDown className="size-3" />
        </div>
      </div>
    </th>
  );
}

function IconBtn({
  children,
  ariaLabel,
  onClick,
  bordered,
  active,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  onClick?: () => void;
  bordered?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "size-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
        bordered && "border border-border bg-card",
        active ? "bg-muted" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}



function cellBg(percent: number): string {
  if (percent >= 90) return "bg-emerald-50 dark:bg-emerald-900/20";
  if (percent >= 80) return "bg-green-50 dark:bg-green-900/20";
  if (percent >= 70) return "bg-yellow-50 dark:bg-yellow-900/20";
  if (percent >= 60) return "bg-orange-50 dark:bg-orange-900/20";
  return "bg-red-50 dark:bg-red-900/20";
}

function GradeCell({
  grade,
  maxScore,
  hidden,
}: {
  grade: Grade | undefined;
  maxScore: number;
  hidden?: boolean;
}) {
  if (!grade || grade.score === null || hidden) {
    if (grade?.isMissing) {
      return (
        <div className="flex flex-col items-center justify-center py-3 px-2">
          <span className="text-base font-bold text-red-600">M</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            /{maxScore}
          </span>
        </div>
      );
    }
    return <div className="h-[52px]" />;
  }
  const percent = maxScore > 0 ? (grade.score / maxScore) * 100 : 0;
  return (
    <div className={cn("relative w-full h-full flex flex-col items-center justify-center py-3 px-2 group-hover/cell:ring-1 group-hover/cell:ring-inset group-hover/cell:ring-foreground/30 transition-shadow", cellBg(percent))}>
      {grade.isDraft && (
        <span className="absolute top-1 right-1 size-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
      )}
      <span className="text-sm font-bold tabular-nums">
        {grade.score}
      </span>
      <span className="text-[9px] text-muted-foreground tabular-nums">
        /{maxScore}
      </span>
    </div>
  );
}

function CellEditor({
  initial,
  maxScore,
  onSave,
  onCancel,
}: {
  initial: number | null;
  maxScore: number;
  onSave: (val: number | null) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initial?.toString() ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function commit() {
    const trimmed = val.trim();
    if (trimmed === "") {
      onSave(null);
      return;
    }
    const n = Number(trimmed);
    if (Number.isNaN(n)) {
      onCancel();
      return;
    }
    onSave(Math.max(0, Math.min(maxScore, n)));
  }

  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") onCancel();
        }}
        className="w-12 h-6 text-center text-base font-semibold text-foreground tabular-nums bg-card border border-foreground/40 rounded outline-none"
      />
      <span className="text-[10px] text-muted-foreground tabular-nums">
        /{maxScore}
      </span>
    </div>
  );
}

function fakeDueDate(id: string): string {
  const day = (id.charCodeAt(id.length - 1) % 28) + 1;
  const months = [
    "yan",
    "fev",
    "mar",
    "apr",
    "may",
    "iyn",
    "iyl",
    "avg",
    "sen",
    "okt",
    "noy",
    "dek",
  ];
  const m = months[(id.charCodeAt(0) + id.length) % 12];
  return `${day}-${m}`;
}
