"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSection, SettingsSwitch } from "../SettingsFields";
import { Digits } from "./Digits";

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
    <div className="doska-card grid size-full place-items-center px-4" data-card="blue">
      <Digits
        text={text}
        // Yuqori chegara katta: «Markazga» rejimida soat butun ekranga
        // kattalashadi va raqam u bilan oʻsishi kerak.
        style={{ fontSize: "clamp(2rem, 26cqw, 30rem)" }}
      />
    </div>
  );
}

export function ClockSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.clock");

  return (
    <SettingsSection label={t("view")}>
      <SettingsSwitch
        label={t("showSeconds")}
        checked={widget.state.showSeconds !== false}
        onChange={(on) => patch(widget.id, { showSeconds: on })}
      />
    </SettingsSection>
  );
}
