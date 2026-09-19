"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { classColorValue, type ClassColor } from "@/lib/class-colors";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import {
  getSetDraftAction,
  listSetsAction,
  type SetDraft,
} from "@/server/actions/assess";
import type { ActivitySetRow } from "@/server/db/schema";
import { SlideView } from "@/components/slides/SlideView";
import { slideLayoutOf } from "@/lib/slide-layouts";
import { stageThemeBg } from "@/lib/stage-themes";
import {
  TEACHER_FALLBACK_POLL_MS,
  type LiveResults,
  type LiveSessionInfo,
  type RealtimeConfig,
} from "@/lib/live-session";
import {
  endLiveSessionAction,
  listLiveClassesAction,
  liveRealtimeConfigAction,
  liveResultsAction,
  setLiveStepAction,
  startLiveSessionAction,
} from "@/server/actions/assess-live";
import { useLiveNudge } from "@/hooks/useLiveNudge";

export type Team = { name: string; score: number };

/** Jamoa tuslari — sinf rangi dvigatelidan, yangi palitra ixtiro qilinmaydi. */
const TEAM_TINTS: ClassColor[] = ["blue", "rose", "amber", "green"];
const MAX_TEAMS = TEAM_TINTS.length;

/**
 * TAQDIMOT — toʻplamni doskada birma-bir koʻrsatish (R276, R280).
 *
 * Taqdimot alohida obyekt emas: bu oʻsha toʻplam (savollar + slaydlar),
 * faqat proyektorda oʻqituvchi boshqaradi. QURILMA TALAB QILINMAYDI —
 * savol doskada chiqadi, sinf ogʻzaki yoki qoʻl koʻtarib javob beradi,
 * toʻgʻri javobni oʻqituvchi «Javobni ochish» bilan koʻrsatadi. Shu
 * sababli bu yerdan `responses` ga hech narsa yozilmaydi: jurnalga
 * tushadigan yoʻl — PIN/QR sessiyasi yoki QR-kartalar.
 *
 * JAMOA BALLARI (R280) — ixtiyoriy qatlam: sinf 2–4 jamoaga boʻlinadi,
 * toʻgʻri javob bergan jamoaga oʻqituvchi bir bosishda ball qoʻshadi.
 * Ball faqat shu vidjet holatida — jurnalga tushmaydi, chunki javob
 * aniq oʻquvchiga bogʻlanmagan. Toʻplam almashtirilsa jamoalar qoladi:
 * bitta dars davomida bir nechta taqdimot oʻynalishi mumkin.
 *
 * JONLI SESSIYA (R284) — ixtiyoriy: oʻquvchilar oʻz qurilmasidan PIN/QR
 * bilan qoʻshiladi, qadamni shu vidjet boshqaradi (`current_index`),
 * javoblar doskada jonli ustun boʻlib oʻsadi va jurnalga tushishi mumkin.
 * Sessiya maʼlumoti (`live`) vidjet holatida — sahifa yangilansa ham
 * sessiya yoʻqolmaydi.
 *
 * Holatda faqat `setId`, joriy qadam va javob ochilganmi — mazmunning
 * oʻzi saqlanmaydi, har ochilishda toʻplamdan oʻqiladi (toʻplam tahrir
 * qilinsa doska eskirgan nusxani koʻrsatmasin).
 */
