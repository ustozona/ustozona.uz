"use server";

import { z } from "zod";
import { createBank, listBanks } from "@/server/dal/assess/banks";
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
  type ActivityWithItems,
} from "@/server/dal/assess/activities";
import {
  createSet,
  deleteSet,
  getSet,
  getSetMeta,
  listSets,
  listSetsWithPublishState,
  updateSet,
  type SetMeta,
  type SetPublishState,
} from "@/server/dal/assess/sets";
import type { ActivityBankRow, ActivityRow, ActivitySetRow } from "@/server/db/schema";

/* MCQ savol muharriri — yupqa qatlam: zod-parse → DAL. */

const mcqOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(500),
  isCorrect: z.boolean(),
});

const mcqFormSchema = z.object({
  bankId: z.string().min(1).optional(),
  standardId: z.string().optional(),
  title: z.string().min(1).max(200),
  stem: z.string().min(1).max(2000),
  options: z.array(mcqOptionSchema).min(2).max(8),
});

export type McqFormValues = z.infer<typeof mcqFormSchema>;

function assertAtLeastOneCorrect(options: McqFormValues["options"]) {
  if (!options.some((o) => o.isCorrect)) {
    throw new Error("Kamida bitta toʻgʻri variant belgilanishi kerak");
  }
}

export async function listMyBanksAction(): Promise<ActivityBankRow[]> {
  return listBanks();
}

export async function createBankAction(name: string): Promise<ActivityBankRow> {
  return createBank({ name });
}

export async function listMcqActivitiesAction(bankId?: string): Promise<ActivityRow[]> {
  const all = await listActivities(bankId);
  return all.filter((a) => a.shape === "mcq");
}

/** Barcha shakl (mcq + pairs) — Baholash roʻyxati uchun. */
export async function listAllActivitiesAction(bankId?: string): Promise<ActivityRow[]> {
  return listActivities(bankId);
}

export async function getMcqActivityAction(id: string): Promise<ActivityWithItems | null> {
  return getActivity(id);
}

export async function createMcqActivityAction(input: McqFormValues): Promise<ActivityWithItems> {
  const parsed = mcqFormSchema.parse(input);
  assertAtLeastOneCorrect(parsed.options);
  return createActivity({
    bankId: parsed.bankId,
    standardId: parsed.standardId,
    shape: "mcq",
    title: parsed.title,
    grading: "exact",
    items: [{ content: { stem: parsed.stem, options: parsed.options } }],
  });
}

export async function updateMcqActivityAction(
  id: string,
  input: McqFormValues
): Promise<ActivityWithItems> {
  const parsed = mcqFormSchema.parse(input);
  assertAtLeastOneCorrect(parsed.options);
  return updateActivity(id, {
    title: parsed.title,
    standardId: parsed.standardId,
    items: [{ content: { stem: parsed.stem, options: parsed.options } }],
  });
}

export async function deleteMcqActivityAction(id: string): Promise<void> {
  await deleteActivity(id);
}

/* Pairs (moslashtirish) muharriri — DragBoard oilasidagi birinchi shakl (B2). */

const pairRowSchema = z.object({
  id: z.string().min(1),
  left: z.string().min(1).max(300),
  right: z.string().min(1).max(300),
});

const pairsFormSchema = z.object({
  bankId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  pairs: z.array(pairRowSchema).min(2).max(20),
});

export type PairsFormValues = z.infer<typeof pairsFormSchema>;

export async function createPairsActivityAction(input: PairsFormValues): Promise<ActivityWithItems> {
  const parsed = pairsFormSchema.parse(input);
  return createActivity({
    bankId: parsed.bankId,
    shape: "pairs",
    title: parsed.title,
    grading: "exact",
    items: parsed.pairs.map((p) => ({ content: { left: p.left, right: p.right } })),
  });
}

export async function updatePairsActivityAction(
  id: string,
  input: PairsFormValues
): Promise<ActivityWithItems> {
  const parsed = pairsFormSchema.parse(input);
  return updateActivity(id, {
    title: parsed.title,
    items: parsed.pairs.map((p) => ({ content: { left: p.left, right: p.right } })),
  });
}

/* Toʻplam (activity_sets) — savollarni sinfga test sifatida biriktiradi. */

const createSetFormSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(1).max(200),
  purpose: z.enum(["formative", "summative"]),
  activityIds: z.array(z.string().min(1)).min(1),
});

