import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes } from "@/server/db/schema";
import { ForbiddenError, requireTeacher, UnauthorizedError } from "@/server/session";
import { assertTeachesClass } from "@/server/workspace";
import { wheelDisplayNames, type WheelAccess, type WheelRosterResult } from "@/lib/doska/wheel";
import { listLiveClasses } from "./assess/live";
import { activeClassRoster } from "./class-roster";

/* ════════════════════════════════════════════════════════════════════
   DOSKA GʻILDIRAGI — sinf roʻyxatini ulash (v1.1, docs/doska-gildirak-spec.md
   R296).

   ⭐ Pullik imkoniyat: faqat `teachers.plan === "pro"`. Tekshiruv SHU
   YERDA, serverda — UIʼdagi yulduzcha faqat taklif, himoya emas. AI
   limitlari ham xuddi shu ustunga tayanadi (`lib/ai-limits.ts`).

   Ismlar brauzerda SAQLANMAYDI — gʻildirak ularni har sahifa ochilishida
   shu yerdan oladi. Shuning uchun tarif har safar tekshiriladi: Pro
   tugagan yoki hisobdan chiqilgan boʻlsa roʻyxat ham yopiladi, umumiy
   kompyuterda keyingi odam uni koʻrmaydi.

   «Kirmagan», «Pro emas» va «bu sinf sizniki emas» — XATO EMAS, `denied`
   javobi: `/doska` kirmasdan ochiladi (R134) va bu holatlar oddiy.
   ════════════════════════════════════════════════════════════════════ */

const isPro = (plan: string | null | undefined) => plan === "pro";

const isDenied = (e: unknown) => e instanceof UnauthorizedError || e instanceof ForbiddenError;

/** Mehmon / bepul / pullik — va pullik boʻlsa, oʻqituvchi dars beradigan sinflar. */
export async function wheelAccess(): Promise<WheelAccess> {
  let teacher;
  try {
    teacher = await requireTeacher();
  } catch (e) {
    // Kirmagan yoki oʻqituvchi emas (oʻquvchi/ota-ona akkaunti) — mehmon.
    if (isDenied(e)) return { access: "guest" };
    throw e;
  }
  if (!isPro(teacher.plan)) return { access: "free" };
  return { access: "pro", classes: await listLiveClasses() };
}

/**
 * Sinfning joriy roʻyxati, gʻildirak uchun: oʻquvchi ID si + qisqa ism
 * («Aziza K.»). Toʻliq ism brauzerga YUBORILMAYDI.
 *
 * ID nega kerak: qisqa ism butun roʻyxatdan hisoblanadi — yangi «Aziza
 * Komilova» kelsa, eski «Aziza K.» «Aziza Ka.» ga aylanadi. «Soʻralganlar»
 * va «bugun yoʻq» ism bilan saqlansa, ular shu zahoti boshqa bolaga
 * tegishli boʻlib qolardi.
 */
export async function wheelRoster(classId: string): Promise<WheelRosterResult> {
  try {
    const teacher = await requireTeacher();
    if (!isPro(teacher.plan)) return { status: "denied" };
    // `classId` mijozdan keladi — sinf aynan shu oʻqituvchiniki ekani tekshiriladi.
    await assertTeachesClass(classId);
  } catch (e) {
    if (isDenied(e)) return { status: "denied" };
    throw e;
  }

  const [cls] = await db
    .select({ name: classes.name })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);
  if (!cls) return { status: "denied" };

  const roster = await activeClassRoster(classId);
  const names = wheelDisplayNames(roster.map((r) => r.name));
  return {
    status: "ok",
    className: cls.name,
    students: roster.map((r, i) => ({ id: r.id, name: names[i] })),
  };
}
