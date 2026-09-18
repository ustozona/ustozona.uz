"use client";

import { useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ════════════════════════════════════════════════════════════════════
   KOʻRIB CHIQISH ROʻYXATI — boʻlim va dars importida umumiy: oʻquvchi
   importidagi kabi ⠿ · № · nom maydoni · oʻchirish. Tartib ⠿ tutqichidan
   sudrab tuzatiladi; jadval ramkasi va belgilash yoʻq.
   ════════════════════════════════════════════════════════════════════ */

export type NameRow = { key: string; title: string };

export const newRowKey = () => Math.random().toString(36).slice(2, 10);

export function NameReviewList({ rows, onChange, label, placeholder, deleteLabel, badge, isMuted }: {
  rows: NameRow[];
  /** Qator yonidagi kichik belgi (masalan «Bor»). */
  badge?: (row: NameRow) => string | null;
  /** Saqlanmaydigan qator (xira koʻrinadi). */
  isMuted?: (row: NameRow) => boolean;
  onChange: (rows: NameRow[]) => void;
  label: string;
  placeholder: string;
  deleteLabel: string;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const move = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const from = rows.findIndex((r) => r.key === fromKey);
    const to = rows.findIndex((r) => r.key === toKey);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <Label className="shrink-0">{label}</Label>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-hover pr-1">
        {rows.map((r, i) => (
          <div
            key={r.key}
            onDragOver={(e) => { e.preventDefault(); if (dragKey) move(dragKey, r.key); }}
            className={cn("grid grid-cols-[16px_24px_1fr_auto] items-center gap-2 rounded-md", (dragKey === r.key || isMuted?.(r)) && "opacity-50")}
          >
            <span
              draggable
              onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragKey(r.key); }}
              onDragEnd={() => setDragKey(null)}
              className="cursor-grab text-muted-foreground active:cursor-grabbing"
              aria-hidden
            >
              <GripVertical className="size-4" />
            </span>
            <span className="text-body tabular-nums text-muted-foreground">{i + 1}</span>
            <div className="relative min-w-0">
            <Input
              value={r.title}
              onChange={(e) => onChange(rows.map((x) => (x.key === r.key ? { ...x, title: e.target.value } : x)))}
              placeholder={placeholder}
              className={cn("h-9", badge?.(r) && "pr-14")}
            />
            {badge?.(r) && (
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-muted px-1.5 py-0.5 text-tag text-muted-foreground">
                {badge(r)}
              </span>
            )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
              className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={deleteLabel}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
