import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { teachers } from "./teachers";
import { workspaces } from "./workspaces";

/* ════════════════════════════════════════════════════════════════════
   MAKTAB DARS JADVALI — zavuch hujjati.

   ⛔ `planning.ts` dagi `timetable_versions` bilan ARALASHTIRMANG. Ular
   ikki boshqa hujjat va oralarida BIR YOʻNALISHLI nashr bor:

     school_timetables  →  nashr  →  timetable_versions
     (maydon, zavuch)                (oʻqituvchi, shaxsiy)

   Nashr `src/server/actions/timetable-publish.ts` dan boshqa joyda
   qilinmaydi — bu ikki mahsulot orasidagi yagona koʻprik
   (docs/dars-jadvali-spec.md §9).

   Egalik `workspace_id` da, `teacher_id` da EMAS: jadval maktabniki,
   uni tuzgan odamniki emas. Zavuch ishdan ketsa jadval qoladi.
   ════════════════════════════════════════════════════════════════════ */

export const schoolTimetables = pgTable(
  "school_timetables",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** "YYYY-MM-DD" — shu sanadan kuchga kiradi (nashrda oʻqituvchi versiyasiga oʻtadi). */
    effectiveFrom: text("effective_from").notNull(),
    /** draft | review | approved | archived */
    status: text("status").notNull().default("draft"),
    note: text("note"),
    /** SchoolTimetableDoc butunligicha (src/lib/school-timetable.ts). */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    /** Kim tasdiqqa yubordi / tasdiqladi — imzo bloki uchun. */
    approvedBy: text("approved_by").references(() => teachers.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("school_timetables_workspace_idx").on(t.workspaceId),
    /* Maydonda bitta sanada bitta jadval — ikki marta nashr qilinganda
       dublikat yaratilmasin. */
    uniqueIndex("school_timetables_effective_idx").on(t.workspaceId, t.effectiveFrom),
  ]
);

/* ════════════════════════════════════════════════════════════════════
   XODIM MOSLIGI — «Nurmatova M.» ↔ Ustozona hisobi.

   Nashrning eng qiyin qismi (spec §6): jadvalda familiya, bazada hisob.
   Moslik BIR MARTA qilinadi va shu yerda saqlanadi — keyingi nashrlarda
   qayta soʻralmaydi.

   `teacher_id` NULL boʻlishi mumkin: xodim hali Ustozonaga kirmagan.
   Bunda `invite_token` orqali taklif havolasi beriladi va u roʻyxatdan
   oʻtganda jadvali toʻlgan holda kiradi — bu oʻsish dvigateli, xato emas.
   ════════════════════════════════════════════════════════════════════ */

export const schoolTimetableStaff = pgTable(
  "school_timetable_staff",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    /** Hujjatdagi `SchoolStaff.id` — jadval ichida shu bilan adreslanadi. */
    staffKey: text("staff_key").notNull(),
    /** Varaqda yozilgan familiya, aynan. */
    displayName: text("display_name").notNull(),
    teacherId: text("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
    /** Taklif havolasi tokeni — hisob bogʻlanmagan xodim uchun. */
    inviteToken: text("invite_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("school_timetable_staff_workspace_idx").on(t.workspaceId),
    uniqueIndex("school_timetable_staff_key_idx").on(t.workspaceId, t.staffKey),
    /* Bitta oʻqituvchi maydonda bitta xodim qatoriga bogʻlanadi.
       Partial — bogʻlanmaganlar (NULL) cheklovga tushmaydi. */
    uniqueIndex("school_timetable_staff_teacher_idx")
      .on(t.workspaceId, t.teacherId)
      .where(sql`${t.teacherId} is not null`),
  ]
);

export type SchoolTimetableRow = typeof schoolTimetables.$inferSelect;
export type NewSchoolTimetableRow = typeof schoolTimetables.$inferInsert;
export type SchoolTimetableStaffRow = typeof schoolTimetableStaff.$inferSelect;
export type NewSchoolTimetableStaffRow = typeof schoolTimetableStaff.$inferInsert;
