"use client";

import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDoskaStore } from "@/lib/doska/store";
import { SHAPES, SHAPE_ORDER, toPixels, type ShapeId } from "@/lib/doska/shapes";
import { BarButton } from "./BarButton";
import { IconShape } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   SHAKL TANLASH — panel tugmasi.

   Toʻqqiz shakl uchun toʻqqizta panel tugmasi qilinmadi: panel allaqachon
   olti tugmali va u sinf ekranining pastida turadi. Shuning uchun bitta
   tugma + tanlash paneli, `BackgroundPicker` naqshi bilan bir xil.

   ⚠️ Namunalar shaklning OʻZ maʼlumotidan chiziladi (`SHAPES`), yaʼni
   har shakl uchun alohida ikona chizilmaydi. Yangi shakl qoʻshish
   `shapes.ts` ga bitta yozuv — panel oʻzi yangilanadi va namuna
   haqiqatan ekranga chiqadigan figuraga teng boʻladi.
   ════════════════════════════════════════════════════════════════════ */

export function ShapePicker() {
  const addWidget = useDoskaStore((s) => s.addWidget);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <BarButton label="Shakl" Icon={IconShape} tint="cyan" />
      </PopoverTrigger>

      <PopoverContent
        align="center"
        sideOffset={12}
        className="doska-bar w-72 p-2"
        style={{ zIndex: "var(--z-doska-context)" }}
      >
        <div className="grid grid-cols-3 gap-2">
          {SHAPE_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                addWidget("shape.v1", undefined, { shape: id });
                // Tanlangach panel yopiladi — oʻqituvchi figurani
                // darhol joyiga sudray olsin, panel ustidan turmasin.
                setOpen(false);
              }}
              className="group flex flex-col items-center gap-1.5"
              title={SHAPES[id].label}
            >
              <span className="group-hover:border-foreground/30 group-hover:bg-muted/50 grid h-12 w-full place-items-center rounded-md border transition-colors">
                <ShapeGlyph id={id} />
              </span>
              <span className="text-muted-foreground group-hover:text-foreground text-center text-[11px] leading-tight transition-colors">
                {SHAPES[id].label}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Namuna — yorliqsiz va ingichka chiziqli.
 *
 * 34×28 katakda `A, B, C` harflari oʻqilmaydi, lekin joy egallab
 * figurani kichraytiradi. Panelda tanib olishni SILUET tashiydi.
 */
function ShapeGlyph({ id }: { id: ShapeId }) {
  const def = SHAPES[id];
  const w = 34;
  const h = 28;
  const pad = 3;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {def.points ? (
        <polygon
          points={toPixels(def.points, w, h, pad)
            .map(([x, y]) => `${x},${y}`)
            .join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ) : (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - pad}
          ry={h / 2 - pad}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}
