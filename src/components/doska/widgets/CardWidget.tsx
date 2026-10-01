"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsChoices, SettingsSection } from "../SettingsFields";
import { EditableText } from "./EditableText";

/* ════════════════════════════════════════════════════════════════════
   KARTA — sarlavha va yozuv varagʻi: «Dars maqsadi», «Uyga vazifa»,
   «Kerakli narsalar»… (docs/doska-referens-koriklari.md R444, R447).

   ⚠️ BITTA vidjet, uchta obyekt emas. Boshqa xizmatlarda bunday karta
   rangli toʻrtburchak + sarlavha matni + yozuv matnidan qoʻlda yigʻiladi
   va guruhlanadi: bittasi siljisa karta buziladi, oʻlchamni oʻzgartirish
   uchun uchalasini alohida choʻzish kerak. Bu yerda choʻzilganda ichi
   oʻzi moslashadi.

   «Eslatma»dan farqi: eslatma — doskaga yopishtirilgan QOGʻOZ (bir xil
   pushti), karta esa ekranning BOʻLIMI — sarlavhasi bor, tusi tanlanadi,
   bir ekranda bir nechtasi yonma-yon turadi (R454 «Kun rejasi»).

   Sarlavha: `preset` — tayyor variant kaliti (tarjimada), `title` —
   oʻqituvchi oʻzi yozgani; yozilgan boʻlsa u ustun. Kalit saqlangani
   uchun shablondagi karta sarlavhasi interfeys tili bilan almashadi.

   Tus — uslubning karta tuslari (`data-card`), sinf palitrasi emas:
   har uslub ularni proyektor sinovidan oʻtkazgan (R324).
   ════════════════════════════════════════════════════════════════════ */

export const CARD_TINTS = ["blue", "teal", "amber", "note", "slate"] as const;
export type CardTint = (typeof CARD_TINTS)[number];

export const CARD_PRESETS = ["goal", "homework", "materials", "reminder", "earlyFinish", "question"] as const;
export type CardPreset = (typeof CARD_PRESETS)[number];

function readCard(state: DoskaWidget["state"]) {
  const tint: CardTint = CARD_TINTS.includes(state.tint as CardTint) ? (state.tint as CardTint) : "blue";
  const preset = CARD_PRESETS.includes(state.preset as CardPreset) ? (state.preset as CardPreset) : null;
  const title = typeof state.title === "string" ? state.title : "";
  return { tint, preset, title };
}

export function CardWidget({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.card");
  const { tint, preset, title } = readCard(widget.state);
  const heading = title.trim() || (preset ? t(`presets.${preset}`) : "");

  return (
    <div className="doska-card flex size-full flex-col gap-[3cqw] p-[4cqw]" data-card={tint}>
      <h3
        className={cn("doska-card-title shrink-0 truncate", !heading && "opacity-40")}
        style={{ fontSize: "clamp(0.9rem, 8cqw, 3.5rem)" }}
      >
        {heading || t("untitled")}
      </h3>
      <div className="doska-card-body min-h-0 flex-1 px-[4cqw] py-[3cqw]">
        <EditableText
          widget={widget}
          placeholder={t("placeholder")}
          // Roʻyxat boʻlib yoziladi — chapda va tepadan, «Eslatma» kabi.
          className="text-left"
          style={{ alignContent: "start" }}
          widthRatio={0.075}
          minFont={12}
          maxFont={44}
        />
      </div>
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function CardSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.card");
  const { tint, preset, title } = readCard(widget.state);

  return (
    <>
      <SettingsSection label={t("title")}>
        {/* Tayyor sarlavha — matn maydonisiz: doskada klaviatura ekranning
            yarmini yopadi (SettingsFields sarlavhasi). */}
        <SettingsChoices<CardPreset | "">
          ariaLabel={t("title")}
          columns={2}
          value={title.trim() ? "" : (preset ?? "")}
          options={CARD_PRESETS.map((p) => ({ value: p, label: t(`presets.${p}`) }))}
          onChange={(p) => patch(widget.id, { preset: p || null, title: "" })}
        />
        <Input
          value={title}
          maxLength={60}
          placeholder={t("custom")}
          aria-label={t("custom")}
          onChange={(e) => patch(widget.id, { title: e.target.value })}
        />
      </SettingsSection>

      <SettingsSection label={t("color")}>
        <SettingsChoices<CardTint>
          ariaLabel={t("color")}
          value={tint}
          options={CARD_TINTS.map((c) => ({
            value: c,
            title: t(`tints.${c}`),
            // Namuna — joriy uslubning shu tusdagi foni va urgʻusi. Ikkalasi
            // kerak: «Sokin»da tus fonda, «Doska»da fon hammasida qogʻoz va
            // tus faqat urgʻuda (magnit, chiziq).
            //
            // ⚠️ `.doska-card` klassi qoʻyilmaydi — uning magniti (`::before`)
            // qatlamsiz qoida, utilita bilan yashirib boʻlmaydi va 36 px
            // namunaning ustida 26 px doira boʻlib chiqardi.
            label: (
              <span
                aria-hidden="true"
                className="flex h-7 w-9 items-start justify-center rounded-md pt-1"
                style={{ background: `var(--doska-${c}-bg)`, boxShadow: "inset 0 0 0 1px var(--doska-card-line)" }}
              >
                <span className="size-2.5 rounded-full" style={{ background: `var(--doska-${c}-accent)` }} />
              </span>
            ),
          }))}
          onChange={(c) => patch(widget.id, { tint: c })}
        />
      </SettingsSection>
    </>
  );
}
