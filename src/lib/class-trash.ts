/* ════════════════════════════════════════════════════════════════════
   SINF SAVATI — umumiy tiplar va muddat.

   Neytral modul (na "use server", na "server-only"): server amallari
   ham, mijoz komponentlari ham shu yerdan import qiladi. Tipni
   "use server" fayldan reeksport qilish prodni buzadi (AGENTS.md).

   Hayot sikli: faol → arxiv → savat (TRASH_DAYS kun) → butunlay.
   ════════════════════════════════════════════════════════════════════ */

/** Savatdagi sinf necha kundan keyin butunlay oʻchadi. */
export const TRASH_DAYS = 7;

/**
 * Savatga tashlash dialogi uchun bitta sinf holati.
 *
 * `trash`        — sinf savatga tushadi (men egaman yoki maydon adminiman)
 * `leave`        — men oddiy hamkasbman: sinf qoladi, faqat men chiqaman
 * `not_archived` — avval arxivlash kerak (faol sinf savatga tushmaydi)
 */
export type ClassTrashPreview = {
  classId: string;
  name: string;
  mode: "trash" | "leave" | "not_archived";
  /** Sinfdan mahrum boʻladigan (yoki unda qoladigan) hamkasblar. */
  otherTeachers: string[];
  students: number;
  grades: number;
  attendance: number;
};

export type TrashedClass = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  students: number;
  /** ISO */
  deletedAt: string;
  /** ISO — shu paytdan keyin cron butunlay oʻchiradi. */
  purgeAt: string;
  /** Butunlay oʻchishiga qolgan toʻliq kunlar (server hisoblaydi; 0 = bugun). */
  daysLeft: number;
  deletedByName: string | null;
  /** Tiklash va «hozir oʻchirish» huquqi (ega, admin yoki tashlagan odam). */
  canManage: boolean;
};

export function purgeDate(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + TRASH_DAYS * 24 * 60 * 60 * 1000);
}
