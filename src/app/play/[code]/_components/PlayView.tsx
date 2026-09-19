"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { unwrap } from "@/lib/action-result";
import type { PlaySessionContent } from "@/server/dal/play/content";
import { SlideView } from "@/components/slides/SlideView";
import { stageThemeVars } from "@/lib/stage-themes";
import { stageFontVars } from "@/lib/stage-fonts";
import { STAGE_FONT_CLASS } from "@/components/stage/stage-font-faces";
import { STUDENT_POLL_MS, type LiveState } from "@/lib/live-session";
import {
  ChoiceGrid,
  ChoiceTile,
  ResultBanner,
  StageCounter,
  StageProgress,
  type ChoiceState,
} from "@/components/stage/StageParts";
import { cn } from "@/lib/utils";

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
  /* Qoʻshilishdan OLDINGI ikki holat alohida: «bunday kod yoʻq» va
     «serverga ulanib boʻlmadi». Ilgari ikkalasi `error` + boʻsh roʻyxatdan
     taxmin qilinardi va boʻsh sinfda ism tanlanmasa ham «Kod topilmadi»
     chiqardi. */
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  /* Sahna shrifti butun oʻyin ekraniga (qoʻshilish, savollar, natija,
     portal ichidagi menyular ham) — shuning uchun har `return` shoxini
     oʻramasdan `body` ga qoʻyiladi va sahifadan chiqqanda olib tashlanadi. */
  const stageFont = content?.stageFont;
  useEffect(() => {
    const body = document.body;
    const classes = ["stage-font", ...STAGE_FONT_CLASS.split(" ")];
    const vars = Object.entries(stageFontVars(stageFont));
    body.classList.add(...classes);
    for (const [k, v] of vars) body.style.setProperty(k, String(v));
    return () => {
      body.classList.remove(...classes);
      for (const [k] of vars) body.style.removeProperty(k);
    };
  }, [stageFont]);
  const [liveState, setLiveState] = useState<LiveState | null>(null);

  /* KLAVIATURA 1–6 — kompyuter sinfida variantni raqam bilan tanlash
     (plitkadagi raqam). Faqat test va soʻrovnoma ekranida, javob
     qulflanmagan boʻlsa; matn maydonida yozilayotgan raqam ushlanmaydi.
     Tinglovchi bir marta ulanadi, joriy holat ref orqali oʻqiladi. */
  const digitKeyRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => digitKeyRef.current?.(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  /** activityId → javob natijasi (true/false; moslashtirishda null — tugatdi). */
  const [liveAnswers, setLiveAnswers] = useState<Record<string, boolean | null>>({});
  const [liveStepSeen, setLiveStepSeen] = useState<number | null>(null);
  /** Soʻz buluti maydoni. */
  const [wordText, setWordText] = useState("");
  /** Oʻz tezligidagi rejim: javob yuborilgach shu savolning natija ekrani. */
  const [reveal, setReveal] = useState<{
    activityId: string;
    correctIds: string[];
    isCorrect: boolean | null;
  } | null>(null);

  useEffect(() => {
    digitKeyRef.current = (e) => {
      if (phase !== "playing" || !content || submitting) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const step = content.steps[stepIndex];
      if (!step || (step.kind !== "mcq" && step.kind !== "poll")) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > Math.min(6, step.options.length)) return;
      const answered = live
        ? step.activityId in liveAnswers || (step.kind === "mcq" && Boolean(liveState?.revealed))
        : reveal?.activityId === step.activityId;
      if (answered) return;
      e.preventDefault();
      setSelectedOption(step.options[n - 1].id);
    };
  });

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
      .then((res) => {
        if (!res.ok) return setLoadError(res.message);
        if (res.data === null) return setNotFound(true);
        setRoster(res.data);
        setPhase("join");
      })
      // Tarmoq uzilishi — kod notoʻgʻri degani emas, qayta urinish beriladi.
      .catch(() => setLoadError("Internet aloqasini tekshirib, qayta urinib koʻring."));
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
      const result = unwrap(
        await joinSessionAction({
          joinCode,
          studentId: student.id,
          displayName: student.name,
        }),
      );
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
      emas — ekran «javob qabul qilindi» holatiga oʻtadi. Matnni solishtirish
      faqat `unwrap()` tufayli ishlaydi: xato mijozda otiladi va matni
      saqlanadi (prodda serverdan otilgan xato matni yashirinadi). */
  function handleLiveDuplicate(e: unknown, activityId: string): boolean {
    if (!live || !(e instanceof Error) || e.message !== "Javob allaqachon yuborilgan") return false;
    setError(null);
    setLiveAnswers((prev) => ({ ...prev, [activityId]: prev[activityId] ?? null }));
    return true;
  }

  function advanceStep(c: PlaySessionContent) {
    setSelectedOption(null);
    setReveal(null);
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
      const { isCorrect, correctOptionIds } = unwrap(
        await submitResponseAction({
          token,
          itemId: step.itemId,
          answer: { optionId: selectedOption },
        }),
      );
      setAnsweredCount((n) => n + 1);
      if (isCorrect) {
        setCorrectCount((n) => n + 1);
        setPoints((p) => p + 100 * step.pointsMultiplier);
      }
      setError(null);
      if (live) setLiveAnswers((prev) => ({ ...prev, [step.activityId]: Boolean(isCorrect) }));
      // Oʻz tezligida — darhol keyingisiga EMAS, natija ekraniga: toʻgʻri
      // variant yashil, xato tanlov qizil, keyin «Keyingisi».
      else setReveal({ activityId: step.activityId, correctIds: correctOptionIds ?? [], isCorrect });
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
      unwrap(await submitResponseAction({ token, itemId: step.itemId, answer }));
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
      const { isCorrect } = unwrap(
        await submitResponseAction({
          token,
          itemId: pickedLeftId,
          answer: { matchedId: rightItemId },
        }),
      );
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

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">Kod topilmadi</p>
        <p className="text-muted-foreground">Ekrandagi kodni tekshirib, qayta kiriting.</p>
        {/* Oʻquvchi kodni qoʻlda yozgan boʻlsa (`/play`), bir harf xatosi
            uni boshi berk sahifada qoldirmasin. */}
        <a href="/play" className="font-medium underline underline-offset-4">
          Kodni qayta kiritish
        </a>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-semibold">Ulanib boʻlmadi</p>
        <p className="text-muted-foreground">{loadError}</p>
        <PushButton
          block={false}
          onClick={() => {
            setLoadError(null);
            loadRoster();
          }}
        >
          Qayta urinish
        </PushButton>
      </div>
    );
  }

  if (phase === "loading") {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Yuklanmoqda...</div>;
  }

  /* Kod toʻgʻri, lekin sinfga hali oʻquvchi yozilmagan — tanlaydigan ism
     yoʻq. Boʻsh roʻyxat va «Boshlash» tugmasi oʻquvchini chalgʻitardi. */
  if (phase === "join" && roster.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">Sinf roʻyxati boʻsh</p>
        <p className="text-muted-foreground">
          Kod toʻgʻri, lekin bu sinfga hali oʻquvchi qoʻshilmagan. Oʻqituvchingizga ayting.
        </p>
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
          <ResultBanner kind="info" inline>
            Javob ochildi — doskaga qarang
          </ResultBanner>
        ) : liveAnswer ? (
          <ResultBanner kind="correct" inline>
            Toʻgʻri!
          </ResultBanner>
        ) : (
          <ResultBanner kind="wrong" inline>
            Notoʻgʻri
          </ResultBanner>
        )
      ) : (
        <p className="text-center text-white/85">Javobingiz qabul qilindi — kuting</p>
      )
    ) : liveState?.revealed && graded ? (
      <ResultBanner kind="timeout" inline>
        Javob vaqti tugadi
      </ResultBanner>
    ) : null;

    const errorNote = error && (
      <p className="rounded-lg bg-white/90 px-3 py-2 text-center text-sm text-destructive">{error}</p>
    );
    const screen = (label: string | null, children: React.ReactNode) => (
      <div
        className="stage-screen flex flex-col gap-5 p-5"
        data-stage-style={content.stageStyle ?? "classic"}
        style={stageThemeVars(content.stageTheme ?? "")}
      >
        <div className="flex flex-col gap-2">
          <StageProgress total={content.steps.length} current={stepIndex} />
          {label && <p className="text-sm text-white/80">{label}</p>}
        </div>
        {children}
      </div>
    );

    /* Toʻgʻri variantlar — javob ochilganda plitkalar boʻyaladi: toʻgʻri
       yashil ✓, oʻquvchi tanlagan xato qizil ✗, qolganlari xira. Jonli
       rejimda oʻqituvchi ochgandagina keladi (getLiveState), oʻz tezligida
       — javob yuborilgach (submitResponse). */
    const revealIds: string[] | null =
      step.kind !== "mcq"
        ? null
        : live
          ? liveState?.revealed && liveState.revealedActivityId === step.activityId
            ? (liveState.correctOptionIds ?? [])
            : null
          : reveal?.activityId === step.activityId
            ? reveal.correctIds
            : null;
    const tileState = (optionId: string): ChoiceState => {
      if (revealIds) {
        if (revealIds.includes(optionId)) return "correct";
        return optionId === selectedOption ? "wrong" : "ghost";
      }
      if (!selectedOption) return "idle";
      return optionId === selectedOption ? "selected" : "dim";
    };

    if (step.kind === "mcq") {
      const selfReveal = !live && reveal?.activityId === step.activityId ? reveal : null;
      // «+ball» — zamonaviy uslubda toʻgʻri plitkada, faqat oʻzi toʻgʻri topgan boʻlsa.
      const earned =
        content.stageStyle === "modern" && (live ? liveAnswer === true : selfReveal?.isCorrect)
          ? 100 * step.pointsMultiplier
          : 0;
      return screen(
        null,
        <>
          <StageCounter current={stepIndex} total={content.steps.length} />
          <h1 className="stage-stem-pill text-xl">{step.stem}</h1>
          <ChoiceGrid count={step.options.length} layout={step.answerLayout}>
            {step.options.map((option, i) => (
              <ChoiceTile
                key={option.id}
                index={i}
                state={tileState(option.id)}
                points={earned && tileState(option.id) === "correct" ? earned : undefined}
                disabled={liveLocked || Boolean(selfReveal) || submitting}
                onClick={() => setSelectedOption(option.id)}
              >
                {option.text}
              </ChoiceTile>
            ))}
          </ChoiceGrid>
          {errorNote}
          {selfReveal ? (
            <>
              <ResultBanner kind={selfReveal.isCorrect ? "correct" : "wrong"} inline>
                {selfReveal.isCorrect ? "Toʻgʻri!" : "Notoʻgʻri"}
              </ResultBanner>
              <PushButton onClick={() => advanceStep(content)}>
                {stepIndex + 1 < content.steps.length ? "Keyingisi" : "Yakunlash"}
              </PushButton>
            </>
          ) : (
            (liveNote ?? (
              <PushButton disabled={!selectedOption || submitting} onClick={handleMcqNext}>
                {live ? "Javob berish" : "Javobni tekshirish"}
              </PushButton>
            ))
          )}
        </>,
      );
    }

    // Taqdimot slaydi — javob yoʻq, serverga hech narsa yozilmaydi.
    if (step.kind === "slide") {
      return screen(
        null,
        <>
          {/* Muharrir va Doska bilan bir xil renderer — slayd hamma joyda
              bir xil koʻrinadi. Telefonda 16:9 sahna ekran eniga choʻziladi. */}
          <div className="flex flex-1 items-center">
            <div className="quiz-stage" style={stageThemeVars(step.bg ?? content.stageTheme ?? "")}>
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
            <p className="text-center text-sm text-white/80">Keyingi slaydga oʻqituvchi oʻtkazadi</p>
          ) : (
            <PushButton onClick={() => advanceStep(content)}>
              {stepIndex + 1 < content.steps.length ? "Keyingisi" : "Yakunlash"}
            </PushButton>
          )}
        </>,
      );
    }

    // Soʻrovnoma — variant tanlanadi, toʻgʻri/notoʻgʻri koʻrsatilmaydi.
    if (step.kind === "poll") {
      return screen(
        "Soʻrovnoma",
        <>
          <StageCounter current={stepIndex} total={content.steps.length} />
          <h1 className="stage-stem-pill text-xl">{step.stem}</h1>
          <ChoiceGrid count={step.options.length} layout={step.answerLayout}>
            {step.options.map((option, i) => (
              <ChoiceTile
                key={option.id}
                index={i}
                state={tileState(option.id)}
                disabled={liveLocked || submitting}
                onClick={() => setSelectedOption(option.id)}
              >
                {option.text}
              </ChoiceTile>
            ))}
          </ChoiceGrid>
          {errorNote}
          {liveNote ?? (
            <PushButton
              disabled={!selectedOption || submitting}
              onClick={() => selectedOption && handleOpinionSubmit({ optionId: selectedOption })}
            >
              Yuborish
            </PushButton>
          )}
        </>,
      );
    }

    // Soʻz buluti — bitta qisqa soʻz; doskada koʻp yozilgani kattaroq chiqadi.
    if (step.kind === "wordcloud") {
      const text = wordText.trim();
      return screen(
        "Soʻz buluti",
        <>
          <StageCounter current={stepIndex} total={content.steps.length} />
          <h1 className="stage-stem-pill text-xl">{step.stem}</h1>
          <div className="flex flex-1 flex-col justify-center gap-2">
            <input
              value={wordText}
              onChange={(e) => setWordText(e.target.value)}
              maxLength={40}
              disabled={liveLocked}
              placeholder="Bitta soʻz yoki qisqa ibora"
              className="h-14 rounded-xl border-2 border-transparent bg-card px-4 text-lg text-foreground outline-none focus:border-white"
              onKeyDown={(e) => {
                if (e.key === "Enter" && text && !submitting) void handleOpinionSubmit({ text });
              }}
            />
            <p className="text-right text-xs text-white/80">{wordText.length}/40</p>
          </div>
          {errorNote}
          {liveNote ?? (
            <PushButton disabled={!text || submitting} onClick={() => handleOpinionSubmit({ text })}>
              Yuborish
            </PushButton>
          )}
        </>,
      );
    }

    // Ochiq javob — erkin matn; bahoni oʻqituvchi keyin qoʻyadi.
    if (step.kind === "text") {
      const text = wordText.trim();
      return screen(
        "Ochiq javob",
        <>
          <StageCounter current={stepIndex} total={content.steps.length} />
          <h1 className="stage-stem-pill text-xl">{step.stem}</h1>
          <div className="flex flex-1 flex-col gap-2">
            <textarea
              value={wordText}
              onChange={(e) => setWordText(e.target.value)}
              maxLength={2000}
              disabled={liveLocked}
              placeholder="Javobingizni yozing…"
              className="min-h-40 flex-1 resize-none rounded-xl border-2 border-transparent bg-card p-4 text-base text-foreground outline-none focus:border-white"
            />
            <p className="text-right text-xs text-white/80">{wordText.length}/2000</p>
          </div>
          {errorNote}
          {liveNote ?? (
            <PushButton disabled={!text || submitting} onClick={() => handleOpinionSubmit({ text })}>
              Yuborish
            </PushButton>
          )}
        </>,
      );
    }

    // pairs — tegib moslashtirish: chapdan bittani tanlang, keyin oʻngdagi juftini bosing.
    const pairCard = "min-h-14 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors";
    return screen(
      "Moslashtiring",
      <>
        <div className="grid flex-1 grid-cols-2 content-start gap-3">
          <div className="flex flex-col gap-2">
            {step.left.map((l) => {
              const matched = matchedLeftIds.has(l.itemId);
              return (
                <button
                  key={l.itemId}
                  type="button"
                  disabled={matched}
                  onClick={() => setPickedLeftId(l.itemId)}
                  className={cn(
                    pairCard,
                    matched
                      ? "bg-white/15 text-white/60 line-through"
                      : pickedLeftId === l.itemId
                        ? "bg-card text-foreground ring-4 ring-white"
                        : "bg-card/90 text-foreground hover:bg-card",
                  )}
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
                  className={cn(
                    pairCard,
                    matched
                      ? "bg-white/15 text-white/60 line-through"
                      : "bg-card/90 text-foreground hover:bg-card disabled:opacity-60",
                  )}
                >
                  {r.text}
                </button>
              );
            })}
          </div>
        </div>
        {errorNote}
        {liveNote}
      </>,
    );
  }

  return (
    <div
      className="stage-screen flex flex-col items-center justify-center gap-3 p-6 text-center"
      data-stage-style={content?.stageStyle ?? "classic"}
      style={stageThemeVars(content?.stageTheme ?? "")}
    >
      <h1 className="text-3xl font-semibold">Tabriklaymiz!</h1>
      <p className="stage-stem-pill text-3xl">{points} ball</p>
      <p className="text-lg text-white/85">
        {correctCount} / {answeredCount} toʻgʻri
      </p>
    </div>
  );
}
