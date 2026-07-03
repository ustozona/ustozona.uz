import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth, type AuthSession } from "./auth";
import { db } from "./db/client";
import { teachers, type TeacherRow } from "./db/schema";

/* ════════════════════════════════════════════════════════════════════
   SESSIYA — haqiqiy himoya qatlami (proxy.ts faqat UX redirect).

   `requireTeacher()` HAR BIR DAL funksiyasi boshida chaqiriladi:
   sessiya yoʻq boʻlsa UnauthorizedError otadi, bor boʻlsa teachers
   qatorini qaytaradi (birinchi kirishda yaratib). `teacherId` HECH
   QACHON clientdan olinmaydi — faqat shu yerdan.

   React `cache()` bir render/soʻrov ichida takroriy DB soʻrovlarni
   yoʻq qiladi.
   ════════════════════════════════════════════════════════════════════ */

export class UnauthorizedError extends Error {
  constructor(message = "Kirish talab qilinadi") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Sessiyani qaytaradi yoki null — 401 qaytarish oʻzi hal qilinadigan joylar (route handler) uchun. */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() });
});

/** Sessiya + teachers qatori. Birinchi kirishda teachers qatorini yaratadi. */
export const requireTeacher = cache(async (): Promise<TeacherRow> => {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();

  const { user } = session;
  const [existing] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, user.id));
  if (existing) return existing;

  const [created] = await db
    .insert(teachers)
    .values({ id: user.id, name: user.name, email: user.email })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  // Parallel soʻrov bilan poyga boʻlsa — endi qator bor, qayta oʻqiymiz.
  const [raced] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, user.id));
  return raced;
});
