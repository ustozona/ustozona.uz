"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { requireTeacher } from "@/server/session";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   HISOBNI OʻCHIRISH — haqiqiy, serverdagi oʻchirish.

   `user` qatorini oʻchirish cascade zanjiri orqali HAMMASINI oʻchiradi:
   user → teachers (id = user.id, ON DELETE CASCADE) → barcha domen
   jadvallari (classes, students, grades, attendance, ...) + qolgan
   session/account qatorlari (ular ham user.id ga cascade).

   Avval `signOut`: joriy sessiya cookie'sini tozalaydi (nextCookies
   plugini server action ichida Set-Cookie yozadi). Aks holda cookie
   brauzerda qolib, `proxy.ts` uni koʻrib dashboard'ga yoʻnaltiraverardi
   — foydalanuvchi "oʻchirdim, lekin eski hisobga kirib turaveradi"
   muammosining aynan sababi shu edi.
   ════════════════════════════════════════════════════════════════════ */
export async function deleteAccountAction(): Promise<{ ok: true }> {
  const teacher = await requireTeacher(); // sessiyadan teacherId (= user.id)
  await auth.api.signOut({ headers: await headers() });
  await db.delete(user).where(eq(user.id, teacher.id));
  return { ok: true };
}
