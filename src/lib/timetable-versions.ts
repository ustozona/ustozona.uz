import type { TimetableEvent } from "@/lib/timetable";
import type { BellConfig } from "@/lib/bell-schedule";
import { addDaysKey, dateKeyToDate, dateToKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   JADVAL VERSIYALARI — amal qilish sanali snapshotlar

   Haftalik jadval endi bitta statik shablon emas: har oʻzgarish
   "qachondan amalda" (effectiveFrom) sanali TOʻLIQ nusxa boʻlib
   saqlanadi. Sana uchun jadval = effectiveFrom <= sana boʻlgan eng
   soʻnggi versiya. Shu tufayli oʻtmishdagi sanalar (planner, davomat)
   har doim OʻSHA PAYTDA amalda boʻlgan jadvalni koʻradi — jadval
   oʻzgarganda tarix qayta yozilmaydi.

   Store — useTimetableStore; bu fayl sof (React'siz) tiplar va
   rezolyutsiya helperlari: lesson-schedule kabi hook boʻlmagan kod
   ham ishlatadi.
   ════════════════════════════════════════════════════════════════════ */

export type TimetableVersion = {
  id: string;
  /** "YYYY-MM-DD" — shu kundan (inklyuziv) amal qiladi. Versiyalar orasida unikal. */
  effectiveFrom: string;
  /** Haftalik gridning toʻliq snapshoti. */
  events: TimetableEvent[];
  /** Qoʻngʻiroq jadvali snapshoti — u ham yil oʻrtasida oʻzgarishi mumkin. */
  bellConfig: BellConfig;
  /** "Nima oʻzgardi?" — foydalanuvchi izohi. */
  note?: string;
  createdAt: string; // ISO
};

/** effectiveFrom boʻyicha oʻsish tartibida (asl massivga tegmaydi). */
export function sortVersions(vs: TimetableVersion[]): TimetableVersion[] {
  return [...vs].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
}

/** Sanada amalda boʻlgan versiya: effectiveFrom <= dateKey boʻlgan eng soʻnggisi.
    Birinchi versiyadan oldingi sanalar → null (jadval hali mavjud emas edi). */
export function resolveVersionForDate(vs: TimetableVersion[], dateKey: string): TimetableVersion | null {
  let found: TimetableVersion | null = null;
  for (const v of sortVersions(vs)) {
    if (v.effectiveFrom <= dateKey) found = v;
    else break;
  }
  return found;
}

/** Versiya amal qilish oxiri: keyingi versiya boshidan 1 kun oldin, oxirgisida null ("hozirgacha"). */
export function versionRangeEnd(vs: TimetableVersion[], id: string): string | null {
  const sorted = sortVersions(vs);
  const i = sorted.findIndex((v) => v.id === id);
  if (i < 0 || i === sorted.length - 1) return null;
  return addDaysKey(sorted[i + 1].effectiveFrom, -1);
}

/** Keyingi dushanba (qatʼiy keyingi hafta: fromKey dushanba boʻlsa ham +7 kun). */
export function nextMonday(fromKey: string): string {
  const d = dateKeyToDate(fromKey);
  const mondayOffset = (d.getDay() + 6) % 7; // Du=0 … Ya=6
  d.setDate(d.getDate() + (7 - mondayOffset));
  return dateToKey(d);
}

