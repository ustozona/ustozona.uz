import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { aiUsage, aiDocs, aiChats, classes } from "@/server/db/schema";
import { aiCredits, monthStartTashkent, todayTashkent } from "@/lib/ai-limits";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA AI — kvota va hujjat DAL'i.

   Ilgari bu soʻrovlar route handler'larining ichida edi va `db` ni
   toʻgʻridan-toʻgʻri import qilardi — bu repo qoidasini buzardi
   (eslint `no-restricted-imports`: DB klientiga faqat DAL tegadi).
   Qizil lint xatosi kod ishlashiga xalaqit bermasa ham, keyingi
   haqiqiy xatolarni shovqin ichida koʻrinmas qiladi.

   ── KVOTA MODELI ────────────────────────────────────────────────────
   `ai_usage` jadvali KUNLIK qatorlarda qoladi (admin trend grafigi
   shunga tayanadi), lekin CHEGARA oylik: oy boshidan beri yigʻindi
   taʼrif kreditidan oshsa rad etiladi (`ai-limits.ts` da nega oylik
   ekani yozilgan).

   ⚠️ Hisoblagich limitdan OSHIB ketaveradi: kvota tugagach ham
   inkrement qilinadi. Bu ataylab — admin panelida "kredit yetmagan"
   talab hajmi koʻrinsin, aks holda chegara past qoʻyilgani bilinmay
   qolardi.
   ════════════════════════════════════════════════════════════════════ */

export type AiQuotaResult = {
  /** Kvota ichidami — false boʻlsa route 429 qaytaradi. */
  allowed: boolean;
  /** Shu oyda sarflangan (shu soʻrov bilan birga). */
  used: number;
  /** Taʼrifga tegishli oylik kredit. */
  credit: number;
  /** Toshkent kuni (YYYY-MM-DD) — provayder telemetriyasi shu qatorga yoziladi. */
  day: string;
};

/* Inkrement va yigʻindi ikki ALOHIDA soʻrov: bitta CTE ichida yozib,
   oʻsha CTE'dan oʻqib boʻlmaydi — PostgreSQL'da yondosh CTE yozuvni
   koʻrmaydi (bir xil snapshot), yaʼni yigʻindi oʻz inkrementini
   hisobga olmagan boʻlardi. Ketma-ket ikki statement esa koʻradi.
   Poyga oynasi bir necha millisekund va eng yomon holatda oʻqituvchi
   kredit chegarasidan bir-ikki xabar oshib ketadi — bu narxda ham,
   xavfsizlikda ham ahamiyatsiz. */
async function monthlyUsed(userId: string, column: "count" | "doc_count") {
  const rows = await db
    .select({
      used: sql<number>`coalesce(sum(${column === "count" ? aiUsage.count : aiUsage.docCount}), 0)::int`,
    })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), sql`${aiUsage.day} >= ${monthStartTashkent()}`));
  return rows[0]?.used ?? 0;
}

/** AI xabari sarflanadi: kunlik qatorni oshiradi, oylik kreditni tekshiradi. */
export async function consumeAiMessage(
  userId: string,
  plan: string | null | undefined
): Promise<AiQuotaResult> {
  const day = todayTashkent();
  await db
    .insert(aiUsage)
    .values({ id: `${userId}:${day}`, userId, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1` },
    });
  const credit = aiCredits(plan).messages;
  const used = await monthlyUsed(userId, "count");
  return { allowed: used <= credit, used, credit, day };
}

/** Hujjat yuklash sarflanadi (darslik rejimi). */
export async function consumeAiDoc(
  userId: string,
  plan: string | null | undefined
): Promise<AiQuotaResult> {
  const day = todayTashkent();
  await db
    .insert(aiUsage)
    .values({ id: `${userId}:${day}`, userId, day, count: 0, docCount: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.day],
      set: { docCount: sql`${aiUsage.docCount} + 1` },
    });
  const credit = aiCredits(plan).docs;
  const used = await monthlyUsed(userId, "doc_count");
  return { allowed: used <= credit, used, credit, day };
}

/* Qaysi provayder javob bergani — FAQAT birinchi delta kelganda
   yoziladi. Shuning uchun `count` yigʻindisi bilan `providers`
   yigʻindisi orasidagi farq = umuman javob olinmagan soʻrovlar
   (admin panelida "javobsiz qolgan" ustuni). */
export async function recordAiProvider(userId: string, day: string, provider: string) {
  await db
    .update(aiUsage)
    .set({
      providers: sql`jsonb_set(coalesce(${aiUsage.providers}, '{}'::jsonb), array[${provider}::text], to_jsonb(coalesce((${aiUsage.providers}->>${provider})::int, 0) + 1))`,
    })
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, day)));
}

/** Yuklangan hujjatni qayd etish (egalik keyin shu qator orqali tekshiriladi). */
export async function saveAiDoc(row: {
  userId: string;
  uri: string;
  mimeType: string;
  name: string;
}) {
  await db
    .insert(aiDocs)
    .values({ id: crypto.randomUUID(), ...row })
    .onConflictDoNothing();
}

/** Hujjat egaligi: chat faqat OʻZ foydalanuvchisi yuklagan uri'ni qabul qiladi. */
export async function findAiDoc(userId: string, uri: string) {
  const [row] = await db
    .select({ uri: aiDocs.uri, mimeType: aiDocs.mimeType })
    .from(aiDocs)
    .where(and(eq(aiDocs.userId, userId), eq(aiDocs.uri, uri)));
  return row ?? null;
}

/* Sinf nomlari — AI'ning `get_class_stats` tool deklaratsiyasi uchun.
   ⚠️ Bu funksiya OʻZI koʻrish huquqini tekshirmaydi: chaqiruvchi id'larni
   `visibleClassIds()` bilan filtrlab beradi. Nomi shuning uchun `ai...`
   bilan boshlanadi — umumiy sinf read model'i sifatida qayta
   ishlatilmasin (aynan shu naqsh koʻp-ijarali sizishlarning sababi). */
export async function listAiClassNames(scopedIds: string[]) {
  if (!scopedIds.length) return [];
  return db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(inArray(classes.id, scopedIds));
}

/* ── Chat tarixi (har foydalanuvchi+dars uchun bitta suhbat) ────────── */

export type AiChatMessageRow = { role: "user" | "assistant"; content: string };

export async function getAiChat(userId: string, lessonId: string) {
  const [row] = await db
    .select({ messages: aiChats.messages })
    .from(aiChats)
    .where(and(eq(aiChats.userId, userId), eq(aiChats.lessonId, lessonId)));
  return row?.messages ?? [];
}

export async function saveAiChat(
  userId: string,
  lessonId: string,
  messages: AiChatMessageRow[]
) {
  await db
    .insert(aiChats)
    .values({ id: `${userId}:${lessonId}`, userId, lessonId, messages })
    .onConflictDoUpdate({
      target: aiChats.id,
      set: { messages, updatedAt: new Date() },
    });
}
