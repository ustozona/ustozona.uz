"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  useSettingsStore,
  normalizeBackground,
  normalizeBackgroundScale,
  BACKGROUND_SCALE_DEFAULT,
} from "@/store/useSettingsStore";
import { backgroundStyle } from "@/lib/workspace-background";

/* Naqsh hisobi `@/lib/workspace-background` ga koʻchdi — `/jadval` ham
   shu manbadan foydalanadi (u dashboard store'iga bogʻlana olmaydi).
   Bu yerdan reʼeksport qilinadi: `AppearanceSection` eski yoʻl bilan
   import qiladi va oʻzgartirishga hojat yoʻq. */
export { backgroundStyle };

/* Ishchi maydon foni — dashboard shellʼining orqa fonini boshqaradi.
   `next-themes`ʼdan mavzuni oʻqib, yorugʻ/qorongʻu uchun mos rang tanlaydi
   (inline style → globals.css Turbopack keshi gotchasidan qochamiz). */

export default function WorkspaceBackground() {
  const kind = useSettingsStore((s) => s.workspaceBackground);
  const scale = useSettingsStore((s) => s.backgroundScale);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  // Hidratsiyagacha default ("grid"/100%) — flashning oldini olamiz.
  const effective = hydrated ? normalizeBackground(kind) : "grid";
  const effectiveScale = hydrated ? normalizeBackgroundScale(scale) : BACKGROUND_SCALE_DEFAULT;

  return (
    <div
      aria-hidden
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={backgroundStyle(effective, dark, effectiveScale)}
    />
  );
}
