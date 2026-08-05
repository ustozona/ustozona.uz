import "server-only";
import { randomUUID, randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  activityItems,
  quizSessions,
  responses,
  sessionParticipants,
  type QuizSessionRow,
} from "@/server/db/schema";
import { requireTeacher } from "@/server/session";
import { hashParticipantToken } from "@/server/play/session";
import { scoreResponse } from "@/lib/assess/score";
import { scanOmrSheet } from "@/server/lessonlab/baholash";
import { buildSheetPlan, type SheetPlan } from "./baholash-sheets";
import { getSet } from "./assess/sets";

/* ════════════════════════════════════════════════════════════════════
   QOGʻOZ TESTNI OʻQISH — varaq surati → jurnal

   Bu `baholash-sheets.ts` ning TESKARI yoʻli: u varaq chizish uchun
   maʼlumot yigʻadi, bu esa chizilgan varaqni qaytib oʻqiydi. Ikkalasi
   bitta shartnomaga tayanadi:

       QR = { test_ref, class_ref, student_ref }   (uchta butun son)

   `student_ref` — sinf roʻyxatidagi TARTIB raqami, UUID emas. Demak
   raqamni oʻquvchiga qaytarish MAJBURIYATI shu yerda: roʻyxat aynan
   `buildSheetPlan()` bergan tartibda qayta yigʻiladi (`sortOrder`,
   keyin `createdAt`), shuning uchun ikki tomon bir xil qatorni
   koʻradi.

   ⚠️ Varaq chop etilgandan keyin sinf roʻyxati oʻzgargan boʻlsa
   raqamlar suriladi va varaq BOSHQA bolaga bogʻlanadi. Kod buni
   sezmaydi — sezishning imkoni yoʻq. Shuning uchun oqim IKKI QADAM:
   avval oʻqituvchi kim ekanini KOʻRADI (preview), keyin tasdiqlaydi.
   Avtomatik yozish bu yerda ataylab yoʻq.

   IKKI DAFTAR CHEGARASI: LessonLab faqat «qaysi katak belgilangan»
   degan xom natijani qaytaradi. Ball shu yerda, Ustozonaning OʻZ
   `scoreResponse()` funksiyasi bilan hisoblanadi — aynan onlayn javob
   kabi.
   ════════════════════════════════════════════════════════════════════ */

/** OMR harfi → variant indeksi. `X` (ikki katak belgilangan) roʻyxatda
    YOʻQ: u javob berilgan, lekin noaniq degani — XATO sifatida
    yoziladi, boʻsh sifatida emas (docs/baholash-integratsiya.md §7). */
const LETTERS = ["A", "B", "C", "D"] as const;

/** Bundan past ishonchli javob oʻqituvchiga «tekshiring» deb
    koʻrsatiladi. Varaqning OʻZI ishonchsiz boʻlsa dvigatel uni
    roʻyxatga umuman qoʻshmaydi — bu esa bitta katak darajasidagi
    shubha. */
export const LOW_CONFIDENCE = 0.6;

/* ── Varaq qatorlari qaysi savolga tegishli ───────────────────────── */

/** Varaqdagi bitta qator (savol) — QANDAY baholanishi bilan birga.

    `itemId === null` — bu qatorni qogʻozda baholab boʻlmaydi
    (masalan juftlash savoli). Bunday qator suratdan oʻqilsa ham
    eʼtiborga olinmaydi va oʻqituvchiga ochiq aytiladi. */
type PaperQuestion = {
  no: number;
  activityId: string;
  itemId: string | null;
  shape: string;
  /** A..D tartibidagi variant id'lari. Toʻrttadan koʻp variant boʻlsa
      qolganlari qogʻozga umuman chizilmaydi — ogohlantiriladi. */
  optionIds: string[];
  optionCount: number;
  /* Javob yozish uchun kerakli maydonlar — ikkinchi marta soʻrov
     qilmaslik uchun shu yerda olib qoʻyiladi. */
  teacherId: string;
  grading: string;
  version: number;
  standardId: string | null;
  source: string | null;
  ordinal: number;
  content: Record<string, unknown>;
};