export type CreateSetFormValues = z.infer<typeof createSetFormSchema>;

export async function listSetsAction(classId?: string): Promise<ActivitySetRow[]> {
  return listSets(classId);
}

/** Sinf testlari + har biri jurnalga chiqqanmi.

    Topshiriqlar sahifasi shu bilan «tuzilgan, lekin hali nashr
    qilinmagan» testlarni koʻrsatadi — aks holda test tuzilgandan keyin
    oʻsha sahifada hech narsa koʻrinmasdi (`listSetsWithPublishState`
    izohiga qarang). */
export async function listSetsWithPublishStateAction(
  classId?: string
): Promise<SetPublishState[]> {
  return listSetsWithPublishState(classId);
}

/** Topshiriqqa biriktirilgan toʻplamning pasporti (nom · savol soni ·
    maks. ball) — muharrirdagi mazmun kartasi shu bilan chiziladi. */
export async function getSetMetaAction(setId: string): Promise<SetMeta | null> {
  return getSetMeta(setId);
}

/** Toʻliq toʻplam qatori — sessiya paneli `classId` va `items` ni talab
    qiladi, topshiriqda esa faqat `setId` bor. */
export async function getSetAction(setId: string): Promise<ActivitySetRow | null> {
  return getSet(setId);
}

export async function createSetAction(input: CreateSetFormValues): Promise<ActivitySetRow> {
  const parsed = createSetFormSchema.parse(input);
  return createSet({
    classId: parsed.classId,
    title: parsed.title,
    purpose: parsed.purpose,
    items: parsed.activityIds.map((activityId) => ({ activityId, role: "check" as const })),
  });
}

export async function deleteSetAction(id: string): Promise<void> {
  await deleteSet(id);
}

/* ════════════════════════════════════════════════════════════════════
   TOʻPLAM BUILDER — Kahoot uslubidagi muharrir uchun BITTA amal.

   Muharrirda toʻplam HUJJAT: savollar uning ichida yashaydi, alohida
   roʻyxat yoʻq. Shu sababli mijoz butun qoralamani mahalliy holatda
   tutadi va "Saqlash" bosilganda hammasi bir amalda yoziladi — yarim
   yaratilgan `activities` qatorlari qolib ketmaydi.

   Per-savol sozlamalar (vaqt, ball, koʻp tanlov) `activities.config`
   ichida; karta uslubi butun toʻplamga tegishli — `activity_sets.config`.
   Ikkalasi ham `jsonb`, migratsiya kerak emas.
   ════════════════════════════════════════════════════════════════════ */

const draftQuestionSchema = z.object({
  /** Mavjud savol — yangilanadi. Boʻsh boʻlsa yangi `activity` yaratiladi. */
  activityId: z.string().min(1).optional(),
  shape: z.enum(["mcq", "pairs"]),
  title: z.string().min(1).max(200),
  stem: z.string().max(2000),
  options: z.array(mcqOptionSchema),
  pairs: z.array(pairRowSchema),
  timeLimitSec: z.number().int().min(5).max(300),
  pointsMode: z.enum(["standard", "double", "none"]),
  /** `true` — bir nechta toʻgʻri variant kutiladi. */
  multiSelect: z.boolean(),
  /** Javob kartalari joylashuvi: 2x2 katak yoki vertikal roʻyxat. */
  answerLayout: z.enum(["grid", "list"]).default("grid"),
});

export type DraftQuestionValues = z.infer<typeof draftQuestionSchema>;

const saveSetDraftSchema = z.object({
  /** Boʻsh — yangi toʻplam yaratiladi. */
  setId: z.string().min(1).optional(),
  classId: z.string().min(1),
  title: z.string().min(1).max(200),
  purpose: z.enum(["formative", "summative"]),
  /** Sahna foni — muharrirdagi 16:9 maydon va jonli ekran uchun. */
  stageTheme: z.string().min(1).max(40).default("neutral"),
  questions: z.array(draftQuestionSchema).min(1),
});

export type SaveSetDraftValues = z.infer<typeof saveSetDraftSchema>;

export type SetDraft = {
  set: ActivitySetRow;
  questions: DraftQuestionValues[];
};

