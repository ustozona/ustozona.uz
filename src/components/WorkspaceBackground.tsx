"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  useSettingsStore,
  normalizeBackground,
  type WorkspaceBackground as BgKind,
} from "@/store/useSettingsStore";

/* Ishchi maydon foni — dashboard shellʼining orqa fonini boshqaradi.
   `next-themes`ʼdan mavzuni oʻqib, yorugʻ/qorongʻu uchun mos rang tanlaydi
   (inline style → globals.css Turbopack keshi gotchasidan qochamiz). */

export function backgroundStyle(kind: BgKind, dark: boolean): React.CSSProperties {
  switch (kind) {
    case "parchment":
      return dark
        ? {
            backgroundColor: "oklch(0.205 0 0)",
            backgroundImage: `radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          }
        : {
            backgroundColor: "oklch(0.985 0.012 85)",
            backgroundImage: `radial-gradient(rgba(161,124,58,0.18) 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
          };
    case "circles":
      return dark
        ? {
            backgroundColor: "oklch(0.21 0.02 250)",
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(96,165,250,0.10) 0, transparent 42%), radial-gradient(circle at 72% 68%, rgba(96,165,250,0.08) 0, transparent 44%)`,
            backgroundSize: "96px 96px",
          }
        : {
            backgroundColor: "oklch(0.968 0.019 236)",
            backgroundImage: `radial-gradient(circle at 30% 30%, rgba(59,130,246,0.14) 0, transparent 42%), radial-gradient(circle at 72% 68%, rgba(59,130,246,0.10) 0, transparent 44%)`,
            backgroundSize: "96px 96px",
          };
    case "stripes":
      return dark
        ? {
            backgroundColor: "oklch(0.205 0 0)",
            backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.045) 0, rgba(255,255,255,0.045) 1px, transparent 1px, transparent 11px)`,
          }
        : {
            backgroundColor: "oklch(0.97 0 0)",
            backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.035) 0, rgba(0,0,0,0.035) 1px, transparent 1px, transparent 11px)`,
          };
    case "grid":
    default:
      return dark
        ? {
            backgroundColor: "oklch(0.205 0 0)",
            backgroundImage: `linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }
        : {
            backgroundColor: "oklch(0.97 0 0)",
            backgroundImage: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          };
  }
}

export default function WorkspaceBackground() {
  const kind = useSettingsStore((s) => s.workspaceBackground);
  const hydrated = useSettingsStore((s) => s._hasHydrated);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  // Hidratsiyagacha default ("grid") — flashning oldini olamiz.
  const effective = hydrated ? normalizeBackground(kind) : "grid";

  return (
    <div
      aria-hidden
      className="absolute inset-0 h-full w-full pointer-events-none"
      style={backgroundStyle(effective, dark)}
    />
  );
}
