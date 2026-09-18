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
      onGo={(next) => patch(widget.id, { index: next, revealed: false })}
      onReveal={() => patch(widget.id, { revealed: !revealed })}
      onChange={() => patch(widget.id, { setId: null, index: 0, revealed: false })}
      teams={teams}
      onTeamsChange={setTeams}
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

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("flex size-full flex-col rounded-[var(--radius)]", className)}
      style={{
        background: "var(--doska-slate-bg)",
        color: "var(--doska-slate-fg)",
        boxShadow: "0 4px 0 var(--doska-slate-edge)",
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
}: {
  setId: string;
  index: number;
  revealed: boolean;
  onGo: (next: number) => void;
  onReveal: () => void;
  onChange: () => void;
  teams: Team[] | null;
  onTeamsChange: (next: Team[] | null) => void;
}) {
  const [draft, setDraft] = React.useState<SetDraft | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
    <Panel className="gap-[2cqw] p-[3cqw]">
      <div className="flex shrink-0 items-center gap-2 text-[max(12px,1.6cqw)] opacity-70">
        <span className="min-w-0 flex-1 truncate">{draft.set.title}</span>
        <span className="font-mono">
          {total === 0 ? 0 : current + 1} / {total}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-[2.5cqw] overflow-y-auto">
        {!step && <p className="text-center opacity-70">Toʻplam boʻsh</p>}

        {step?.shape === "slide" && (
          <>
            {step.title && (
              <h2 className="text-[max(18px,4.5cqw)] font-bold leading-tight">{step.title}</h2>
            )}
            {step.stem && (
              <p className="whitespace-pre-wrap text-[max(14px,2.8cqw)] leading-relaxed">
                {step.stem}
              </p>
            )}
          </>
        )}

        {step?.shape === "mcq" && (
          <>
            <h2 className="text-center text-[max(16px,3.6cqw)] font-bold leading-snug">
              {step.stem}
            </h2>
            <div className="grid grid-cols-2 gap-[1.5cqw]">
              {step.options.map((option, i) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center gap-[1.5cqw] rounded-xl border-2 px-[2cqw] py-[1.5cqw] text-[max(13px,2.4cqw)] font-medium transition-opacity",
                    revealed && option.isCorrect && "border-[var(--doska-light-green)]",
                    revealed && !option.isCorrect && "opacity-35",
                    !revealed && "border-current/20",
                  )}
                >
                  <span className="font-mono opacity-60">{String.fromCharCode(65 + i)}</span>
                  <span className="min-w-0">{option.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {step?.shape === "pairs" && (
          <>
            <h2 className="text-center text-[max(16px,3.2cqw)] font-bold">{step.title}</h2>
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
        <NavButton onClick={onChange}>Almashtirish</NavButton>
        <NavButton
          onClick={() =>
            onTeamsChange(
              teams ? null : [{ name: "1-jamoa", score: 0 }, { name: "2-jamoa", score: 0 }],
            )
          }
        >
          {teams ? "Jamoalarni yopish" : "Jamoalar"}
        </NavButton>
        <div className="flex-1" />
        {step && step.shape !== "slide" && (
          <NavButton onClick={onReveal}>{revealed ? "Yashirish" : "Javobni ochish"}</NavButton>
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
