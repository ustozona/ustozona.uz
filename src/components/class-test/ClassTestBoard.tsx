"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  HelpCircle,
  LoaderCircle,
  Maximize,
  Minimize,
  Play,
  QrCode,
  RadioReceiver,
  Save,
  Table2,
  TriangleAlert,
  Trophy,
  Users,
  X,
} from "lucide-react";
import type { PultQuestion } from "@/lib/launch-types";
import {
  MAX_TIMER_SEC,
  TEST_LETTERS,
  isCorrectLetter,
  overallAccuracy,
  questionStat,
  rankStudents,
  studentScores,
} from "@/lib/class-test";
import type { ClassTest } from "./useClassTest";
import { BOARD_FONT_CLASS } from "./board-font";
import { ShareResults } from "@/components/launch/ShareResults";

/* ════════════════════════════════════════════════════════════════════
   SINF TESTI SAHNASI — proyektor / aqlli doska (docs/sinf-testi-spec.md).

   LessonLab botidagi smart doska oynasi bilan bir xil koʻrinish va
   oqim: kutish zali → savol → savol natijasi → yakuniy natijalar.
   Stil — `styles/class-test-board.css` (doim yorugʻ sahna).

   Komponent faqat CHIZADI: holat va amallar `useClassTest` da, javob
   manbai (telefon kamerasi yoki radio pult) — chaqiruvchida. Shuning
   uchun QR-karta va pult testi AYNAN bir xil koʻrinadi.

   Oʻqituvchi kompyuterdan ham boshqaradi: pastdagi tugmalar (sichqoncha
   kelganda aniq koʻrinadi) va klaviatura — → / PageDown keyingi,
   ← / PageUp oldingi, Space / Enter boshlash yoki javobni koʻrsatish.
   ════════════════════════════════════════════════════════════════════ */

const TOAST_MS = 1800;

/** Har 300 ms da yangilanadigan soat — taymer va bildirishnoma uchun
    (render ichida `Date.now()` chaqirilmaydi). */
function useNow(): number {
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 300);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** QR-karta testida telefon (ustoz pulti) ulanmagan boʻlsa — kutish zalida
    pult QR'i. Ulangach yoʻqoladi. */
export type BoardPhone = {
  online: boolean;
  qrSvg: string | null;
  busy: boolean;
  onConnect: () => void;
};

