import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth, type AuthSession } from "./auth";
import { isSuperAdmin, isTeacher } from "@/lib/auth-roles";
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

/** Sessiya bor, lekin rol yetarli emas (401 → /login, 403 → /dashboard farqi). */
export class ForbiddenError extends Error {
  constructor(message = "Ruxsat yoʻq") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Sessiyani qaytaradi yoki null — 401 qaytarish oʻzi hal qilinadigan joylar (route handler) uchun. */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  return auth.api.getSession({ headers: await headers() });
});

/** Sessiya + teachers qatori. Birinchi kirishda teachers qatorini yaratadi.

    ROL DARVOZASI (majburiy): faqat `teacher` rolli akkaunt uchun qator
    yaratiladi. Busiz Shogird (student/guardian) akkauntlari oʻqituvchi
    marshrutiga tegib ketganda soxta ijara egasini yaratib yuborardi.
    `rolesOf` boʻsh rolni "teacher" deb qaytargani uchun mavjud akkauntlar
    taʼsirlanmaydi. */
export const requireTeacher = cache(async (): Promise<TeacherRow> => {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (!isTeacher(session.user)) throw new ForbiddenError();

  const { user } = session;
  const [existing] = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, user.id));
  if (existing) return existing;

  const [created] = await db
    .insert(teachers)
    .values({ id: user.id, name: user.name, email: user.email, avatarUrl: user.image ?? null })
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

/** Admin akti bajaruvchisi — audit logga yoziladigan snapshot. */
export type AdminActor = { id: string; email: string; name: string };

/** Super-admin darvozasi — HAR BIR admin DAL funksiyasi boshida chaqiriladi.
    Impersonatsiya sessiyasi tabiiy ravishda oʻtmaydi (rol teacher boʻladi). */
export const requireAdmin = cache(
  async (): Promise<{ session: AuthSession; actor: AdminActor }> => {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();
    if (!isSuperAdmin(session.user)) throw new ForbiddenError();
    const { id, email, name } = session.user;
    return { session, actor: { id, email, name } };
  },
);

/* ⛔ `requireSchoolAdmin()` va `SchoolScope` OLIB TASHLANDI (2026-08-26).

   Ular ikki xil rol tizimini birga talab qilardi: global auth roli
   `school_admin` VA `workspace_members.role = "admin"`. Ikki oqibati
   bor edi:

   1) Mijoz oʻzi zavuch tayinlay olmasdi — global rol faqat Ustozona
      jamoasining qoʻlida (`/admin/users`)
   2) `[row]` ikki maktabda admin boʻlgan odam uchun BIRINCHI tasodifiy
      qatorni olardi — qaysi maktab ekani aniqlanmagan

   Amalda hech qayerdan chaqirilmagan edi (yagona foydalanuvchisi
   `getSchoolForCurrentAdmin()` ning oʻzi ham 0 chaqiruvli edi), shu
   bois olib tashlash xavfsiz boʻldi.

   Oʻrniga: `requireWorkspaceAdmin()` — `src/server/workspace.ts` da,
   FAOL maydon boʻyicha va yagona manbadan (`workspace_members.role`).
   Sabab va qaror: docs/ish-maydoni-arxitektura.md §11. */
