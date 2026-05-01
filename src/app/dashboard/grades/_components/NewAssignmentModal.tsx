"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WEIGHT_COLORS,
  WEIGHT_LABELS,
  type AssignmentWeight,
  type Topic,
} from "@/lib/grades-data";

type Props = {
  topics: Topic[];
  onClose: () => void;
  onCreate: (input: {
    title: string;
    maxScore: number;
    weight: AssignmentWeight;
    topicId: string;
  }) => void;
};

export default function NewAssignmentModal({
  topics,
  onClose,
  onCreate,
}: Props) {
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [weight, setWeight] = useState<AssignmentWeight>("normal");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");

  const weights: AssignmentWeight[] = ["light", "normal", "heavy", "exam"];

  function submit() {
    if (!title.trim() || !topicId) return;
    onCreate({ title: title.trim(), maxScore, weight, topicId });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Yangi topshiriq</h3>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          <Field label="Sarlavha">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="masalan: 1-bob: Tinglab tushunish"
              autoFocus
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
          </Field>

          <Field label="Mavzu">
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30 cursor-pointer"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Maksimal ball">
            <input
              type="number"
              min={1}
              max={1000}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value) || 100)}
              className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-foreground/30"
            />
          </Field>

          <Field label="Vazn (turi)">
            <div className="grid grid-cols-2 gap-2">
              {weights.map((w) => {
                const c = WEIGHT_COLORS[w];
                const selected = w === weight;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeight(w)}
                    className={cn(
                      "flex items-center gap-2 px-3 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                      selected
                        ? cn(c.bg, c.text, "ring-2", c.ring, "border-transparent")
                        : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        c.bg.replace("100", "500").replace("dark:bg-", "bg-")
                      )}
                    />
                    {WEIGHT_LABELS[w]}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Og&apos;irroq vaznlar yakuniy bahoga ko&apos;proq ta&apos;sir qiladi.
            </p>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 h-9 text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 h-9 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="size-4" />
            Yaratish
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
