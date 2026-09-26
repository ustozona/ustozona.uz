"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { IconQuiet, IconTalk, IconWhisper } from "../icons";
import { SettingsSection, SettingsSwitch } from "../SettingsFields";

/**
 * SVETOFOR — sinf shovqini yoki ish rejimi belgisi.
 *
 * Uch chiroq: qizil (jim ishlaymiz), sariq (pichirlab), yashil (erkin
 * gaplashamiz). Faol chiroq yonadi, qolgani soʻnadi.
 *
 * ⚠️ Holat faqat RANG bilan aytilmaydi: pastda faol chiroqning belgisi
 * va soʻzi turadi (docs/doska-ux-tadqiqot.md R326 — 30 kishilik sinfda
 * taxminan bir bola qizil-yashilni farqlamaydi; WCAG 1.4.1). Yozuvni
 * sozlamada oʻchirish mumkin — masalan hali oʻqiy olmaydigan sinfda —
 * belgi baribir qoladi.
 */
const LIGHTS = [
  { id: "red", color: "var(--doska-light-red)", Icon: IconQuiet },
  { id: "amber", color: "var(--doska-light-amber)", Icon: IconWhisper },
  { id: "green", color: "var(--doska-light-green)", Icon: IconTalk },
] as const;

export function TrafficLightWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.trafficLight");
  const active = LIGHTS.find((l) => l.id === widget.state.active) ?? LIGHTS[0];
  const showLabel = widget.state.labels !== false;

  return (
    <div className="doska-card flex size-full flex-col items-center px-[8cqw] py-[6cqw]" data-card="slate">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-around">
        {LIGHTS.map((light) => {
          const on = active.id === light.id;
          return (
            <button
              key={light.id}
              type="button"
              aria-label={t(light.id)}
              aria-pressed={on}
              // Chiroqni bosish sudrashni boshlamasin. `stopPropagation`
              // bu yerda ish bermaydi — sabab `lib/doska/interaction.ts`
              // dagi `ATTR_NO_DRAG` izohida.
              data-doska-no-drag=""
              onClick={() => patch(widget.id, { active: light.id })}
              className={cn(
                // Oʻlcham balandlikdan: pastda yozuv turadi va uch chiroq
                // qolgan joyga sigʻishi kerak. `min` — tor vidjetda eni ham.
                "aspect-square h-[min(70cqw,28%)] rounded-full transition-opacity duration-300",
                !on && "opacity-15",
              )}
              style={{
                background: light.color,
                // Yonganda chiroq atrofida yumshoq nur — uzoqdan qaysi
                // chiroq faolligi darhol koʻrinsin.
                boxShadow: on
                  ? `0 0 6cqw 1cqw color-mix(in oklch, ${light.color} 55%, transparent)`
                  : "none",
              }}
            />
          );
        })}
      </div>

      {/* Faol holat — belgi + soʻz. `aria-live`: holat almashsa ekran
          oʻquvchi ham eʼlon qiladi. */}
      <p
        aria-live="polite"
        className="mt-[4cqw] flex flex-col items-center gap-[1.5cqw] text-center leading-tight font-semibold"
        style={{ fontSize: "clamp(0.75rem, 13cqw, 5rem)" }}
      >
        <active.Icon className="size-[1.4em]" />
        {showLabel ? <span>{t(active.id)}</span> : <span className="sr-only">{t(active.id)}</span>}
      </p>
    </div>
  );
}

export function TrafficLightSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.trafficLight");

  return (
    <SettingsSection label={t("labelSection")}>
      <SettingsSwitch
        label={t("showLabel")}
        checked={widget.state.labels !== false}
        onChange={(on) => patch(widget.id, { labels: on })}
      />
    </SettingsSection>
  );
}
