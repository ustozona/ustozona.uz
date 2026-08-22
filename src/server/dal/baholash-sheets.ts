import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { classes, enrollments, students } from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { assertTeachesClass } from "@/server/workspace";
import { getSet } from "./assess/sets";

/* ════════════════════════════════════════════════════════════════════
   QOGʻOZ TEST — varaq maʼlumotini yigʻish

   LessonLab dvigateli varaq chizadi, lekin QR ga nima yozilishini BIZ
   hal qilamiz. QR sigʻimi kichik — telefon kamerasi uzun matnni oʻqiy
   olmaydi — shuning uchun u faqat UCHTA BUTUN SON tashiydi:

       test_ref  · class_ref  · student_ref

   Ustozona kalitlari esa UUID. Ularni QR ga sigʻdirib boʻlmaydi, demak
   moslashtirish kerak. Tanlangan yechim:

     test_ref / class_ref  — UUID'ning turgʻun 31-bitli xesh'i.
        Bu KALIT EMAS, TEKSHIRUV: skanerlashda oʻqituvchi allaqachon
        testni tanlagan boʻladi, xesh esa «bu varaq oʻsha testdanmi»
        degan savolga javob beradi. Toʻqnashuv ehtimoli bor, lekin u
        notoʻgʻri oʻquvchiga baho qoʻymaydi — faqat begona varaqni
        oʻtkazib yuborishi mumkin.

     student_ref  — sinf roʻyxatidagi TARTIB raqami (1..N).
        `students.studentNumber` ISHLATILMAYDI: u butun bazada
        yagona identity, yaʼni qiymati 4821 boʻlishi mumkin, dvigatel
        esa `max(no)` tagacha varaq chizadi — 4821 sahifa PDF.

   TARTIB RAQAMINING NARXI (buni bilib turing): varaq chop etilgandan
   keyin sinfga oʻquvchi qoʻshilsa yoki oʻchirilsa, raqamlar surilib
   ketadi va eski varaqlar notoʻgʻri odamga bogʻlanadi. Shuning uchun
   roʻyxat SNAPSHOT sifatida qaytariladi — chaqiruvchi uni chop etish
   payti bilan birga saqlashi va skanerlashda oʻshanga tayanishi kerak.
   ════════════════════════════════════════════════════════════════════ */

/** UUID → turgʻun musbat 31-bitli son (FNV-1a).

    Kriptografik emas va boʻlishi ham shart emas: bu maxfiylik chorasi
    emas, varaqni testga bogʻlaydigan tekshiruv belgisi. */
export function refOf(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 1 — belgi bitini tashlaymiz, natija har doim musbat.
  return (h >>> 0) >>> 1;
}

export type SheetPlan = {
  testRef: number;
  classRef: number;
  title: string;
  className: string;
  questionCount: number;
  /** `no` — varaqdagi tartib raqami, `id` — bizning oʻquvchi UUID'i. */
  roster: { no: number; id: string; name: string }[];
};

/** Varaq chizish uchun kerakli hamma narsani bitta soʻrovda yigʻadi.

    Egalik tekshiruvi shu yerda: `setId` clientdan keladi, shuning uchun
    test va sinf AYNAN shu oʻqituvchiniki ekani tekshiriladi. Aks holda
    begona sinf roʻyxatini chop etib olish mumkin boʻlardi.

    `actorId` — telefondan kelgan chipta oqimi uchun (`scan-ticket.ts`):
    u yerda cookie sessiyasi YOʻQ, kimlik imzolangan chiptadan keladi.
    Berilmasa odatdagidek `requireTeacher()` ishlaydi. Chipta imzosi
    allaqachon tekshirilgan boʻlishi SHART — bu funksiya qiymatga
    ishonadi. */
export async function buildSheetPlan(
  setId: string,
  classId: string,
  actorId?: string
): Promise<SheetPlan> {
  const teacherId = actorId ?? (await requireTeacher()).id;

  const set = await getSet(setId, teacherId);
  if (!set || set.teacherId !== teacherId) {
    throw new Error("Test topilmadi");
  }

  /* Sinf CHAQIRUVCHIDAN keladi, `set.classId` dan EMAS.

     Test qaysi sinfda tuzilganidan qatʼi nazar oʻqituvchi uni istagan
     sinfiga bera oladi — LessonLabdagi mantiq shunday va oʻqituvchilar
     aynan shunga oʻrgangan. Varaqdagi ismlar va QR raqamlari
     TANLANGAN sinf roʻyxatidan olinishi shart, aks holda 8-B ga
     6-A ning ismlari chop etilardi.

     Egalik shu yerda tekshiriladi: `classId` mijozdan kelgan qiymat. */
  await assertTeachesClass(classId);
  const [cls] = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);
  if (!cls) throw new Error("Sinf topilmadi");

  const rows = await db
    .select({ id: students.id, name: students.name, status: students.status })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(eq(enrollments.classId, cls.id))
    .orderBy(asc(enrollments.sortOrder), asc(students.createdAt));

  // `archived` — sinfdan chiqqan oʻquvchi, unga varaq chop etilmaydi.
  // `away` esa QOLADI: vaqtincha yoʻq bola qaytib kelib topshirishi
  // mumkin, varaqni qayta chop etish esa raqamlarni suradi.
  const active = rows.filter((r) => r.status !== "archived");

  return {
    testRef: refOf(set.id),
    classRef: refOf(cls.id),
    title: set.title,
    className: cls.name,
    questionCount: set.items.length,
    roster: active.map((r, i) => ({ no: i + 1, id: r.id, name: r.name })),
  };
}
