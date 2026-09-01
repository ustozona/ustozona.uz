import {
  boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { teachers } from "./teachers";
import { workspaces } from "./workspaces";

/* ════════════════════════════════════════════════════════════════════
   SINFLAR va OʻQUVCHILAR — roster yadrosi.

   ID'lar: text, ilova/seed generatsiya qiladi. Legacy seed id'lar
   ("5-a", "s-0-abdulloh-xasanov") faqat demo oʻqituvchiga tegishli;
   yangi yozuvlar uchun ilova global-unikal id yaratishi shart
   (crypto.randomUUID) — PK butun jadval boʻyicha yagona.

   ⭐ IJARA BIRLIGI — OʻQITUVCHI EMAS, ISH MAYDONI (2026-08-22).
   Ilgari `classes.teacherId` / `students.teacherId` bor edi, yaʼni bola
   oʻqituvchiga tegishli edi. Bu yakka oʻqituvchi quroli uchun toʻgʻri
   edi, lekin bitta bolani bir nechta oʻqituvchi oʻqitishi kerak
   boʻlganda buzildi: har oʻqituvchida ALOHIDA "Bobur" paydo boʻlardi.

   Endi: bola maydonga tegishli, oʻqituvchining unga kirishi esa
   YOZILISH orqali (`enrollments` + `class_teachers`) — "biz bir
   darsdamiz" fakti. Batafsil: docs/ish-maydoni-arxitektura.md

   ⚠️ Boshqa jadvallardagi `teacherId` (grades, attendance_records,
   student_notes…) OLIB TASHLANMAYDI — u yerda maʼno boshqa:
   "bu yozuvni KIM yaratgan" (mualliflik), "kimga tegishli" emas.
   ════════════════════════════════════════════════════════════════════ */

export const classes = pgTable(
  "classes",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Maʼmuriy sinf (7-A) — dars guruhi ("7-A Ingliz 1-guruh") unga ulanadi.
        null = mustaqil: yakka oʻqituvchining sinfi yoki toʻgarak.

        Oʻz-oʻziga ishora ATAYLAB (alohida jadval emas): oʻzbek tilida
        ikkalasi ham "sinf" deyiladi (asoschi, 2026-08-22), demak
        foydalanuvchi uchun bitta tushuncha — faqat qaysi oʻquvchilar
        olinishi farq qiladi.

        `set null` — maʼmuriy sinf oʻchsa dars guruhi qolsin: undagi baho
        va davomat yoʻqolmasligi kerak. */
    parentClassId: text("parent_class_id").references((): AnyPgColumn => classes.id, {
      onDelete: "set null",
    }),
    /** Koʻrsatiladigan nom ("5-A") — HISOBLANUVCHI: grade+section+label dan
        hosil qilinadi (class-naming.ts). Denormalizatsiya ataylab: nom
        ilova boʻylab ~100 joyda oʻqiladi va qidiruv/eksportda ishlatiladi. */
    name: text("name").notNull(),
    /** Parallel harfi ("A", "B", "D"…) — yildan yilga oʻzgarmaydi. */
    section: text("section"),
    /** Ixtiyoriy erkin nom; berilsa daraja+harfdan ustun. */
    label: text("label"),
    /** {oʻquv yili id: daraja} — rollover tarixi. Eski yil faollashtirilganda
        nom shu yerdagi darajadan tiklanadi (5-A → 6-A qaytariluvchan). */
    gradeByYear: jsonb("grade_by_year").$type<Record<string, number>>(),
    /** ClassColor yorligʻi ("blue", "gray", ...); null = indeks boʻyicha avto. */
    color: text("color"),
    /** Koʻrsatma vaqti, mas. "17:10 — 17:55" (faqat koʻrinish uchun). */
    time: text("time"),
    /** Sinf raqami (1–11); null = toʻgarak kabi darajasiz guruh. */
    grade: integer("grade"),
    /** Fan nomi, mas. "Ingliz tili". */
    subject: text("subject"),
    /** Avatar ikonkasi kaliti (ClassIconKey). */
    icon: text("icon"),
    /** @deprecated Sinf tavsifi 2026-08-02 da ilovadan olib tashlandi (hech
        qayerda koʻrsatilmasdi). Ustun ATAYLAB qoldirildi: DROP COLUMN
        qaytarilmas. Kod bu maydonni oʻqimaydi ham, yozmaydi ham. */
    description: text("description"),
    /** Frontend massiv tartibi (sidebar/roʻyxat) — round-trip'da saqlanadi. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Arxivlangan sana (ISO satr) yoki null. null = faol sinf. Arxiv sinflar
        pickerlardan yashiriladi (rollover: bitiruvchi guruhlar). Sinf UUID va
        tarixi (davomat/baho) saqlanadi — faqat roʻyxatdan yashirin. */
    archivedAt: text("archived_at"),
    /** Shogird onboarding: yoqilsa, oʻquvchi sinfga qoʻshilganda ota-ona
        telefon raqamini kiritishi talab qilinadi (guardian_phone). */
    requireGuardianContact: boolean("require_guardian_contact").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("classes_workspace_idx").on(t.workspaceId),
    index("classes_parent_idx").on(t.parentClassId),
  ]
);

