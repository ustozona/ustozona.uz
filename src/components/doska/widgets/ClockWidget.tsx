"use client";

import * as React from "react";

import type { DoskaWidget } from "@/lib/doska/types";

/**
 * SOAT — joriy vaqt.
 *
 * ⚠️ Vaqt serverda va brauzerda har xil boʻlgani uchun birinchi render
 * BOʻSH chiqadi (`null`), qiymat esa mount'dan keyin qoʻyiladi. Aks
 * holda hydration mismatch boʻladi.
 */
export function ClockWidget({ widget }: { widget: DoskaWidget }) {
  const showSeconds = widget.state.showSeconds !== false;
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const text = now
    ? showSeconds
      ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      : `${pad(now.getHours())}:${pad(now.getMinutes())}`
    : "";

  return (
    <div
      className="grid size-full place-items-center rounded-[var(--radius)] px-4"
      style={{
        background: "var(--doska-blue-bg)",
        color: "var(--doska-blue-fg)",
        boxShadow: "0 4px 0 var(--doska-blue-edge)",
      }}
    >
      <span
        className="font-mono leading-none font-medium tabular-nums"
        style={{ fontSize: "clamp(2rem, 26cqw, 7rem)" }}
      >
        {text}
      </span>
    </div>
  );
}
