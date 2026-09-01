"use client";

import * as React from "react";
import { ChevronDown, MessageSquarePlus, MoreVertical, Trash2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TypographyMuted } from "@/components/ui/typography";
import { DAYS_UZ_SUN, MONTHS_UZ } from "@/lib/localization";
import type { BehaviorEvent } from "@/lib/behavior-data";
import { BehaviorEmoji } from "./BehaviorEmoji";
import { formatPoints } from "./SkillCard";

/* Xulq eventlari lentasi — yangi→eski, sana boʻyicha guruhlangan.
   Hisobot paneli, "Ballar" Sheet va profil tabi birga ishlatadi.

   Ikki harakat uslubi:
   • "menu"  — ⋮ menyu (Izoh / Oʻchirish AlertDialog bilan) — hisobot/profil.
   • "inline" — koʻrinadigan "Bekor qilish" + "Izoh" tugmalari (tasdiqsiz,
     undo semantikasi) — "Ballar" yon paneli.

   Izoh (2.6): bitta event = bitta izoh; kulrang sub-karta, inline tahrir. */

function AutoChip({ source }: { source: string }) {
  const t = useTranslations("EventTimeline");
  const autoSourceLabel: Record<string, string> = {
    attendance: t("autoLabelAttendance"),
    streak: t("autoLabelStreak"),
    grade: t("autoLabelGrade"),
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="ml-1.5 inline-flex shrink-0 items-center rounded-full border border-border bg-muted/60 px-1.5 py-px align-middle text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {t("autoBadge")}
        </span>
      </TooltipTrigger>
      <TooltipContent>{autoSourceLabel[source] ?? t("autoLabelDefault")}</TooltipContent>
    </Tooltip>
  );
}

export type EventGroupBy = "date" | "student" | "skill";

/** Hovercard uchun oʻquvchi maʼlumoti (PointsSheet hisoblab beradi). */
export type StudentHoverInfo = {
  name: string;
  initials: string;
  balance: number;
  earned: number;
  lost: number;
};