/** Toʻplamning varaqdagi tartibi boʻyicha savollar.

    Tartib `set.items` dan olinadi — varaq ham aynan shu tartibda
    chiziladi (`buildSheetPlan().questionCount = set.items.length`).
    Ikki joyda bir xil tartib boʻlishi SHART, aks holda 3-savolning
    javobi 5-savolga yozilardi. */
async function loadPaperQuestions(plan: SheetPlan, setItems: { activityId: string }[]) {
  const activityIds = setItems.map((i) => i.activityId);
  if (activityIds.length === 0) return [];

  const activityRows = await db
    .select()
    .from(activities)
    .where(inArray(activities.id, activityIds));
  const byId = new Map(activityRows.map((a) => [a.id, a]));

  const itemRows = await db
    .select()
    .from(activityItems)
    .where(inArray(activityItems.activityId, activityIds))
    .orderBy(asc(activityItems.ordinal));
  const itemsByActivity = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const list = itemsByActivity.get(item.activityId) ?? [];
    list.push(item);
    itemsByActivity.set(item.activityId, list);
  }

  const questions: PaperQuestion[] = [];
  setItems.forEach((entry, index) => {
    const activity = byId.get(entry.activityId);
    if (!activity) return;
    // `mcq` da faoliyat = bitta element. Boshqa shakllarda bir nechta
    // element bor va ular bitta katakli qatorga sigʻmaydi.
    const items = itemsByActivity.get(entry.activityId) ?? [];
    const item = activity.shape === "mcq" ? items[0] : undefined;
    const content = (item?.content ?? {}) as {
      options?: { id: string; text: string }[];
    };
    const options = content.options ?? [];
    questions.push({
      no: index + 1,
      activityId: activity.id,
      itemId: item?.id ?? null,
      shape: activity.shape,
      optionIds: options.slice(0, LETTERS.length).map((o) => o.id),
      optionCount: options.length,
      teacherId: activity.teacherId,
      grading: activity.grading,
      version: activity.version,
      standardId: activity.standardId,
      source: activity.source,
      ordinal: item?.ordinal ?? 0,
      content: (item?.content ?? {}) as Record<string, unknown>,
    });
  });
  // `plan.questionCount` varaqdagi qatorlar soni — roʻyxat undan uzun
  // boʻlolmaydi.
  return questions.slice(0, plan.questionCount);
}

/** Qogʻozda ishonchli baholab boʻlmaydigan savollar haqida ogohlantirish.

    Yashirmaymiz: oʻqituvchi «hammasi oʻqildi» deb oʻylab, aslida ikki
    savol tashlab ketilganini bilmay qolishi mumkin edi. */
function warnAbout(questions: PaperQuestion[]): string[] {
  const warnings: string[] = [];
  const notMcq = questions.filter((q) => q.itemId === null);
  if (notMcq.length > 0) {
    warnings.push(
      `${notMcq.map((q) => q.no).join(", ")}-savol variantli emas — qogʻoz ` +
        "varaqdan oʻqilmaydi va bu savollar baholanmaydi."
    );
  }
  const tooMany = questions.filter((q) => q.optionCount > LETTERS.length);
  if (tooMany.length > 0) {
    warnings.push(
      `${tooMany.map((q) => q.no).join(", ")}-savolda ${LETTERS.length} tadan koʻp ` +
        "variant bor — varaqda faqat A–D katagi chiziladi, qolgan variantni " +
        "oʻquvchi belgilay olmaydi."
    );
  }
  return warnings;
}

/* ── 1-QADAM: suratni oʻqish (hech narsa yozilmaydi) ──────────────── */

export type ScanAnswer = {
  no: number;
  /** `A`..`D` · `X` (ikki katak) · `null` (boʻsh). */
  letter: string | null;
  confidence: number;
  /** Bu qator umuman baholanadimi (variantli savolmi). */
  gradable: boolean;
  /** Qogʻozda mavjud variantlar soni — tuzatish tugmalari shunga qarab
      chiziladi (A–D dan koʻpi varaqqa sigʻmaydi). */
  optionCount: number;
};

