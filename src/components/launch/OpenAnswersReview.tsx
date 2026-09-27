"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gradeOpenAnswerAction, listOpenAnswersAction } from "@/server/actions/assess-sessions";
import type { OpenAnswer } from "@/lib/live-session";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   OCHIQ JAVOBLAR — qoʻlda baholash (0 / ½ / 1).

   Faqat ochiq javob boʻlsagina chiqadi. Baholanmaganlari jurnalga 0
   boʻlib tushadi — shuning uchun ularning soni «Jurnalga» tugmasidan
   OLDIN, koʻzga tashlanadigan joyda turadi.

   `onGraded` — natija ekrani foizni qayta hisoblashi uchun: baho
   qoʻyilgach oʻquvchining foizi darhol oʻzgaradi.
   ════════════════════════════════════════════════════════════════════ */

const SCORE_STEPS: { value: 0 | 0.5 | 1; label: string }[] = [
  { value: 0, label: "0" },
  { value: 0.5, label: "½" },
  { value: 1, label: "1" },
];

export function OpenAnswersReview({
  sessionId,
  defaultOpen = false,
  onGraded,
}: {
  sessionId: string;
  defaultOpen?: boolean;
  onGraded?: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const [answers, setAnswers] = useState<OpenAnswer[] | null>(null);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    let alive = true;
    listOpenAnswersAction(sessionId)
      .then((rows) => alive && setAnswers(rows))
      .catch(() => alive && setAnswers([]));
    return () => {
      alive = false;
    };
  }, [sessionId]);

  if (!answers || answers.length === 0) return null;
  const pending = answers.filter((a) => a.score === null).length;

  async function grade(responseId: string, score: 0 | 0.5 | 1) {
    const previous = answers?.find((a) => a.responseId === responseId)?.score ?? null;
    setAnswers((prev) => prev?.map((a) => (a.responseId === responseId ? { ...a, score } : a)) ?? prev);
    try {
      await gradeOpenAnswerAction({ responseId, score });
      onGraded?.();
    } catch {
      // Server qabul qilmadi — ekran haqiqatdan chetga chiqmasin.
      setAnswers(
        (prev) =>
          prev?.map((a) => (a.responseId === responseId ? { ...a, score: previous } : a)) ?? prev,
      );
    }
  }

  // Savol boʻyicha guruhlash — bir savolga kelgan javoblar yonma-yon oʻqiladi.
  const groups = new Map<string, OpenAnswer[]>();
  for (const a of answers) groups.set(a.activityId, [...(groups.get(a.activityId) ?? []), a]);

  return (
    <div className="flex flex-col rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-foreground">
          {t("openAnswersTitle", { count: answers.length })}
        </span>
        <span className="flex items-center gap-2">
          <span className={cn("text-caption", pending ? "text-warning" : "text-muted-foreground")}>
            {pending ? t("openAnswersPendingShort", { count: pending }) : t("openAnswersAllGraded")}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-fast",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      {open && (
        <div className="flex max-h-80 flex-col gap-4 overflow-y-auto border-t border-border px-4 py-3">
          {[...groups.values()].map((list) => (
            <div key={list[0].activityId} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-foreground">{list[0].question}</p>
              {list[0].sample && (
                <p className="rounded-md bg-muted px-2 py-1 text-caption text-muted-foreground">
                  {t("openAnswersSample", { sample: list[0].sample })}
                </p>
              )}
              {list.map((a) => (
                <div key={a.responseId} className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-caption font-medium text-muted-foreground">{a.studentName}</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">{a.text}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {SCORE_STEPS.map((step) => (
                      <Button
                        key={step.value}
                        size="icon-sm"
                        variant={a.score === step.value ? "default" : "outline"}
                        aria-pressed={a.score === step.value}
                        onClick={() => void grade(a.responseId, step.value)}
                      >
                        {step.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
