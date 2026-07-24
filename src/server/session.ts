import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth, type AuthSession } from "./auth";
import { isSuperAdmin, isSchoolAdmin } from "@/lib/auth-roles";
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

/** Maktab admini qamrovi: super_admin → hammasi; school_admin → oʻz maktabi. */
export type SchoolScope = { all: true } | { all: false; schoolId: string };

/** super_admin YOKI school_admin darvozasi — qamrov school_admin uchun
    `teachers.schoolId`dan olinadi (schoolId yoʻq boʻlsa ForbiddenError). */
export const requireSchoolAdmin = cache(
  async (): Promise<{ session: AuthSession; actor: AdminActor; scope: SchoolScope }> => {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();
    const { id, email, name } = session.user;
    const actor: AdminActor = { id, email, name };

    if (isSuperAdmin(session.user)) return { session, actor, scope: { all: true } };
    if (!isSchoolAdmin(session.user)) throw new ForbiddenError();

    const [row] = await db.select().from(teachers).where(eq(teachers.id, id));
    if (!row?.schoolId) throw new ForbiddenError();
    return { session, actor, scope: { all: false, schoolId: row.schoolId } };
  },
);
