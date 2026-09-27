import { isTaught, lessonSessions, type Lesson, type LessonSession } from "@/lib/lessons-data";

/* ════════════════════════════════════════════════════════════════════
   SESSIYA KOʻCHISHLARI — bitta sinfdagi sessiya almashishlari roʻyxati.

   Dars oqimi (`@/lib/lesson-flow`) qayta joylash natijasini shu shaklda
   beradi; store uni bitta holat oʻzgarishida qoʻllaydi
   (`applySessionMoves`). `to: null` — dars jadvalga sigʻmadi.
   «Keyingi darsga sur» ham endi oqim orqali (`useLessonFlow().bump`).
   ════════════════════════════════════════════════════════════════════ */

export type SessionMove = { lessonId: string; from: LessonSession | null; to: LessonSession | null };

/** «Oʻtildimi?» soʻralsinmi: mavzu oʻtilmagan, lekin sinfdagi biror sessiyasi
    tugagan. (Bugungi dars tugaganidan keyin ham soʻraladi.) */
export function needsTaughtConfirm(l: Lesson, classId: string, today: string, nowMin: number): boolean {
  if (isTaught(l, classId)) return false;
  return lessonSessions(l).some((s) => s.classId === classId && (s.date < today || (s.date === today && s.endMin <= nowMin)));
}
