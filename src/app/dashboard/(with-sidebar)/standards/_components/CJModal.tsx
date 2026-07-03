"use client";

import { useEffect, useMemo, useState } from "react";
import { Scale, Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OPEN_TASK, SCRIPTS } from "@/lib/diagnostics";
import { CLASS_DATA } from "@/lib/grades-data";
import { rankScripts, nextPair, type Judgement } from "@/lib/cj-ranking";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standardId: string;
  standardDesc: string;
};

const STUDENT_NAME = new Map(
  Object.values(CLASS_DATA).flatMap((c) => c.students.map((s) => [s.id, s.name] as const)),
);

export default function CJModal({ open, onOpenChange, standardId, standardDesc }: Props) {
  // Demo insho banki — mavjud CJ seed (OPEN_TASK/SCRIPTS).
  const scripts = SCRIPTS;
  const scriptById = useMemo(() => new Map(scripts.map((s) => [s.id, s])), [scripts]);
  const ids = useMemo(() => scripts.map((s) => s.id), [scripts]);

  const [judgements, setJudgements] = useState<Judgement[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (open) {
      setJudgements([]);
      setShowResults(false);
    }
  }, [open]);

  const pair = useMemo(() => nextPair(ids, judgements), [ids, judgements]);
  const done = pair === null;
  const ranks = useMemo(() => rankScripts(ids, judgements), [ids, judgements]);
  const atResults = showResults || done;

  // Jami juftlar va progres.
  const totalPairs = (ids.length * (ids.length - 1)) / 2;
  const progress = totalPairs ? Math.round((judgements.length / totalPairs) * 100) : 0;

  function choose(winnerId: string) {
    if (!pair) return;
    setJudgements((prev) => [...prev, { leftId: pair[0], rightId: pair[1], winnerId }]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Scale className="size-4 text-muted-foreground" aria-hidden />
            Qiyosiy baholash — {standardId}
          </DialogTitle>
          <DialogDescription className="mt-1">
            Ikki ishdan qaysi biri standartni yaxshiroq qondiradi? Tanlang. Mutlaq ball emas —
            taqqoslashlardan ishonchli tartib (ranking) hosil boʻladi.
          </DialogDescription>
        </div>

        {!atResults ? (
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption text-muted-foreground italic line-clamp-2">«{OPEN_TASK.prompt}»</p>
              <Badge variant="outline" className="shadow-none shrink-0 tabular-nums">{progress}%</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pair!.map((sid) => {
                const sc = scriptById.get(sid)!;
                return (
                  <button
                    key={sid}
                    type="button"
                    onClick={() => choose(sid)}
                    className="group text-left rounded-xl border border-border bg-card p-4 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer flex flex-col gap-3 min-h-[180px]"
                  >
                    <span className="text-caption font-medium text-muted-foreground">Ish #{ids.indexOf(sid) + 1}</span>
                    <p className="text-body text-foreground/90 leading-relaxed flex-1">{sc.content}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Bu yaxshiroq <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-caption text-muted-foreground text-center">
              {judgements.length} ta taqqoslash · {totalPairs - judgements.length} ta qoldi
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-warning-foreground" aria-hidden />
              <span className="heading-small">Reyting natijasi</span>
              <Badge variant="outline" className="shadow-none tabular-nums">{judgements.length} taqqoslash</Badge>
            </div>
            <ul className="space-y-2 max-h-[46vh] overflow-y-auto">
              {ranks.map((r, i) => {
                const sc = scriptById.get(r.scriptId)!;
                return (
                  <li key={r.scriptId} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <span className={cn(
                      "shrink-0 size-7 rounded-full flex items-center justify-center text-sm font-bold tabular-nums",
                      i === 0 ? "bg-warning/15 text-warning-foreground" : "bg-muted text-muted-foreground",
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{STUDENT_NAME.get(sc.studentId) ?? "Oʻquvchi"}</span>
                        <Badge variant="outline" className="shadow-none tabular-nums shrink-0">
                          {Math.round(r.score * 100)}% gʻalaba
                        </Badge>
                      </div>
                      <p className="text-caption text-muted-foreground line-clamp-2">{sc.content}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t border-border">
          {atResults && !done && (
            <Button variant="outline" className="shadow-none gap-1.5" onClick={() => setShowResults(false)}>
              <RotateCcw className="size-4" aria-hidden />
              Davom etish
            </Button>
          )}
          {!atResults && judgements.length > 0 && (
            <Button variant="outline" className="shadow-none" onClick={() => setShowResults(true)}>
              Natijani koʻrish
            </Button>
          )}
          <DialogClose asChild>
            <Button>Yopish</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
