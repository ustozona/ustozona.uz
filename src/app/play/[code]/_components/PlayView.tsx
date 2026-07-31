"use client";

import { useCallback, useEffect, useState } from "react";
import PushButton from "@/app/play/_components/PushButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSessionContentAction,
  joinSessionAction,
  listRosterByCodeAction,
  submitResponseAction,
} from "@/server/actions/play";
import type { PlaySessionContent } from "@/server/dal/play/content";

/* Ishtirokchi ekrani — `data-surface="handheld"` (proxy.ts orqali
   avtomatik teglangan, 17px/48px shkala). Akkauntsiz: token
   localStorage'da saqlanadi, bazada faqat hash (play/session.ts). */

type Roster = { id: string; name: string };
type Phase = "loading" | "join" | "playing" | "done";

function tokenKey(joinCode: string) {
  return `ustozona_play_token_${joinCode}`;
}

export default function PlayView({ joinCode }: { joinCode: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [roster, setRoster] = useState<Roster[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<PlaySessionContent | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  /* Ball — FAQAT oʻyin ekrani uchun (docs/ost-loyihalar-arxitektura.md
     R33): "Ikki barobar"/"Ballsiz" shu yerda koʻrinadi, lekin jurnalga
     koʻchadigan baho har doim foizga normalizatsiya qilinadi va bu
     koeffitsiyentga bogʻliq emas — ikkalasi mustaqil daftar. */
  const [points, setPoints] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [matchedLeftIds, setMatchedLeftIds] = useState<Set<string>>(new Set());
  const [pickedLeftId, setPickedLeftId] = useState<string | null>(null);

  const loadRoster = useCallback(() => {
    listRosterByCodeAction(joinCode)
      .then((r) => {
        setRoster(r);
        setPhase("join");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Kod topilmadi"));
  }, [joinCode]);

  useEffect(() => {
    const existingToken = localStorage.getItem(tokenKey(joinCode));
    if (existingToken) {
      getSessionContentAction(existingToken)
        .then((c) => {
          setContent(c);
          setPhase("playing");
        })
        .catch(() => {
          localStorage.removeItem(tokenKey(joinCode));
          loadRoster();
        });
    } else {
      loadRoster();
    }
  }, [joinCode, loadRoster]);

  async function handleJoin() {
    const student = roster.find((r) => r.id === selectedStudentId);
    if (!student) {
      setError("Ismingizni tanlang");
      return;
    }
    setError(null);
    try {
      const result = await joinSessionAction({
        joinCode,
        studentId: student.id,
        displayName: student.name,
      });
      localStorage.setItem(tokenKey(joinCode), result.token);
      const c = await getSessionContentAction(result.token);
      setContent(c);
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qoʻshilishda xatolik");
    }
  }

  function advanceStep(c: PlaySessionContent) {
    setSelectedOption(null);
    setMatchedLeftIds(new Set());
    setPickedLeftId(null);
    if (stepIndex + 1 < c.steps.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setPhase("done");
    }
  }

  async function handleMcqNext() {
    if (!content || !selectedOption) return;
    const step = content.steps[stepIndex];
    if (step.kind !== "mcq") return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem(tokenKey(joinCode))!;
      const { isCorrect } = await submitResponseAction({
        token,
        itemId: step.itemId,
        answer: { optionId: selectedOption },
      });
      setAnsweredCount((n) => n + 1);
      if (isCorrect) {
        setCorrectCount((n) => n + 1);
        setPoints((p) => p + 100 * step.pointsMultiplier);
      }
      advanceStep(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePairPick(rightItemId: string) {
    if (!content || !pickedLeftId || submitting) return;
    const token = localStorage.getItem(tokenKey(joinCode));
    if (!token) return;
    const currentStep = content.steps[stepIndex];
    setSubmitting(true);
    try {
      const { isCorrect } = await submitResponseAction({
        token,
        itemId: pickedLeftId,
        answer: { matchedId: rightItemId },
      });
      setAnsweredCount((n) => n + 1);
      if (isCorrect) {
        setCorrectCount((n) => n + 1);
        if (currentStep.kind === "pairs") setPoints((p) => p + 100 * currentStep.pointsMultiplier);
      }
      const nextMatched = new Set(matchedLeftIds);
      nextMatched.add(pickedLeftId);
      setMatchedLeftIds(nextMatched);
      setPickedLeftId(null);
      const step = content.steps[stepIndex];
      if (step.kind === "pairs" && nextMatched.size >= step.left.length) {
        advanceStep(content);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "loading") {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  if (error && phase === "join" && roster.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">Kod topilmadi</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (phase === "join") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 p-6">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h1 className="text-center text-2xl font-bold">Qoʻshilish — {joinCode}</h1>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Ismingizni tanlang" />
            </SelectTrigger>
            <SelectContent>
              {roster.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <PushButton onClick={handleJoin}>Boshlash</PushButton>
        </div>
      </div>
    );
  }

  if (phase === "playing" && content) {
    if (content.steps.length === 0) {
      return (
        <div className="flex h-screen items-center justify-center text-center text-muted-foreground">
          Bu sessiyada hali savol yoʻq
        </div>
      );
    }
    const step = content.steps[stepIndex];

    if (step.kind === "mcq") {
      return (
        <div className="flex h-screen flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground">
            {stepIndex + 1} / {content.steps.length}
          </p>
          <h1 className="text-xl font-semibold leading-snug">{step.stem}</h1>
          <div className="flex flex-1 flex-col gap-3">
            {step.options.map((option) => (
              <PushButton
                key={option.id}
                pressed={selectedOption === option.id}
                surface={
                  selectedOption === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-card-foreground"
                }
                className="justify-start text-left"
                onClick={() => setSelectedOption(option.id)}
              >
                {option.text}
              </PushButton>
            ))}
          </div>
          <PushButton disabled={!selectedOption || submitting} onClick={handleMcqNext}>
            {stepIndex + 1 < content.steps.length ? "Keyingisi" : "Yakunlash"}
          </PushButton>
        </div>
      );
    }

    // pairs — tegib moslashtirish: chapdan bittani tanlang, keyin oʻngdagi juftini bosing.
    return (
      <div className="flex h-screen flex-col gap-6 p-6">
        <p className="text-sm text-muted-foreground">
          {stepIndex + 1} / {content.steps.length} · Moslashtiring
        </p>
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            {step.left.map((l) => {
              const matched = matchedLeftIds.has(l.itemId);
              return (
                <button
                  key={l.itemId}
                  type="button"
                  disabled={matched}
                  onClick={() => setPickedLeftId(l.itemId)}
                  className={`h-14 rounded-xl border-2 px-3 text-left text-sm font-medium transition-colors ${
                    matched
                      ? "border-transparent bg-muted text-muted-foreground line-through"
                      : pickedLeftId === l.itemId
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted"
                  }`}
                >
                  {l.text}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            {step.right.map((r) => {
              const matched = matchedLeftIds.has(r.itemId);
              return (
                <button
                  key={r.itemId}
                  type="button"
                  disabled={matched || !pickedLeftId || submitting}
                  onClick={() => handlePairPick(r.itemId)}
                  className={`h-14 rounded-xl border-2 px-3 text-left text-sm font-medium transition-colors ${
                    matched
                      ? "border-transparent bg-muted text-muted-foreground line-through"
                      : "border-border hover:bg-muted disabled:opacity-40"
                  }`}
                >
                  {r.text}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold">Tabriklaymiz!</h1>
      <p className="text-3xl font-bold text-primary">{points} ball</p>
      <p className="text-lg text-muted-foreground">
        {correctCount} / {answeredCount} toʻgʻri
      </p>
    </div>
  );
}
