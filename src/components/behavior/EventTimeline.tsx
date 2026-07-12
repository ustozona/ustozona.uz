"use client";

import * as React from "react";
import { MoreVertical, StickyNote, Trash2, Undo2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
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
  const [text, setText] = React.useState(initial);
  return (
    <div className="mt-1.5 space-y-1.5">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        rows={2}
        autoFocus
        placeholder="Izoh yozing…"
      />
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-7" onClick={() => onSave(text)}>
          Saqlash
        </Button>
        <Button size="sm" variant="ghost" className="h-7" onClick={onCancel}>
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}

export function EventTimeline({
  events,
  nameById,
  actionStyle = "menu",
  onDelete,
  onSaveNote,
  className,
}: {
  events: BehaviorEvent[];
  /** Berilsa — har yozuvda oʻquvchi ismi ham chiqadi ("Ballar" paneli). */
  nameById?: Map<string, string>;
  actionStyle?: "menu" | "inline";
  onDelete: (event: BehaviorEvent) => void;
  /** Boʻsh matn = izohni olib tashlash. */
  onSaveNote: (event: BehaviorEvent, note: string) => void;
  className?: string;
}) {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmEvent, setConfirmEvent] = React.useState<BehaviorEvent | null>(null);

  /* Yangi → eski; sana boʻyicha guruhlar (date-key desc). */
  const groups = React.useMemo(() => {
    const sorted = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const byDate = new Map<string, BehaviorEvent[]>();
    for (const e of sorted) {
      const list = byDate.get(e.date);
      if (list) list.push(e);
      else byDate.set(e.date, [e]);
    }
    return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [events]);

  return (
    <div className={cn("space-y-4", className)}>
      {groups.map(([date, list]) => (
        <div key={date}>
          <p className="text-label font-semibold uppercase text-muted-foreground">
            {formatDateLabel(date)}
          </p>
          <div className="mt-1 divide-y divide-border/60">
            {list.map((e) => {
              const positive = e.points > 0;
              const studentName = nameById?.get(e.studentId);
              const editing = editingId === e.id;
              return (
                <div key={e.id} className="flex items-start gap-3 py-2.5">
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
                    <p className="truncate text-sm font-medium text-foreground">
                      {formatPoints(e.points)} · {e.name}
                    </p>
                    <TypographyMuted className="text-xs">
                      {formatTime(e.createdAt)}
                      {studentName ? ` · ${studentName}` : ""}
                    </TypographyMuted>

                    {editing ? (
                      <NoteEditor
                        initial={e.note ?? ""}
                        onSave={(note) => {
                          onSaveNote(e, note);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      e.note && (
                        <div className="mt-1.5 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                          {e.note}
                        </div>
                      )
                    )}

                    {actionStyle === "inline" && !editing && (
                      <div className="mt-1 flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => setEditingId(e.id)}
                        >
                          <StickyNote className="size-3.5" aria-hidden />
                          {e.note ? "Izohni tahrirlash" : "Izoh qoʻshish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => onDelete(e)}
                        >
                          <Undo2 className="size-3.5" aria-hidden />
                          Bekor qilish
                        </Button>
                      </div>
                    )}
                  </div>

                  {actionStyle === "menu" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground"
                          aria-label="Yozuv amallari"
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingId(e.id)}>
                          <StickyNote className="size-4" aria-hidden />
                          {e.note ? "Izohni tahrirlash" : "Izoh qoʻshish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setConfirmEvent(e)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Oʻchirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <AlertDialog
        open={confirmEvent !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmEvent(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yozuvni oʻchirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              «{confirmEvent?.name}» ({confirmEvent ? formatPoints(confirmEvent.points) : ""})
              yozuvi oʻchiriladi va balansdan olib tashlanadi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmEvent) onDelete(confirmEvent);
                setConfirmEvent(null);
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
