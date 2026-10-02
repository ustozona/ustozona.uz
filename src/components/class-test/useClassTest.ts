"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PultPlan, PultQuestion } from "@/lib/launch-types";
import {
  DEFAULT_CLASS_TEST_SETTINGS,
  MAX_TIMER_SEC,
  answersToSheets,
  type ClassTestAnswers,
  type ClassTestPhase,
  type ClassTestSettings,
  type ClassTestSource,
} from "@/lib/class-test";
import { pultPlanAction } from "@/server/actions/assess-runs";

/* ════════════════════════════════════════════════════════════════════
   SINF TESTI — boshqaruv holati (docs/sinf-testi-spec.md).

   Bitta hook ikki manbaga xizmat qiladi: QR-karta (javob telefondan,
   pult kanali orqali) va radio pult (Web Serial). Manba faqat
   `receive(no, harf)` ni chaqiradi — qolgan hammasi (qulf, roʻyxat,
   saqlash) shu yerda.

   Holat localStorage'da: dars oʻrtasida sahifa yopilsa, qayta ochilganda
   oʻsha savoldan davom etadi. Pult uchun kalit ESKI (`ustozona_pult_…`)
   — yangilanishdan oldin boshlangan dars ham tiklansin.
   ════════════════════════════════════════════════════════════════════ */

/** Apply endpoint bitta soʻrovda 60 tagacha varaq qabul qiladi. */
const APPLY_CHUNK = 60;

type Persisted = {
  phase?: ClassTestPhase;
  index?: number;
  answers?: ClassTestAnswers;
  revealed?: number[];
  settings?: Partial<ClassTestSettings>;
  present?: number[];
  startedAt?: number | null;
};

function storageKey(source: ClassTestSource, setId: string, classId: string) {
  return source === "pult" ? `ustozona_pult_${setId}_${classId}` : `ustozona_cards_${setId}_${classId}`;
}

export type ReceiveResult =
  | { kind: "answer"; first: boolean }
  | { kind: "present" }
  | { kind: "unknown" }
  | { kind: "entered"; name: string }
  | { kind: "locked" };

export type ClassTest = ReturnType<typeof useClassTest>;

