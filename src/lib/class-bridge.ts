import { CLASSES as SCHOOL_CLASSES, type SchoolClass } from "@/lib/classes-data";
import { CLASSES as GRADE_CLASSES, type ClassInfo } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   SINF-ID KOʻPRIGI

   Ilovada ikki sinf manbasi bor:
     • classes-data  — raqamli id (timetable / planner bloklari)
     • grades-data   — matnli id  (mavzu banki / lessons / grades)
   Bu yerda ular NOM boʻyicha bogʻlanadi ("6-A" ↔ "6-a"), shunda
   planner blokidan grades-data bankiga (va aksincha) oʻtish mumkin.
   Mos kelmasa (masalan 10-A faqat classes-dataʼda) — undefined.
   ════════════════════════════════════════════════════════════════════ */

const norm = (s: string) => s.trim().toUpperCase();

/** classes-data sinf id (raqamli) → grades-data sinf id (matnli) */
export function gradesIdForSchoolClass(schoolClassId: number): string | undefined {
  const sc = SCHOOL_CLASSES.find((c) => c.id === schoolClassId);
  if (!sc) return undefined;
  return GRADE_CLASSES.find((c) => norm(c.name) === norm(sc.name))?.id;
}

/** grades-data sinf id (matnli) → classes-data sinfi (rang/nom uchun) */
export function schoolClassForGradesId(gradesId: string): SchoolClass | undefined {
  const g = GRADE_CLASSES.find((c) => c.id === gradesId);
  if (!g) return undefined;
  return SCHOOL_CLASSES.find((c) => norm(c.name) === norm(g.name));
}

/** grades-data sinf obyekti (nom/rang fallback uchun) */
export function gradeClassById(gradesId: string): ClassInfo | undefined {
  return GRADE_CLASSES.find((c) => c.id === gradesId);
}
