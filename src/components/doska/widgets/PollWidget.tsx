"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSection, SettingsStepper, SettingsSwitch } from "../SettingsFields";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   OVOZ BERISH — oʻquvchilar doskaga chiqib bosadi, qurilmasiz
   (docs/doska-referens-koriklari.md R412).

   Bir daqiqalik «chiqish chiptasi»: «Bugungi dars qanday boʻldi?» —
   smaylik; «Tushundingizmi?» — ha/yoʻq; yoki A–E variant. Masofadan
   (telefondan) ovoz berish bu yerda YOʻQ — u Baholash sessiyasi orqali.

   Har bosish +1. Ovozlar tarixga (Ctrl+Z) yozilmaydi — bu dars natijasi,
   tahrir emas. «Natijani yashirish» — bolalar oldingilarga qarab ovoz
   bermasin; oʻqituvchi oxirida ochadi.

   ⚠️ Variant tugmasi — ASOSIY AMAL: birinchi teginishda ishlaydi,
   vidjetni tanlamaydi (§2.9, qoida 1).
   ════════════════════════════════════════════════════════════════════ */

export type PollType = "smiley" | "yesno" | "choice";

const SMILEYS: Record<number, string[]> = {
  3: ["😞", "😐", "😀"],
  5: ["😢", "😞", "😐", "🙂", "😀"],
};
const LETTERS = ["A", "B", "C", "D", "E"];

function readPoll(state: DoskaWidget["state"]) {
  const type: PollType = state.type === "yesno" || state.type === "choice" ? state.type : "smiley";
  const raw = Number(state.count) || 3;
  const count = type === "yesno" ? 2 : type === "smiley" ? (raw >= 5 ? 5 : 3) : Math.min(5, Math.max(2, raw));
  const saved = Array.isArray(state.votes) ? state.votes.map((v) => Math.max(0, Number(v) || 0)) : [];
  const votes = Array.from({ length: count }, (_, i) => saved[i] ?? 0);
  return {
    type,
    count,
    votes,
    hidden: state.hidden === true,
    question: typeof state.question === "string" ? state.question : "",
  };
}

export function PollWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.poll");
  const { type, count, votes, hidden, question } = readPoll(widget.state);
  const total = votes.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...votes);
  const [flash, setFlash] = React.useState<number | null>(null);

  const labels =
    type === "smiley" ? SMILEYS[count] : type === "yesno" ? [t("yes"), t("no")] : LETTERS.slice(0, count);

  const vote = (i: number) => {
    patch(widget.id, { votes: votes.map((v, j) => (j === i ? v + 1 : v)) });
    setFlash(i);
    setTimeout(() => setFlash((f) => (f === i ? null : f)), 250);
  };

  return (
    <div className="doska-card flex size-full flex-col gap-[2.5cqw] p-[4cqw]" data-card="slate">
      {question && (
        <p className="text-center leading-tight font-semibold" style={{ fontSize: "clamp(0.9rem, 5cqw, 2.5rem)" }}>
          {question}
        </p>
      )}

      <div className="flex min-h-0 flex-1 items-end justify-center gap-[3cqw]">
        {labels.map((label, i) => {
          const share = votes[i] / max;
          return (
            <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-[1.5cqw]">
              {/* Ustun — natija yashirilganda balandligi ham yashiriladi. */}
              <span className="font-mono font-semibold tabular-nums" style={{ fontSize: "clamp(0.8rem, 4.5cqw, 2rem)" }}>
                {hidden ? "?" : votes[i]}
              </span>
              <div className="flex min-h-0 w-full flex-1 items-end">
                <div
                  className="bg-primary/70 w-full rounded-t-[0.5rem] transition-[height] duration-300"
                  style={{ height: hidden ? "0%" : `${Math.max(share * 100, votes[i] ? 4 : 0)}%` }}
                />
              </div>
              <WidgetButton
                label={t("voteFor", { option: label })}
                onClick={() => vote(i)}
                className={cn("w-full transition-transform", flash === i && "scale-110")}
                style={{
                  fontSize: type === "smiley" ? "clamp(1.5rem, 11cqw, 5rem)" : "clamp(0.9rem, 6cqw, 2.5rem)",
                  padding: "1.5cqw 1cqw",
                }}
              >
                {label}
              </WidgetButton>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-[2cqw]" style={{ fontSize: "clamp(0.75rem, 3.2cqw, 1.2rem)" }}>
        <span className="opacity-70">{t("total", { count: total })}</span>
        <WidgetButton onClick={() => patch(widget.id, { hidden: !hidden })} className="px-[3cqw] py-[1.2cqw]">
          {hidden ? t("show") : t("hide")}
        </WidgetButton>
        {total > 0 && (
          <WidgetButton onClick={() => patch(widget.id, { votes: [] })} className="px-[3cqw] py-[1.2cqw]">
            {t("reset")}
          </WidgetButton>
        )}
      </div>
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function PollSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.poll");
  const { type, count, hidden, question } = readPoll(widget.state);

  // Tur yoki variantlar soni oʻzgarsa ovozlar oʻchadi — ular endi boshqa savolga.
  return (
    <>
      <SettingsSection label={t("type")}>
        <SegmentedToggle
          aria-label={t("type")}
          value={type}
          options={[
            { value: "smiley", label: t("typeSmiley") },
            { value: "yesno", label: t("typeYesNo") },
            { value: "choice", label: t("typeChoice") },
          ]}
          onValueChange={(v) => patch(widget.id, { type: v, votes: [] })}
        />
      </SettingsSection>

      {type !== "yesno" && (
        <SettingsSection label={t("options")}>
          <SettingsStepper
            value={String(count)}
            minusLabel={t("less")}
            plusLabel={t("more")}
            minusDisabled={type === "smiley" ? count <= 3 : count <= 2}
            plusDisabled={count >= 5}
            onMinus={() => patch(widget.id, { count: type === "smiley" ? 3 : count - 1, votes: [] })}
            onPlus={() => patch(widget.id, { count: type === "smiley" ? 5 : count + 1, votes: [] })}
          />
        </SettingsSection>
      )}

      <SettingsSection label={t("question")}>
        <Input
          value={question}
          maxLength={120}
          placeholder={t("questionPlaceholder")}
          aria-label={t("question")}
          onChange={(e) => patch(widget.id, { question: e.target.value })}
        />
      </SettingsSection>

      <SettingsSwitch label={t("hideResults")} checked={hidden} onChange={(on) => patch(widget.id, { hidden: on })} />
    </>
  );
}