export type ScanSheet = {
  /** Suratdagi tartib — bitta rasmda 4 tagacha varaq boʻlishi mumkin. */
  index: number;
  /** Varaqdagi QR raqami (sinf roʻyxatidagi tartib). */
  studentNo: number | null;
  studentId: string | null;
  studentName: string | null;
  /** Ismsiz imtihon varagʻi — kimniki ekanini oʻqituvchi tanlaydi. */
  examMode: boolean;
  answers: ScanAnswer[];
  /** Oʻqituvchiga koʻrsatiladigan muammolar (varaq begona testdan, ...). */
  problems: string[];
  /** Bu oʻquvchi shu test boʻyicha allaqachon kiritilgan. */
  alreadyEntered: boolean;
  /** Tuzatib boʻlmaydigan muammo (begona test/sinf varagʻi) — bunday
      varaq oʻquvchi tanlansa ham kiritilmaydi. Sabab matnini oʻqib
      qaror qilish mijozga qolmasin: bayroq shu yerda hisoblanadi. */
  blocked: boolean;
};

export type ScanPreview = {
  title: string;
  className: string;
  questionCount: number;
  /** Qoʻlda biriktirish uchun sinf roʻyxati (varaqdagi tartib bilan). */
  roster: { no: number; id: string; name: string }[];
  sheets: ScanSheet[];
  warnings: string[];
};

/** Shu test+sinf boʻyicha allaqachon varagʻi kiritilgan oʻquvchilar.

    Nega kerak: `publishSessionToGrades()` ishtirokchining BARCHA
    javoblarini qoʻshadi. Bitta varaqni ikki marta kiritish ballni ikki
    barobar qilardi — aynan «800%» xatosi shundan tugʻilgandi. Shuning
    uchun takror kiritish jimgina emas, OCHIQ toʻxtatiladi. */
async function enteredStudentIds(sessionId: string): Promise<Set<string>> {
  const rows = await db
    .select({ studentId: sessionParticipants.studentId })
    .from(sessionParticipants)
    .where(eq(sessionParticipants.sessionId, sessionId));
  return new Set(rows.map((r) => r.studentId).filter((id): id is string => Boolean(id)));
}

/** Shu test+sinf uchun qogʻoz sessiyasi — bor boʻlsa oʻshaniki.

    Bitta test bitta sinfga bir marta qogʻozda beriladi, varaqlar esa
    bir necha surat bilan bosqichma-bosqich kiritiladi. Har surat yangi
    sessiya ochsa, jurnalga bitta test uchun beshta topshiriq
    tushardi. */
async function findPaperSession(
  teacherId: string,
  setId: string,
  classId: string
): Promise<QuizSessionRow | null> {
  const [row] = await db
    .select()
    .from(quizSessions)
    .where(
      and(
        eq(quizSessions.teacherId, teacherId),
        eq(quizSessions.setId, setId),
        eq(quizSessions.classId, classId),
        eq(quizSessions.mode, "paper")
      )
    )
    .orderBy(desc(quizSessions.createdAt))
    .limit(1);
  return row ?? null;
}