export function useClassTest({
  setId,
  classId,
  source,
  loadFailedText,
  actionFailedText,
}: {
  setId: string;
  classId: string;
  source: ClassTestSource;
  loadFailedText: string;
  actionFailedText: string;
}) {
  const [plan, setPlan] = useState<PultPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ClassTestPhase>("lobby");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ClassTestAnswers>({});
  const [revealed, setRevealed] = useState<number[]>([]);
  const [settings, setSettingsState] = useState<ClassTestSettings>(DEFAULT_CLASS_TEST_SETTINGS);
  const [present, setPresent] = useState<number[]>([]);
  /** Joriy savol boshlangan vaqt (ms) — taymer chizigʻi uchun. */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  /** Oxirgi yangi javob — proyektordagi qisqa bildirishnoma uchun. */
  const [lastAnswer, setLastAnswer] = useState<{ no: number; at: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ sessionId: string; added: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    pultPlanAction({ setId, classId })
      .then((res) => {
        if (!alive) return;
        if (!res.ok) return setError(res.message);
        setPlan(res.data);
        // Tugallanmagan dars — tiklanadi.
        try {
          const raw = localStorage.getItem(storageKey(source, setId, classId));
          if (!raw) return;
          const p = JSON.parse(raw) as Persisted;
          if (p.answers) setAnswers(p.answers);
          if (Array.isArray(p.revealed)) setRevealed(p.revealed);
          if (Array.isArray(p.present)) setPresent(p.present);
          if (p.settings) setSettingsState((s) => ({ ...s, ...p.settings }));
          if (typeof p.index === "number") setIndex(p.index);
          // Eski pult yozuvida bosqich yoʻq — javob boʻlsa savoldan davom.
          if (p.phase) setPhase(p.phase);
          else if (p.answers && Object.keys(p.answers).length > 0) setPhase("question");
          if (p.startedAt) setStartedAt(p.startedAt);
        } catch {
          /* xususiy rejim yoki buzuq yozuv — boshidan */
        }
      })
      .catch(() => alive && setError(loadFailedText));
    return () => {
      alive = false;
    };
  }, [setId, classId, source, loadFailedText]);

  // Har oʻzgarishda saqlanadi — sahifa yopilsa ham dars yoʻqolmasin.
  useEffect(() => {
    if (!plan || saved) return;
    try {
      const p: Persisted = { phase, index, answers, revealed, settings, present, startedAt };
      localStorage.setItem(storageKey(source, setId, classId), JSON.stringify(p));
    } catch {
      /* joy yoʻq yoki xususiy rejim — faqat xotirada davom etadi */
    }
  }, [plan, saved, phase, index, answers, revealed, settings, present, startedAt, source, setId, classId]);

  /** Variantli savollar — qolganlari (juftlik, ochiq javob) oʻtkazib yuboriladi. */
  const questions = useMemo<PultQuestion[]>(() => (plan?.questions ?? []).filter((q) => q.gradable), [plan]);
  const roster = useMemo(() => plan?.roster ?? [], [plan]);
  const entered = useMemo(() => new Set(plan?.alreadyEntered ?? []), [plan]);
  const rosterByNo = useMemo(() => new Map(roster.map((r) => [r.no, r])), [roster]);
  const available = useMemo(() => roster.filter((r) => !entered.has(r.id)), [roster, entered]);

  const safeIndex = Math.min(Math.max(index, 0), Math.max(questions.length - 1, 0));
  const question = questions[safeIndex] ?? null;
  const isRevealed = question ? revealed.includes(question.no) : false;
  const current = useMemo<Record<number, string>>(
    () => (question ? (answers[question.no] ?? {}) : {}),
    [answers, question],
  );
  const answeredCount = Object.keys(current).length;
  const hasAnything = Object.values(answers).some((m) => Object.keys(m).length > 0);

  /* Tashqi manbalar (seriya oqimi, kanal) eskirgan yopilish bilan
     chaqiradi — joriy qiymatlar ref orqali oʻqiladi. */
  const liveRef = useRef({
    phase, index: safeIndex, question, questions, revealed, rosterByNo, entered, answers, saved, settings,
  });
  useLayoutEffect(() => {
    liveRef.current = {
      phase, index: safeIndex, question, questions, revealed, rosterByNo, entered, answers, saved, settings,
    };
  }, [phase, safeIndex, question, questions, revealed, rosterByNo, entered, answers, saved, settings]);

  const receive = useCallback((no: number, letter: string | null, qNo?: number): ReceiveResult => {
    const live = liveRef.current;
    const student = live.rosterByNo.get(no);
    if (!student) return { kind: "unknown" };
    if (live.entered.has(student.id)) return { kind: "entered", name: student.name };
    // Saqlangan yoki yakunlangan test — kechikib kelgan javob qabul qilinmaydi.
    if (live.saved || live.phase === "final") return { kind: "locked" };
    // Roʻyxat bosqichi — karta/pult ishlashini tekshirish: «keldi».
    if (live.phase === "lobby" || qNo === 0) {
      if (letter) setPresent((prev) => (prev.includes(no) ? prev : [...prev, no]));
      return { kind: "present" };
    }
    const q = qNo ? live.questions.find((x) => x.no === qNo) : live.question;
    if (!q || live.revealed.includes(q.no)) return { kind: "locked" };
    const before = live.answers[q.no]?.[no];
    if (before === (letter ?? undefined)) return { kind: "answer", first: false };
    setAnswers((prev) => {
      const row = { ...(prev[q.no] ?? {}) };
      if (letter) row[no] = letter;
      else delete row[no];
      return { ...prev, [q.no]: row };
    });
    setPresent((prev) => (prev.includes(no) ? prev : [...prev, no]));
    const first = before === undefined && Boolean(letter);
    if (first) setLastAnswer({ no, at: Date.now() });
    return { kind: "answer", first };
  }, []);

  const start = useCallback(() => {
    setPhase("question");
    setStartedAt(Date.now());
  }, []);

  const reveal = useCallback(() => {
    const { question: q, revealed: locked, settings: st } = liveRef.current;
    if (!q) return;
    if (!locked.includes(q.no)) setRevealed((prev) => (prev.includes(q.no) ? prev : [...prev, q.no]));
    if (st.showResults) setPhase("results");
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex(next);
    setPhase("question");
    setStartedAt(Date.now());
  }, []);

  const next = useCallback(() => {
    const { phase: ph, index: i, questions: qs } = liveRef.current;
    if (ph === "lobby") return start();
    if (ph === "final") return;
    if (i >= qs.length - 1) {
      setPhase("final");
      return;
    }
    goTo(i + 1);
  }, [start, goTo]);

  const prev = useCallback(() => {
    const { phase: ph, index: i } = liveRef.current;
    if (ph === "lobby") return;
    if (ph === "final" || ph === "results") {
      setPhase("question");
      return;
    }
    if (i > 0) goTo(i - 1);
  }, [goTo]);

  const finish = useCallback(() => setPhase("final"), []);

  const setSettings = useCallback((patch: Partial<ClassTestSettings>) => {
    setSettingsState((s) => {
      const timerSec =
        patch.timerSec === undefined ? s.timerSec : Math.min(Math.max(Math.round(patch.timerSec) || 0, 0), MAX_TIMER_SEC);
      return { ...s, ...patch, timerSec };
    });
  }, []);

  const save = useCallback(async (): Promise<{ sessionId: string; added: number } | null> => {
    const live = liveRef.current;
    if (live.saved || !plan) return live.saved;
    const sheets = answersToSheets(live.answers, plan.roster, live.entered);
    if (sheets.length === 0) return null;
    setSaving(true);
    setSaveError(null);
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
          throw new Error((data && "message" in data ? data.message : null) ?? actionFailedText);
        }
        sessionId = data.report.sessionId;
        added += data.report.studentsAdded;
      }
      try {
        localStorage.removeItem(storageKey(source, setId, classId));
      } catch {
        /* ahamiyatsiz */
      }
      const result = { sessionId, added };
      setSaved(result);
      return result;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : actionFailedText);
      return null;
    } finally {
      setSaving(false);
    }
  }, [plan, setId, classId, source, actionFailedText]);

  /** Saqlanmagan dars javoblarini tashlab yuborish (yopishda tasdiq bilan). */
  const discard = useCallback(() => {
    try {
      localStorage.removeItem(storageKey(source, setId, classId));
    } catch {
      /* ahamiyatsiz */
    }
  }, [source, setId, classId]);

  return {
    source,
    plan,
    error,
    phase,
    index: safeIndex,
    question,
    questions,
    roster,
    entered,
    available,
    rosterByNo,
    answers,
    revealed,
    isRevealed,
    current,
    answeredCount,
    hasAnything,
    present,
    settings,
    setSettings,
    startedAt,
    lastAnswer,
    saving,
    saved,
    saveError,
    receive,
    start,
    reveal,
    next,
    prev,
    goTo,
    finish,
    save,
    discard,
  };
}