/* ────────────────────────────────────────────────────────────────────
   DARSNI KIM OʻTADI.

   🔴 IMTIYOZ OSHIRISH: koʻrinuvchanlik "men oʻtadigan darsdagi bolalar"
   qoidasiga tayangani uchun, oʻqituvchi oʻzini istalgan darsga qoʻsha
   olsa — OʻZIGA OʻZI ruxsat bergan boʻladi. Shu bois bu jadvalga yozish
   nazorat qilinadigan amal (maktabda: admin; adminsiz maydonda: EGA).

   ⭐ EGA (2026-08-26) — sinf egaligi naqshi. Ilgari bu
   jadval yassi toʻplam edi va "kim kimni chiqaradi, kim sinfni
   oʻchiradi" savoliga javob yoʻq edi: ikki hamkasb bir-birini chiqarib
   tashlashi mumkin edi. Adminsiz maydonda nazoratchi ham yoʻq edi —
   hujjat "oʻzaro kelishadi" deb qoldirgan, bu esa qoida emas.

   Batafsil: docs/ish-maydoni-arxitektura.md §10.4
   ──────────────────────────────────────────────────────────────────── */

export const classTeachers = pgTable(
  "class_teachers",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    /** owner = sinfni yaratgan; hamkasb qoʻshadi/chiqaradi, sinfni oʻchiradi.
        teacher = hamkasb; dars oʻtadi, lekin faqat OʻZI chiqa oladi.

        ⚠️ Har sinfda kamida bitta `owner` boʻlishi kerak — aks holda sinf
        yetim qoladi va uni interfeys orqali tuzatib boʻlmaydi. Egalik
        oʻtkazish shu sababli alohida amal (§10.6 fors-major). */
    role: text("role").notNull().default("teacher"), // owner | teacher
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.classId, t.teacherId] }),
    index("class_teachers_teacher_idx").on(t.teacherId),
  ]
);

export const students = pgTable(
  "students",
  {
    id: text("id").primaryKey(),
    /** Avto-beriladigan oʻquvchi raqami (global ketma-ket, DB tomonidan
        insert paytida beriladi — ilova hech qachon qiymat yubormaydi va
        uni oʻzgartirmaydi, shu bois barqaror va takrorlanmas). */
    studentNumber: integer("student_number").generatedAlwaysAsIdentity(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Sentyabr: oʻquvchi akkaunti ulanganда auth user'ga bogʻlanadi. */
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    status: text("status").notNull().default("active"), // active | away | archived
    gender: text("gender"), // male | female
    birthDate: text("birth_date"), // "YYYY-MM-DD" — frontend bilan aynan mos satr
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    studentPhone: text("student_phone"),
    /** Taxallus (ixtiyoriy).

        Bu maydon LessonLab bilan BIRGA ishlatiladi va uning YAGONA
        manbasi shu yer: bot `bot_students` da nusxa saqlamaydi, uni
        `roster_links` orqali `v_unified_students` dan o'qiydi.

        ⛔ `bot_students` ga `nickname` qo'shmang — bir xil maydon ikki
        jadvalda yashasa vaqt o'tib ajralib ketadi va qaysi biri
        to'g'ri ekanini hech kim bilmaydi. Batafsil: LessonLab
        repo'sida `docs/CROSS_PLATFORM.md`. */
    nickname: text("nickname"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("students_workspace_idx").on(t.workspaceId)]
);

/* ────────────────────────────────────────────────────────────────────
   YOZILISH — bola ↔ sinf/guruh, KOʻP-KOʻPGA.

   Ilgari `students.classId` (yagona FK) edi — bola faqat BITTA sinfda
   boʻla olardi. Bu ikki holatni imkonsiz qilardi:

   1) Bir bolani ikki oʻqituvchi oʻqitishi (7-A matematika + 7-A ingliz)
   2) Bir oʻqituvchining ikki guruhida boʻlishi — masalan Eshmat
      informatika darsida ham, oʻsha domlaning toʻgaragida ham

   `sortOrder` YOZILISHDA (oʻquvchida emas): bola ikki guruhda turlicha
   tartibda turishi mumkin.
   ──────────────────────────────────────────────────────────────────── */

export const enrollments = pgTable(
  "enrollments",
  {
    classId: text("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    /** Roster tartibi shu guruh ichida. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.classId, t.studentId] }),
    index("enrollments_student_idx").on(t.studentId),
  ]
);

export type ClassRow = typeof classes.$inferSelect;
export type StudentRow = typeof students.$inferSelect;
export type ClassTeacherRow = typeof classTeachers.$inferSelect;
export type EnrollmentRow = typeof enrollments.$inferSelect;
