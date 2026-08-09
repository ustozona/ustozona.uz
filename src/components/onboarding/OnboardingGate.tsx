"use client";

import * as React from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useGradesStore } from "@/store/useGradesStore";
import { useOnboardingVisible } from "./onboarding-visible";
import OnboardingWizard from "./OnboardingWizard";

/* ════════════════════════════════════════════════════════════════════
   ONBOARDING GATE — sehrgarni qachon koʻrsatishni hal qiladi.

   Qaror bir marta LATCH qilinadi: tegishli store'lar hydration'i tugagan
   ondagi holatga qarab (onboarding tugamagan + hali sinf yoʻq = chinakam
   yangi hisob). Ikki store hydration'ini kutish — mavjud maʼlumotli
   hisoblarda «boʻsh» chaqnab oʻtmasligi uchun.

   Kalendar endi CalendarServerSync tomonidan eager-seed qilinadi (hech
   qachon boʻsh emas), shuning uchun trigger kalendar holatiga TAYANMAYDI —
   yangi hisob signali `onboardingCompleted=false` + sinf yoʻqligi.

   MUHIM: sehrgar ochilgach latch ushlab turadi va faqat `onboardingCompleted`
   true boʻlganda (tugatildi/oʻtkazib yuborildi) yopiladi.
   Dashboard layout'ida sync koʻpriklari yonida turadi.
   ════════════════════════════════════════════════════════════════════ */

export default function OnboardingGate() {
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);
  const onboarded = useSettingsStore((s) => s.onboardingCompleted);
  const gradesHydrated = useGradesStore((s) => s._hasHydrated);
  const classCount = useGradesStore((s) => Object.keys(s.classDataMap).length);

  const ready = settingsHydrated && gradesHydrated;
  const [latched, setLatched] = React.useState(false);

  React.useEffect(() => {
    // Faqat hydration tugagan ondagi holatni tekshiramiz — keyingi
    // (sehrgar keltirgan) oʻzgarishlar latch'ni buzmaydi.
    if (ready && !onboarded && classCount === 0) {
      setLatched(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const visible = !onboarded && latched;

  // Sehrgar ekrandaligini eʼlon qilamiz — boshqa toʻliq ekranli
  // darvozalar (masalan `LessonLabLinkGate`) ustiga chiqmasligi uchun.
  // `TourProvider` dagi `setActiveTour` bilan bir xil naqsh.
  const setOpen = useOnboardingVisible((s) => s.setOpen);
  React.useEffect(() => {
    setOpen(visible);
    return () => setOpen(false);
  }, [visible, setOpen]);

  if (!visible) return null;
  return <OnboardingWizard />;
}