export async function previewOmrScan(input: {
  setId: string;
  classId: string;
  image: Uint8Array;
  contentType: string;
}): Promise<ScanPreview> {
  // Egalik shu yerda tekshiriladi (`requireTeacher` + set/class egasi).
  const plan = await buildSheetPlan(input.setId, input.classId);
  if (plan.questionCount < 1) throw new Error("Testda savol yoʻq");

  const { setItems } = await loadSetItems(input.setId);
  const questions = await loadPaperQuestions(plan, setItems);
  const questionByNo = new Map(questions.map((q) => [q.no, q]));

  const scan = await scanOmrSheet({
    image: input.image,
    contentType: input.contentType,
    questionCount: plan.questionCount,
  });

  const teacher = await requireTeacher();
  const session = await findPaperSession(teacher.id, input.setId, input.classId);
  const entered = session ? await enteredStudentIds(session.id) : new Set<string>();

  const sheets: ScanSheet[] = scan.sheets.map((sheet, i) => {
    const problems: string[] = [];
    let blocked = false;

    // Xesh — kalit emas, TEKSHIRUV: «bu varaq oʻsha testdanmi».
    if (sheet.testRef !== plan.testRef) {
      problems.push("Bu varaq boshqa testdan — kiritilmaydi.");
      blocked = true;
    }
    // `class_ref = 0` imtihon rejimida ataylab yoziladi, xato emas.
    if (sheet.classRef !== null && sheet.classRef !== 0 && sheet.classRef !== plan.classRef) {
      problems.push("Varaq boshqa sinf roʻyxati bilan chop etilgan — kiritilmaydi.");
      blocked = true;
    }

    const no = sheet.examMode ? null : sheet.studentRef;
    const student = no === null ? undefined : plan.roster.find((r) => r.no === no);
    if (no !== null && !student) {
      problems.push(
        `Roʻyxatda ${no}-raqamli oʻquvchi yoʻq — varaq chop etilgandan keyin ` +
          "sinf oʻzgargan boʻlishi mumkin. Oʻquvchini qoʻlda tanlang."
      );
    }
    if (sheet.examMode) {
      problems.push("Ismsiz imtihon varagʻi — oʻquvchini qoʻlda tanlang.");
    }

    const answers: ScanAnswer[] = [];
    for (let q = 1; q <= plan.questionCount; q++) {
      const question = questionByNo.get(q);
      const letter = sheet.answers[String(q)] ?? null;
      answers.push({
        no: q,
        letter,
        confidence: sheet.confidence[String(q)] ?? 0,
        gradable: Boolean(question?.itemId),
        optionCount: Math.min(question?.optionCount ?? 0, LETTERS.length),
      });
    }

    return {
      index: i,
      studentNo: no,
      studentId: student?.id ?? null,
      studentName: student?.name ?? null,
      examMode: sheet.examMode,
      answers,
      problems,
      alreadyEntered: student ? entered.has(student.id) : false,
      blocked,
    };
  });

  return {
    title: plan.title,
    className: plan.className,
    questionCount: plan.questionCount,
    roster: plan.roster,
    sheets,
    warnings: warnAbout(questions),
  };
}

/* ── 2-QADAM: tasdiqlangan varaqlarni yozish ──────────────────────── */

export type ApplySheet = {
  studentId: string;
  /** Savol raqami → harf. Oʻqituvchi tuzatgan qiymatlar shu yerda
      keladi — surat emas, EKRANDAGI holat haqiqat hisoblanadi. */
  answers: Record<string, string | null>;
};

export type ApplyReport = {
  sessionId: string;
  studentsAdded: number;
  answersSaved: number;
  /** Kiritilmagan varaqlar — sababi bilan. */
  skipped: { name: string; reason: string }[];
};

