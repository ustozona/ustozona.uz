"use client";

import { useTranslations } from "next-intl";

import { activeScreenOf, useActiveBackground, useDoskaStore } from "@/lib/doska/store";
import { backgroundById } from "@/lib/doska/backgrounds";
import { hasVisibleInk } from "@/lib/doska/ink";
import { useInkTool } from "@/lib/doska/ink-tool";

/* ════════════════════════════════════════════════════════════════════
   BOʻSH DOSKA YOʻRIGʻI — ekranda hech narsa boʻlmaganda bir qator.

   Birinchi ochilishda oʻqituvchi yashil (yoki oq) maydon va pastdagi
   panelni koʻradi; nima qilish kerakligi hech qayerda yozilmagan edi.
   Vidjet qoʻyilishi, birinchi chiziq chizilishi yoki qoʻlyozma rejimiga
   oʻtilishi bilan yoʻrigʻ yoʻqoladi.

   Matn faqat kanvas USTIDA turadi va bosishni toʻsmaydi
   (`pointer-events-none`). Boshqaruv yashirilganda (`B`) chizilmaydi —
   sinfga toza ekran koʻrsatilmoqda.

   ⚠️ Selektor boolean qaytaradi: ekran obyekti har chiziq va taymer
   soniyasida yangilanadi, yoʻrigʻni esa faqat «boʻsh/boʻsh emas» farqi
   qiziqtiradi. `hasVisibleInk` faqat vidjet yoʻq paytda hisoblanadi.
   ════════════════════════════════════════════════════════════════════ */
export function DoskaEmptyHint() {
  const t = useTranslations("Doska.bar");
  const empty = useDoskaStore((s) => {
    const screen = activeScreenOf(s);
    return s.hydrated && !!screen && screen.widgets.length === 0 && !hasVisibleInk(screen);
  });
  const tone = backgroundById(useActiveBackground()).tone;
  // Qalam rejimida «Qalamni tanlang» deyish notoʻgʻri — oʻqituvchi allaqachon yozyapti.
  const inking = useInkTool((s) => s.mode !== null);

  if (!empty || inking) return null;

  return (
    <p
      className="pointer-events-none absolute inset-x-0 top-[42%] mx-auto max-w-md px-6 text-center text-lg leading-snug font-medium select-none"
      style={{ color: tone === "dark" ? "oklch(1 0 0 / 0.6)" : "oklch(0.3 0 0 / 0.55)" }}
    >
      {t("emptyHint")}
    </p>
  );
}
