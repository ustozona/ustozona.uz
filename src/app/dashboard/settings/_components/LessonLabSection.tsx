"use client";

import { SettingsCard } from "./SettingsShared";
import { LessonLabLinkPanel, WhyLinkInfo } from "@/components/lessonlab/LessonLabLinkPanel";

/* LessonLab bog'lanishini SOZLAMALARDAN boshqarish — to'liq koʻrinish.
   Ixcham koʻrinishi Profilda (`ProfileSection.tsx`). Ikkalasi ham
   `LessonLabLinkPanel` / `useLessonLabLink` orqali BIR XIL holat va
   amaldan foydalanadi. */
export default function LessonLabSection() {
  return (
    <SettingsCard
      title={
        <span className="inline-flex items-center gap-1.5">
          LessonLab bog'lanishi
          <WhyLinkInfo />
        </span>
      }
      description="Ustozona va LessonLab — bitta tizim. Bog'langan bo'lsangiz, sinf va o'quvchilaringiz ikkalasida ham ko'rinadi."
    >
      <div className="rounded-xl border border-border bg-card px-4 py-4">
        <LessonLabLinkPanel variant="full" />
      </div>
    </SettingsCard>
  );
}
