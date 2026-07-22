"use client";

import { useState } from "react";
import { Sparkles, Check, CircleDot, Circle, Wand2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ClassListPanel from "@/components/ClassListPanel";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import { withSidebarPageClass, panelHeaderClass } from "@/components/DashboardPage";
import { cn } from "@/lib/utils";
import { seedClass, MISCONCEPTIONS, type Misconception } from "@/lib/diagnostics";

type DraftOption = { id: string; text: string; isCorrect: boolean; misconceptionId?: string };
type DraftQuestion = { id: string; stem: string; options: DraftOption[]; approved: boolean };

const NONE = "__none__";

/** AI qoralamasi (mock) — standartga mos namuna MCQ'lar. */
function draftFor(standardId: string): DraftQuestion[] {
  return Array.from({ length: 3 }, (_, i) => {
    const n = i + 1;
    return {
      id: `${standardId}-d${n}`,
      stem: `${standardId} boʻyicha diagnostik savol ${n} (AI qoralamasi — tahrirlang)`,
      options: [
        { id: `o${n}-a`, text: "Toʻgʻri javob", isCorrect: true },
        { id: `o${n}-b`, text: "Notoʻgʻri variant 1", isCorrect: false },
        { id: `o${n}-c`, text: "Notoʻgʻri variant 2", isCorrect: false },
        { id: `o${n}-d`, text: "Notoʻgʻri variant 3", isCorrect: false },
      ],
      approved: false,
    };
  });
}

export default function QuizPage() {
  const [storeClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });
  const data = seedClass();

  const [standardId, setStandardId] = useState<string>(data.standards[0]?.id ?? "");
  const [drafts, setDrafts] = useState<DraftQuestion[]>([]);
  const [generated, setGenerated] = useState(false);

  const generate = () => { setDrafts(draftFor(standardId)); setGenerated(true); };

  const setMisconception = (qId: string, optId: string, mId: string) =>
    setDrafts((prev) => prev.map((q) => q.id !== qId ? q : {
      ...q,
      options: q.options.map((o) => o.id === optId ? { ...o, misconceptionId: mId === NONE ? undefined : mId } : o),
    }));

  const toggleApprove = (qId: string) =>
    setDrafts((prev) => prev.map((q) => q.id === qId ? { ...q, approved: !q.approved } : q));

  const approvedCount = drafts.filter((q) => q.approved).length;

  return (
    <>
      <div className="hidden lg:block w-[280px] shrink-0 h-full py-4 pl-4">
        <ClassListPanel page="standards" selectedClassId={storeClassId ?? ""} onSelect={setSelectedClassId} />
      </div>

      <div className={withSidebarPageClass}>
        <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className={cn(panelHeaderClass, "items-center justify-between gap-3 min-h-16")}>
            <div className="flex items-center gap-3 min-w-0">
              <SectionIcon>
                <Sparkles className="size-[18px]" aria-hidden />
              </SectionIcon>
              <div className="min-w-0">
                <CardTitle>Quiz yaratish</CardTitle>
                <TypographyMuted className="text-caption">
                  Ustozona AI qoralama beradi — oʻqituvchi distraktorlarni misconception'ga bogʻlab tasdiqlaydi
                </TypographyMuted>
              </div>
            </div>
            {generated && (
              <Badge variant="outline" className="shadow-none gap-1.5 shrink-0 tabular-nums">
                <Check className="size-3.5 text-success" /> {approvedCount}/{drafts.length} tasdiqlandi
              </Badge>
            )}
          </div>

          {/* Toolbar: standart tanlash + generatsiya */}
          <div className="shrink-0 border-b border-border px-6 py-4 flex items-center gap-3 flex-wrap">
            <Select value={standardId} onValueChange={(v) => { setStandardId(v); setGenerated(false); setDrafts([]); }}>
              <SelectTrigger className="w-[320px] max-w-full">
                <SelectValue placeholder="Standart tanlang" />
              </SelectTrigger>
              <SelectContent>
                {data.standards.map((std) => (
                  <SelectItem key={std.id} value={std.id}>
                    <span className="font-mono text-xs font-bold mr-2">{std.code}</span>
                    <span className="text-muted-foreground">{std.desc.slice(0, 40)}…</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generate} className="gap-2">
              <Wand2 className="size-4" /> Ustozona AI bilan yaratish
            </Button>
          </div>

          {/* Drafts */}
          {!generated ? (
            <Empty className="flex-1">
              <EmptyHeader>
                <EmptyMedia><Illustration name="4" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>Quiz qoralamasi tayyor emas</EmptyTitle>
                <EmptyDescription>
                  Standart tanlab, “Ustozona AI bilan yaratish” tugmasini bosing. AI savol qoralaydi —
                  yakuniy qarorni siz qabul qilasiz.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-6 space-y-4">
                {drafts.map((q, qi) => (
                  <div key={q.id} className={cn("rounded-xl border p-4 space-y-3", q.approved ? "border-success/40 bg-success/5" : "border-border")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="secondary" className="shadow-none shrink-0">Savol {qi + 1}</Badge>
                        <p className="text-body text-foreground">{q.stem}</p>
                      </div>
                      <Button
                        variant={q.approved ? "default" : "outline"}
                        size="sm"
                        className={cn("shadow-none shrink-0 gap-1.5", !q.approved && "")}
                        onClick={() => toggleApprove(q.id)}
                      >
                        <Check className="size-3.5" /> {q.approved ? "Tasdiqlandi" : "Tasdiqlash"}
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-3">
                          {o.isCorrect ? (
                            <CircleDot className="size-4 text-success shrink-0" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                          )}
                          <span className={cn("text-body flex-1 min-w-0", o.isCorrect ? "text-foreground font-medium" : "text-foreground/80")}>
                            {o.text}
                          </span>
                          {!o.isCorrect ? (
                            <Select value={o.misconceptionId ?? NONE} onValueChange={(v) => setMisconception(q.id, o.id, v)}>
                              <SelectTrigger size="sm" className="w-[260px] max-w-full">
                                <SelectValue placeholder="Misconception bogʻlang" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NONE}><span className="text-muted-foreground">— bogʻlanmagan —</span></SelectItem>
                                {MISCONCEPTIONS.map((m: Misconception) => (
                                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="shadow-none border-success/30 text-success shrink-0">Toʻgʻri</Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {!q.approved && q.options.some((o) => !o.isCorrect && !o.misconceptionId) && (
                      <TypographyMuted className="text-caption pl-7">
                        Maslahat: har bir notoʻgʻri variantni misconception'ga bogʻlang — diagnostika shunda ishlaydi.
                      </TypographyMuted>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </>
  );
}
