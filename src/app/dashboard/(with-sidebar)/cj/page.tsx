"use client";

import { useMemo, useState } from "react";
import { Scale, ArrowLeftRight, Trophy, RotateCcw, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TypographyMuted } from "@/components/ui/typography";
import ClassListPanel from "@/components/ClassListPanel";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { withSidebarPageClass, panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { seedClass, OPEN_TASK, SCRIPTS } from "@/lib/diagnostics";

// Tavsiya etilgan minimal taqqoslashlar (15 oʻquvchi uchun ~15–20)
const TARGET_JUDGEMENTS = SCRIPTS.length + 5;
const K = 32; // Elo K-faktor

type Ratings = Record<string, number>;

function pickPair(scriptIds: string[], counts: Record<string, number>): [string, string] {
  // Kam taqqoslangan ishlarga ustunlik
  const sorted = [...scriptIds].sort((a, b) => (counts[a] ?? 0) - (counts[b] ?? 0));
  const left = sorted[0];
  const pool = sorted.filter((id) => id !== left);
  const right = pool[Math.floor(Math.random() * Math.min(pool.length, 4))];
  return Math.random() < 0.5 ? [left, right] : [right, left];
}

export default function CjPage() {
  const [storeClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });
  const data = seedClass();

  const scriptIds = useMemo(() => SCRIPTS.map((s) => s.id), []);
  const studentById = useMemo(
    () => new Map(data.students.map((s) => [s.id, s])),
    [data]
  );
  const scriptById = useMemo(() => new Map(SCRIPTS.map((s) => [s.id, s])), []);

  const [ratings, setRatings] = useState<Ratings>(() => Object.fromEntries(scriptIds.map((id) => [id, 1000])));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [judged, setJudged] = useState(0);
  const [pair, setPair] = useState<[string, string]>(() => pickPair(scriptIds, {}));

  const done = judged >= TARGET_JUDGEMENTS;

  const judge = (winnerId: string, loserId: string) => {
    setRatings((prev) => {
      const rw = prev[winnerId], rl = prev[loserId];
      const ew = 1 / (1 + 10 ** ((rl - rw) / 400));
      return { ...prev, [winnerId]: rw + K * (1 - ew), [loserId]: rl + K * (0 - (1 - ew)) };
    });
    setCounts((prev) => ({ ...prev, [winnerId]: (prev[winnerId] ?? 0) + 1, [loserId]: (prev[loserId] ?? 0) + 1 }));
    const next = judged + 1;
    setJudged(next);
    if (next < TARGET_JUDGEMENTS) setPair(pickPair(scriptIds, { ...counts, [winnerId]: (counts[winnerId] ?? 0) + 1, [loserId]: (counts[loserId] ?? 0) + 1 }));
  };

  const reset = () => {
    setRatings(Object.fromEntries(scriptIds.map((id) => [id, 1000])));
    setCounts({});
    setJudged(0);
    setPair(pickPair(scriptIds, {}));
  };

  // Shkalalangan ball (1–100): reytinglarni min-max normalizatsiya
  const leaderboard = useMemo(() => {
    const vals = Object.values(ratings);
    const min = Math.min(...vals), max = Math.max(...vals);
    return [...scriptIds]
      .map((id) => {
        const sc = scriptById.get(id)!;
        const stu = studentById.get(sc.studentId)!;
        const scaled = max === min ? 50 : Math.round(((ratings[id] - min) / (max - min)) * 99) + 1;
        return { id, student: stu, scaled, count: counts[id] ?? 0 };
      })
      .sort((a, b) => b.scaled - a.scaled);
  }, [ratings, counts, scriptIds, scriptById, studentById]);

  const progress = Math.round((judged / TARGET_JUDGEMENTS) * 100);

  return (
    <>
      <div className="hidden lg:block w-[280px] shrink-0 h-full py-4 pl-4">
        <ClassListPanel page="standards" selectedClassId={storeClassId ?? ""} onSelect={setSelectedClassId} />
      </div>

      <div className={withSidebarPageClass}>
        <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-[4.5rem]")}>
            <div className="flex items-center gap-3 min-w-0">
              <SectionIcon>
                <Scale className="size-[18px]" aria-hidden />
              </SectionIcon>
              <div className="min-w-0">
                <CardTitle>Qiyosiy baholash</CardTitle>
                <TypographyMuted className="text-caption truncate">
                  {OPEN_TASK.prompt}
                </TypographyMuted>
              </div>
            </div>
            <Badge variant="outline" className="shadow-none gap-1.5 shrink-0 tabular-nums">
              {judged}/{TARGET_JUDGEMENTS} taqqoslash
            </Badge>
          </div>

          {/* Progress */}
          <div className="shrink-0 h-1 bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          {!done ? (
            // ── Taqqoslash ekrani ──
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="text-center px-6 pt-6">
                <p className="heading-small text-foreground inline-flex items-center gap-2">
                  <ArrowLeftRight className="size-4 text-primary" /> Qaysi ish yaxshiroq?
                </p>
                <TypographyMuted className="text-caption mt-1">Ikki ishni oʻqing va yaxshirogʻini tanlang — ball qoʻymaysiz</TypographyMuted>
              </div>
              <div className="flex-1 min-h-0 grid md:grid-cols-2 gap-4 p-6">
                {pair.map((id, idx) => {
                  const sc = scriptById.get(id)!;
                  const other = pair[idx === 0 ? 1 : 0];
                  return (
                    <button
                      key={id}
                      onClick={() => judge(id, other)}
                      className="group flex flex-col text-left rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:card-elevation focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="shadow-none">{idx === 0 ? "Chap" : "Oʻng"}</Badge>
                        <span className="text-caption text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                          <Check className="size-3.5 text-primary" /> Buni tanlash
                        </span>
                      </div>
                      <p className="text-body text-foreground/90 leading-relaxed flex-1">{sc.content}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            // ── Natija: shkalalangan ball ──
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="heading-small text-foreground inline-flex items-center gap-2">
                    <Trophy className="size-4 text-warning-foreground" /> Shkalalangan ball
                  </p>
                  <Button variant="outline" size="sm" className="shadow-none gap-2" onClick={reset}>
                    <RotateCcw className="size-3.5" /> Qaytadan
                  </Button>
                </div>
                <TypographyMuted className="text-caption">
                  Taqqoslashlardan hisoblangan (Elo) — mutlaq ball emas, nisbiy sifatga asoslangan
                </TypographyMuted>
                <div className="space-y-2">
                  {leaderboard.map((row, i) => (
                    <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border px-4 py-3">
                      <span className="w-6 text-center font-mono text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                      <Avatar className="size-8"><AvatarFallback className="text-[11px]">{row.student.initials}</AvatarFallback></Avatar>
                      <span className="flex-1 min-w-0 text-body text-foreground truncate">{row.student.name}</span>
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden hidden sm:block">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${row.scaled}%` }} />
                      </div>
                      <Badge variant="outline" className="shadow-none tabular-nums w-12 justify-center">{row.scaled}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </>
  );
}
