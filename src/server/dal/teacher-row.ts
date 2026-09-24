import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { teachers, user } from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   `teachers` QATORI — SESSIYASIZ YARATISH (bot, Telegram roʻyxati)

   Odatda qator ustoz saytga birinchi kirganda `requireTeacher()` da
   yaratiladi. Lekin `user_telegram` ga yozishdan OLDIN u bor boʻlishi
   SHART.

   ⛔ SABAB — PROD BAZADAGI TRIGGER (repoda YOʻQ, boshqa bot bilan
   umumiy baza): `user_telegram` AFTER INSERT → `on_telegram_linked()`
   → `reconcile_teacher_links()`. U `workspace_members` ga
   (`ws-<userId>`, userId, owner) yozadi; `teachers` qatori yoʻq boʻlsa
   shaxsiy maydon ham yaratilmaydi va ikkala FK buziladi. Xato butun
   INSERT'ni bekor qiladi: Telegram bogʻlanmaydi, `user` qatori esa
   yetim qoladi — kirish usuli yoʻq, saytga kirib boʻlmaydi.

   2026-09-23..24 da botdan roʻyxatdan oʻtishning HAMMASI shu tufayli
   yiqilgan; `/tg-royxat` orqali biriktirish ham (akkaunt ochilgan,
   Telegram ulanmagan).

   Qiymatlar `requireTeacher()` bilan bir xil — qaysi biri birinchi
   yaratsa ham natija farq qilmaydi (`onConflictDoNothing`).
   ════════════════════════════════════════════════════════════════════ */

export async function ensureTeacherRow(userId: string): Promise<void> {
  const [u] = await db
    .select({ name: user.name, email: user.email, image: user.image })
    .from(user)
    .where(eq(user.id, userId));
  if (!u) return;
  await db
    .insert(teachers)
    .values({ id: userId, name: u.name, email: u.email, avatarUrl: u.image ?? null })
    .onConflictDoNothing();
}
