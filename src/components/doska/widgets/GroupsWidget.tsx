"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { parseEntries } from "@/lib/doska/wheel";
import { randomIndex } from "@/lib/spin-wheel";
import { SettingsSection, SettingsStepper } from "../SettingsFields";
import { WidgetButton } from "./WidgetButton";

/* ════════════════════════════════════════════════════════════════════
   GURUH TUZUVCHI — roʻyxatni tasodifiy guruhlarga boʻlish
   (docs/doska-referens-koriklari.md R411, 1-qadam).

   Ikki usul: guruhlar SONI («4 ta guruh») yoki guruhdagi ODAM soni
   («3 tadan»). Ismlar aralashtiriladi va navbat bilan tarqatiladi —
   guruhlar orasidagi farq koʻpi bilan bitta odam.

   Roʻyxat gʻildirak kabi: har qator bitta ism; boʻsh boʻlsa namuna
   ismlar (gʻildirakniki). Sinf roʻyxati, bugun yoʻqlar va cheklovlar
   («birga qoʻyilmasin») — keyingi qadam, server bilan (B bosqichi).

   Natija storeʼda (`groups`) — sahifa yangilansa ham guruhlar qoladi:
   oʻquvchilar dars davomida ekranga qarab oʻz guruhini topadi.
   Tasodif kriptografik (`randomIndex`), gʻildirak bilan bir xil.
   ════════════════════════════════════════════════════════════════════ */

export type GroupsBy = "count" | "size";

const MAX_N = 12;

function readGroups(state: DoskaWidget["state"]) {
  const by: GroupsBy = state.by === "size" ? "size" : "count";
  const n = Math.min(MAX_N, Math.max(2, Number(state.n) || 4));
  const groups = Array.isArray(state.groups)
    ? state.groups.filter(Array.isArray).map((g) => (g as unknown[]).map(String))
    : [];
  return { text: typeof state.text === "string" ? state.text : "", by, n, groups };
}

