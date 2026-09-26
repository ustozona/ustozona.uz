"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { backgroundStyle } from "@/lib/workspace-background";

/* ════════════════════════════════════════════════════════════════════
   `/jadval` ISHCHI MAYDON FONI.

   ⚠️ Nega umuman kerak: light rejimda `--background` va `--card` AYNAN
   bir xil qiymatda (`oklch(1 0 0)`), panel soyasi esa `none`. Yaʼni oq
   ustida oq — panelni faqat 1px chegara ajratib turadi va butun sahifa
   yassi, «boʻsh» boʻlib koʻrinadi.

   Dashboard bu muammoni `WorkspaceBackground` bilan yechgan: shell foni
   `oklch(0.97 0 0)` + yengil naqsh, kartalar esa oq boʻlib ustida
   «suzadi». `/jadval` esa dashboard layout ichida EMAS — mustaqil yoʻl
   (docs/dars-jadvali-spec.md §9), shuning uchun u fon unga yetib
   bormasdi.

   ⛔ `WorkspaceBackground` komponentining oʻzi import qilinmaydi — u
   `useSettingsStore` ni ishga tushiradi, ost-loyiha esa dashboard
   store'lariga bogʻlanmaydi. Faqat sof hisob (`backgroundStyle`)
   olinadi.

   Naqsh va oʻlcham qatʼiy: `/jadval` mehmon rejimida ishlaydi, unda
   sozlamalar sahifasi yoʻq — tanlash imkoni ham, saqlaydigan joyi ham.
   ════════════════════════════════════════════════════════════════════ */

/* `grid` EMAS, `parchment` (nozik nuqtalar).

   Sabab kuzatilgan: 72px katakli toʻr chizigʻi boʻsh ekranda —
   masalan sozlash sahifasida — millimetrli qogʻozdek dominant boʻlib
   koʻrinadi va asosiy mazmundan diqqatni tortadi. Nuqtali tekstura
   xuddi shu vazifani (panel fondan ajralsin) bajaradi, lekin oʻzi
   koʻzga tashlanmaydi. Ish maydonida ham toʻr ustiga toʻr tushmaydi. */
const JADVAL_BACKGROUND = "parchment" as const;
const JADVAL_BACKGROUND_SCALE = 200;

export default function JadvalBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      aria-hidden
      /* `-z-10` — `body` foni canvas'ga koʻchgani uchun bu qatlam undan
         yuqorida, lekin butun kontentdan pastda chiziladi. Shu sababli
         `JadvalWorkspace` ga umuman tegilmaydi. */
      className="pointer-events-none fixed inset-0 -z-10"
      style={backgroundStyle(
        JADVAL_BACKGROUND,
        mounted && resolvedTheme === "dark",
        JADVAL_BACKGROUND_SCALE
      )}
    />
  );
}
