"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  PlugZap,
  RadioReceiver,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { PultPlan } from "@/lib/launch-types";
import { pultPlanAction } from "@/server/actions/assess-runs";
import { publishPult, unpublishPult } from "@/lib/doska/remote-bus";

/* ════════════════════════════════════════════════════════════════════
   PULT REJIMI — radio pultlar bilan test, natija Ustozona jurnaliga.

   Qurilma: Arduino + 433 MHz qabul qilgich (LessonLab `arduino/`),
   noutbukka USB bilan ulanadi. Brauzer uni Web Serial orqali oʻqiydi
   (Chrome/Edge, kompyuter). Qabul qilgich ikki formatdan birini
   chiqaradi — ikkalasi ham qabul qilinadi:

       {"pult":5,"button":"B"}     ← hozirgi sketch (RUN rejimi)
       ID:5,BTN:B                  ← eski format

   PULT RAQAMI = JURNALDAGI TARTIB RAQAMI (QR-karta va OMR varagʻi
   bilan bir xil qoida) — bogʻlash jadvali kerak emas.

   Oqim: savol katta koʻrinadi → bolalar tugma bosadi (kim javob bergani
   koʻrinadi, HARF yashirin — proyektorda bir-birinikini koʻrmasin) →
   «Javobni koʻrsatish» (taqsimot + toʻgʻri variant; shundan keyin
   oʻzgartirib boʻlmaydi) → «Keyingi». Oxirida «Saqlash» → javoblar
   qogʻoz varaq bilan AYNAN bir yoʻldan yoziladi
   (`/api/baholash/scan/apply` → `applyOmrScan`), raqamlanish ham
   oʻsha (`buildPultPlan`). Jurnalga yozish — natija ekranida.

   Yigʻilgan javoblar localStorage'da ham turadi: dars oʻrtasida sahifa
   tasodifan yopilsa, qayta ochilganda tiklanadi.
   ════════════════════════════════════════════════════════════════════ */

type SerialPortLike = {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};
type SerialLike = {
  requestPort(): Promise<SerialPortLike>;
  /** Ilgari ruxsat berilgan portlar — bosishsiz qayta ulanish uchun. */
  getPorts?(): Promise<SerialPortLike[]>;
};

function serialApi(): SerialLike | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { serial?: SerialLike }).serial ?? null;
}

/** Qabul qilgich satri → {pult, harf}. Izoh (`#`), `ERR`, `PONG` — `null`. */
export function parsePultSignal(line: string): { pult: number; letter: string } | null {
  const text = line.trim();
  if (!text || text.startsWith("#")) return null;
  const json = text.match(/"pult"\s*:\s*(\d+)\s*,\s*"button"\s*:\s*"([A-Da-d])"/);
  if (json) return { pult: Number(json[1]), letter: json[2].toUpperCase() };
  const legacy = text.match(/ID:(\d+),BTN:([A-Da-d])/);
  if (legacy) return { pult: Number(legacy[1]), letter: legacy[2].toUpperCase() };
  return null;
}

/** savol raqami → oʻquvchi tartib raqami → harf */
type Answers = Record<number, Record<number, string>>;

const LETTERS = ["A", "B", "C", "D"] as const;
/** Apply endpoint bitta soʻrovda 60 tagacha varaq qabul qiladi. */
const APPLY_CHUNK = 60;

function storageKey(setId: string, classId: string) {
  return `ustozona_pult_${setId}_${classId}`;
}

