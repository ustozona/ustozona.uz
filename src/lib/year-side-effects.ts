import { inRange, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { todayDateKey } from "@/lib/behavior-data";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useGradesStore } from "@/store/useGradesStore";
import { projectClassForYear } from "@/lib/class-naming";

/* ════════════════════════════════════════════════════════════════════
   YIL FAOLLASHUVI YON-TAʼSIRLARI (koʻp-yil, 1-bosqich)

   Oʻquv yili yaratilgach yoki faollashtirilgach ikki store'ga yon-taʼsir:
   (1) Jadval yil boshini qoplashi — eng erta versiya klonlab, yangi yil
       boshidagi dars kunlari "jadval yoʻq" boʻlib qolmaydi (ensureVersionAt).
   (2) Bugun yangi yil ichida boʻlsa — xulq avto-langarlari (attendanceSince/
       journalSince) yil boshiga suriladi; seriyalar tabiiy noldan boshlanadi,
       langar oldidagi tarix (balans) saqlanadi.

   UI event-handlerlaridan (CreateSemesterModal, AcademicYearSection)
   chaqiriladi — shu sabab store'lar getState() bilan oʻqiladi (import
   sikli yoʻq; hech kim bu faylni store ichidan import qilmaydi). */
export function applyYearActivationSideEffects(active: AcademicYearCalendar): void {
  projectClassesToActiveYear();
  const start = active.range.start;
  if (!start) return;
  useTimetableStore.getState().ensureVersionAt(start);
  if (inRange(todayDateKey(), active.range)) {
    useBehaviorStore.getState().shiftAutoAnchorsForward(start);
  }
}

/* ════════════════════════════════════════════════════════════════════
   SINFLARNI FAOL YILGA PROYEKSIYA QILISH

   Sinfning darajasi yil boʻyicha saqlanadi (`ClassInfo.gradeByYear`),
   koʻrsatiladigan nom esa darajadan hosil boʻladi. Yil almashganda shu
   funksiya barcha sinflarning `grade` va `name` maydonlarini oʻsha yil
   qiymatiga keltiradi — 2025–2026 ga qaytilganda "6-A" yana "5-A"
   boʻlib koʻrinadi. Tarix (`gradeByYear`) tegilmaydi, shuning uchun
   amal qaytariluvchan.

   Referens tenglik saqlanadi: oʻzgarmagan sinf obyekti aynan oʻsha
   qoladi, shu bois grades-sync uni serverga qayta yozmaydi.
   ════════════════════════════════════════════════════════════════════ */
export function projectClassesToActiveYear(): void {
  const yearId = useCalendarStore.getState().years.find((y) => y.isActive)?.id;
  if (!yearId) return;
  useGradesStore.getState().setClassDataMap((prev) => {
    let changed = false;
    const next: typeof prev = {};
    for (const [id, cd] of Object.entries(prev)) {
      const info = projectClassForYear(cd.info, yearId);
      if (info !== cd.info) changed = true;
      next[id] = info === cd.info ? cd : { ...cd, info };
    }
    return changed ? next : prev;
  });
}
