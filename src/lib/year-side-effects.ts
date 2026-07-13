import { inRange, type AcademicYearCalendar } from "@/lib/academic-calendar";
import { todayDateKey } from "@/lib/behavior-data";
import { useTimetableStore } from "@/store/useTimetableStore";
import { useBehaviorStore } from "@/store/useBehaviorStore";

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
  const start = active.range.start;
  if (!start) return;
  useTimetableStore.getState().ensureVersionAt(start);
  if (inRange(todayDateKey(), active.range)) {
    useBehaviorStore.getState().shiftAutoAnchorsForward(start);
  }
}
