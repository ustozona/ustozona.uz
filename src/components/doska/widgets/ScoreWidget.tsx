"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSection, SettingsStepper } from "../SettingsFields";
import { Digits } from "./Digits";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   HISOB TAXTASI — jamoalar ochkosi (docs/doska-referens-koriklari.md R414).

   Viktorina, guruh ishi, «kim tezroq»: 2–6 jamoa, har birida katta son
   va −/+ tugmalari. Tugmalar ASOSIY AMAL — birinchi teginishda ishlaydi.

   Ochkolar qaytarish tarixiga (Ctrl+Z) yozilmaydi — xato bosilsa «−».
   Jamoa nomi boʻsh boʻlsa «1-jamoa» koʻrinadi (tarjimadan, saqlanmaydi).
   ════════════════════════════════════════════════════════════════════ */

const MIN_TEAMS = 2;
const MAX_TEAMS = 6;

type Team = { name: string; score: number };

function readTeams(state: DoskaWidget["state"]): Team[] {
  const raw = Array.isArray(state.teams) ? state.teams : [];
  const teams = raw.slice(0, MAX_TEAMS).map((x) => {
    const t = (x ?? {}) as Record<string, unknown>;
    return { name: typeof t.name === "string" ? t.name : "", score: Number(t.score) || 0 };
  });
  while (teams.length < MIN_TEAMS) teams.push({ name: "", score: 0 });
  return teams;
}

export function ScoreWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.score");
  const teams = readTeams(widget.state);
  const top = Math.max(...teams.map((x) => x.score));
  const leader = top > 0 && teams.filter((x) => x.score === top).length === 1 ? top : null;

  const add = (i: number, delta: number) =>
    patch(widget.id, { teams: teams.map((x, j) => (j === i ? { ...x, score: x.score + delta } : x)) });

  return (
    <div
      className="doska-card grid size-full gap-[2cqw] p-[3cqw]"
      data-card="slate"
      style={{ gridTemplateColumns: `repeat(${Math.min(teams.length, 3)}, minmax(0, 1fr))` }}
    >
      {teams.map((team, i) => {
        const name = team.name.trim() || t("teamName", { n: i + 1 });
        return (
          <section
            key={i}
            className="flex min-h-0 min-w-0 flex-col items-center justify-between gap-[1cqw] rounded-[0.75rem] bg-current/10 p-[2cqw]"
            style={leader !== null && team.score === leader ? { boxShadow: "inset 0 0 0 3px var(--primary)" } : undefined}
          >
            <h3 translate="no" className="w-full truncate text-center leading-tight font-semibold" style={{ fontSize: "clamp(0.75rem, 4cqw, 1.75rem)" }}>
              {name}
            </h3>
            <Digits text={String(team.score)} style={{ fontSize: `clamp(1.5rem, ${teams.length > 3 ? 11 : 14}cqw, 8rem)` }} />
            <div className="flex gap-[1.5cqw]">
              <WidgetButton shape="round" label={t("minus", { name })} onClick={() => add(i, -1)} style={{ fontSize: "clamp(1rem, 5cqw, 1.75rem)" }}>
                −
              </WidgetButton>
              <WidgetButton shape="round" tone="primary" label={t("plus", { name })} onClick={() => add(i, 1)} style={{ fontSize: "clamp(1rem, 5cqw, 1.75rem)" }}>
                +
              </WidgetButton>
            </div>
          </section>
        );
      })}
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function ScoreSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.score");
  const teams = readTeams(widget.state);
  const set = (next: Team[]) => patch(widget.id, { teams: next });

  return (
    <>
      <SettingsSection label={t("teams")}>
        <SettingsStepper
          value={String(teams.length)}
          minusLabel={t("less")}
          plusLabel={t("more")}
          minusDisabled={teams.length <= MIN_TEAMS}
          plusDisabled={teams.length >= MAX_TEAMS}
          onMinus={() => set(teams.slice(0, -1))}
          onPlus={() => set([...teams, { name: "", score: 0 }])}
        />
      </SettingsSection>

      <SettingsSection label={t("names")}>
        <div className="flex flex-col gap-1.5">
          {teams.map((team, i) => (
            <Input
              key={i}
              value={team.name}
              maxLength={30}
              placeholder={t("teamName", { n: i + 1 })}
              aria-label={t("teamName", { n: i + 1 })}
              onChange={(e) => set(teams.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
          ))}
        </div>
      </SettingsSection>

      <Button type="button" variant="outline" className="h-11 w-full" onClick={() => set(teams.map((x) => ({ ...x, score: 0 })))}>
        {t("reset")}
      </Button>
    </>
  );
}