export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const date = new Date(y, m - 1, d);
  return `${d}-${MONTHS_UZ[m - 1].toLowerCase()}, ${DAYS_UZ_SUN[date.getDay()].toLowerCase()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function NoteEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (note: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("EventTimeline");
  const [text, setText] = React.useState(initial);
  return (
    <div className="mt-1.5 space-y-1.5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        rows={2}
        autoFocus
        placeholder={t("notePlaceholder")}
      />
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-7" onClick={() => onSave(text)}>
          {t("save")}
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}

/** Rasm qoʻyilmagan avatar fallback — sinf rangini oladi (classHex berilsa). */
function ClassAvatar({
  initials,
  classHex,
  size = "default",
}: {
  initials: string;
  classHex?: string;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar size={size} style={classHex ? ({ "--avatar-bg": classHex } as React.CSSProperties) : undefined}>
      <AvatarFallback className={cn("font-semibold", classHex && "bg-[var(--avatar-bg)] text-white")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** Ism ustidagi hovercard kontenti — avatar + balans + ijobiy/salbiy pill'lar. */
function StudentHoverBody({ info, classHex }: { info: StudentHoverInfo; classHex?: string }) {
  const t = useTranslations("EventTimeline");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <ClassAvatar initials={info.initials} classHex={classHex} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{info.name}</p>
          <p className="text-xs text-muted-foreground">
            {t("hoverBalanceLabel")}{" "}
            <span className="font-semibold tabular-nums text-foreground">{info.balance}</span>{" "}
            {t("hoverBalanceUnit")}
          </p>
        </div>
      </div>
      <Separator />
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-success">
          {t("hoverEarned", { count: info.earned })}
        </span>
        <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-destructive">
          {t("hoverLost", { count: info.lost })}
        </span>
      </div>
    </div>
  );
}

/** Avatar/ikonka ustiga hovercard — info yoki groupBody topilsa; aks holda oddiy children. */
function IconHoverTrigger({
  info,
  groupBody,
  classHex,
  children,
}: {
  info?: StudentHoverInfo;
  groupBody?: React.ReactNode;
  classHex?: string;
  children: React.ReactNode;
}) {
  const body = groupBody ?? (info ? <StudentHoverBody info={info} classHex={classHex} /> : null);
  if (!body) return <>{children}</>;
  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <span className="cursor-default">{children}</span>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64">
        {body}
      </HoverCardContent>
    </HoverCard>
  );
}

/** Guruh roʻyxatidagi bitta aʼzo — ismi ustida oʻz hovercard'i (avatar + balans). */
function GroupMemberRow({
  name,
  info,
  classHex,
}: {
  name: string;
  info?: StudentHoverInfo;
  classHex?: string;
}) {
  const avatar = <ClassAvatar initials={info?.initials ?? "?"} classHex={classHex} size="sm" />;
  const row = (
    <div className="flex items-center gap-2">
      {info ? (
        <HoverCard openDelay={120} closeDelay={60}>
          <HoverCardTrigger asChild>
            <span className="cursor-default" onClick={(e) => e.stopPropagation()}>
              {avatar}
            </span>
          </HoverCardTrigger>
          <HoverCardContent align="end" className="w-64">
            <StudentHoverBody info={info} classHex={classHex} />
          </HoverCardContent>
        </HoverCard>
      ) : (
        avatar
      )}
      <span className="min-w-0 truncate text-sm text-foreground">{name}</span>
    </div>
  );
  return row;
}

/** Oʻchirish tasdigʻiga ixtiyoriy sabab — tezkor chiplar + erkin matn. */
function DeleteReasonField({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Avto-minusni bekor qilishda sabab shart (ekspert qarori). */
  required?: boolean;
}) {
  const t = useTranslations("EventTimeline");
  const quickDeleteReasons = [t("quickReason1"), t("quickReason2"), t("quickReason3")];
  return (
    <div className="space-y-2 pt-1">
      <div className="flex flex-wrap gap-1.5">
        {quickDeleteReasons.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange(value === r ? "" : r)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              value === r
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? t("reasonPlaceholderRequired") : t("reasonPlaceholderOptional")}
        rows={2}
        maxLength={500}
      />
    </div>
  );
}

export function EventTimeline({
  events,
  nameById,
  actionStyle = "menu",
  groupBy = "date",
  studentInfoById,
  classHex,
  onDelete,
  onSaveNote,
  className,
}: {
  events: BehaviorEvent[];
  /** Berilsa — har yozuvda oʻquvchi ismi (yoki guruh aʼzolari) ham chiqadi ("Ballar" paneli). */
  nameById?: Map<string, string>;
  actionStyle?: "menu" | "inline";
  /** Seksiya kaliti: sana (default) / oʻquvchi / koʻnikma. */
  groupBy?: EventGroupBy;
  /** Berilsa — ism ustiga hovercard (avatar + balans + statistika) chiqadi. */
  studentInfoById?: Map<string, StudentHoverInfo>;
  /** Avatar fallback foni — rasm qoʻyilmagan boʻlsa sinf rangi. */
  classHex?: string;
  /** `reason` — ixtiyoriy, foydalanuvchi oʻchirish sababini yozsa/tanlasa. */
  onDelete: (event: BehaviorEvent, reason?: string) => void;
  /** Boʻsh matn = izohni olib tashlash. */
  onSaveNote: (event: BehaviorEvent, note: string) => void;
  className?: string;
}) {
  const t = useTranslations("EventTimeline");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmEvent, setConfirmEvent] = React.useState<BehaviorEvent | null>(null);
  const [confirmGroup, setConfirmGroup] = React.useState<BehaviorEvent[] | null>(null);
  const [deleteReason, setDeleteReason] = React.useState("");
  // Avto MANFIY yozuvni bekor qilishda izoh majburiy (6-tur ekspert qarori).
  const requireDeleteReason = !!confirmEvent?.source && confirmEvent.points < 0;
  /* Yigʻilgan seksiyalar — default boʻsh (hammasi ochiq). */
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /* Yangi → eski; groupBy boʻyicha seksiyalar. "date"da kalit desc
     tartiblanadi; "student"/"skill"da seksiyalar eng soʻnggi eventi
     boʻyicha (first-seen recency) tartibda qoladi. */
  const sections = React.useMemo((): { key: string; title: string; events: BehaviorEvent[] }[] => {
    const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    if (groupBy === "student") {
      const byStudent = new Map<string, BehaviorEvent[]>();
      for (const e of sorted) {
        const list = byStudent.get(e.studentId);
        if (list) list.push(e);
        else byStudent.set(e.studentId, [e]);
      }
      return [...byStudent.entries()].map(([sid, list]) => ({
        key: `st-${sid}`,
        title: nameById?.get(sid) ?? sid,
        events: list,
      }));
    }

    if (groupBy === "skill") {
      const bySkill = new Map<string, BehaviorEvent[]>();
      for (const e of sorted) {
        const k = e.skillId ?? `snap-${e.name}`;
        const list = bySkill.get(k);
        if (list) list.push(e);
        else bySkill.set(k, [e]);
      }
      return [...bySkill.entries()].map(([k, list]) => ({
        key: `sk-${k}`,
        // Snapshot yangilangan boʻlishi mumkin — eng yangi nom gʻolib.
        title: list[0].name,
        events: list,
      }));
    }

    const byDate = new Map<string, BehaviorEvent[]>();
    for (const e of sorted) {
      const list = byDate.get(e.date);
      if (list) list.push(e);
      else byDate.set(e.date, [e]);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, list]) => ({ key: `d-${date}`, title: formatDateLabel(date), events: list }));
  }, [events, groupBy, nameById]);

  /* Bir vaqtda birga berilgan (Sinf/tanlangan guruh) eventlarni bitta
     qatorga birlashtiradi — aks holda har oʻquvchi uchun takroriy qator
     chiqadi (koʻnikma-asosli xulq tizimlarida uchraydigan taniqli muammo). */
  type Row = { kind: "single"; event: BehaviorEvent } | { kind: "group"; key: string; events: BehaviorEvent[] };
  const toRows = (list: BehaviorEvent[]): Row[] => {
    const rows: Row[] = [];
    const groupIndex = new Map<string, number>();
    for (const e of list) {
      if (e.groupId) {
        const idx = groupIndex.get(e.groupId);
        if (idx !== undefined) {
          (rows[idx] as { kind: "group"; key: string; events: BehaviorEvent[] }).events.push(e);
          continue;
        }
        groupIndex.set(e.groupId, rows.length);
        rows.push({ kind: "group", key: e.groupId, events: [e] });
      } else {
        rows.push({ kind: "single", event: e });
      }
    }
    return rows;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {sections.map((section) => {
        const sectionCollapsed = collapsed.has(section.key);
        /* groupId birlashtirish faqat sana rejimida maʼnoli — oʻquvchi/
           koʻnikma kesimida har event oʻz seksiyasida alohida qator. */
        const rows: Row[] =
          groupBy === "date"
            ? toRows(section.events)
            : section.events.map((event) => ({ kind: "single" as const, event }));
        return (
        <div key={section.key}>
          <button
            type="button"
            onClick={() => toggleSection(section.key)}
            className="group/section flex w-full cursor-pointer items-center gap-1.5 text-left"
          >
            <span className="text-label font-semibold uppercase text-muted-foreground">
              {section.title}
            </span>
            <span className="text-label font-medium tabular-nums text-muted-foreground/60">
              {section.events.length}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground/60 transition-transform group-hover/section:text-muted-foreground",
                sectionCollapsed && "-rotate-90"
              )}
              aria-hidden
            />
          </button>
          {!sectionCollapsed && (
          <div className={cn("mt-1.5", actionStyle === "inline" ? "space-y-2" : "divide-y divide-border/60")}>
            {rows.map((row) => {
              const e = row.kind === "single" ? row.event : row.events[0];
              const positive = e.points > 0;
              const editing = row.kind === "single" && editingId === e.id;
              const groupLabel = row.kind === "group" ? t("groupLabel", { count: row.events.length }) : undefined;
              const primaryLabel = row.kind === "group" ? groupLabel : nameById?.get(e.studentId);
              const key = row.kind === "single" ? e.id : row.key;
              const hoverInfo =
                row.kind === "single" ? studentInfoById?.get(e.studentId) : undefined;
              const groupHoverBody =
                row.kind === "group" && studentInfoById ? (
                  <ul className="space-y-1.5">
                    {row.events.map((ev) => (
                      <li key={ev.id}>
                        <GroupMemberRow
                          name={nameById?.get(ev.studentId) ?? ev.studentId}
                          info={studentInfoById.get(ev.studentId)}
                          classHex={classHex}
                        />
                      </li>
                    ))}
                  </ul>
                ) : undefined;

              if (actionStyle === "inline") {
                return (
                  <div
                    key={key}
                    className="group/row rounded-xl border border-border/60 bg-card px-3.5 py-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="relative mt-0.5 inline-flex shrink-0">
                        <BehaviorEmoji code={e.emoji} label={e.name} className="size-8" />
                        <span
                          className={cn(
                            "absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-card px-0.5",
                            "text-[10px] font-bold tabular-nums leading-none",
                            positive
                              ? "bg-success text-success-foreground"
                              : "bg-destructive text-destructive-foreground"
                          )}
                        >
                          {formatPoints(e.points)}
                        </span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground">
                          {groupBy === "student" ? (
                            e.name
                          ) : (
                            <>
                              {primaryLabel && (
                                <IconHoverTrigger info={hoverInfo} groupBody={groupHoverBody} classHex={classHex}>
                                  <span className="font-semibold underline decoration-dotted decoration-muted-foreground/50 underline-offset-4">
                                    {primaryLabel}
                                  </span>
                                </IconHoverTrigger>
                              )}
                              {primaryLabel && groupBy === "date" ? " — " : ""}
                              {groupBy === "date" ? e.name : null}
                            </>
                          )}
                          {e.source && <AutoChip source={e.source} />}
                        </p>
                        <TypographyMuted className="mt-0.5 text-xs">
                          {formatTime(e.createdAt)}
                        </TypographyMuted>

                        {row.kind === "single" && editing && (
                          <NoteEditor
                            initial={e.note ?? ""}
                            onSave={(note) => {
                              onSaveNote(e, note);
                              setEditingId(null);
                            }}
                            onCancel={() => setEditingId(null)}
                          />
                        )}
                        {row.kind === "single" && !editing && e.note && (
                          <div className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                            {e.note}
                          </div>
                        )}
                      </div>

                      {row.kind === "single" && !editing && (
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 text-muted-foreground"
                                aria-label={e.note ? t("editNote") : t("addNote")}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setEditingId(e.id);
                                }}
                              >
                                <MessageSquarePlus className="size-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{e.note ? t("editNote") : t("addNote")}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 text-muted-foreground"
                                aria-label={t("delete")}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setDeleteReason("");
                                  setConfirmEvent(e);
                                }}
                              >
                                <Undo2 className="size-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("delete")}</TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {row.kind === "group" && (
                        <div className="opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-within/row:opacity-100 pointer-coarse:opacity-100">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 shrink-0 text-muted-foreground"
                                aria-label={t("deleteAll")}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setDeleteReason("");
                                  setConfirmGroup(row.events);
                                }}
                              >
                                <Undo2 className="size-4" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("deleteAll")}</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={key} className="group flex items-center gap-3 py-2.5">
                  <span className="relative inline-flex shrink-0">
                    <BehaviorEmoji code={e.emoji} label={e.name} className="size-8" />
                    <span
                      className={cn(
                        "absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-card px-0.5",
                        "text-[10px] font-bold tabular-nums leading-none",
                        positive
                          ? "bg-success text-success-foreground"
                          : "bg-destructive text-destructive-foreground"
                      )}
                    >
                      {formatPoints(e.points)}
                    </span>
                  </span>

                  <div className="min-w-0 flex-1">
                    {primaryLabel ? (
                      <>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {primaryLabel}
                          {e.source && <AutoChip source={e.source} />}
                        </p>
                        <TypographyMuted className="truncate text-xs">
                          {e.name} · {formatTime(e.createdAt)}
                        </TypographyMuted>
                      </>
                    ) : (
                      <>
                        <p className="truncate text-sm font-medium text-foreground">
                          {e.name}
                          {e.source && <AutoChip source={e.source} />}
                        </p>
                        <TypographyMuted className="text-xs">{formatTime(e.createdAt)}</TypographyMuted>
                      </>
                    )}

                    {row.kind === "single" && editing && (
                      <NoteEditor
                        initial={e.note ?? ""}
                        onSave={(note) => {
                          onSaveNote(e, note);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                    {row.kind === "single" && !editing && e.note && (
                      <div className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                        {e.note}
                      </div>
                    )}
                  </div>

                  {row.kind === "single" && actionStyle === "menu" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-label={t("rowActions")}
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingId(e.id)}>
                          <MessageSquarePlus className="size-4" aria-hidden />
                          {e.note ? t("editNote") : t("addNote")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setDeleteReason("");
                            setConfirmEvent(e);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {row.kind === "group" && actionStyle === "menu" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground"
                      aria-label={t("deleteAll")}
                      onClick={() => {
                        setDeleteReason("");
                        setConfirmGroup(row.events);
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
        );
      })}

      <AlertDialog
        open={confirmEvent !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmEvent(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteEventTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteEventDescription", {
                name: confirmEvent?.name ?? "",
                points: confirmEvent ? formatPoints(confirmEvent.points) : "",
              })}
              {confirmEvent?.source && t("autoEventNote")}
              {requireDeleteReason && t("requireReasonNote")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DeleteReasonField
            value={deleteReason}
            onChange={setDeleteReason}
            required={requireDeleteReason}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={requireDeleteReason && deleteReason.trim().length === 0}
              onClick={() => {
                if (confirmEvent) onDelete(confirmEvent, deleteReason.trim() || undefined);
                setConfirmEvent(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmGroup !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmGroup(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteGroupTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteGroupDescription", { count: confirmGroup?.length ?? 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <DeleteReasonField value={deleteReason} onChange={setDeleteReason} />
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const reason = deleteReason.trim() || undefined;
                if (confirmGroup) confirmGroup.forEach((ev) => onDelete(ev, reason));
                setConfirmGroup(null);
              }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
