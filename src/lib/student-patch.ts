import type { ClassData, Student } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHINING SHAXSIY MAYDONLARI — hamma sinf nusxasida bir yoʻla.

   Serverda bu maydonlar (ism, jinsi, tugʻilgan sana, telefonlar, holat)
   bitta `students` qatorida yashaydi, mijozda esa bola turgan HAR sinfning
   `ClassData.students` ida alohida nusxa bor. Faqat bitta nusxa
   yangilansa, qolganlari eskirib qoladi: boshqa sinfga oʻtilganda eski ism
   chiqadi, keyingi tahrirda esa eskirgan nusxa (masalan eski `status`)
   serverga qaytib yoziladi.

   Shuning uchun shaxsiy maydonni oʻzgartiradigan har amal `updateClass`
   bilan emas, shu funksiya orqali `setClassDataMap` ga beriladi.
   Oʻquvchi turmagan sinf obyekti oʻzgarmaydi — sync diff'i uni oʻtkazib
   yuboradi.
   ════════════════════════════════════════════════════════════════════ */

/** Shaxsiy (sinfsiz) maydonlar. Sinfga oid narsa (tartib, baho) bu yerga
    kirmaydi. */
export type StudentPersonalPatch = Partial<
  Pick<
    Student,
    | "name"
    | "initials"
    | "status"
    | "gender"
    | "birthDate"
    | "parentName"
    | "parentPhone"
    | "studentPhone"
  >
>;

export function patchStudentEverywhere(
  classDataMap: Record<string, ClassData>,
  studentIds: string | ReadonlySet<string>,
  patch: StudentPersonalPatch
): Record<string, ClassData> {
  const has = typeof studentIds === "string"
    ? (id: string) => id === studentIds
    : (id: string) => studentIds.has(id);
  let changed = false;
  const next: Record<string, ClassData> = {};
  for (const [classId, cd] of Object.entries(classDataMap)) {
    if (!cd.students.some((s) => has(s.id))) {
      next[classId] = cd;
      continue;
    }
    changed = true;
    next[classId] = {
      ...cd,
      students: cd.students.map((s) => (has(s.id) ? { ...s, ...patch } : s)),
    };
  }
  return changed ? next : classDataMap;
}