export function ClassTestBoard({
  test,
  connection,
  topExtra,
  notice,
  phone,
  onClose,
  onOpenResults,
}: {
  test: ClassTest;
  phone?: BoardPhone;
  /** Tepadagi ulanish belgisi: karta — telefon kanali, pult — qabul qilgich. */
  connection: { live: boolean; label: string };
  /** Tepada qoʻshimcha boshqaruv (masalan, «Qurilmani ulash»). */
  topExtra?: React.ReactNode;
  /** Pastdagi qisqa xabar (masalan, «#31-pult roʻyxatda yoʻq»). */
  notice?: string | null;
  onClose: () => void;
  /** Saqlangandan keyin — Topshiriqlardagi natija ekranini ochish. */
  onOpenResults?: (sessionId: string) => void;
}) {
  const t = useTranslations("ClassTest");
  const now = useNow();
  const [sidebar, setSidebar] = React.useState(false);
  const [confirmExit, setConfirmExit] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = React.useState(false);

  /* Toʻliq ekran — sahnaning OʻZI. Boshqa element (masalan, taqdimot
     vidjeti) toʻliq ekranda boʻlsa, sahna uning tashqarisida qolib
     koʻrinmasdi — shuning uchun ochilganda u yopiladi. Butun sahifa
     (`documentElement`) toʻliq ekrani tegilmaydi: sahna uning ichida. */
  React.useEffect(() => {
    const el = document.fullscreenElement;
    if (el && el !== document.documentElement && el !== rootRef.current) void document.exitFullscreen().catch(() => {});
    const sync = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement === rootRef.current) void document.exitFullscreen().catch(() => {});
    else void rootRef.current?.requestFullscreen().catch(() => {});
  };

  const requestClose = React.useCallback(() => {
    if (test.hasAnything && !test.saved) setConfirmExit(true);
    else onClose();
  }, [test.hasAnything, test.saved, onClose]);

  /* Klaviatura — joriy amallar ref orqali (effekt har qadamda qayta ulanmaydi). */
  const keysRef = React.useRef({ test, requestClose, confirmExit });
  React.useEffect(() => {
    keysRef.current = { test, requestClose, confirmExit };
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Fokusdagi tugma Enter/Space bilan oʻzi bosilsin (oʻquvchi chipi va h.k.).
      if (target?.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      const { test: tt, requestClose: close, confirmExit: asking } = keysRef.current;
      if (asking) {
        if (e.key === "Escape") setConfirmExit(false);
        return;
      }
      if (["ArrowRight", "PageDown"].includes(e.key)) tt.next();
      else if (["ArrowLeft", "PageUp"].includes(e.key)) tt.prev();
      else if (e.key === " " || e.key === "Enter") {
        if (tt.phase === "lobby") tt.start();
        else if (tt.phase === "question") tt.reveal();
        else tt.next();
      } else if (e.key === "Escape") close();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const title = test.plan?.title ?? "";
  const total = test.questions.length;

  return createPortal(
    <div
      ref={rootRef}
      className={`ct-board ${BOARD_FONT_CLASS}`}
      role="dialog"
      aria-modal="true"
      aria-label={title || t("title")}
    >
      <div className="ct-orb ct-orb-a" aria-hidden="true" />
      <div className="ct-orb ct-orb-b" aria-hidden="true" />
      <div className="ct-orb ct-orb-c" aria-hidden="true" />

      {test.phase === "question" && test.question && !test.isRevealed && (
        <TimerBar seconds={test.settings.timerSec} startedAt={test.startedAt} now={now} />
      )}

      {/* ── Tepa panel ── */}
      <div className="ct-top">
        <div className="ct-top-group">
          <div className="ct-chip">
            {test.source === "cards" ? <QrCode className="size-[1em]" /> : <RadioReceiver className="size-[1em]" />}
            <span className="ct-num">
              {test.phase === "lobby" || total === 0
                ? t("chipLobby")
                : test.phase === "final"
                  ? t("chipFinal")
                  : t("chipQuestion", { current: test.index + 1, total })}
            </span>
          </div>
          {title && <span className="ct-title-mini">{title}</span>}
        </div>
        <div className="ct-top-group">
          {test.phase !== "lobby" && test.phase !== "final" && (
            <button type="button" className="ct-toggle" onClick={() => setSidebar((v) => !v)} aria-pressed={sidebar}>
              <BarChart3 className="size-[1.1em]" style={{ color: "var(--ct-accent)" }} />
              {t("answersToggle")}
              <span className="ct-switch" data-on={sidebar} aria-hidden="true" />
            </button>
          )}
          {topExtra}
          <div className="ct-conn">
            <span className="ct-dot" data-live={connection.live} />
            {connection.label}
          </div>
          <button
            type="button"
            className="ct-icon-btn"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
            title={fullscreen ? t("exitFullscreen") : t("fullscreen")}
          >
            {fullscreen ? <Minimize /> : <Maximize />}
          </button>
          <button type="button" className="ct-icon-btn" onClick={requestClose} aria-label={t("close")}>
            <X />
          </button>
        </div>
      </div>

      {/* ── Ekranlar ── */}
      {!test.plan && !test.error && (
        <div className="ct-center">
          <div className="ct-logo">
            <LoaderCircle className="animate-spin" />
          </div>
          <p className="ct-center-text">{t("loading")}</p>
        </div>
      )}
      {test.error && (
        <div className="ct-center">
          <div className="ct-logo" data-tone="err">
            <TriangleAlert />
          </div>
          <p className="ct-center-text" data-tone="err">
            {test.error}
          </p>
        </div>
      )}
      {test.plan && total === 0 && (
        <div className="ct-center">
          <div className="ct-logo" data-tone="err">
            <HelpCircle />
          </div>
          <p className="ct-center-text">{t("needsMcq")}</p>
        </div>
      )}

      {test.plan && total > 0 && test.phase === "lobby" && <Lobby test={test} phone={phone} />}
      {test.plan && test.question && test.phase === "question" && (
        <QuestionScreen key={test.question.no} test={test} question={test.question} now={now} />
      )}
      {test.plan && test.question && test.phase === "results" && <ResultsScreen test={test} question={test.question} />}
      {test.plan && total > 0 && test.phase === "final" && <FinalScreen test={test} onOpenResults={onOpenResults} />}

      {/* ── Javoblar paneli ── */}
      {test.plan && test.question && (
        <Sidebar test={test} open={sidebar && test.phase !== "lobby" && test.phase !== "final"} />
      )}

      {/* ── Yangi javob bildirishnomasi ── */}
      {test.lastAnswer && now - test.lastAnswer.at < TOAST_MS && test.phase === "question" && (
        <div className="ct-toasts" aria-live="polite">
          <div className="ct-toast" key={test.lastAnswer.at}>
            <CheckCircle2 />#{test.lastAnswer.no} {test.rosterByNo.get(test.lastAnswer.no)?.name ?? ""}
          </div>
        </div>
      )}

      {test.plan && total > 0 && <Controls test={test} notice={notice} />}

      {confirmExit && (
        <div className="ct-modal-scrim" role="alertdialog" aria-modal="true" aria-labelledby="ct-exit-title">
          <div className="ct-gc ct-modal">
            <h2 id="ct-exit-title">{t("exitTitle")}</h2>
            <p>{t("exitDescription")}</p>
            <div className="ct-modal-actions">
              <button type="button" className="ct-btn" autoFocus onClick={() => setConfirmExit(false)}>
                {t("exitStay")}
              </button>
              <button type="button" className="ct-btn" data-primary="true" onClick={onClose}>
                {t("exitLeave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/* ══════════════════ Taymer ══════════════════ */

function TimerBar({ seconds, startedAt, now }: { seconds: number; startedAt: number | null; now: number }) {
  if (!seconds || !startedAt || !now) return null;
  const left = Math.max(0, seconds * 1000 - (now - startedAt));
  return (
    <div className="ct-timer" aria-hidden="true">
      <div
        className="ct-timer-fill"
        style={{ transform: `scaleX(${left / (seconds * 1000)})`, transition: "transform 300ms linear" }}
      />
    </div>
  );
}

function secondsLeft(seconds: number, startedAt: number | null, now: number): number | null {
  if (!seconds || !startedAt || !now) return null;
  return Math.max(0, Math.ceil((seconds * 1000 - (now - startedAt)) / 1000));
}

/* ══════════════════ 1. Kutish zali ══════════════════ */

function Lobby({ test, phone }: { test: ClassTest; phone?: BoardPhone }) {
  const t = useTranslations("ClassTest");
  const present = new Set(test.present);
  const presentCount = test.available.filter((s) => present.has(s.no)).length;
  return (
    <section className="ct-screen">
      <h1 className="ct-lobby-title">{test.plan?.title}</h1>
      <p className="ct-lobby-sub">
        {test.source === "cards" ? <QrCode /> : <RadioReceiver />}
        {t(test.source === "cards" ? "lobbyCards" : "lobbyPult", { count: test.available.length })}
      </p>
      <div className="ct-gc ct-settings">
        <label>
          <Clock style={{ color: "var(--ct-accent)" }} />
          {t("timer")}
          <input
            type="number"
            min={0}
            max={MAX_TIMER_SEC}
            step={5}
            value={test.settings.timerSec}
            onChange={(e) => test.setSettings({ timerSec: Number(e.target.value) })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={test.settings.showResults}
            onChange={(e) => test.setSettings({ showResults: e.target.checked })}
          />
          <Eye style={{ color: "var(--ct-ok)" }} />
          {t("showResults")}
        </label>
        <span className="ct-pill">
          <Users />
          {t("presentCount", { count: presentCount, total: test.available.length })}
        </span>
      </div>
      {phone && !phone.online ? (
        <div className="ct-gc ct-phone">
          {phone.qrSvg ? (
            // QR serverda bizning havolamizdan chiziladi (`qrcode` paketi) — tashqi SVG emas.
            <div className="ct-phone-qr" dangerouslySetInnerHTML={{ __html: phone.qrSvg }} />
          ) : (
            <button type="button" className="ct-btn" data-primary="true" disabled={phone.busy} onClick={phone.onConnect}>
              {phone.busy ? <LoaderCircle className="animate-spin" /> : <QrCode />}
              {t("phoneConnect")}
            </button>
          )}
          <div className="ct-phone-text">
            <b>{t("phoneTitle")}</b>
            <span>{t(phone.qrSvg ? "phoneScan" : "phoneConnectHint")}</span>
          </div>
        </div>
      ) : (
        <p className="ct-q-meta" style={{ marginBottom: "1.6rem" }}>
          {t(test.source === "cards" ? "lobbyHintCards" : "lobbyHintPult")}
        </p>
      )}
      <div className="ct-students">
        {test.roster.map((s) => {
          const done = test.entered.has(s.id);
          const joined = present.has(s.no);
          return (
            <div key={s.id} className="ct-student" data-state={done ? "entered" : joined ? "joined" : undefined}>
              <div className="ct-student-no">#{s.no}</div>
              <div className="ct-student-name">
                {s.name}
                {joined && !done && <CheckCircle2 />}
              </div>
              {done && <div className="ct-student-no">{t("entered")}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ══════════════════ 2. Savol ══════════════════ */

function QuestionScreen({ test, question, now }: { test: ClassTest; question: PultQuestion; now: number }) {
  const t = useTranslations("ClassTest");
  const [picking, setPicking] = React.useState<number | null>(null);
  const showCorrect = test.isRevealed && test.settings.showResults;
  const left = test.isRevealed ? null : secondsLeft(test.settings.timerSec, test.startedAt, now);
  const pickingStudent = picking !== null ? test.rosterByNo.get(picking) : undefined;

  return (
    <section className="ct-screen" style={{ justifyContent: "center" }}>
      <div className="ct-q-wrap">
        <div className="ct-gc ct-q-text">
          {test.index + 1}. {question.stem}
        </div>
        <div className="ct-options" data-count={question.options.length}>
          {question.options.map((o) => {
            const correct = question.correct.includes(o.letter);
            const state = test.isRevealed ? (showCorrect && correct ? "correct" : "dimmed") : undefined;
            return (
              <div key={o.letter} className="ct-option" data-letter={o.letter} data-state={state}>
                <span className="ct-option-badge">{o.letter}</span>
                {o.text}
                {state === "correct" && <CheckCircle2 className="ct-option-check" />}
              </div>
            );
          })}
        </div>
        <div className="ct-q-meta">
          <span className="ct-pill">
            <Users />
            {t("answeredOf", { answered: test.answeredCount, total: test.available.length })}
          </span>
          {left !== null && (
            <span className="ct-pill" data-tone={left === 0 ? "warn" : undefined}>
              <Clock />
              {left === 0 ? t("timeUp") : t("timeLeft", { sec: left })}
            </span>
          )}
          {test.isRevealed && (
            <span className="ct-pill">
              <Check />
              {t("locked")}
            </span>
          )}
          {question.truncated && (
            <span className="ct-pill" data-tone="warn">
              <TriangleAlert />
              {t("truncated")}
            </span>
          )}
        </div>
        <div className="ct-gc ct-tracker">
          {test.available.map((s) => {
            const letter = test.current[s.no];
            const result = showCorrect && letter ? (isCorrectLetter(question, letter) ? "right" : "wrong") : undefined;
            return (
              <button
                key={s.id}
                type="button"
                className="ct-track"
                data-answered={Boolean(letter) && !result}
                data-result={result}
                data-picking={picking === s.no}
                disabled={test.isRevealed}
                onClick={() => setPicking(picking === s.no ? null : s.no)}
                title={t("pickHint")}
              >
                {letter && <Check />}
                {s.name}
                {/* Harf javob ochilguncha yashirin — proyektorda bir-birinikini koʻrmasin. */}
                {result && ` · ${letter}`}
              </button>
            );
          })}
        </div>
        {pickingStudent && !test.isRevealed && (
          <div className="ct-gc ct-picker">
            {t("pickFor", { name: pickingStudent.name })}
            {TEST_LETTERS.slice(0, Math.max(question.options.length, 1)).map((letter) => (
              <button
                key={letter}
                type="button"
                data-letter={letter}
                onClick={() => {
                  test.receive(pickingStudent.no, letter, question.no);
                  setPicking(null);
                }}
              >
                {letter}
              </button>
            ))}
            <button
              type="button"
              data-letter="none"
              onClick={() => {
                test.receive(pickingStudent.no, null, question.no);
                setPicking(null);
              }}
            >
              {t("clear")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════ 3. Savol natijasi ══════════════════ */

function ResultsScreen({ test, question }: { test: ClassTest; question: PultQuestion }) {
  const t = useTranslations("ClassTest");
  const stat = questionStat(question, test.answers[question.no]);
  const ranked = rankStudents(test.available, studentScores(test.questions, test.answers));
  const [width, setWidth] = React.useState(0);
  // Chiziq 0 dan oʻsib chiqadi (bot oynasidagi kabi).
  React.useEffect(() => {
    const id = window.setTimeout(() => setWidth(stat.accuracy), 100);
    return () => window.clearTimeout(id);
  }, [stat.accuracy]);

  return (
    <section className="ct-screen">
      <div className="ct-gc ct-resp-pill">
        <Users />
        {t("responses", { count: stat.total })}
      </div>
      <div className="ct-acc-bar">
        <div className="ct-acc-fill" style={{ width: `${width}%` }} />
        <div className="ct-acc-badge">{t("accuracy", { pct: stat.accuracy })}</div>
        <div className="ct-acc-labels">
          <span>{stat.correct} ✓</span>
          <span>{stat.total - stat.correct} ✗</span>
        </div>
      </div>
      <div className="ct-res-layout">
        <div className="ct-gc ct-res-left">
          <div className="ct-res-q">
            {test.index + 1}. {question.stem}
          </div>
          {question.options.map((o) => {
            const correct = question.correct.includes(o.letter);
            const cnt = stat.counts[o.letter] ?? 0;
            const pct = stat.total ? (cnt / stat.total) * 100 : 0;
            return (
              <div key={o.letter} className="ct-res-row">
                <div className="ct-res-badge" data-correct={correct}>
                  {o.letter}
                </div>
                <div className="ct-res-body">
                  <div className="ct-res-text" data-correct={correct}>
                    {o.text}
                  </div>
                  <div className="ct-res-track">
                    <div className="ct-res-fill" data-correct={correct} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="ct-res-cnt">{cnt}</div>
              </div>
            );
          })}
        </div>
        <div className="ct-gc ct-res-right">
          <div className="ct-mini-head">
            <span>{t("rankHead")}</span>
            <span>{t("nameHead")}</span>
            <span>{t("ptsHead")}</span>
          </div>
          <div className="ct-mini-list">
            {ranked.map(({ student, score, rank }) => (
              <div key={student.id} className="ct-mini-item" data-rank={rank <= 3 ? rank : undefined}>
                <span className="ct-mini-rank">{rank}</span>
                <span className="ct-mini-name">{student.name}</span>
                <span className="ct-mini-pts">{t("pts", { count: score })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════ 4. Yakuniy natijalar ══════════════════ */

function FinalScreen({ test, onOpenResults }: { test: ClassTest; onOpenResults?: (sessionId: string) => void }) {
  const t = useTranslations("ClassTest");
  const [tab, setTab] = React.useState<"overview" | "questions">("overview");
  const scores = studentScores(test.questions, test.answers);
  const ranked = rankStudents(test.available, scores);
  const accuracy = overallAccuracy(test.questions, test.answers);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const id = window.setTimeout(() => setWidth(accuracy), 200);
    return () => window.clearTimeout(id);
  }, [accuracy]);

  // Bayram — bir marta, ekran ochilganda.
  React.useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const timers: number[] = [];
    import("canvas-confetti")
      .then(({ default: confetti }) => {
        if (cancelled) return;
        const fire = (opts: Parameters<typeof confetti>[0]) => void confetti({ zIndex: 70, ...opts });
        fire({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
        timers.push(window.setTimeout(() => fire({ particleCount: 100, spread: 100, angle: 60, origin: { x: 0 } }), 500));
        timers.push(window.setTimeout(() => fire({ particleCount: 100, spread: 100, angle: 120, origin: { x: 1 } }), 1000));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const sheetsReady = test.hasAnything;

  return (
    <section className="ct-screen" style={{ justifyContent: "flex-start" }}>
      <div className="ct-lb-hero">
        <h1 className="ct-lb-title">
          <Trophy className="ct-trophy" />
          {t("finalTitle")}
        </h1>
        <div className="ct-gc ct-ribbon">
          <div className="ct-ribbon-pct">{accuracy}%</div>
          <div className="ct-ribbon-track">
            <div className="ct-ribbon-fill" style={{ width: `${width}%` }} />
          </div>
        </div>
        <p className="ct-ribbon-msg">{t(accuracy >= 80 ? "msgGreat" : accuracy >= 50 ? "msgGood" : "msgGrow")}</p>
      </div>

      <div className="ct-tabs" role="tablist">
        <button type="button" role="tab" className="ct-tab" aria-selected={tab === "overview"} onClick={() => setTab("overview")}>
          <Table2 />
          {t("tabResults")}
        </button>
        <button type="button" role="tab" className="ct-tab" aria-selected={tab === "questions"} onClick={() => setTab("questions")}>
          <HelpCircle />
          {t("tabQuestions")}
        </button>
      </div>

      {tab === "overview" ? (
        <div className="ct-table-wrap">
          <table className="ct-table">
            <thead>
              <tr>
                <th className="ct-sticky">{t("student")}</th>
                <th>{t("score")}</th>
                {test.questions.map((q, i) => {
                  const s = questionStat(q, test.answers[q.no]);
                  return (
                    <th key={q.no}>
                      {t("qShort", { n: i + 1 })}
                      <small data-good={s.total ? s.accuracy >= 50 : undefined}>{s.total ? `${s.accuracy}%` : "—"}</small>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ student, score, rank }) => (
                <tr key={student.id}>
                  <td className="ct-sticky">
                    <div className="ct-rank-row">
                      <span className="ct-rank" data-rank={rank <= 3 ? rank : undefined}>
                        {rank}
                      </span>
                      <span className="ct-rank-name">{student.name}</span>
                    </div>
                  </td>
                  <td className="ct-score">{score}</td>
                  {test.questions.map((q) => {
                    const letter = test.answers[q.no]?.[student.no];
                    return (
                      <td key={q.no} title={letter}>
                        {letter ? (
                          isCorrectLetter(q, letter) ? (
                            <span className="ct-mark-right">✔</span>
                          ) : (
                            <span className="ct-mark-wrong">✘</span>
                          )
                        ) : (
                          <span className="ct-mark-none">○</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ct-analytics">
          {test.questions.map((q, i) => {
            const s = questionStat(q, test.answers[q.no]);
            return (
              <div key={q.no} className="ct-gc ct-analytic" data-good={s.correct > 0}>
                <div className="ct-analytic-head">
                  <div className="ct-analytic-q">
                    <b>{t("qShort", { n: i + 1 })}</b> — {q.stem}
                  </div>
                  <div className="ct-analytic-tags">
                    <span className="ct-tag" data-tone="ok">
                      ✔ {s.correct}
                    </span>
                    <span className="ct-tag" data-tone="muted">
                      {s.accuracy}%
                    </span>
                  </div>
                </div>
                {q.options.map((o) => {
                  const correct = q.correct.includes(o.letter);
                  const cnt = s.counts[o.letter] ?? 0;
                  return (
                    <div key={o.letter} className="ct-analytic-row">
                      <span className="ct-analytic-letter" data-correct={correct}>
                        {o.letter}
                      </span>
                      <span className="ct-analytic-text" data-correct={correct}>
                        {o.text}
                      </span>
                      <span className="ct-analytic-track">
                        <span
                          className="ct-analytic-fill"
                          data-correct={correct}
                          style={{ display: "block", width: `${s.total ? (cnt / s.total) * 100 : 0}%` }}
                        />
                      </span>
                      <span className="ct-analytic-cnt">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Jurnalga saqlash — bot oynasidagi «ulashish» kartasi oʻrnida. */}
      <div className="ct-gc ct-save">
        {test.saved ? (
          <>
            <p data-tone="ok">{t("saved", { count: test.saved.added })}</p>
            {onOpenResults && (
              <button type="button" className="ct-btn" onClick={() => onOpenResults(test.saved!.sessionId)}>
                {t("openResults")}
              </button>
            )}
          </>
        ) : (
          <>
            <p>{sheetsReady ? t("saveHint") : t("nothingToSave")}</p>
            <button
              type="button"
              className="ct-btn"
              data-tone="ok"
              disabled={!sheetsReady || test.saving}
              onClick={() => void test.save()}
            >
              {test.saving ? <LoaderCircle className="animate-spin" /> : <Save />}
              {test.saving ? t("saving") : t("save")}
            </button>
            {test.saveError && <p data-tone="err">{test.saveError}</p>}
          </>
        )}
      </div>

      {/* Saqlangach — natija Telegramga: ota-onalarga va oʻqituvchiga. */}
      {test.saved && <ShareResults sessionId={test.saved.sessionId} classId={test.classId} variant="board" />}
    </section>
  );
}

/* ══════════════════ Javoblar paneli ══════════════════ */

function Sidebar({ test, open }: { test: ClassTest; open: boolean }) {
  const t = useTranslations("ClassTest");
  return (
    <aside className="ct-sidebar" data-open={open} aria-hidden={!open}>
      <div className="ct-sb-head">
        <span>{t("answersToggle")}</span>
        <span>
          {test.answeredCount}/{test.available.length}
        </span>
      </div>
      <div className="ct-sb-list">
        {test.available.map((s) => {
          const answered = Boolean(test.current[s.no]);
          return (
            <div key={s.id} className="ct-sb-item" data-answered={answered}>
              <small>#{s.no}</small>
              <span>{s.name}</span>
              {answered && <CheckCircle2 />}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

/* ══════════════════ Oʻqituvchi boshqaruvi ══════════════════ */

function Controls({ test, notice }: { test: ClassTest; notice?: string | null }) {
  const t = useTranslations("ClassTest");
  const last = test.index >= test.questions.length - 1;
  return (
    <div className="ct-controls">
      {notice && <span className="ct-pill" data-tone="warn">{notice}</span>}
      {test.phase === "lobby" && (
        <button type="button" className="ct-btn" data-primary="true" onClick={test.start}>
          <Play />
          {t("start")}
        </button>
      )}
      {test.phase === "question" && (
        <>
          <button type="button" className="ct-btn" disabled={test.index === 0} onClick={test.prev}>
            <ChevronLeft />
            {t("prev")}
          </button>
          {!test.isRevealed && (
            <button type="button" className="ct-btn" onClick={test.reveal}>
              <Eye />
              {t("reveal")}
            </button>
          )}
          <button type="button" className="ct-btn" data-primary="true" onClick={test.next}>
            {last ? t("toFinal") : t("next")}
            <ChevronRight />
          </button>
        </>
      )}
      {test.phase === "results" && (
        <>
          <button type="button" className="ct-btn" onClick={test.prev}>
            <ChevronLeft />
            {t("backToQuestion")}
          </button>
          <button type="button" className="ct-btn" data-primary="true" onClick={test.next}>
            {last ? t("toFinal") : t("next")}
            <ChevronRight />
          </button>
        </>
      )}
      {test.phase === "final" && (
        <button type="button" className="ct-btn" onClick={test.prev}>
          <ChevronLeft />
          {t("backToQuestions")}
        </button>
      )}
    </div>
  );
}
