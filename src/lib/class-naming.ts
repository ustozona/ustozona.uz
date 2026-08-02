import type { ClassInfo } from "@/lib/grades-data";

/* ════════════════════════════════════════════════════════════════════
   SINF NOMI — strukturaviy model

   Sinf nomi endi ERKIN MATN EMAS. Manba uchta maydon:
     · grade   — daraja (1–11) yoki null (toʻgarak/darajasiz guruh)
     · section — parallel harfi ("A", "B", "D"…); xalqaro atamada
                 "section", post-sovet anʼanasida "parallel"
     · label   — ixtiyoriy erkin nom ("Ingliz toʻgaragi"); berilsa
                 daraja+harfdan USTUN turadi

   `ClassInfo.name` esa HISOBLANUVCHI (derived) maydon: ilova boʻylab
   ~100 joyda oʻqilgani uchun saqlab qolindi, lekin hech qachon qoʻlda
   yozilmaydi — har yozuvda `displayClassName` qayta hisoblaydi.

   Nima uchun muhim: nom satr boʻlib saqlanganda yil oʻtkazish (rollover)
   uni joyida qayta yozardi va eski oʻquv yiliga qaytganda 5-A baribir
   6-A boʻlib koʻrinardi. Endi nom darajadan hosil boʻladi, daraja esa
   yil boʻyicha saqlanadi (`gradeByYear`) — shu bois eski yil eski
   nomni koʻrsatadi.
   ════════════════════════════════════════════════════════════════════ */

/** Oʻzbek maktablarida keng tarqalgan parallel harflari (kirill anʼanasidan
    qolgan tartib — "C" va "V" ishlatilmaydi). Faqat TAKLIF: oʻqituvchi
    istalgan harf/belgini kiritishi mumkin. */
export const COMMON_SECTIONS = ["A", "B", "D", "E", "F", "G", "H", "J", "K", "L"];

/** Sinf nomi harfi uchun ruxsat etilgan maksimal uzunlik. */
export const SECTION_MAX_LENGTH = 3;

/** Nom manbasi — `ClassInfo` ning nom hosil qiluvchi qismi. */
export type ClassNameParts = {
  grade?: number | null;
  section?: string;
  label?: string;
};

/** Koʻrsatiladigan sinf nomini hisoblaydi.
    · label boʻlsa            → oʻsha (erkin nom ustun)
    · daraja + harf boʻlsa    → "5-A"
    · faqat daraja boʻlsa     → "5-sinf"
    · faqat harf boʻlsa       → "A"
    · hech biri boʻlmasa      → "" (chaqiruvchi fallback beradi) */
export function displayClassName(parts: ClassNameParts): string {
  const label = parts.label?.trim();
  if (label) return label;
  const section = parts.section?.trim();
  const grade = parts.grade;
  if (grade != null && section) return `${grade}-${section}`;
  if (grade != null) return `${grade}-sinf`;
  return section ?? "";
}

/** Eski erkin matnli nomni strukturaviy qismlarga ajratadi (migratsiya va
    import uchun). "5-A", "5 A", "11-D" → {grade, section}; boshqa hamma
    narsa (masalan "Ingliz toʻgaragi") → {label}.

    Daraja 1–11 oraligʻidan tashqarida boʻlsa ham label sifatida qoladi —
    xato daraja yaratib qoʻymaslik uchun. */
export function parseClassName(name: string): ClassNameParts {
  const m = name.trim().match(/^(\d{1,2})\s*[-–—\s]\s*([\p{L}]{1,3})$/u);
  if (m) {
    const grade = Number(m[1]);
    if (grade >= 1 && grade <= 11) {
      return { grade, section: m[2].toUpperCase() };
    }
  }
  return { label: name.trim() };
}

/* ── Yil boʻyicha daraja ─────────────────────────────────────────────── */

/** Sinfning berilgan oʻquv yilidagi darajasi. `gradeByYear` da yozuv boʻlsa —
    oʻsha; boʻlmasa joriy `grade` (tarixi yoʻq eski sinflar uchun fallback). */
export function gradeForYear(info: ClassInfo, yearId: string | null | undefined): number | null {
  if (yearId && info.gradeByYear && yearId in info.gradeByYear) {
    return info.gradeByYear[yearId];
  }
  return info.grade ?? null;
}

/** Sinf maʼlumotini berilgan oʻquv yiliga proyeksiya qiladi: `grade` va
    undan hosil boʻladigan `name` oʻsha yildagi qiymatga keltiriladi.
    `gradeByYear` — haqiqiy manba — tegilmaydi, shuning uchun amal
    qaytariluvchan (boshqa yilga oʻtib qayta chaqirish yetarli).

    Yil faollashganda (`applyYearActivationSideEffects`) barcha sinflarga
    qoʻllanadi; shu sabab isteʼmolchilar hech nima bilmasdan toʻgʻri
    nomni koʻradi. */
export function projectClassForYear(info: ClassInfo, yearId: string | null | undefined): ClassInfo {
  const grade = gradeForYear(info, yearId);
  const name = displayClassName({ grade, section: info.section, label: info.label });
  if (grade === (info.grade ?? null) && name === info.name) return info; // oʻzgarish yoʻq — referens saqlanadi
  return {
    ...info,
    ...(grade != null ? { grade } : { grade: undefined }),
    name: name || info.name,
  };
}

/** `gradeByYear` ga berilgan yil uchun darajani yozadi (mavjud tarixni
    saqlaydi). Daraja null boʻlsa yozuv qoʻshilmaydi — darajasiz guruhlar
    yil boʻyicha tarix yuritmaydi. */
export function withGradeForYear(
  info: ClassInfo,
  yearId: string | null | undefined,
  grade: number | null
): ClassInfo {
  if (!yearId || grade == null) return info;
  return { ...info, gradeByYear: { ...(info.gradeByYear ?? {}), [yearId]: grade } };
}
