"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";

/**
 * SVETOFOR — sinf shovqini yoki ish rejimi belgisi.
 *
 * Uch chiroq: qizil (jim ishlaymiz), sariq (juftlikda pichirlab),
 * yashil (erkin gaplashamiz). Faol chiroq yonadi, qolgani soʻnadi.
 */
const LIGHTS = [
  { id: "red", label: "Jim ishlaymiz", color: "var(--doska-light-red)" },
  { id: "amber", label: "Pichirlab", color: "var(--doska-light-amber)" },
  { id: "green", label: "Erkin gaplashamiz", color: "var(--doska-light-green)" },
] as const;

export function TrafficLightWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const active = String(widget.state.active ?? "red");

  return (
    <div
      className="flex size-full flex-col items-center justify-around rounded-[var(--radius)] px-[8cqw] py-[6cqw]"
      style={{
        background: "var(--doska-slate-bg)",
        boxShadow: "0 4px 0 var(--doska-slate-edge)",
      }}
    >
      {LIGHTS.map((light) => {
        const on = active === light.id;
        return (
          <button
            key={light.id}
            type="button"
            aria-label={light.label}
            aria-pressed={on}
            // Chiroqni bosish sudrashni boshlamasin. `stopPropagation`
            // bu yerda ish bermaydi — sabab `lib/doska/interaction.ts`
            // dagi `ATTR_NO_DRAG` izohida.
            data-doska-no-drag=""
            onClick={() => patch(widget.id, { active: light.id })}
            className={cn(
              "aspect-square w-[70cqw] rounded-full transition-opacity duration-300",
              !on && "opacity-15",
            )}
            style={{
              background: light.color,
              // Yonganda chiroq atrofida yumshoq nur — uzoqdan qaysi
              // chiroq faolligi darhol koʻrinsin.
              boxShadow: on ? `0 0 6cqw 1cqw color-mix(in oklch, ${light.color} 55%, transparent)` : "none",
            }}
          />
        );
      })}
    </div>
  );
}
