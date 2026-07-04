"use client";

import * as React from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useGradesStore } from "@/store/useGradesStore";
import { isCalendarConfigured } from "@/lib/academic-calendar";
import OnboardingWizard from "./OnboardingWizard";

/* ════════════════════════════════════════════════════════════════════
   ONBOARDING GATE — sehrgarni qachon koʻrsatishni hal qiladi.

   Qaror bir marta LATCH qilinadi: barcha tegishli store'lar hydration'i
   tugagan ondagi holatga qarab (onboarding tugamagan + kalendar sozlanmagan
   + sinf yoʻq). Uch store hydration'ini kutish — mavjud maʼlumotli
   hisoblarda «boʻsh» chaqnab oʻtmasligi uchun.

   MUHIM: sehrgar ochilgach latch ushlab turadi va faqat `onboardingCompleted`
   true boʻlganda (tugatildi/oʻtkazib yuborildi) yopiladi. Aks holda sehrgar
   oʻzi 3-qadamda kalendarni yozganda gate sharti oʻzgarib, sehrgar oʻrtada
   yopilib qolardi (isCalendarConfigured true boʻlib ketardi).
   Dashboard layout'ida sync koʻpriklari yonida turadi.
   ════════════════════════════════════════════════════════════════════ */

export default function OnboardingGate() {
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const calHydrated = useCalendarStore((s) => s._hasHydrated);
  const calendar = useCalendarStore((s) => s.calendar);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const classCount = useGradesStore((s) => Object.keys(s.classDataMap).length);

  const ready = settingsHydrated && calHydrated && gradesHydrated;
  const [latched, setLatched] = React.useState(false);

  React.useEffect(() => {
    // Faqat hydration tugagan ondagi holatni tekshiramiz — keyingi
    // (sehrgar keltirgan) oʻzgarishlar latch'ni buzmaydi.
    if (ready && !onboarded && !isCalendarConfigured(calendar) && classCount === 0) {
      setLatched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (onboarded || !latched) return null;
  return <OnboardingWizard />;
}
