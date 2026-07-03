import { CLASSES as GRADE_CLASSES, classColor } from "@/lib/grades-data";
import { CLASSES as SCHOOL_CLASSES } from "@/lib/classes-data";
import { autoClassColor, type ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   SINF ID YORDAMCHISI — ikki manbani bog'lash

   Loyihada sinflar IKKI ro'yxatda: `classes-data` (numerik id, sinflar
   sahifasidagi kartalar) va `grades-data` (string id "5-a", har bir bo'lim
   ma'lumotlari shunga kalitlangan). Sinf-detali sahifasi URL'da STRING
   slug ishlatadi ("5-a") — chunki ClassListPanel ham, baholar/davomat/
   darslar ma'lumotlari ham shu formatda.
   ════════════════════════════════════════════════════════════════════ */

export type ClassIdentity = { id: string; name: string; color: ClassColor };

/** Sinf nomidan barqaror slug — "5-A" → "5-a" */
export function classSlug(name: string): string {
  return name.toLowerCase();
}

/**
 * URL slug'ini sinf identifikatoriga aylantirish.
 * 1) grades-data CLASSES (ma'lumotli sinflar) — to'liq mos.
 * 2) classes-data CLASSES (slug bo'yicha) — grades-data'da yo'q sinflar uchun.
 * Topilmasa null (→ notFound).
 */
export function resolveClassIdentity(id: string): ClassIdentity | null {
  const gc = GRADE_CLASSES.find((c) => c.id === id && c.id !== "no-class");
  if (gc) return { id: gc.id, name: gc.name, color: classColor(gc) };

  const sc = SCHOOL_CLASSES.find((c) => classSlug(c.name) === id);
  if (sc) return { id, name: sc.name, color: sc.color ?? autoClassColor(id) };

  return null;
}
