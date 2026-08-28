import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import * as schema from "@/server/db/schema";

/* ════════════════════════════════════════════════════════════════════
   JAMOA SINOVI — uchta test hisobi va ular uchun minimal roster.

   Ish maydoni (docs/ish-maydoni-arxitektura.md) qoʻlda sinaladi, buning
   uchun har safar uch hisob + sinf + oʻquvchi kerak boʻladi. Ularni
   interfeys orqali kiritish sinovning oʻzidan koʻp vaqt oladi, sinovni
   qaytadan boshlash esa (taklif kodi bir martalik, koʻchirish
   qaytarilmas) deyarli imkonsiz boʻlib qoladi.

   Ishga tushirish:
     npm run db:seed:jamoa             — yaratadi (avval tozalaydi)
     npm run db:seed:jamoa -- --tayyor — jamoa allaqachon tuzilgan holat
     npm run db:seed:jamoa -- --reset  — faqat oʻchiradi

   `--tayyor` — sinovning 3–8-qadamlarini (kod yaratish, qoʻshilish,
   darsga biriktirish) oʻtkazib yuborish uchun: B allaqachon maktabda,
   9-V si koʻchgan, va u 7-A ni A bilan birga oʻtadi. Shu holatdan
   toʻgʻridan-toʻgʻri 9-qadam (sinfni oʻchirish) sinaladi. Ishlatilgan
   taklif kodi ham qoʻyiladi — 7-qadam uchun.

   ⛔ FAQAT DEV BAZASI. Skript prod (Supabase) URL'ini koʻrsa toʻxtaydi:
      sinov hisoblari haqiqiy oʻqituvchilar orasiga tushmasligi kerak.

   Nima ATAYLAB qilinmaydi — baho, davomat, taklif kodi. Ular sinovning
   OʻZI: qoʻlda kiritilishi kerak, aks holda kiritish oqimi sinalmay
   qoladi. Skript faqat zerikarli qismini (hisob + roster) tayyorlaydi.

   Server db client'i (src/server/db/client.ts) EMAS — u `server-only`
   import qiladi va tsx ostida ishlamaydi (scripts/seed.ts bilan bir xil
   naqsh).
   ════════════════════════════════════════════════════════════════════ */

const PASSWORD = "test12345";

/** Maktab maydoni — ATAYLAB `ws-<teacherId>` EMAS.

    `leaveWorkspace()` shaxsiy maydonni aynan shu naqsh boʻyicha tanib
    oladi (dal/workspace-invites.ts). Agar A ning maktabi `ws-<A>` deb
    nomlansa, "oxirgi ega chiqa olmaydi" toʻsigʻi sinalmaydi — undan
    oldin "shaxsiy maydonni tark etib boʻlmaydi" ishlab ketadi. */
const SCHOOL_WS = "ws-test-maktab";

const A = {
  key: "A",
  name: "Aziza Karimova",
  email: "test-a@ustozona.uz",
  subject: "Matematika",
  roli: "maktab maydonining egasi — taklif kodini shu yaratadi",
};
const B = {
  key: "B",
  name: "Bekzod Toshmatov",
  email: "test-b@ustozona.uz",
  subject: "Ingliz tili",
  roli: "qoʻshiladigan hamkasb — oʻz sinfi bilan keladi (nima koʻchishini koʻrish uchun)",
};
const C = {
  key: "C",
  name: "Charos Yoʻldosheva",
  email: "test-c@ustozona.uz",
  subject: "Biologiya",
  roli: "begona yakka oʻqituvchi — maydoni ham, sinfi ham YOʻQ (onboarding sinovi)",
};
const HISOBLAR = [A, B, C];

/** Sinf va oʻquvchi id'lari `test-` bilan boshlanadi — tozalash shu
    prefiksga tayanmaydi (maydon CASCADE qiladi), lekin bazani qoʻlda
    koʻrganda sinov qatorlari darhol ajralib tursin. */
