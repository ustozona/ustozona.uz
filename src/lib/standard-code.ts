/* ════════════════════════════════════════════════════════════════════
   STANDART KODI — tahlil (parsing).

   Kod shunchaki yorliq emas: yetuk ramkalarda u ierarxiyani oʻzida
   olib yuradi. Bizga undan kerakli narsa — MAZMUN SOHASI (domen),
   qoʻshimcha ravishda fan va sinf.

   Qoʻllab-quvvatlanadigan ikki shakl:

     IAT5.AD.01     3 segment — OʻzDTS
     │   │  └── tartib raqami
     │   └───── mazmun sohasi          ← DOMEN
     └───────── fan bosh harfi + sinf raqami

     R.01           2 segment — qisqa shakl (bizning kutubxona, CEFR…)
     │  └── tartib raqami
     └───── domen

   ⚠️ «Birinchi prefiksni ol» degan sodda qoida NOTOʻGʻRI: `IAT5.AD.01`
   da birinchi segment `IAT5` boʻlib, u fan+sinf. Toʻgʻri qoida —
   OXIRGI segment tartib raqami, undan OLDINGI harfli segment domen.

   Batafsil: docs/standards-page-spec.md §14.9, docs/dts-iat.md
   ════════════════════════════════════════════════════════════════════ */

export interface ParsedStandardCode {
  /** Tozalangan kod (oxirgi nuqtasiz, katta harfda). */
  code: string;
  /** Fan bosh harfi, mas. "IAT" — faqat 3 segmentli shaklda. */
  subjectPrefix?: string;
  /** Sinf raqami, mas. 5 — faqat 3 segmentli shaklda. */
  grade?: number;
  /** Mazmun sohasi kodi, mas. "AD" / "R". */
  domainId?: string;
  /** Tartib raqami, mas. 1 (`01` dan). */
  seq?: number;
}

/** Fan+sinf segmenti: harflar + raqam(lar), mas. `IAT5`, `MAT10`. */
const SUBJECT_GRADE = /^([A-Z]+)(\d+)$/;
/** Sof harfli segment — domen boʻlishga nomzod. */
const LETTERS_ONLY = /^[A-Z]+$/;
/** Sof raqamli segment — tartib raqami. */
const DIGITS_ONLY = /^\d+$/;

/**
 * Kodni tozalaydi: atrofdagi boʻshliq va OXIRGI NUQTA olib tashlanadi.
 *
 * Oxirgi nuqta OʻzDTS jadvallarida bor (`IAT5.AD.01.`). Tozalanmasa
 * `IAT5.AD.01` va `IAT5.AD.01.` ikki xil standart boʻlib qolardi.
 */
export function normalizeStandardCode(raw: string): string {
  return raw.trim().replace(/\.+$/, "").trim().toUpperCase();
}

/**
 * Koddan tuzilmani ajratadi. Tanib boʻlmasa ham `code` doim qaytadi —
 * erkin yozilgan kodlar (`1`, `Standart A`) yoʻqolmasligi kerak.
 */
export function parseStandardCode(raw: string): ParsedStandardCode {
  const code = normalizeStandardCode(raw);
  const parts = code.split(".").filter((p) => p.length > 0);
  const out: ParsedStandardCode = { code };

  if (parts.length < 2) return out;

  // Oxirgi segment — tartib raqami (raqamli boʻlsa).
  const last = parts[parts.length - 1];
  if (DIGITS_ONLY.test(last)) out.seq = Number(last);

  // Undan oldingi harfli segment — domen.
  const beforeLast = parts[parts.length - 2];
  if (LETTERS_ONLY.test(beforeLast)) out.domainId = beforeLast;

  // 3+ segmentli shaklda birinchi segment fan+sinf boʻlishi mumkin.
  const head = SUBJECT_GRADE.exec(parts[0]);
  if (parts.length >= 3 && head) {
    out.subjectPrefix = head[1];
    out.grade = Number(head[2]);
  }

  return out;
}
