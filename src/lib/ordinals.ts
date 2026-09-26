/* ════════════════════════════════════════════════════════════════════
   BOʻLIM / MAVZU TARTIB RAQAMI — saqlanmaydi, roʻyxatdan hisoblanadi.

   Bazadagi `number` faqat TARTIB KALITI: yaratilganda `max+1` beriladi
   va keyin qayta hisoblanmaydi. Shuning uchun oʻchirishdan keyin teshik
   (01, 02, 04), importdan keyin esa takror (01, 01) qolardi. Ekranda
   koʻrinadigan raqam — shu kalit boʻyicha tartiblangan roʻyxatdagi oʻrin.
   Tenglikda massivdagi asl oʻrin saqlanadi (`Array.sort` barqaror).
   ════════════════════════════════════════════════════════════════════ */

import { lessonClassIds, unitIdForClass, type Lesson } from "@/lib/lessons-data";

type Numbered = { id: string; number: number };

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const byNumber = (a: Numbered, b: Numbered) => a.number - b.number;

/** `id → 1, 2, 3…` — roʻyxat BIR guruh (bitta sinfning boʻlimlari yoki bitta boʻlimning mavzulari) boʻlishi kerak. */
export function ordinalsOf(items: readonly Numbered[]): Map<string, number> {
  const map = new Map<string, number>();
  [...items].sort(byNumber).forEach((item, i) => map.set(item.id, i + 1));
  return map;
}

/** Mavzu raqami boʻlimlar boʻylab davom etadi: shu boʻlimdan oldingi boʻlimlardagi mavzular soni.
    `orderedUnits` — sinf boʻlimlari tartibda; roʻyxatda yoʻq `unitId` («Boʻlimsiz») hammasidan keyin sanaladi. */
export function lessonNumberOffset(
  lessons: readonly Lesson[], orderedUnits: readonly { id: string }[], classId: string, unitId: string,
): number {
  const counts = new Map<string, number>();
  for (const l of lessons) {
    if (!lessonClassIds(l).includes(classId)) continue;
    const uid = unitIdForClass(l, classId);
    if (uid) counts.set(uid, (counts.get(uid) ?? 0) + 1);
  }
  let offset = 0;
  for (const u of orderedUnits) {
    if (u.id === unitId) return offset;
    offset += counts.get(u.id) ?? 0;
  }
  return offset;
}