const SINFLAR = [
  {
    id: "test-7a",
    egasi: "A" as const,
    name: "7-A",
    grade: 7,
    section: "A",
    subject: "Matematika",
    color: "blue",
    oquvchilar: [
      "Abdulaziz Rahimov",
      "Malika Yusupova",
      "Sardor Ergashev",
      "Nilufar Qodirova",
      "Jasur Aliyev",
      "Zilola Nazarova",
      "Otabek Sharipov",
      "Madina Tursunova",
    ],
  },
  {
    id: "test-8b",
    egasi: "A" as const,
    name: "8-B",
    grade: 8,
    section: "B",
    subject: "Matematika",
    color: "green",
    oquvchilar: [
      "Shohruh Bekmurodov",
      "Dilnoza Ismoilova",
      "Aziz Xolmatov",
      "Sevara Rustamova",
      "Bobur Qosimov",
      "Gulnora Sattorova",
    ],
  },
  {
    id: "test-9v",
    egasi: "B" as const,
    name: "9-V",
    grade: 9,
    section: "V",
    subject: "Ingliz tili",
    color: "orange",
    oquvchilar: [
      "Rustam Nurmatov",
      "Kamola Umarova",
      "Doniyor Saidov",
      "Feruza Ochilova",
    ],
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL topilmadi. Ishga tushirish: npm run db:seed:jamoa");
  }
  /* ⛔ Prod darvozasi. Sinov hisoblari haqiqiy bazaga tushsa, ularni
     u yerdan tozalash qoʻlda ish boʻladi — koʻchirish qaytarilmas. */
  if (/supabase/i.test(url)) {
    throw new Error(
      "DATABASE_URL prod (Supabase) ga qaragan. Bu skript faqat dev bazasi uchun — .env.local dagi URL'ni tekshiring."
    );
  }

  const db = drizzle(postgres(url, { prepare: false, max: 1 }), { schema });
  const faqatTozalash = process.argv.includes("--reset");
  const tayyor = process.argv.includes("--tayyor");

  /* ── 1. Eski sinov qatorlarini oʻchirish ─────────────────────────── */
  const emails = HISOBLAR.map((h) => h.email);
  const eski = await db
    .select({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .where(inArray(schema.user.email, emails));

  const maydonlar = new Set<string>([SCHOOL_WS]);
  if (eski.length > 0) {
    const ids = eski.map((u) => u.id);
    ids.forEach((id) => maydonlar.add(`ws-${id}`));
    const azoliklar = await db
      .select({ workspaceId: schema.workspaceMembers.workspaceId })
      .from(schema.workspaceMembers)
      .where(inArray(schema.workspaceMembers.teacherId, ids));
    azoliklar.forEach((m) => maydonlar.add(m.workspaceId));
  }

  /* ⚠️ Maydon OLDIN — sinf/oʻquvchi/aʼzolik/taklif unga CASCADE bilan
     bogʻlangan. Hisob oldin oʻchirilsa maydonlar yetim qolardi: ularga
     hech narsa ishora qilmaydi, demak oʻzi hech qachon oʻchmaydi. */
  const ochirilgan = await db
    .delete(schema.workspaces)
    .where(inArray(schema.workspaces.id, [...maydonlar]))
    .returning({ id: schema.workspaces.id });
  if (eski.length > 0) {
    await db.delete(schema.user).where(
      inArray(
        schema.user.id,
        eski.map((u) => u.id)
      )
    );
  }
  console.log(
    `Tozalandi: ${eski.length} hisob, ${ochirilgan.length} maydon (sinf/oʻquvchi CASCADE bilan).`
  );

  if (faqatTozalash) {
    console.log("--reset: yangi qatorlar yaratilmadi.");
    return;
  }

  /* ── 2. Hisoblar (Better Auth API — parol hash toʻgʻri boʻlishi uchun) ─ */
  const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "teacher", input: false },
      },
    },
  });

  const userId: Record<string, string> = {};
  for (const h of HISOBLAR) {
    try {
      const res = await auth.api.signUpEmail({
        body: { name: h.name, email: h.email, password: PASSWORD },
      });
      userId[h.key] = res.user.id;
    } catch (err) {
      if (!(err instanceof APIError)) throw err;
      const [mavjud] = await db
        .select({ id: schema.user.id })
        .from(schema.user)
        .where(eq(schema.user.email, h.email));
      if (!mavjud) throw err;
      userId[h.key] = mavjud.id;
    }
    await db.insert(schema.teachers).values({
      id: userId[h.key],
      name: h.name,
      email: h.email,
      subject: h.subject,
      /* Sinov hisobi faollashuv voronkasini buzmasin — koʻrsatkich
         haqiqiy oʻqituvchilarni sanashi kerak. */
      excludeFromMetrics: true,
    });
    console.log(`  + ${h.key}: ${h.email}`);
  }

  /* ── 3. Maydonlar ────────────────────────────────────────────────── */
  /* A — maktab maydoni, egasi. B — shaxsiy maydon (`ws-<teacherId>`,
     server/workspace.ts createPersonalWorkspace bilan AYNAN bir xil id;
     aks holda B maktabdan chiqqanda unga ikkinchi maydon paydo boʻladi).
     C — hech qanday maydon YOʻQ: birinchi kirishida ilova oʻzi yaratadi,
     bu ham sinovning bir qismi. */
  await db.insert(schema.workspaces).values([
    { id: SCHOOL_WS, name: "24-maktab (sinov)", kind: "school" },
    { id: `ws-${userId.B}`, name: B.name, kind: "personal" },
  ]);
  await db.insert(schema.workspaceMembers).values([
    { workspaceId: SCHOOL_WS, teacherId: userId.A, role: "owner" },
    { workspaceId: `ws-${userId.B}`, teacherId: userId.B, role: "owner" },
  ]);
  await db
    .update(schema.teachers)
    .set({ activeWorkspaceId: SCHOOL_WS })
    .where(eq(schema.teachers.id, userId.A));
  await db
    .update(schema.teachers)
    .set({ activeWorkspaceId: `ws-${userId.B}` })
    .where(eq(schema.teachers.id, userId.B));

  /* ── 4. Sinf, oʻquvchi, yozilish ─────────────────────────────────── */
  const classRows: (typeof schema.classes.$inferInsert)[] = [];
  const classTeacherRows: (typeof schema.classTeachers.$inferInsert)[] = [];
  const studentRows: (typeof schema.students.$inferInsert)[] = [];
  const enrollmentRows: (typeof schema.enrollments.$inferInsert)[] = [];

  SINFLAR.forEach((sinf, sinfIdx) => {
    const ws = sinf.egasi === "A" ? SCHOOL_WS : `ws-${userId.B}`;
    classRows.push({
      id: sinf.id,
      workspaceId: ws,
      name: sinf.name,
      grade: sinf.grade,
      section: sinf.section,
      subject: sinf.subject,
      color: sinf.color,
      sortOrder: sinfIdx,
    });
    /* ⚠️ `role` ANIQ beriladi: ustunning bazadagi sukut qiymati
       "teacher" (schema/classes.ts). Berilmasa sinf EGASIZ qoladi va
       "hamkasb qoʻshish" hech kimda chiqmaydi. */
    classTeacherRows.push({
      classId: sinf.id,
      teacherId: userId[sinf.egasi],
      role: "owner",
    });
    sinf.oquvchilar.forEach((name, i) => {
      const id = `test-s-${sinf.id.replace("test-", "")}-${i}`;
      studentRows.push({ id, workspaceId: ws, name, initials: initials(name) });
      enrollmentRows.push({ classId: sinf.id, studentId: id, sortOrder: i });
    });
  });

  await db.insert(schema.classes).values(classRows);
  await db.insert(schema.classTeachers).values(classTeacherRows);
  await db.insert(schema.students).values(studentRows);
  await db.insert(schema.enrollments).values(enrollmentRows);
  console.log(
    `  + ${classRows.length} sinf, ${studentRows.length} oʻquvchi, ${enrollmentRows.length} yozilish`
  );

  /* ── 4b. `--tayyor`: jamoa allaqachon tuzilgan ────────────────────── */
  if (tayyor) {
    /* B maktabga koʻchadi. Bu `moveTeacherToWorkspace` qiladigan ishning
       aynan oʻzi: aʼzolik almashadi, shaxsiy maydondagi sinf va
       oʻquvchilar maktabga oʻtadi. ⚠️ Mantiq oʻzgarsa bu yer ham
       yangilansin — aks holda skript sinamoqchi boʻlgan holatdan
       boshqa holat quradi. */
    await db
      .update(schema.classes)
      .set({ workspaceId: SCHOOL_WS })
      .where(eq(schema.classes.workspaceId, `ws-${userId.B}`));
    await db
      .update(schema.students)
      .set({ workspaceId: SCHOOL_WS })
      .where(eq(schema.students.workspaceId, `ws-${userId.B}`));
    await db
      .delete(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.teacherId, userId.B));
    await db
      .insert(schema.workspaceMembers)
      .values({ workspaceId: SCHOOL_WS, teacherId: userId.B, role: "teacher" });
    await db.delete(schema.workspaces).where(eq(schema.workspaces.id, `ws-${userId.B}`));
    await db
      .update(schema.teachers)
      .set({ activeWorkspaceId: SCHOOL_WS })
      .where(eq(schema.teachers.id, userId.B));

    /* B 7-A ni A bilan birga oʻtadi — 8-qadamning natijasi.
       ⚠️ `role: "teacher"`: A ega boʻlib qoladi, aks holda 9-qadam
       sinamoqchi boʻlgan holat (ega ustidan oʻchirish) yuzaga kelmaydi. */
    await db
      .insert(schema.classTeachers)
      .values({ classId: "test-7a", teacherId: userId.B, role: "teacher" });

    /* Ishlatilgan kod — 7-qadam uchun. Muddati kelajakda, yaʼni
       «muddati tugagan» emas, aynan «allaqachon ishlatilgan» deyilsin. */
    await db.insert(schema.workspaceInvites).values({
      id: "test-invite-1",
      code: "TESTKOD1",
      workspaceId: SCHOOL_WS,
      role: "teacher",
      createdBy: userId.A,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      usedAt: new Date(),
      usedBy: userId.B,
    });
    console.log("  + jamoa tuzilgan: B maktabda, 7-A ni birga oʻtadi");
  }

  /* ── 5. Xulosa ───────────────────────────────────────────────────── */
  console.log("\n─────────────────────────────────────────────");
  console.log("Sinov hisoblari tayyor. Parol (hammasida bir xil):", PASSWORD);
  console.log("─────────────────────────────────────────────");
  for (const h of HISOBLAR) {
    console.log(`\n${h.key} — ${h.name}`);
    console.log(`   ${h.email}`);
    console.log(`   ${h.roli}`);
  }
  if (tayyor) {
    console.log("\n── JAMOA TUZILGAN (--tayyor) ──");
    console.log("Maktabda: 7-A (A ega, B oʻqituvchi), 8-B (A), 9-V (B)");
    console.log("C: hali maydonsiz");
    console.log("Ishlatilgan kod: TESTKOD1 — 7-qadamda shuni kiriting");
    console.log("\n→ Toʻgʻridan-toʻgʻri 9-qadamdan boshlang.");
  } else {
    console.log("\nA maydonida: 7-A (8 oʻquvchi), 8-B (6 oʻquvchi)");
    console.log("B maydonida: 9-V (4 oʻquvchi) — qoʻshilganda shular koʻchadi");
    console.log("C: boʻsh — onboarding sehrgari oʻzi chiqishi kerak");
  }
  console.log("\nQaytadan boshlash: npm run db:seed:jamoa" + (tayyor ? " -- --tayyor" : ""));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
