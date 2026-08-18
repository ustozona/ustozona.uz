/* Materiallar kutubxonasining umumiy shakli.

   NEYTRAL modul — `server-only` ham, `"use server"` ham yoʻq. Tipni shu
   yerda saqlash sababi: roʻyxatni server (`server/dal/library.ts`)
   oʻqiydi, chizishni esa klient komponenti qiladi; ikkalasi ham shu
   fayldan import qiladi va klient bundle'iga server kodi tortilmaydi. */

export type LibraryKind = "test" | "lesson";

export type LibraryItem = {
  id: string;
  kind: LibraryKind;
  title: string;
  /** Bir qatorlik tavsif — "12 savol", "3-boʻlim · 4-dars". */
  meta: string;
  subject: string | null;
  grade: number | null;
  /** Qayerda tuzilgani — `null` = sinfsiz (faqat kutubxonada). */
  classId: string | null;
  className: string | null;
  updatedAt: Date;
  /** Necha marta ishlatilgan; hisoblanmaydigan turda `null`. */
  usedCount: number | null;
  /** Oxirgi marta qachon ishlatilgan — «Yaqinda ishlatilgan» saralashi. */
  lastUsedAt: Date | null;
  /**
   * Hali tugallanmagan material.
   *
   * Darsda bu haqiqiy holat (`lessons.status === "Draft"`). Testda
   * qoralama tushunchasi YOʻQ — toʻplam atomik saqlanadi, yarim holat
   * bazaga yozilmaydi — shuning uchun u doim `false`.
   */
  isDraft: boolean;
};
