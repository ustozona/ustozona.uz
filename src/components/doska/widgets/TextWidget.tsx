"use client";

import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsChoices, SettingsSection, SettingsSwitch } from "../SettingsFields";
import { EditableText } from "./EditableText";

/**
 * MATN — sarlavha, topshiriq, eʼlon.
 *
 * ⚠️ IDISHSIZ vidjet (docs/doska-dizayn-tizimi.md §3). Fon ham,
 * chegara ham, ofset soya ham yoʻq — faqat siyoh. Sabab: oʻqituvchi
 * doskaga yozganda qogʻoz olib kelmaydi, yozadi. Rangli kartochka
 * matnni «stiker» qilib qoʻyadi va yonidagi haqiqiy vidjetlar bilan
 * raqobatlashadi.
 *
 * Shuning uchun standart rangi bitta: `--doska-ink` (`.doska-ink`).
 * Toʻq fonda u boʻr rangiga oʻtadi (src/styles/doska.css), yaʼni yashil
 * doskada matn boʻr bilan yozilgandek koʻrinadi.
 *
 * RANG VA QALINLIK (docs/doska-referens-koriklari.md R417) — butun
 * vidjetga, harfma-harf emas. Ranglar qalam palitrasidan
 * (`--doska-pen-*`): ular toʻq fonda oʻzi ochroq boʻladi, yaʼni rangli
 * matn ham, rangli boʻr ham bir xil koʻrinadi.
 *
 * Boʻsh vidjet koʻrinmay qolmaydi: tanlanganida chegara `SelectionOverlay`
 * dan keladi, boʻshligida esa placeholder turadi.
 */

export const TEXT_COLORS = ["auto", "red", "blue", "green", "orange", "violet"] as const;
export type TextColor = (typeof TEXT_COLORS)[number];

function readTextStyle(state: DoskaWidget["state"]) {
  const color: TextColor = TEXT_COLORS.includes(state.color as TextColor) ? (state.color as TextColor) : "auto";
  return { color, bold: state.bold === true };
}

function colorValue(color: TextColor): string | undefined {
  return color === "auto" ? undefined : `var(--doska-pen-${color})`;
}

export function TextWidget({ widget }: { widget: DoskaWidget }) {
  const { color, bold } = readTextStyle(widget.state);
  return (
    <div className="size-full px-[3cqw] py-[2cqw]">
      <EditableText
        widget={widget}
        placeholder="Matn yozing…"
        // Siyoh / boʻr rangi va qalinlik — uslubdan (`.doska-ink`).
        className="doska-ink"
        style={{ color: colorValue(color), fontWeight: bold ? 700 : undefined }}
        // Yuqori chegara — qisqa sarlavha butun kenglikni egallasin.
        // Uzun jumla yozilsa `useFitText` uni oʻzi pasaytiradi.
        widthRatio={0.11}
        minFont={14}
        maxFont={80}
      />
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function TextSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.textStyle");
  const { color, bold } = readTextStyle(widget.state);

  return (
    <>
      <SettingsSection label={t("color")}>
        <SettingsChoices
          ariaLabel={t("color")}
          value={color}
          columns={6}
          options={TEXT_COLORS.map((c) => ({
            value: c,
            title: t(`colors.${c}`),
            label: (
              <span
                aria-hidden="true"
                className="size-6 rounded-full border border-black/10"
                style={{ background: colorValue(c) ?? "var(--doska-ink)" }}
              />
            ),
          }))}
          onChange={(c) => patch(widget.id, { color: c })}
        />
      </SettingsSection>
      <SettingsSwitch label={t("bold")} checked={bold} onChange={(on) => patch(widget.id, { bold: on })} />
    </>
  );
}
