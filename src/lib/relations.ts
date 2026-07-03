/* ════════════════════════════════════════════════════════════════════
   QARINDOSHLIK — maktab boʻyicha oʻquvchilar roʻyxati + qarindoshlik
   yorligʻi (aka/uka/opa/singil) hisoblash.

   Bogʻlanish YOʻNALISHSIZ saqlanadi (relations-store.ts). Yorliq esa
   KOʻRUVCHI nuqtai nazaridan hisoblanadi — qarindoshning jinsi va yoshi
   (tugʻilgan sanasi) asosida. Shu sabab bogʻ avtomatik ikki tomonlama:
   A uchun "uka" boʻlsa, B uchun "aka" boʻlib koʻrinadi.
   ════════════════════════════════════════════════════════════════════ */

import { CLASS_DATA, classColor } from "@/lib/grades-data";
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
};

let _all: SchoolStudent[] | null = null;
let _byId: Map<string, SchoolStudent> | null = null;

/** Maktabdagi barcha oʻquvchilar (sinflar boʻyicha tartibda) */
export function getAllStudents(): SchoolStudent[] {
  if (_all) return _all;
  const out: SchoolStudent[] = [];
  for (const [classId, data] of Object.entries(CLASS_DATA)) {
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
      });
    }
  }
  _all = out;
  return out;
}

export function getSchoolStudent(id: string): SchoolStudent | undefined {
  if (!_byId) _byId = new Map(getAllStudents().map((s) => [s.id, s]));
  return _byId.get(id);
}

/** Koʻruvchi nuqtai nazaridan qarindoshlik yorligʻi (jins + yosh boʻyicha) */
export function kinshipLabel(viewerId: string, relativeId: string): string {
  const v = getSchoolStudent(viewerId);
  const r = getSchoolStudent(relativeId);
  if (!r) return "Qarindosh";
  // Ertaroq tugʻilgan = kattaroq
  const older =
    v?.birthDate && r.birthDate ? r.birthDate < v.birthDate : false;
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

/** Boshlangʻich bogʻlarni id juftliklariga aylantiradi (topilmaganlari oʻtkazib yuboriladi) */
export function resolveDefaultLinks(): [string, string][] {
  const byName = new Map(getAllStudents().map((s) => [s.name, s.id]));
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
