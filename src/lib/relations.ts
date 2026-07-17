/* ════════════════════════════════════════════════════════════════════
   QARINDOSHLIK — maktab boʻyicha oʻquvchilar roʻyxati + qarindoshlik
   yorligʻi (aka/uka/opa/singil) hisoblash.

   Bogʻlanish YOʻNALISHSIZ saqlanadi (relations-store.ts). Yorliq esa
   KOʻRUVCHI nuqtai nazaridan hisoblanadi — qarindoshning jinsi va yoshi
   (tugʻilgan sanasi) asosida. Shu sabab bogʻ avtomatik ikki tomonlama:
   A uchun "uka" boʻlsa, B uchun "aka" boʻlib koʻrinadi.
   ════════════════════════════════════════════════════════════════════ */

import { CLASS_DATA, classColor, type ClassData } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";

export type SchoolStudent = {
  id: string;
  name: string;
  initials: string;
  classId: string;
  className: string;
  hex: string;
  gender?: "male" | "female";
  birthDate?: string;
  classGrade?: number;
};

/** Maktabdagi barcha oʻquvchilar (sinflar boʻyicha tartibda) —
    jonli classDataMap'dan (chaqiruvchi useGradesStore'dan uzatadi). */
export function getAllStudents(classDataMap: Record<string, ClassData>): SchoolStudent[] {
  const out: SchoolStudent[] = [];
  for (const [classId, data] of Object.entries(classDataMap)) {
    const hex = CLASS_COLOR_HEX[classColor(data.info)];
    for (const s of data.students) {
      out.push({
        id: s.id,
        name: s.name,
        initials: s.initials,
        classId,
        className: data.info.name,
        hex,
        gender: s.gender,
        birthDate: s.birthDate,
        classGrade: data.info.grade,
      });
    }
  }
  return out;
}

export function getSchoolStudent(
  classDataMap: Record<string, ClassData>,
  id: string
): SchoolStudent | undefined {
  for (const [classId, data] of Object.entries(classDataMap)) {
    const s = data.students.find((st) => st.id === id);
    if (s) {
      return {
        id: s.id,
        name: s.name,
        initials: s.initials,
        classId,
        className: data.info.name,
        hex: CLASS_COLOR_HEX[classColor(data.info)],
        gender: s.gender,
        birthDate: s.birthDate,
        classGrade: data.info.grade,
      };
    }
  }
  return undefined;
}

/** Koʻruvchi nuqtai nazaridan qarindoshlik yorligʻi (jins + yosh boʻyicha) */
export function kinshipLabel(
  classDataMap: Record<string, ClassData>,
  viewerId: string,
  relativeId: string
): string {
  const v = getSchoolStudent(classDataMap, viewerId);
  const r = getSchoolStudent(classDataMap, relativeId);
  if (!r) return "Qarindosh";
  // Ertaroq tugʻilgan = kattaroq; tugʻilgan sana yoʻq boʻlsa, sinf raqami
  // boʻyicha taxmin qilinadi (kattaroq sinf = kattaroq oʻquvchi)
  let older: boolean;
  if (v?.birthDate && r.birthDate) {
    older = r.birthDate < v.birthDate;
  } else if (v?.classGrade != null && r.classGrade != null) {
    older = r.classGrade > v.classGrade;
  } else {
    older = false;
  }
  if (r.gender === "female") return older ? "Opa" : "Singil";
  if (r.gender === "male") return older ? "Aka" : "Uka";
  return older ? "Katta" : "Kichik";
}

/** Demo uchun boshlangʻich aka-uka/opa-singil juftliklari (ism boʻyicha) */
const DEFAULT_SIBLING_NAMES: string[][] = [
  ["Otabek Xoliqov", "Gavhar Xoliqova"],
  ["Diyorbek Karimov", "Oydin Karimova"],
  ["Ibrohim Tursunov", "Nodir Tursunov"],
  ["Feruza Yusupova", "Xurshid Yusupov"],
];

/** Boshlangʻich bogʻlarni id juftliklariga aylantiradi (topilmaganlari
    oʻtkazib yuboriladi). FAQAT seed (scripts/seed.ts) ishlatadi — shu
    sabab statik CLASS_DATA'dan oʻqiydi. */
export function resolveDefaultLinks(): [string, string][] {
  const byName = new Map(getAllStudents(CLASS_DATA).map((s) => [s.name, s.id]));
  const pairs: [string, string][] = [];
  for (const group of DEFAULT_SIBLING_NAMES) {
    const ids = group
      .map((n) => byName.get(n))
      .filter((x): x is string => Boolean(x));
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]]);
  }
  return pairs;
}