/** Fisher–Yates, kriptografik tasodif bilan. */
function shuffle<T>(list: readonly T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ismlarni guruhlarga boʻladi: navbat bilan, farq koʻpi bilan bitta. */
export function makeGroups(names: readonly string[], by: GroupsBy, n: number): string[][] {
  if (names.length === 0) return [];
  const count = Math.max(1, Math.min(names.length, by === "count" ? n : Math.ceil(names.length / n)));
  const groups: string[][] = Array.from({ length: count }, () => []);
  shuffle(names).forEach((name, i) => groups[i % count].push(name));
  return groups;
}

/** Guruhlar soniga qarab ustunlar — kataklar iloji boricha kvadratga yaqin. */
function columnsFor(count: number): number {
  if (count <= 3) return count;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function GroupsWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.groups");
  const tWheel = useTranslations("Doska.wheel");
  const { text, by, n, groups } = readGroups(widget.state);
  /**
   * Koʻchirish — sudrash emas, IKKI TEGINISH: ismga tegiladi (tanlanadi),
   * keyin boshqa guruhga. Sensorli doskada ism ustida sudrash vidjetni
   * surib yuborardi; ikki teginish sichqonchada ham, barmoqda ham bir xil.
   */
  const [picked, setPicked] = React.useState<{ g: number; i: number } | null>(null);

  const moveTo = (target: number) => {
    if (!picked || picked.g === target) {
      setPicked(null);
      return;
    }
    const next = groups.map((g) => [...g]);
    const [name] = next[picked.g].splice(picked.i, 1);
    if (name !== undefined) next[target].push(name);
    patch(widget.id, { groups: next });
    setPicked(null);
  };

  const make = () => {
    setPicked(null);
    const typed = parseEntries(text);
    const names = typed.length > 0 ? typed : (tWheel.raw("sampleNames") as string[]);
    patch(widget.id, { groups: makeGroups(names, by, n) });
  };

  if (groups.length === 0) {
    return (
      <div className="doska-card flex size-full flex-col items-center justify-center gap-[4cqw] p-[6cqw] text-center" data-card="slate">
        <p className="leading-snug opacity-80" style={{ fontSize: "clamp(0.8rem, 5cqw, 1.75rem)" }}>
          {by === "count" ? t("summaryCount", { n }) : t("summarySize", { n })}
        </p>
        <WidgetButton
          tone="primary"
          onClick={make}
          className="min-h-11 px-[6cqw] py-[3cqw] font-semibold"
          style={{ fontSize: "clamp(0.85rem, 5cqw, 1.75rem)" }}
        >
          {t("make")}
        </WidgetButton>
      </div>
    );
  }

  const cols = columnsFor(groups.length);
  return (
    <div className="doska-card flex size-full flex-col gap-[2cqw] p-[3cqw]" data-card="slate">
      <div
        translate="no"
        className="grid min-h-0 flex-1 gap-[2cqw] overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {groups.map((members, i) => (
          <section
            key={i}
            data-doska-no-drag=""
            onClick={() => picked && moveTo(i)}
            className={cn(
              "flex min-h-0 flex-col gap-[0.8cqw] overflow-hidden rounded-[0.75rem] bg-current/10 p-[2cqw]",
              picked && picked.g !== i && "outline-primary/60 cursor-pointer outline-2 outline-dashed",
            )}
          >
            <h3 className="leading-tight font-semibold" style={{ fontSize: `clamp(0.75rem, ${9 / cols}cqw, 2rem)` }}>
              {t("groupName", { n: i + 1 })}
            </h3>
            <ul className="min-h-0 overflow-hidden leading-snug" style={{ fontSize: `clamp(0.7rem, ${8 / cols}cqw, 1.75rem)` }}>
              {members.map((name, j) => (
                <li key={j}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPicked(picked?.g === i && picked.i === j ? null : { g: i, i: j });
                    }}
                    className={cn(
                      "w-full truncate rounded-[0.4rem] px-[0.6cqw] text-left",
                      picked?.g === i && picked.i === j && "bg-primary text-primary-foreground",
                    )}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="flex items-center justify-center gap-[2cqw]">
        {picked && (
          <span className="opacity-75" style={{ fontSize: "clamp(0.75rem, 3cqw, 1.2rem)" }}>
            {t("moveHint")}
          </span>
        )}
        <WidgetButton
          tone="primary"
          onClick={make}
          className="px-[5cqw] py-[1.5cqw] font-semibold"
          style={{ fontSize: "clamp(0.8rem, 3.5cqw, 1.4rem)" }}
        >
          {t("shuffle")}
        </WidgetButton>
      </div>
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function GroupsSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.groups");
  const tWheel = useTranslations("Doska.wheel");
  const { text, by, n } = readGroups(widget.state);
  const samples = tWheel.raw("sampleNames") as string[];
  const count = parseEntries(text).length;

  // Usul yoki son oʻzgarsa eski guruhlar oʻchadi — ular endi boshqa narsa.
  return (
    <>
      <SettingsSection label={t("by")}>
        <SegmentedToggle
          aria-label={t("by")}
          value={by}
          options={[
            { value: "count", label: t("byCount") },
            { value: "size", label: t("bySize") },
          ]}
          onValueChange={(v) => patch(widget.id, { by: v, groups: [] })}
        />
      </SettingsSection>

      <SettingsSection label={by === "count" ? t("groupsCount") : t("perGroup")}>
        <SettingsStepper
          value={String(n)}
          minusLabel={t("less")}
          plusLabel={t("more")}
          minusDisabled={n <= 2}
          plusDisabled={n >= MAX_N}
          onMinus={() => patch(widget.id, { n: n - 1, groups: [] })}
          onPlus={() => patch(widget.id, { n: n + 1, groups: [] })}
        />
      </SettingsSection>

      <SettingsSection label={count > 0 ? t("namesCount", { count }) : t("names")}>
        <Textarea
          value={text}
          rows={6}
          spellCheck={false}
          translate="no"
          placeholder={samples.join("\n")}
          aria-label={t("names")}
          className="resize-none select-text"
          onChange={(e) => patch(widget.id, { text: e.target.value, groups: [] })}
        />
        <p className="text-muted-foreground text-xs leading-snug">{count > 0 ? t("namesHint") : t("samplesHint")}</p>
      </SettingsSection>
    </>
  );
}
