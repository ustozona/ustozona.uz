"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PushButton from "@/app/play/_components/PushButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  gameShellUrlAction,
  getLiveStateAction,
  getSessionContentAction,
  joinSessionAction,
  listRosterByCodeAction,
  submitResponseAction,
} from "@/server/actions/play";
import type { PlaySessionContent } from "@/server/dal/play/content";
import { SlideView } from "@/components/slides/SlideView";
import { stageThemeBg } from "@/lib/stage-themes";
import { STUDENT_POLL_MS, type LiveState } from "@/lib/live-session";

/* Ishtirokchi ekrani — `data-surface="handheld"` (proxy.ts orqali
   avtomatik teglangan, 17px/48px shkala). Akkauntsiz: token
   localStorage'da saqlanadi, bazada faqat hash (play/session.ts). */

type Roster = { id: string; name: string };
type Phase = "loading" | "join" | "playing" | "done";

function tokenKey(joinCode: string) {
  return `ustozona_play_token_${joinCode}`;
}

export default function PlayView({ joinCode }: { joinCode: string }) {
  /* `?game=<qobiq>` — oʻqituvchi «Jonli oʻyin» tanlagan boʻlsa havolada
     keladi. Qobiq LessonLab domenida turadi, savolni esa BU YERDAN
     (`/api/play/content`) oladi va javobni shu yerga yozadi. Shuning
     uchun oʻyin ekrani bilan oddiy ekran orasida hech qanday maʼlumot
     farqi yoʻq — faqat koʻrinish boshqa.

     Qobiq ochilmasa (sozlanmagan, notoʻgʻri nom, tarmoq yoʻq) —
     oʻquvchi oddiy ekranda davom etadi. Oʻyin hech qachon test
     topshirishga TOʻSIQ boʻlmasligi kerak. */
  const gameShell = (useSearchParams().get("game") ?? "").trim();
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

  /* ── JONLI REJIM (R284) ──
     Qadamni oʻqituvchi boshqaradi: qurilma har ~1,5 s da joriy qadamni
     soʻraydi. «Keyingisi» tugmasi yoʻq; javobdan keyin oʻquvchi kutadi,
     oʻqituvchi javobni ochganda natijasini koʻradi. */
  const live = content?.mode === "live";
  const [liveState, setLiveState] = useState<LiveState | null>(null);
  /** activityId → javob natijasi (true/false; moslashtirishda null — tugatdi). */
  const [liveAnswers, setLiveAnswers] = useState<Record<string, boolean | null>>({});
  const [liveStepSeen, setLiveStepSeen] = useState<number | null>(null);
  /** Soʻz buluti maydoni. */
  const [wordText, setWordText] = useState("");

  useEffect(() => {
    if (phase !== "playing" || !live) return;
    const token = localStorage.getItem(tokenKey(joinCode));
    if (!token) return;
    let cancelled = false;
    const tick = () =>
      getLiveStateAction(token)
        .then((state) => {
          if (cancelled) return;
          setLiveState(state);
          if (state.ended) setPhase("done");
        })
        .catch(() => {});
    void tick();
    const timer = setInterval(tick, STUDENT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, live, joinCode]);

  // Oʻqituvchi qadamni almashtirsa — tanlovlar tozalanadi (render paytida,
  // effektsiz: holat oldingi qadam raqami bilan solishtiriladi).
  const liveIndex = liveState && content ? Math.min(liveState.index, content.steps.length - 1) : null;
  if (live && liveIndex !== null && liveIndex !== liveStepSeen) {
    setLiveStepSeen(liveIndex);
    setStepIndex(liveIndex);
    setSelectedOption(null);
    setMatchedLeftIds(new Set());
    setPickedLeftId(null);
    setWordText("");
  }

  /** Qobiqqa oʻtish. `true` qaytsa — sahifa almashdi, davom etmang.

      `useCallback` — chunki uni `useEffect` ichida chaqiramiz va
      har renderda yangi funksiya yaratilsa effekt qayta ishga tushardi. */
  const redirectToShell = useCallback(
    async (token: string): Promise<boolean> => {
      if (!gameShell) return false;
      try {
        const url = await gameShellUrlAction({
          shellId: gameShell,
          token,
          origin: window.location.origin,
        });
        if (!url) return false;
        window.location.href = url;
        return true;
      } catch {
        return false; // qobiq ochilmadi — oddiy ekranda davom etamiz
      }
    },
    [gameShell]
  );

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
        .then(async (c) => {
          // Qaytib kelgan oʻquvchi ham qobiqqa tushsin — aks holda
          // sahifani yangilash oʻyindan oddiy ekranga tashlab yuborardi.
          if (await redirectToShell(existingToken)) return;
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
  }, [joinCode, loadRoster, redirectToShell]);

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
      if (await redirectToShell(result.token)) return;
      const c = await getSessionContentAction(result.token);
      setContent(c);
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Qoʻshilishda xatolik");
    }
  }

  /** Jonli sessiyada sahifa yangilangach oʻquvchi allaqachon javob bergan
      savolni yana koʻradi. Server «allaqachon yuborilgan» desa, bu xato
      emas — ekran «javob qabul qilindi» holatiga oʻtadi. */
  function handleLiveDuplicate(e: unknown, activityId: string): boolean {
    if (!live || !(e instanceof Error) || e.message !== "Javob allaqachon yuborilgan") return false;
    setError(null);
    setLiveAnswers((prev) => ({ ...prev, [activityId]: prev[activityId] ?? null }));
    return true;
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
      setError(null);
      if (live) setLiveAnswers((prev) => ({ ...prev, [step.activityId]: Boolean(isCorrect) }));
      else advanceStep(content);
    } catch (e) {
      if (handleLiveDuplicate(e, step.activityId)) return;
      setError(e instanceof Error ? e.message : "Yuborishda xatolik");
    } finally {
      setSubmitting(false);
    }
  }

  /** Soʻrovnoma yoki soʻz buluti — baholanmaydi, ball qoʻshilmaydi. */
  async function handleOpinionSubmit(answer: Record<string, unknown>) {
    if (!content) return;
    const step = content.steps[stepIndex];
    if (step.kind !== "poll" && step.kind !== "wordcloud" && step.kind !== "text") return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem(tokenKey(joinCode))!;
      await submitResponseAction({ token, itemId: step.itemId, answer });
      setError(null);
      if (live) setLiveAnswers((prev) => ({ ...prev, [step.activityId]: null }));
      else {
        setWordText("");
        advanceStep(content);
      }
    } catch (e) {
      if (handleLiveDuplicate(e, step.activityId)) return;
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
        if (live) setLiveAnswers((prev) => ({ ...prev, [step.activityId]: null }));
        else advanceStep(content);
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

    if (live && !liveState) {
      return (
        <div className="flex h-screen items-center justify-center p-6 text-center text-muted-foreground">
          Oʻqituvchi boshlashini kuting…
        </div>
      );
    }

    const liveAnswer = live ? liveAnswers[step.activityId] : undefined;
    const liveDone = live && step.activityId in liveAnswers;
    // Soʻrovnoma/soʻz bulutida «toʻgʻri javob» yoʻq — natija ochilgach ham javob mumkin.
    const graded = step.kind === "mcq" || step.kind === "pairs" || step.kind === "text";
    const liveLocked = live && (liveDone || (graded && Boolean(liveState?.revealed)));
    const liveNote = !live ? null : liveDone ? (
      liveState?.revealed ? (
        liveAnswer === null ? (
          <p className="text-center text-lg font-semibold">Javob ochildi — doskaga qarang</p>
        ) : liveAnswer ? (
          <p className="text-center text-2xl font-semibold text-success">✓ Toʻgʻri!</p>
        ) : (
          <p className="text-center text-2xl font-semibold text-destructive">✗ Notoʻgʻri</p>
        )
      ) : (
        <p className="text-center text-muted-foreground">Javobingiz qabul qilindi — kuting</p>
      )
    ) : liveState?.revealed && graded ? (
      <p className="text-center text-muted-foreground">Javob vaqti tugadi</p>
    ) : null;

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
                disabled={liveLocked}
                onClick={() => setSelectedOption(option.id)}
              >
                {option.text}
              </PushButton>
            ))}
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {liveNote ?? (
            <PushButton disabled={!selectedOption || submitting} onClick={handleMcqNext}>
              {live ? "Javob berish" : stepIndex + 1 < content.steps.length ? "Keyingisi" : "Yakunlash"}
            </PushButton>
          )}
        </div>
      );
    }

    // Taqdimot slaydi — javob yoʻq, serverga hech narsa yozilmaydi.
    if (step.kind === "slide") {
      return (
        <div className="flex h-screen flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground">
            {stepIndex + 1} / {content.steps.length}
          </p>
          {/* Muharrir va Doska bilan bir xil renderer — slayd hamma joyda
              bir xil koʻrinadi. Telefonda 16:9 sahna ekran eniga choʻziladi. */}
          <div className="flex flex-1 items-center">
            <div
              className="quiz-stage"
              style={{ "--stage-bg": stageThemeBg(step.bg ?? content.stageTheme ?? "") } as React.CSSProperties}
            >
              <SlideView
                slide={{
                  layout: step.layout,
                  title: step.title,
                  body: step.body,
                  imageUrl: step.imageUrl,
                  videoUrl: step.videoUrl,
                }}
              />
            </div>
          </div>
          {live ? (
            <p className="text-center text-sm text-muted-foreground">
              Keyingi slaydga oʻqituvchi oʻtkazadi
            </p>
          ) : (
            <PushButton onClick={() => advanceStep(content)}>
              {stepIndex + 1 < content.steps.length ? "Keyingisi" : "Yakunlash"}
            </PushButton>
          )}
        </div>
      );
    }

    // Soʻrovnoma — variant tanlanadi, toʻgʻri/notoʻgʻri koʻrsatilmaydi.
    if (step.kind === "poll") {
      return (
        <div className="flex h-screen flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground">
            {stepIndex + 1} / {content.steps.length} · Soʻrovnoma
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
                disabled={liveLocked}
                onClick={() => setSelectedOption(option.id)}
              >
                {option.text}
              </PushButton>
            ))}
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {liveNote ?? (
            <PushButton
              disabled={!selectedOption || submitting}
              onClick={() => selectedOption && handleOpinionSubmit({ optionId: selectedOption })}
            >
              Yuborish
            </PushButton>
          )}
        </div>
      );
    }

    // Soʻz buluti — bitta qisqa soʻz; doskada koʻp yozilgani kattaroq chiqadi.
    if (step.kind === "wordcloud") {
      const text = wordText.trim();
      return (
        <div className="flex h-screen flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground">
            {stepIndex + 1} / {content.steps.length} · Soʻz buluti
          </p>
          <h1 className="text-xl font-semibold leading-snug">{step.stem}</h1>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <input
              value={wordText}
              onChange={(e) => setWordText(e.target.value)}
              maxLength={40}
              disabled={liveLocked}
              placeholder="Bitta soʻz yoki qisqa ibora"
              className="h-14 rounded-xl border-2 border-border bg-card px-4 text-lg outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && text && !submitting) void handleOpinionSubmit({ text });
              }}
            />
            <p className="text-right text-xs text-muted-foreground">{wordText.length}/40</p>
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {liveNote ?? (
            <PushButton disabled={!text || submitting} onClick={() => handleOpinionSubmit({ text })}>
              Yuborish
            </PushButton>
          )}
        </div>
      );
    }

    // Ochiq javob — erkin matn; bahoni oʻqituvchi keyin qoʻyadi.
    if (step.kind === "text") {
      const text = wordText.trim();
      return (
        <div className="flex h-screen flex-col gap-6 p-6">
          <p className="text-sm text-muted-foreground">
            {stepIndex + 1} / {content.steps.length} · Ochiq javob
          </p>
          <h1 className="text-xl font-semibold leading-snug">{step.stem}</h1>
          <div className="flex flex-1 flex-col gap-2">
            <textarea
              value={wordText}
              onChange={(e) => setWordText(e.target.value)}
              maxLength={2000}
              disabled={liveLocked}
              placeholder="Javobingizni yozing…"
              className="min-h-40 flex-1 resize-none rounded-xl border-2 border-border bg-card p-4 text-base outline-none focus:border-primary"
            />
            <p className="text-right text-xs text-muted-foreground">{wordText.length}/2000</p>
          </div>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {liveNote ?? (
            <PushButton disabled={!text || submitting} onClick={() => handleOpinionSubmit({ text })}>
              Yuborish
            </PushButton>
          )}
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
                  disabled={matched || !pickedLeftId || submitting || liveLocked}
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
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {liveNote}
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