function validateDraftQuestion(q: DraftQuestionValues, index: number) {
  const label = `${index + 1}-savol`;
  if (q.shape === "mcq") {
    if (q.options.length < 2) throw new Error(`${label}: kamida 2 ta variant kerak`);
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct === 0) throw new Error(`${label}: toʻgʻri variant belgilanmagan`);
    if (!q.multiSelect && correct > 1) {
      throw new Error(`${label}: bitta tanlovda faqat bitta toʻgʻri variant boʻladi`);
    }
    return;
  }
  if (q.pairs.length < 2) throw new Error(`${label}: kamida 2 ta juftlik kerak`);
}

/** Qoralama savolni DAL kutayotgan `items` shakliga oʻgiradi. */
function draftItems(q: DraftQuestionValues) {
  return q.shape === "mcq"
    ? [{ content: { stem: q.stem, options: q.options } }]
    : q.pairs.map((p) => ({ content: { left: p.left, right: p.right } }));
}

function draftConfig(q: DraftQuestionValues) {
  return {
    timeLimitSec: q.timeLimitSec,
    pointsMode: q.pointsMode,
    multiSelect: q.multiSelect,
    answerLayout: q.answerLayout,
  };
}

/** Muharrirni ochish — toʻplam + uning savollari toʻliq holda. */
export async function getSetDraftAction(setId: string): Promise<SetDraft | null> {
  const set = await getSet(setId);
  if (!set) return null;

  const loaded = await Promise.all(set.items.map((item) => getActivity(item.activityId)));
  const questions: DraftQuestionValues[] = [];

  for (const activity of loaded) {
    if (!activity) continue; // oʻchirilgan savol — jimgina tashlab ketiladi
    const config = activity.config as Partial<ReturnType<typeof draftConfig>>;
    const base = {
      activityId: activity.id,
      title: activity.title,
      timeLimitSec: config.timeLimitSec ?? 20,
      pointsMode: config.pointsMode ?? ("standard" as const),
      answerLayout: config.answerLayout ?? ("grid" as const),
    };

    if (activity.shape === "pairs") {
      questions.push({
        ...base,
        shape: "pairs",
        stem: "",
        options: [],
        multiSelect: false,
        pairs: activity.items.map((item) => ({
          id: item.id,
          ...(item.content as { left: string; right: string }),
        })),
      });
      continue;
    }

    const content = activity.items[0]?.content as
      | { stem: string; options: McqFormValues["options"] }
      | undefined;
    const options = content?.options ?? [];
    questions.push({
      ...base,
      shape: "mcq",
      stem: content?.stem ?? "",
      options,
      pairs: [],
      multiSelect: config.multiSelect ?? options.filter((o) => o.isCorrect).length > 1,
    });
  }

  return { set, questions };
}

/**
 * Butun qoralamani saqlaydi: savollarni yaratadi/yangilaydi, toʻplamdan
 * olib tashlangan savollarni oʻchiradi, soʻng toʻplamning oʻzini yozadi.
 */
export async function saveSetDraftAction(input: SaveSetDraftValues): Promise<SetDraft> {
  const parsed = saveSetDraftSchema.parse(input);
  parsed.questions.forEach(validateDraftQuestion);

  const previous = parsed.setId ? await getSet(parsed.setId) : null;
  if (parsed.setId && !previous) throw new Error("Toʻplam topilmadi yoki sizga tegishli emas");

  const saved = await Promise.all(
    parsed.questions.map(async (q) => {
      const payload = {
        title: q.title,
        grading: "exact" as const,
        config: draftConfig(q),
        items: draftItems(q),
      };
      if (q.activityId) return updateActivity(q.activityId, payload);
      return createActivity({ ...payload, shape: q.shape });
    })
  );

  // Toʻplamdan chiqarilgan savollar bu yerda faqat shu toʻplamga tegishli —
  // muharrir bank qayta ishlatishini hali qoʻllab-quvvatlamaydi.
  const keptIds = new Set(saved.map((a) => a.id));
  const removed = (previous?.items ?? []).filter((item) => !keptIds.has(item.activityId));
  await Promise.all(removed.map((item) => deleteActivity(item.activityId)));

  const setPayload = {
    title: parsed.title,
    purpose: parsed.purpose,
    items: saved.map((a) => ({ activityId: a.id, role: "check" as const })),
    config: {
      ...(previous?.config ?? {}),
      stageTheme: parsed.stageTheme,
    },
  };

  const set = previous
    ? await updateSet(previous.id, setPayload)
    : await createSet({ ...setPayload, classId: parsed.classId });

  return {
    set,
    questions: parsed.questions.map((q, index) => ({ ...q, activityId: saved[index].id })),
  };
}