export function PresentationWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const setId = (widget.state.setId as string | null) ?? null;
  const index = Number(widget.state.index ?? 0);
  const revealed = Boolean(widget.state.revealed);
  const teams = (widget.state.teams as Team[] | null | undefined) ?? null;
  const setTeams = (next: Team[] | null) => patch(widget.id, { teams: next });
  const live = (widget.state.live as LiveSessionInfo | null | undefined) ?? null;
  const showJoin = Boolean(widget.state.showJoin);
  const deckClassId = useDoskaStore((s) => s.deck.classId);

  // Jonli sessiyada har oʻtish serverga ham yoziladi — oʻquvchi qurilmalari
  // shuni soʻrab oladi. Xato jim: doska baribir oʻtadi, keyingi bosishda
  // server yana yetib oladi.
  const syncLive = (next: number, nextRevealed: boolean, activityId?: string) => {
    if (!live) return;
    void setLiveStepAction({
      sessionId: live.sessionId,
      index: next,
      revealed: nextRevealed,
      activityId,
    }).catch(() => {});
  };

  if (!setId) {
    return (
      <SetPicker onPick={(id) => patch(widget.id, { setId: id, index: 0, revealed: false })} />
    );
  }

  return (
    <Player
      setId={setId}
      index={index}
      revealed={revealed}
      onGo={(next) => {
        patch(widget.id, { index: next, revealed: false, showJoin: false });
        syncLive(next, false);
      }}
      onReveal={(activityId) => {
        patch(widget.id, { revealed: !revealed });
        syncLive(index, !revealed, activityId);
      }}
      onChange={() => patch(widget.id, { setId: null, index: 0, revealed: false })}
      teams={teams}
      onTeamsChange={setTeams}
      live={live}
      showJoin={showJoin}
      onToggleJoin={() => patch(widget.id, { showJoin: !showJoin })}
      preferredClassId={(widget.state.classId as string | undefined) ?? deckClassId}
      onStartLive={async (classId) => {
        const info = await startLiveSessionAction({ setId, classId });
        patch(widget.id, { live: info, index: 0, revealed: false, showJoin: true, classId });
      }}
      onEndLive={async () => {
        if (live) await endLiveSessionAction(live.sessionId).catch(() => {});
        patch(widget.id, { live: null, showJoin: false });
      }}
    />
  );
}

function TeamBar({ teams, onChange }: { teams: Team[]; onChange: (next: Team[] | null) => void }) {
  const update = (i: number, delta: number) =>
    onChange(teams.map((t, j) => (j === i ? { ...t, score: Math.max(0, t.score + delta) } : t)));
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-[1cqw]">
      {teams.map((team, i) => {
        const color = classColorValue(TEAM_TINTS[i]);
        return (
          <div
            key={i}
            className="flex items-center overflow-hidden rounded-lg text-[max(12px,1.8cqw)] font-semibold text-white"
            style={{ background: color }}
          >
            <button
              type="button"
              data-doska-no-drag=""
              aria-label={`${team.name}: ball qoʻshish`}
              onClick={() => update(i, 1)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-black/10"
            >
              <span>{team.name}</span>
              <span className="font-mono">{team.score}</span>
            </button>
            <button
              type="button"
              data-doska-no-drag=""
              aria-label={`${team.name}: ball ayirish`}
              onClick={() => update(i, -1)}
              className="border-l border-white/30 px-2 py-1.5 hover:bg-black/10"
            >
              −
            </button>
          </div>
        );
      })}
      {teams.length < MAX_TEAMS && (
        <NavButton onClick={() => onChange([...teams, { name: `${teams.length + 1}-jamoa`, score: 0 }])}>
          + Jamoa
        </NavButton>
      )}
      {teams.length > 2 && (
        <NavButton onClick={() => onChange(teams.slice(0, -1))}>− Jamoa</NavButton>
      )}
      <NavButton onClick={() => onChange(teams.map((t) => ({ ...t, score: 0 })))}>Nolga</NavButton>
    </div>
  );
}

function Panel({
  children,
  className,
  ref,
}: {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={cn("flex size-full flex-col rounded-[var(--radius)]", className)}
      style={{
        background: "var(--doska-slate-bg)",
        color: "var(--doska-slate-fg)",
        boxShadow: "0 4px 0 var(--doska-slate-edge)",
        // `cqw` panelning oʻziga nisbatan — toʻliq ekranda ham matn
        // ekran oʻlchamiga moslashadi (aks holda vidjet oʻlchamida qolardi).
        containerType: "inline-size",
      }}
    >
      {children}
    </div>
  );
}

