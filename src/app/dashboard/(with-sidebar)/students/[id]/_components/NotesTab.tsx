"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Plus, StickyNote, Smile, AlertCircle, Minus } from "lucide-react";

export type Sentiment = "positive" | "concern" | "neutral";
export type Note = { id: string; text: string; sentiment: Sentiment; time: string };

const SENTIMENT: Record<
  Sentiment,
  { label: string; pill: string; dot: string; icon: React.ComponentType<{ className?: string }> }
> = {
  positive: {
    label: "Ijobiy",
    pill: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: Smile,
  },
  concern: {
    label: "Eʼtibor",
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    dot: "bg-amber-500",
    icon: AlertCircle,
  },
  neutral: {
    label: "Oddiy",
    pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700",
    dot: "bg-slate-400",
    icon: Minus,
  },
};

export default function NotesTab({
  notes,
  onAdd,
}: {
  notes: Note[];
  onAdd: (text: string, sentiment: Sentiment) => void;
}) {
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [filter, setFilter] = useState<Sentiment | "all">("all");

  const visible = filter === "all" ? notes : notes.filter((n) => n.sentiment === filter);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t, sentiment);
    setText("");
    setSentiment("neutral");
  };

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div className="rounded-xl border border-border bg-background p-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bu oʻquvchi haqida qayd qoʻshing…"
          className="min-h-20 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-1.5">
            {(Object.keys(SENTIMENT) as Sentiment[]).map((s) => {
              const cfg = SENTIMENT[s];
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSentiment(s)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                    sentiment === s ? cfg.pill : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="size-3.5" /> {cfg.label}
                </button>
              );
            })}
          </div>
          <Button onClick={submit} disabled={!text.trim()} size="sm" className="shrink-0 font-semibold">
            <Plus className="size-4" /> Qoʻshish
          </Button>
        </div>
      </div>

      {/* Filter */}
      {notes.length > 0 && (
        <div className="flex items-center gap-1.5">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            Hammasi ({notes.length})
          </FilterPill>
          {(Object.keys(SENTIMENT) as Sentiment[]).map((s) => (
            <FilterPill key={s} active={filter === s} onClick={() => setFilter(s)}>
              {SENTIMENT[s].label}
            </FilterPill>
          ))}
        </div>
      )}

      {/* List */}
      {visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><StickyNote /></EmptyMedia>
            <EmptyTitle>{notes.length === 0 ? "Hali qayd yoʻq" : "Bu turdagi qayd yoʻq"}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-2.5">
          {visible.map((n) => {
            const cfg = SENTIMENT[n.sentiment];
            return (
              <div key={n.id} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-foreground">{n.text}</p>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                      cfg.pill
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{n.time}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