export async function applyOmrScan(input: {
  setId: string;
  classId: string;
  sheets: ApplySheet[];
}): Promise<ApplyReport> {
  const teacher = await requireTeacher();
  const plan = await buildSheetPlan(input.setId, input.classId);
  const { setItems } = await loadSetItems(input.setId);
  const questions = await loadPaperQuestions(plan, setItems);
  const byNo = new Map(questions.map((q) => [q.no, q]));
  const rosterById = new Map(plan.roster.map((r) => [r.id, r]));

  const session = await ensurePaperSession(teacher.id, input);
  const entered = await enteredStudentIds(session.id);

  const skipped: ApplyReport["skipped"] = [];
  let studentsAdded = 0;
  let answersSaved = 0;

  for (const sheet of input.sheets) {
    const student = rosterById.get(sheet.studentId);
    // Roʻyxatda yoʻq id — mijozdan kelgan qiymat, jimgina yutilmaydi.
    if (!student) {
      skipped.push({ name: sheet.studentId, reason: "Sinf roʻyxatida topilmadi" });
      continue;
    }
    if (entered.has(student.id)) {
      skipped.push({ name: student.name, reason: "Varagʻi allaqachon kiritilgan" });
      continue;
    }

    /* Ishtirokchi qatori — onlayn qoʻshilgan bola bilan bir xil.
       Token hech kimga berilmaydi (varaq bilan javob berildi), lekin
       ustun `notNull`: bir martalik tasodifiy qiymat yoziladi va
       unutiladi. */
    const participantId = randomUUID();
    await db.insert(sessionParticipants).values({
      id: participantId,
      sessionId: session.id,
      studentId: student.id,
      displayName: student.name,
      tokenHash: hashParticipantToken(randomBytes(24).toString("base64url")),
      deviceLabel: `varaq ${student.no}`,
    });
    entered.add(student.id);
    studentsAdded += 1;

    const rows: (typeof responses.$inferInsert)[] = [];
    for (const [key, letter] of Object.entries(sheet.answers)) {
      // Boʻsh katak — javob YOʻQ, xato emas: qator umuman yozilmaydi.
      if (!letter) continue;
      const question = byNo.get(Number(key));
      if (!question || !question.itemId) continue;

      const index = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
      // `X` (ikki katak) yoki chizilmagan variant → mavjud boʻlmagan
      // tanlov: `scoreResponse()` uni XATO deb baholaydi, boʻsh deb
      // emas. Bola javob bergan, lekin noaniq.
      const optionId = index >= 0 ? (question.optionIds[index] ?? "") : "";
      const answer = { optionId, omr: letter };

      const { isCorrect, score } = scoreResponse({
        shape: question.shape as Parameters<typeof scoreResponse>[0]["shape"],
        grading: question.grading as Parameters<typeof scoreResponse>[0]["grading"],
        content: question.content,
        ordinal: question.ordinal,
        itemId: question.itemId,
        answer,
      });

      rows.push({
        id: randomUUID(),
        teacherId: question.teacherId,
        sessionId: session.id,
        participantId,
        studentId: student.id,
        activityId: question.activityId,
        itemId: question.itemId,
        itemVersion: question.version,
        attemptNo: 1,
        answer,
        isCorrect,
        score: score === null ? null : score.toFixed(3),
        standardId: question.standardId,
        source: question.source,
      });
    }

    /* Bitta INSERT — savol boniga alohida soʻrov emas.

       `submitResponse()` zanjiri onlayn javob uchun yozilgan: u bitta
       javobni oladi, urinish raqamini sanaydi va sessiya holatini
       tekshiradi. Varaqda esa 20-30 javob BIRDANIGA keladi va
       ishtirokchi shu topshiriqda birinchi marta javob beradi
       (`attemptNo = 1` — takror kiritish yuqorida toʻxtatilgan).
       Ballash baribir bitta joyda: `scoreResponse()`. */
    if (rows.length > 0) {
      await db.insert(responses).values(rows).onConflictDoNothing();
      answersSaved += rows.length;
    }
  }

  return { sessionId: session.id, studentsAdded, answersSaved, skipped };
}

/** Qogʻoz sessiyasi — bor boʻlsa oʻshaniki, yoʻq boʻlsa yangisi.

    Sessiya `running` holatda turadi: qolgan varaqlar ertaga
    kiritilishi mumkin. Yopishni oʻqituvchi jurnalga koʻchirish
    paytida oʻzi hal qiladi. */
async function ensurePaperSession(
  teacherId: string,
  input: { setId: string; classId: string }
): Promise<QuizSessionRow> {
  const existing = await findPaperSession(teacherId, input.setId, input.classId);
  if (existing) {
    if (existing.state === "running") return existing;
    const [row] = await db
      .update(quizSessions)
      .set({
        state: "running",
        openedAt: existing.openedAt ?? new Date(),
        closedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(quizSessions.id, existing.id))
      .returning();
    return row;
  }

  const set = await loadSetItems(input.setId);
  const [row] = await db
    .insert(quizSessions)
    .values({
      id: randomUUID(),
      teacherId,
      setId: input.setId,
      classId: input.classId,
      mode: "paper",
      title: set.title,
      state: "running",
      openedAt: new Date(),
      // Qogʻoz sessiyasiga hech kim havola bilan qoʻshilmaydi, lekin
      // `join_code` oʻqituvchi uni roʻyxatda tanib oladigan belgi (R49).
      joinCode: null,
    })
    .returning();
  return row;
}

/** Toʻplam qatori — egalik tekshiruvi bilan (`getSet` ichida). */
async function loadSetItems(setId: string) {
  const set = await getSet(setId);
  if (!set) throw new Error("Test topilmadi");
  return { title: set.title, setItems: set.items };
}