function SetPicker({ onPick }: { onPick: (setId: string) => void }) {
  const [sets, setSets] = React.useState<ActivitySetRow[] | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    listSetsAction()
      .then((rows) =>
        // Taqdimotlar birinchi — vidjet nomi shuni vaʼda qiladi.
        setSets(
          [...rows].sort(
            (a, b) =>
              Number(b.containerKind === "deck") - Number(a.containerKind === "deck") ||
              b.updatedAt.getTime() - a.updatedAt.getTime(),
          ),
        ),
      )
      // Mehmon (kirmagan) — oʻqituvchi toʻplami yoʻq.
      .catch(() => setFailed(true));
  }, []);

  return (
    <Panel className="gap-3 p-4">
      <p className="text-base font-semibold">Taqdimot yoki test tanlang</p>
      {failed && (
        <p className="text-sm opacity-70">
          Taqdimotlaringiz koʻrinishi uchun hisobingizga kiring.
        </p>
      )}
      {!failed && sets === null && <p className="text-sm opacity-70">Yuklanmoqda…</p>}
      {sets?.length === 0 && (
        <p className="text-sm opacity-70">
          Hali toʻplam yoʻq. Jurnalda topshiriq yaratib, taqdimot yoki test qoʻshing.
        </p>
      )}
      {sets && sets.length > 0 && (
        <ul className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {sets.map((set) => (
            <li key={set.id}>
              <button
                type="button"
                data-doska-no-drag=""
                onClick={() => onPick(set.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{set.title}</span>
                <span className="shrink-0 text-xs opacity-60">
                  {set.containerKind === "deck" ? "Taqdimot" : "Test"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Player({
  setId,
  index,
  revealed,
  onGo,
  onReveal,
  onChange,
  teams,
  onTeamsChange,
  live,
  showJoin,
  onToggleJoin,
  preferredClassId,
  onStartLive,
  onEndLive,
}: {
  setId: string;
  index: number;
  revealed: boolean;
  onGo: (next: number) => void;
  /** Ochilayotgan savol — server uni qulflaydi («Yashirish» dan keyin ham). */
  onReveal: (activityId?: string) => void;
  onChange: () => void;
  teams: Team[] | null;
  onTeamsChange: (next: Team[] | null) => void;
  live: LiveSessionInfo | null;
  showJoin: boolean;
  onToggleJoin: () => void;
  preferredClassId?: string;
  onStartLive: (classId: string) => Promise<void>;
  onEndLive: () => Promise<void>;
}) {
  const results = useLiveResults(live);
  const [draft, setDraft] = React.useState<SetDraft | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen();
  };

  /* PROYEKTOR BOSHQARUVI — klaviatura va slayd pulti. Pult tugmalari
     PageDown/PageUp yuboradi, shuning uchun ular ham ushlanadi.
     Tugmalar faqat vidjet toʻliq ekranda boʻlsa yoki fokus uning
     ichida boʻlsa ishlaydi — aks holda Doska'dagi boshqa vidjetga
     yozilayotgan matnni «oʻgʻirlab» ketardi. Oxirgi holat ref orqali
     oʻqiladi: effekt har qadamda qayta ulanmaydi. */
  const keysRef = React.useRef<{ next: () => void; prev: () => void; reveal: () => void }>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      const keys = keysRef.current;
      if (!root || !keys) return;
      const active =
        document.fullscreenElement === root || root.contains(document.activeElement);
      if (!active || e.altKey || e.ctrlKey || e.metaKey) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) keys.next();
      else if (["ArrowLeft", "PageUp"].includes(e.key)) keys.prev();
      else if (e.key === "Enter") keys.reveal();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tugmalar har doim joriy qadamga qarab ishlashi uchun — har renderdan keyin.
  React.useEffect(() => {
    const total = draft?.questions.length ?? 0;
    const current = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
    const step = draft?.questions[current];
    keysRef.current = {
      next: () => current < total - 1 && onGo(current + 1),
      prev: () => current > 0 && onGo(current - 1),
      reveal: () => step && step.shape !== "slide" && onReveal(step.activityId),
    };
  });

  React.useEffect(() => {
    let cancelled = false;
    setDraft(null);
    setError(null);
    getSetDraftAction(setId)
      .then((d) => {
        if (cancelled) return;
        if (!d) setError("Toʻplam topilmadi");
        else setDraft(d);
      })
      .catch(() => !cancelled && setError("Toʻplamni ochib boʻlmadi"));
    return () => {
      cancelled = true;
    };
  }, [setId]);

  if (error) {
    return (
      <Panel className="items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm">{error}</p>
        <NavButton onClick={onChange}>Boshqasini tanlash</NavButton>
      </Panel>
    );
  }
  if (!draft) {
    return (
      <Panel className="items-center justify-center p-4">
        <p className="text-sm opacity-70">Yuklanmoqda…</p>
      </Panel>
    );
  }

  const steps = draft.questions;
  const total = steps.length;
  const current = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const step = steps[current];

  return (
    <Panel ref={rootRef} className="gap-[2cqw] p-[3cqw]">
      <div className="flex shrink-0 items-center gap-2 text-[max(12px,1.6cqw)] opacity-70">
        <span className="min-w-0 flex-1 truncate">{draft.set.title}</span>
        {live && (
          <button
            type="button"
            data-doska-no-drag=""
            onClick={onToggleJoin}
            className="rounded-md bg-black/5 px-2 py-0.5 font-mono hover:bg-black/10 dark:bg-white/10"
          >
            PIN {live.joinCode} · {results?.joined ?? 0} qoʻshildi
          </button>
        )}
        <span className="font-mono">
          {total === 0 ? 0 : current + 1} / {total}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-[2.5cqw] overflow-y-auto">
        {live && showJoin && (
          <JoinOverlay code={live.joinCode} joined={results?.joined ?? 0} onClose={onToggleJoin} />
        )}
        {!step && <p className="text-center opacity-70">Toʻplam boʻsh</p>}

        {/* Slayd — muharrir va oʻquvchi ekrani bilan bir xil renderer,
            vidjet oʻlchamiga 16:9 holida sigʻdiriladi. */}
        {step?.shape === "slide" && (
          <div className="grid min-h-0 flex-1 place-items-center" style={{ containerType: "size" }}>
            <div className="slide-fit">
              <div
                className="quiz-stage"
                style={
                  {
                    "--stage-bg": stageThemeBg(
                      step.slideBg ??
                        (draft.set.config as { stageTheme?: string }).stageTheme ??
                        "",
                    ),
                  } as React.CSSProperties
                }
              >
                <SlideView
                  slide={{
                    layout: slideLayoutOf(step.slideLayout),
                    title: step.title,
                    body: step.stem,
                    imageUrl: step.imageUrl,
                    videoUrl: step.videoUrl,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {step?.shape === "mcq" && (
          <>
            <h2 className="text-center text-[max(16px,3.6cqw)] font-semibold leading-snug">
              {step.stem}
            </h2>
            {live && (
              <p className="text-center text-[max(12px,1.8cqw)] opacity-70">
                {results?.items[step.activityId ?? ""]?.answered ?? 0} / {results?.joined ?? 0} javob berdi
              </p>
            )}
            <div className="grid grid-cols-2 gap-[1.5cqw]">
              {step.options.map((option, i) => {
                const item = live ? results?.items[step.activityId ?? ""] : undefined;
                const count = item?.byOption[option.id] ?? 0;
                const share = item && item.answered > 0 ? count / item.answered : 0;
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex items-center gap-[1.5cqw] overflow-hidden rounded-xl border-2 px-[2cqw] py-[1.5cqw] text-[max(13px,2.4cqw)] font-medium transition-opacity",
                      revealed && option.isCorrect && "border-[var(--doska-light-green)]",
                      revealed && !option.isCorrect && "opacity-35",
                      !revealed && "border-current/20",
                    )}
                  >
                    {/* Jonli ustun — FAQAT javob ochilgach. Erta koʻrinsa
                        proyektorga qarab qolganlar koʻpchilikka ergashadi va
                        jurnalga tushadigan natija buziladi. Ungacha tepada
                        faqat «N/M javob berdi» hisobi turadi. */}
                    {live && revealed && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 bg-current/10 transition-[width] duration-500"
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    )}
                    <span className="relative font-mono opacity-60">{String.fromCharCode(65 + i)}</span>
                    <span className="relative min-w-0 flex-1">{option.text}</span>
                    {live && revealed && <span className="relative font-mono opacity-70">{count}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SOʻROVNOMA — natija oʻqituvchi «Natijani koʻrsatish» ni bosgandagina
            chiqadi: ustunlar erta koʻrinsa oʻquvchilar koʻpchilikka ergashadi. */}
        {step?.shape === "poll" && (
          <>
            <h2 className="text-center text-[max(16px,3.6cqw)] font-semibold leading-snug">
              {step.stem}
            </h2>
            {live && (
              <p className="text-center text-[max(12px,1.8cqw)] opacity-70">
                {results?.items[step.activityId ?? ""]?.answered ?? 0} / {results?.joined ?? 0} javob berdi
              </p>
            )}
            <div className="flex flex-col gap-[1.2cqw]">
              {step.options.map((option, i) => {
                const item = live ? results?.items[step.activityId ?? ""] : undefined;
                const count = item?.byOption[option.id] ?? 0;
                const share = item && item.answered > 0 ? count / item.answered : 0;
                const show = live && revealed;
                return (
                  <div
                    key={option.id}
                    className="relative flex items-center gap-[1.5cqw] overflow-hidden rounded-xl border-2 border-current/20 px-[2cqw] py-[1.2cqw] text-[max(13px,2.4cqw)] font-medium"
                  >
                    {show && (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 bg-current/15 transition-[width] duration-700"
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    )}
                    <span className="relative font-mono opacity-60">{String.fromCharCode(65 + i)}</span>
                    <span className="relative min-w-0 flex-1">{option.text}</span>
                    {show && (
                      <span className="relative font-mono">{Math.round(share * 100)}%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* SOʻZ BULUTI — eng koʻp yozilgan soʻz eng katta. */}
        {step?.shape === "wordcloud" && (
          <>
            <h2 className="text-center text-[max(16px,3.6cqw)] font-semibold leading-snug">
              {step.stem}
            </h2>
            {live ? (
              <>
                <p className="text-center text-[max(12px,1.8cqw)] opacity-70">
                  {results?.items[step.activityId ?? ""]?.answered ?? 0} / {results?.joined ?? 0} javob berdi
                </p>
                {revealed && <WordCloud words={results?.items[step.activityId ?? ""]?.words ?? {}} />}
              </>
            ) : (
              <p className="text-center text-[max(12px,1.8cqw)] opacity-70">
                Soʻz bulutini yigʻish uchun jonli sessiya oching
              </p>
            )}
          </>
        )}

        {/* OCHIQ JAVOB — «Natijani koʻrsatish» da javoblar ISMSIZ chiqadi;
            baholash sessiya panelida, ismlar bilan, proyektorsiz. */}
        {step?.shape === "text" && (
          <>
            <h2 className="text-center text-[max(16px,3.6cqw)] font-semibold leading-snug">
              {step.stem}
            </h2>
            {live && (
              <p className="text-center text-[max(12px,1.8cqw)] opacity-70">
                {results?.items[step.activityId ?? ""]?.answered ?? 0} / {results?.joined ?? 0} javob berdi
              </p>
            )}
            {live && revealed && (
              <div className="grid grid-cols-2 gap-[1cqw] lg:grid-cols-3">
                {(results?.items[step.activityId ?? ""]?.texts ?? []).map((t, i) => (
                  <p
                    key={i}
                    className="line-clamp-4 rounded-lg border-2 border-current/15 p-[1.2cqw] text-[max(12px,1.8cqw)] leading-snug"
                  >
                    {t}
                  </p>
                ))}
              </div>
            )}
          </>
        )}

        {step?.shape === "pairs" && (
          <>
            <h2 className="text-center text-[max(16px,3.2cqw)] font-semibold">{step.title}</h2>
            <div className="flex flex-col gap-[1cqw] text-[max(13px,2.4cqw)]">
              {step.pairs.map((pair) => (
                <div key={pair.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-[1.5cqw]">
                  <span className="rounded-lg border-2 border-current/20 px-[1.5cqw] py-[1cqw]">
                    {pair.left}
                  </span>
                  <span className="opacity-50">→</span>
                  <span
                    className={cn(
                      "rounded-lg border-2 border-current/20 px-[1.5cqw] py-[1cqw]",
                      !revealed && "opacity-0",
                    )}
                  >
                    {pair.right}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {teams && <TeamBar teams={teams} onChange={onTeamsChange} />}

      <div className="flex shrink-0 items-center gap-2">
        {/* Jonli sessiya ketayotganda toʻplamni almashtirib boʻlmaydi —
            oʻquvchilar boshqa toʻplamning qadamlariga ergashib qolardi. */}
        {!live && <NavButton onClick={onChange}>Almashtirish</NavButton>}
        {live ? (
          <NavButton onClick={() => void onEndLive()}>Sessiyani tugatish</NavButton>
        ) : (
          <LiveStarter preferredClassId={preferredClassId} onStart={onStartLive} />
        )}
        <NavButton
          onClick={() =>
            onTeamsChange(
              teams ? null : [{ name: "1-jamoa", score: 0 }, { name: "2-jamoa", score: 0 }],
            )
          }
        >
          {teams ? "Jamoalarni yopish" : "Jamoalar"}
        </NavButton>
        <NavButton onClick={toggleFullscreen}>
          {fullscreen ? "Ekrandan chiqish" : "Toʻliq ekran"}
        </NavButton>
        <div className="flex-1" />
        {step &&
          step.shape !== "slide" &&
          (live || (step.shape !== "poll" && step.shape !== "wordcloud" && step.shape !== "text")) && (
          <NavButton onClick={() => onReveal(step.activityId)}>
            {revealed
              ? "Yashirish"
              : step.shape === "poll" || step.shape === "wordcloud" || step.shape === "text"
                ? "Natijani koʻrsatish"
                : "Javobni ochish"}
          </NavButton>
        )}
        <NavButton disabled={current <= 0} onClick={() => onGo(current - 1)}>
          ‹ Oldingi
        </NavButton>
        <NavButton disabled={current >= total - 1} onClick={() => onGo(current + 1)}>
          Keyingi ›
        </NavButton>
      </div>
    </Panel>
  );
}

/** Soʻz buluti — chastotaga qarab oʻlcham; koʻpi bilan 40 soʻz. */
function WordCloud({ words }: { words: Record<string, number> }) {
  const entries = Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);
  if (entries.length === 0) {
    return <p className="text-center text-[max(12px,1.8cqw)] opacity-60">Hali javob yoʻq</p>;
  }
  const max = entries[0][1];
  // Barqaror aralashtirish: eng kattasi markazda turishi uchun juft/toq tartib.
  const arranged = entries.flatMap((e, i) => (i % 2 === 0 ? [e] : [])).reverse().concat(
    entries.filter((_, i) => i % 2 === 1),
  );
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-[2cqw] gap-y-[1cqw] px-[2cqw]">
      {arranged.map(([word, count]) => {
        const weight = max > 1 ? (count - 1) / (max - 1) : 1;
        return (
          <span
            key={word}
            className="font-semibold leading-tight transition-all duration-500"
            style={{
              fontSize: `max(13px, ${(2.2 + weight * 5).toFixed(2)}cqw)`,
              opacity: 0.55 + weight * 0.45,
            }}
            title={`${count} marta`}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

/** Jonli natija — realtime turtki kelganda darhol, aks holda zaxira soʻrov bilan. */
function useLiveResults(live: LiveSessionInfo | null): LiveResults | null {
  const [results, setResults] = React.useState<LiveResults | null>(null);
  const sessionId = live?.sessionId ?? null;

  const refresh = React.useCallback(() => {
    if (!sessionId) return;
    liveResultsAction(sessionId).then(setResults).catch(() => {});
  }, [sessionId]);

  /* Ulanish sozlamasi serverdan, faqat sessiya ochiq paytda soʻraladi va
     vidjet holatiga (localStorage) YOZILMAYDI — xotirada qoladi xolos. */
  const [realtime, setRealtime] = React.useState<RealtimeConfig | null>(null);
  React.useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    liveRealtimeConfigAction()
      .then((cfg) => !cancelled && setRealtime(cfg))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const { connected } = useLiveNudge(live?.topic ?? null, realtime, refresh);

  React.useEffect(() => {
    if (!sessionId) return;
    refresh();
    // Realtime ulangan boʻlsa soʻrov faqat sugʻurta (turtki yoʻqolsa ham).
    const timer = setInterval(refresh, connected ? 15_000 : TEACHER_FALLBACK_POLL_MS);
    return () => clearInterval(timer);
  }, [sessionId, connected, refresh]);

  return sessionId ? results : null;
}

/** Sinf tanlab jonli sessiyani boshlash. */
function LiveStarter({
  preferredClassId,
  onStart,
}: {
  preferredClassId?: string;
  onStart: (classId: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [classes, setClasses] = React.useState<{ id: string; name: string }[] | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function start(classId: string) {
    setBusy(true);
    setError(null);
    try {
      await onStart(classId);
      setOpen(false);
    } catch {
      setError("Sessiyani boshlab boʻlmadi");
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && classes === null) {
      listLiveClassesAction()
        .then(setClasses)
        .catch(() => setError("Hisobingizga kiring"));
    }
  }

  return (
    <div className="relative">
      <NavButton onClick={toggle}>Jonli sessiya</NavButton>
      {open && (
        <div
          data-doska-no-drag=""
          className="absolute bottom-full left-0 z-10 mb-2 flex max-h-64 w-56 flex-col gap-1 overflow-y-auto rounded-lg bg-card p-2 text-card-foreground shadow-lg"
        >
          <p className="px-2 py-1 text-caption text-muted-foreground">Qaysi sinf qoʻshiladi?</p>
          {error && <p className="px-2 text-caption text-destructive">{error}</p>}
          {classes === null && !error && <p className="px-2 text-sm opacity-70">Yuklanmoqda…</p>}
          {classes?.length === 0 && <p className="px-2 text-sm opacity-70">Sinf topilmadi</p>}
          {classes?.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={busy}
              onClick={() => void start(c.id)}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted disabled:opacity-50",
                c.id === preferredClassId && "font-semibold",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Qoʻshilish oynasi — katta QR, PIN va havola; sinf ekranda koʻrib kiradi. */
function JoinOverlay({ code, joined, onClose }: { code: string; joined: number; onClose: () => void }) {
  const [svg, setSvg] = React.useState<string | null>(null);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/play/${code}`;

  React.useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toString(url, { type: "svg", margin: 1 }))
      .then((out) => !cancelled && setSvg(out))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center gap-[4cqw] rounded-xl p-[3cqw]"
      style={{ background: "var(--doska-slate-bg)" }}
    >
      {svg && (
        <div
          className="aspect-square h-full max-h-[40cqw] rounded-xl bg-white p-[1cqw]"
          // QR kutubxonasi toza SVG qaytaradi, foydalanuvchi matni yoʻq.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
      <div className="flex flex-col gap-[1.5cqw]">
        <p className="text-[max(13px,2.2cqw)] opacity-70">{url.replace(/^https?:\/\//, "").replace(/\/play\/.*$/, "/play")} ga kiring</p>
        <p className="font-mono text-[max(28px,8cqw)] font-semibold leading-none tracking-widest">{code}</p>
        <p className="text-[max(13px,2.4cqw)]">{joined} oʻquvchi qoʻshildi</p>
        <div>
          <NavButton onClick={onClose}>Boshlash</NavButton>
        </div>
      </div>
    </div>
  );
}

function NavButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // Tugmani bosish sudrashni boshlamasin (`lib/doska/interaction.ts`).
      data-doska-no-drag=""
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-black/5 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/10 disabled:opacity-40 dark:bg-white/10 dark:hover:bg-white/15"
    >
      {children}
    </button>
  );
}
