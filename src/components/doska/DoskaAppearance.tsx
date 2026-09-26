"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { DOSKA_STYLES, useDoskaPrefs, type DockSide, type DoskaStyle } from "@/lib/doska/prefs";
import { iconTintStyle } from "@/lib/doska/tint";
import type { ClassColor } from "@/lib/class-colors";
import { SettingsChoices, SettingsSection } from "./SettingsFields";
import { Digits } from "./widgets/Digits";
import { IconArrowLeft, IconCheck, IconDockBottom, IconDockLeft, IconDockRight } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   KOʻRINISH — uslub va panel joyi (menyu ichidagi boʻlim).

   Nega menyuda, alohida oynada emas: oʻqituvchi buni kamdan-kam
   oʻzgartiradi (R329: < 5%), shuning uchun panelda tugma olmaydi. Menyu
   esa pastda, qoʻl yetadigan joyda (R319) — boʻlim oʻsha yerda ochiladi,
   ekran oʻrtasida modal emas.

   Oʻzgarish DARHOL qoʻllanadi, «Saqlash» yoʻq (Q2): oʻqituvchi natijani
   orqadagi doskada koʻrib turadi.

   Uslub namunasi — rasm emas, HAQIQIY tokenlar: namuna oʻz
   `data-doska-style` atributi bilan chiziladi (src/styles/doska.css,
   qoida 1). Shuning uchun namuna va doska hech qachon farq qilmaydi.
   ════════════════════════════════════════════════════════════════════ */

export function DoskaAppearance({ onBack }: { onBack: () => void }) {
  const style = useDoskaPrefs((s) => s.style);
  const setStyle = useDoskaPrefs((s) => s.setStyle);
  const dock = useDoskaPrefs((s) => s.dock);
  const setDock = useDoskaPrefs((s) => s.setDock);
  const t = useTranslations("Doska.appearance");

  const docks: { value: DockSide; label: React.ReactNode; title: string }[] = [
    { value: "left", label: <DockLabel Icon={IconDockLeft} text={t("dockLeft")} />, title: t("dockLeft") },
    { value: "bottom", label: <DockLabel Icon={IconDockBottom} text={t("dockBottom")} />, title: t("dockBottom") },
    { value: "right", label: <DockLabel Icon={IconDockRight} text={t("dockRight")} />, title: t("dockRight") },
  ];

  // Radio guruhi klaviatura qoidasi: guruhga bitta Tab (tanlangani),
  // ichida strelkalar tanlovni suradi. Doska yorliqlari popover ichida
  // jim (useDoskaShortcuts), shuning uchun strelka vidjetni surmaydi.
  const onStyleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const n = DOSKA_STYLES.length;
    const next = DOSKA_STYLES[(DOSKA_STYLES.indexOf(style) + step + n) % n];
    setStyle(next);
    e.currentTarget.querySelector<HTMLElement>(`[data-style-option="${next}"]`)?.focus();
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 border-b py-1 pr-4 pl-1">
        <button
          type="button"
          aria-label={t("back")}
          onClick={onBack}
          className="hover:bg-muted focus-visible:ring-ring grid size-11 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconArrowLeft className="size-5" />
        </button>
        <h2 className="text-sm font-medium">{t("title")}</h2>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <SettingsSection label={t("style")}>
          <div role="radiogroup" aria-label={t("style")} onKeyDown={onStyleKeyDown} className="flex flex-col gap-2">
            {DOSKA_STYLES.map((id) => (
              <StyleOption
                key={id}
                id={id}
                name={t(`styles.${id}.name`)}
                note={t(`styles.${id}.note`)}
                selected={style === id}
                onSelect={() => setStyle(id)}
              />
            ))}
          </div>
        </SettingsSection>

        <SettingsSection label={t("dock")}>
          <SettingsChoices ariaLabel={t("dock")} value={dock} options={docks} onChange={setDock} />
        </SettingsSection>
      </div>
    </div>
  );
}

function DockLabel({ Icon, text }: { Icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <span className="flex flex-col items-center gap-1 py-2">
      <Icon className="size-6" />
      <span className="text-xs">{text}</span>
    </span>
  );
}

function StyleOption({
  id,
  name,
  note,
  selected,
  onSelect,
}: {
  id: DoskaStyle;
  name: string;
  note: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      data-style-option={id}
      onClick={onSelect}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-lg border p-2 text-left transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        // Tanlov rang bilan yolgʻiz aytilmaydi — chegara qalinlashadi va
        // belgi chiqadi (R326).
        selected ? "border-primary ring-primary ring-1" : "hover:bg-muted",
      )}
    >
      <StylePreview id={id} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-muted-foreground text-xs leading-snug">{note}</span>
      </span>
      {selected && <IconCheck className="text-primary size-5 shrink-0" />}
    </button>
  );
}

/** Namunadagi panel tugmalari — haqiqiy vidjetlar tusida. */
const PREVIEW_TINTS: ClassColor[] = ["blue", "amber", "red", "teal"];

/**
 * Uslub namunasi — yashil doska ustida taymer, eslatma va panel.
 *
 * Ikki barobar kattalikda chizilib, yarmiga kichraytiriladi: uslub
 * tokenlari haqiqiy pikselda (kontur 3 px, radius 26 px) — aks holda
 * 96 px namunada Oʻyinchoq konturi kartaning yarmini yeb qoʻyardi.
 */
function StylePreview({ id }: { id: DoskaStyle }) {
  return (
    <span aria-hidden="true" className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-md">
      <span
        data-doska-style={id}
        className="absolute top-0 left-0 block h-32 w-48 origin-top-left scale-50"
        style={{ background: "oklch(0.33 0.045 158)", fontFamily: "var(--doska-font)" }}
      >
        <span className="doska-card absolute top-5 left-4 grid h-16 w-26 place-items-center" data-card="amber">
          <Digits text="05:00" style={{ fontSize: 26 }} />
        </span>
        <span className="doska-card absolute top-5 left-34 block size-12" data-card="note" />
        <span className="doska-ctl absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 p-1">
          {PREVIEW_TINTS.map((tint) => (
            <span
              key={tint}
              data-icon-tinted=""
              style={iconTintStyle(tint)}
              className="doska-tool-tile grid size-6 place-items-center rounded-md"
            >
              <span className="size-3 rounded-full" style={{ background: "var(--doska-tile-icon, var(--doska-icon-tint))" }} />
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
