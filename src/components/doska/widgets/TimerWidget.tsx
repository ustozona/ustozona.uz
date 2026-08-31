"use client";

import * as React from "react";
import { Pause, Play, RotateCcw, Plus } from "lucide-react";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";

/**
 * TAYMER — orqaga sanash.
 *
 * Holat store'da saqlanadi (`durationSec`, `remainingSec`, `running`),
 * shuning uchun sahifa yangilansa ham taymer joyida qoladi. Sanoq esa
 * shu komponentda: har soniyada `remainingSec` kamayadi.
 */
export function TimerWidget({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);

  const durationSec = Number(widget.state.durationSec ?? 300);
  const remainingSec = Number(widget.state.remainingSec ?? durationSec);
  const running = widget.state.running === true;
  const finished = remainingSec <= 0;

  React.useEffect(() => {
    if (!running || finished) return;
    const id = setInterval(() => {
      // Store'dan oʻqiymiz, prop'dan emas: interval yopilmasidan oldin
      // prop eskirgan boʻlishi mumkin.
      const current = useDoskaStore
        .getState()
        .deck.screens.flatMap((s) => s.widgets)
        .find((w) => w.id === widget.id);
      if (!current) return;

      const left = Number(current.state.remainingSec ?? 0) - 1;
      if (left <= 0) {
        patch(widget.id, { remainingSec: 0, running: false });
      } else {
        patch(widget.id, { remainingSec: left });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, finished, widget.id, patch]);

  const mm = Math.floor(Math.max(0, remainingSec) / 60);
  const ss = Math.max(0, remainingSec) % 60;
  const text = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  return (
    <div
      className="flex size-full flex-col items-center justify-center gap-[3cqw] rounded-[var(--radius)] px-[4cqw]"
      style={{
        background: finished ? "var(--doska-light-red)" : "var(--doska-amber-bg)",
        color: finished ? "oklch(0.99 0 0)" : "var(--doska-amber-fg)",
        boxShadow: `0 4px 0 ${finished ? "oklch(0.45 0.18 27)" : "var(--doska-amber-edge)"}`,
      }}
    >
      <span
        className="font-mono leading-none font-medium tabular-nums"
        style={{ fontSize: "clamp(2rem, 24cqw, 6rem)" }}
      >
        {text}
      </span>

      <div className="flex items-center gap-[2cqw]">
        <TimerButton
          label={running ? "Toʻxtatish" : "Boshlash"}
          onClick={() => patch(widget.id, { running: !running })}
          disabled={finished}
        >
          {running ? <Pause className="size-[6cqw] min-h-4 min-w-4" /> : <Play className="size-[6cqw] min-h-4 min-w-4" />}
        </TimerButton>

        <TimerButton
          label="Tiklash"
          onClick={() => patch(widget.id, { remainingSec: durationSec, running: false })}
        >
          <RotateCcw className="size-[6cqw] min-h-4 min-w-4" />
        </TimerButton>

        <TimerButton
          label="Bir daqiqa qoʻshish"
          onClick={() =>
            patch(widget.id, {
              durationSec: durationSec + 60,
              remainingSec: Math.max(0, remainingSec) + 60,
            })
          }
        >
          <Plus className="size-[6cqw] min-h-4 min-w-4" />
          <span className="text-[4cqw] leading-none font-medium">1</span>
        </TimerButton>
      </div>
    </div>
  );
}

/**
 * Taymer tugmasi — `<Button>` primitivi EMAS: bu sirt ichida oʻlcham
 * konteyner kengligiga bogʻlangan (`cqw`), tugma esa vidjet fonining
 * ustida turadi. Primitiv bunday kontekstni bilmaydi.
 *
 * `data-doska-no-drag` shu yerda, har chaqiruvda emas: taymer tugmasi
 * boshqaruv ekan, uni bosish hech qachon sudrash boʻlmasligi kerak.
 * (`stopPropagation` bu ish uchun yaramaydi — sabab
 * `lib/doska/interaction.ts` dagi `ATTR_NO_DRAG` izohida.)
 */
function TimerButton({
  children,
  label,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      data-doska-no-drag=""
      aria-label={label}
      className="grid place-items-center gap-1 rounded-full bg-current/15 px-[4cqw] py-[2.5cqw] transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ gridAutoFlow: "column" }}
      {...props}
    >
      {children}
    </button>
  );
}