export function PultRunner({
  setId,
  classId,
  onClose,
  onSaved,
}: {
  setId: string;
  classId: string;
  onClose: () => void;
  /** Javoblar yozildi — natija ekranini ochish uchun. */
  onSaved: (sessionId: string) => void;
}) {
  const t = useTranslations("LaunchHub");
  const [plan, setPlan] = useState<PultPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [revealed, setRevealed] = useState<number[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [conn, setConn] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [lastSignal, setLastSignal] = useState<{ text: string; at: number } | null>(null);
  const [flash, setFlash] = useState<{ no: number; at: number } | null>(null);

  // Signal belgisi va chaqnash oʻz-oʻzidan soʻnadi (render ichida vaqt
  // oʻqilmaydi — u toza boʻlishi kerak).
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(timer);
  }, [flash]);
  useEffect(() => {
    if (!lastSignal) return;
    const timer = setTimeout(() => setLastSignal(null), 4000);
    return () => clearTimeout(timer);
  }, [lastSignal]);
  const [manualFor, setManualFor] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const readingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    pultPlanAction({ setId, classId })
      .then((res) => {
        if (!alive) return;
        if (!res.ok) return setError(res.message);
        setPlan(res.data);
        // Tugallanmagan dars — tiklanadi.
        try {
          const saved = localStorage.getItem(storageKey(setId, classId));
          if (saved) {
            const parsed = JSON.parse(saved) as { answers?: Answers; revealed?: number[] };
            if (parsed.answers) setAnswers(parsed.answers);
            if (parsed.revealed) setRevealed(parsed.revealed);
          }
        } catch {
          /* xususiy rejim yoki buzuq yozuv — boshidan */
        }
      })
      .catch(() => alive && setError(t("loadFailed")));
    return () => {
      alive = false;
    };
  }, [setId, classId, t]);

  // Har oʻzgarishda saqlanadi — sahifa yopilsa ham dars yoʻqolmasin.
  useEffect(() => {
    if (!plan) return;
    try {
      localStorage.setItem(storageKey(setId, classId), JSON.stringify({ answers, revealed }));
    } catch {
      /* joy yoʻq yoki xususiy rejim — faqat xotirada davom etadi */
    }
  }, [answers, revealed, plan, setId, classId]);

  const questions = useMemo(() => (plan?.questions ?? []).filter((q) => q.gradable), [plan]);
  const question = questions[qIndex] ?? null;
  const entered = useMemo(() => new Set(plan?.alreadyEntered ?? []), [plan]);
  const rosterByNo = useMemo(() => new Map((plan?.roster ?? []).map((r) => [r.no, r])), [plan]);

  /* Seriya oqimi uzoq yashaydi — joriy savol va qulf holatini ref
     orqali oʻqiydi (yopilish ichida eskirgan qiymat qolmasin). */
  const liveRef = useRef({ question, revealed, rosterByNo, entered });
  useLayoutEffect(() => {
    liveRef.current = { question, revealed, rosterByNo, entered };
  }, [question, revealed, rosterByNo, entered]);

  const handleSignal = useCallback(
    (pult: number, letter: string) => {
      const { question: q, revealed: locked, rosterByNo: roster, entered: done } = liveRef.current;
      const student = roster.get(pult);
      if (!student) {
        setLastSignal({ text: t("pultUnknownRemote", { no: pult }), at: Date.now() });
        return;
      }
      if (done.has(student.id)) {
        setLastSignal({ text: t("pultAlreadyEntered", { name: student.name }), at: Date.now() });
        return;
      }
      if (!q || locked.includes(q.no)) return;
      setAnswers((prev) => ({ ...prev, [q.no]: { ...(prev[q.no] ?? {}), [pult]: letter } }));
      setFlash({ no: pult, at: Date.now() });
      setLastSignal({ text: t("pultLastSignal", { no: pult }), at: Date.now() });
    },
    [t],
  );

  const disconnect = useCallback(async () => {
    readingRef.current = false;
    try {
      await readerRef.current?.cancel();
    } catch {
      /* allaqachon yopilgan */
    }
    readerRef.current = null;
    try {
      await portRef.current?.close();
    } catch {
      /* allaqachon yopilgan */
    }
    portRef.current = null;
  }, []);

  useEffect(() => () => void disconnect(), [disconnect]);

  async function connect(given?: SerialPortLike) {
    const serial = serialApi();
    if (!serial) {
      setConn("error");
      toast.error(t("pultUnsupported"));
      return;
    }
    setConn("connecting");
    try {
      const port = given ?? (await serial.requestPort());
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      // O'rganish rejimida qolib ketgan boʻlsa — sinf rejimiga.
      try {
        const writer = port.writable?.getWriter();
        await writer?.write(new TextEncoder().encode("RUN\n"));
        writer?.releaseLock();
      } catch {
        /* eski sketch buyruqni bilmasligi mumkin — zararsiz */
      }
      if (!port.readable) throw new Error("no readable");
      const decoder = new TextDecoderStream();
      void port.readable.pipeTo(decoder.writable as unknown as WritableStream<Uint8Array>).catch(() => {});
      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      readingRef.current = true;
      setConn("connected");

      let buffer = "";
      while (readingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const signal = parsePultSignal(line);
          if (signal) handleSignal(signal.pult, signal.letter);
        }
      }
      if (readingRef.current) setConn("error");
    } catch (e) {
      // Foydalanuvchi port tanlash oynasini yopdi — xato emas.
      if (e instanceof DOMException && e.name === "NotFoundError") {
        setConn("idle");
        return;
      }
      setConn("error");
      toast.error(t("pultConnectFailed"));
    }
  }

  function setManual(no: number, letter: string | null) {
    if (!question || revealed.includes(question.no)) return;
    setAnswers((prev) => {
      const current = { ...(prev[question.no] ?? {}) };
      if (letter) current[no] = letter;
      else delete current[no];
      return { ...prev, [question.no]: current };
    });
    setManualFor(null);
  }

  const current = useMemo<Record<number, string>>(
    () => (question ? (answers[question.no] ?? {}) : {}),
    [answers, question],
  );
  const answeredCount = Object.keys(current).length;
  const available = (plan?.roster ?? []).filter((r) => !entered.has(r.id));
  const isRevealed = question ? revealed.includes(question.no) : false;
  const hasAnything = Object.values(answers).some((m) => Object.keys(m).length > 0);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const letter of Object.values(current)) counts[letter] = (counts[letter] ?? 0) + 1;
    return counts;
  }, [current]);

  async function save() {
    if (!plan) return;
    // Oʻquvchi → {savol raqami: harf}. Javob bermagan savol yozilmaydi (boʻsh).
    const byStudent = new Map<number, Record<string, string>>();
    for (const [qNo, perStudent] of Object.entries(answers)) {
      for (const [studentNo, letter] of Object.entries(perStudent)) {
        const row = byStudent.get(Number(studentNo)) ?? {};
        row[qNo] = letter;
        byStudent.set(Number(studentNo), row);
      }
    }
    const sheets = [...byStudent.entries()]
      .map(([no, map]) => ({ student: rosterByNo.get(no), answers: map }))
      .filter((s): s is { student: { no: number; id: string; name: string }; answers: Record<string, string> } =>
        Boolean(s.student) && !entered.has(s.student!.id),
      )
      .map((s) => ({ studentId: s.student.id, answers: s.answers }));
    if (sheets.length === 0) {
      toast.info(t("pultNoAnswers"));
      return;
    }

    setSaving(true);
    try {
      let sessionId = "";
      let added = 0;
      for (let i = 0; i < sheets.length; i += APPLY_CHUNK) {
        const res = await fetch("/api/baholash/scan/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setId, classId, sheets: sheets.slice(i, i + APPLY_CHUNK) }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok: true; report: { sessionId: string; studentsAdded: number } }
          | { ok: false; message?: string }
          | null;
        if (!res.ok || !data || !data.ok) {
          throw new Error((data && "message" in data ? data.message : null) ?? t("actionFailed"));
        }
        sessionId = data.report.sessionId;
        added += data.report.studentsAdded;
      }
      try {
        localStorage.removeItem(storageKey(setId, classId));
      } catch {
        /* ahamiyatsiz */
      }
      toast.success(t("pultSaved", { count: added }));
      await disconnect();
      onSaved(sessionId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("actionFailed"));
    } finally {
      setSaving(false);
    }
  }

  function requestClose() {
    if (hasAnything) setConfirmExit(true);
    else {
      void disconnect();
      onClose();
    }
  }

  /* Bosishsiz qayta ulanish: brauzer qabul qilgichga ilgari ruxsat bergan
     boʻlsa (`getPorts`), port tanlash oynasisiz ulanadi. Birinchi marta
     ruxsat — baribir «Qurilmani ulash» bilan (brauzer qoidasi). Doskadan
     telefon orqali ochilganda oʻqituvchi kompyuterga qaytmasligi uchun. */
  const connectRef = useRef<((port: SerialPortLike) => Promise<void>) | null>(null);
  useEffect(() => {
    connectRef.current = connect;
  });
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const serial = serialApi();
    serial
      ?.getPorts?.()
      .then((ports) => {
        if (ports[0]) void connectRef.current?.(ports[0]);
      })
      .catch(() => {});
  }, []);

  /* Ustoz pulti — telefon savolni oʻtkazadi va javobni ochadi
     (`lib/doska/remote-bus.ts`). Klaviatura bilan bir xil amallar. */
  useEffect(() => {
    if (!plan) return;
    publishPult(
      {
        next: () => setQIndex((i) => Math.min(i + 1, Math.max(questions.length - 1, 0))),
        prev: () => setQIndex((i) => Math.max(i - 1, 0)),
        reveal: () => {
          if (question && !revealed.includes(question.no)) setRevealed((prev) => [...prev, question.no]);
        },
      },
      {
        title: plan.title,
        index: qIndex,
        total: questions.length,
        answered: answeredCount,
        rosterSize: available.length,
        revealed: isRevealed,
        connected: conn === "connected",
      },
    );
  });
  useEffect(() => () => unpublishPult(), []);

  // Klaviatura: ← → savollar, Space — javobni koʻrsatish.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight") setQIndex((i) => Math.min(i + 1, Math.max(questions.length - 1, 0)));
      else if (e.key === "ArrowLeft") setQIndex((i) => Math.max(i - 1, 0));
      else if (e.key === " " && question && !revealed.includes(question.no)) {
        e.preventDefault();
        setRevealed((prev) => [...prev, question.no]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions.length, question, revealed]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("mode_pult")}
      className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in-0 duration-fast"
    >
      {/* Sarlavha */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground/75">
          <RadioReceiver className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-title text-foreground">{plan?.title ?? t("mode_pult")}</h1>
          <p className="truncate text-caption text-muted-foreground">
            {plan ? `${plan.className} · ${t("pultRule")}` : t("loading")}
          </p>
        </div>
        <ConnectionBadge state={conn} />
        {conn !== "connected" && (
          <Button size="sm" onClick={() => void connect()} loading={conn === "connecting"}>
            {conn !== "connecting" && <PlugZap />}
            {t("pultConnect")}
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={requestClose} aria-label={t("close")}>
          <X />
        </Button>
      </div>

      {!plan && !error && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {plan && questions.length === 0 && (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {t("needsMcq")}
        </div>
      )}

      {plan && question && (
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:overflow-hidden">
          {/* Savol — proyektorda oʻqiladigan oʻlchamda */}
          <section className="flex min-h-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 lg:overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <span className="text-label text-muted-foreground">
                {t("pultQuestion", { current: qIndex + 1, total: questions.length })}
              </span>
              <span className="text-caption text-muted-foreground">
                {t("pultAnswered", { count: answeredCount, total: available.length })}
              </span>
            </div>
            <p className="text-headline whitespace-pre-wrap text-foreground">{question.stem}</p>
            {question.truncated && <p className="text-caption text-warning">{t("pultTruncated")}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => {
                const correct = isRevealed && question.correct.includes(option.letter);
                const count = distribution[option.letter] ?? 0;
                return (
                  <div
                    key={option.letter}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-4 transition-colors duration-fast",
                      correct ? "border-success/50 bg-success/10" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-title",
                        correct ? "bg-success text-success-foreground" : "bg-muted text-foreground",
                      )}
                    >
                      {option.letter}
                    </span>
                    <span className="min-w-0 flex-1 text-body text-foreground">{option.text}</span>
                    {isRevealed && (
                      <span className="shrink-0 font-mono text-title text-muted-foreground">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
            {isRevealed && (
              <p className="text-sm font-medium text-success">
                {t("pultCorrect", { letters: question.correct.join(", ") })}
              </p>
            )}
          </section>

          {/* Sinf — kim javob berdi (harf javob ochilguncha yashirin) */}
          <section className="flex min-h-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:overflow-y-auto">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-label text-muted-foreground">{t("rosterTitle")}</h2>
              <p className="text-caption text-muted-foreground">{t("pultManualHint")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {plan.roster.map((student) => {
                const letter = current[student.no];
                const done = entered.has(student.id);
                const flashing = flash?.no === student.no;
                const right = isRevealed && letter && question.correct.includes(letter);
                return (
                  <button
                    key={student.id}
                    type="button"
                    disabled={done || isRevealed}
                    onClick={() => setManualFor(manualFor === student.no ? null : student.no)}
                    title={done ? t("pultAlreadyEntered", { name: student.name }) : undefined}
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors duration-fast",
                      done
                        ? "border-dashed border-border opacity-50"
                        : letter
                          ? isRevealed
                            ? right
                              ? "border-success/40 bg-success/10"
                              : "border-destructive/40 bg-destructive/10"
                            : "border-info/40 bg-info/10"
                          : "border-border hover:bg-muted/50",
                      flashing && "ring-2 ring-info/50",
                      manualFor === student.no && "ring-2 ring-foreground/30",
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-caption text-muted-foreground">
                      {student.no}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-caption text-foreground">
                      {student.name}
                    </span>
                    {letter && (
                      <span className="shrink-0 font-mono text-caption font-semibold text-foreground">
                        {isRevealed ? letter : "✓"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {manualFor !== null && !isRevealed && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
                <span className="text-caption text-muted-foreground">
                  {t("pultManualFor", { name: rosterByNo.get(manualFor)?.name ?? "" })}
                </span>
                {LETTERS.slice(0, Math.max(question.options.length, 1)).map((letter) => (
                  <Button key={letter} size="icon-sm" variant="outline" onClick={() => setManual(manualFor, letter)}>
                    {letter}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => setManual(manualFor, null)}>
                  {t("pultClear")}
                </Button>
              </div>
            )}
            {plan.alreadyEntered.length > 0 && (
              <p className="text-caption text-muted-foreground">
                {t("pultAlreadyNote", { count: plan.alreadyEntered.length })}
              </p>
            )}
          </section>
        </div>
      )}

      {/* Boshqaruv */}
      {plan && question && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-muted/20 px-5 py-3">
          <Button
            variant="outline"
            className="shadow-none"
            disabled={qIndex === 0}
            onClick={() => setQIndex((i) => Math.max(i - 1, 0))}
          >
            <ChevronLeft />
            {t("pultPrev")}
          </Button>
          <span className="min-w-0 flex-1 truncate text-caption text-muted-foreground">
            {lastSignal?.text ?? ""}
          </span>
          {!isRevealed && (
            <Button
              variant="outline"
              className="shadow-none"
              onClick={() => setRevealed((prev) => [...prev, question.no])}
            >
              <Eye />
              {t("pultReveal")}
            </Button>
          )}
          {qIndex < questions.length - 1 ? (
            <Button onClick={() => setQIndex((i) => i + 1)}>
              {t("pultNext")}
              <ChevronRight />
            </Button>
          ) : (
            <Button loading={saving} disabled={saving || !hasAnything} onClick={() => void save()}>
              {!saving && <Save />}
              {t("pultFinish")}
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={confirmExit} onOpenChange={setConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pultExitTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("pultExitDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("pultExitStay")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void disconnect();
                onClose();
              }}
            >
              {t("pultExitLeave")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body,
  );
}

function ConnectionBadge({ state }: { state: "idle" | "connecting" | "connected" | "error" }) {
  const t = useTranslations("LaunchHub");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-caption",
        state === "connected"
          ? "border-success/30 text-success"
          : state === "error"
            ? "border-destructive/30 text-destructive"
            : "border-border text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          state === "connected"
            ? "animate-pulse bg-success"
            : state === "error"
              ? "bg-destructive"
              : "bg-muted-foreground/50",
        )}
      />
      {t(`pultState_${state}`)}
    </span>
  );
}
