"use server";

import { z } from "zod";
import { runAction } from "@/server/action-result";
import { ForbiddenError } from "@/server/session";
import { SessionStateError } from "@/server/dal/assess/sessions";
import { PublishError } from "@/server/dal/assess/publish";
import {
  closeRun,
  launchSetInfo,
  listClassRuns,
  publishRun,
  reopenRun,
  runMonitor,
  startRun,
} from "@/server/dal/assess/runs";
import { buildPultPlan } from "@/server/dal/baholash-scan";
import type { ActionResult } from "@/lib/action-result";
import type {
  LaunchSetInfo,
  PublishRunResult,
  PultPlan,
  RunMonitorData,
  RunSummary,
} from "@/lib/launch-types";

/* ════════════════════════════════════════════════════════════════════
   TOPSHIRIQLAR «BOSHLASH MARKAZI» — yupqa qatlam: zod → DAL.
   docs/topshiriq-boshlash-markazi.md.

   ⛔ BU FAYLDA `export type { … }` YOZMANG — tiplar `@/lib/launch-types`
   da (AGENTS.md: tip-reeksport prodda BARCHA Server Action'larni
   oʻldiradi).

   Hamma amal `ActionResult` qaytaradi, xato otmaydi: prodda Next otilgan
   xato matnini yashiradi va oʻqituvchi «Muddat oʻtgan», «Avval ishni
   yakunlang» kabi SABABNI koʻrmay qolardi (`lib/action-result.ts`).
   ════════════════════════════════════════════════════════════════════ */

/** Baholash yadrosining oʻz rad etish xatolari ham oʻqituvchiga koʻrinsin.
    Ularning matni ataylab oʻzbekcha foydalanuvchi jumlasi
    («Toʻplamda baholanadigan savol yoʻq»), ichki maʼlumot yoʻq —
    shuning uchun `ForbiddenError` ga oʻgiriladi. Boshqa har qanday xato
    (baza, tarmoq) avvalgidek yashirin qoladi (`server/action-result.ts`). */
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  return runAction(async () => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof PublishError || e instanceof SessionStateError) {
        throw new ForbiddenError(e.message);
      }
      throw e;
    }
  });
}

const id = z.string().min(1).max(100);
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Tanlangan test pasporti — «Qanday oʻtkazamiz?» ekrani uchun. */
export async function launchSetInfoAction(setId: string): Promise<ActionResult<LaunchSetInfo>> {
  return run(() => launchSetInfo(id.parse(setId)));
}

const startSchema = z.object({
  setId: id,
  classId: id,
  kind: z.enum(["selfpaced", "homework", "game"]),
  dueDate: dateKey.optional(),
  shellId: z.string().min(1).max(50).optional(),
});

/** Bitta bosishda sessiya: mustaqil test, uy vazifasi yoki oʻyin. */
export async function startRunAction(
  input: z.input<typeof startSchema>,
): Promise<ActionResult<RunSummary>> {
  return run(() => startRun(startSchema.parse(input)));
}

/** Sinfning ochiq va natijasi kutilayotgan ishlari. */
export async function listClassRunsAction(classId: string): Promise<ActionResult<RunSummary[]>> {
  return run(() => listClassRuns(id.parse(classId)));
}

/** Natija ekrani — roʻyxat, foiz, jurnal nishoni. */
export async function runMonitorAction(sessionId: string): Promise<ActionResult<RunMonitorData>> {
  return run(() => runMonitor(id.parse(sessionId)));
}

export async function closeRunAction(sessionId: string): Promise<ActionResult<void>> {
  return run(() => closeRun(id.parse(sessionId)));
}

export async function reopenRunAction(sessionId: string): Promise<ActionResult<void>> {
  return run(() => reopenRun(id.parse(sessionId)));
}

const publishSchema = z.object({
  sessionId: id,
  /** `undefined` — ustunning oʻz toifasi; `null` — «Toifasiz». */
  topicId: id.nullable().optional(),
});

export async function publishRunAction(
  input: z.input<typeof publishSchema>,
): Promise<ActionResult<PublishRunResult>> {
  return run(() => {
    const parsed = publishSchema.parse(input);
    return publishRun(parsed.sessionId, parsed.topicId);
  });
}

const pultSchema = z.object({ setId: id, classId: id });

/** Pult rejimi: roʻyxat + varaq raqamlanishidagi savollar. */
export async function pultPlanAction(
  input: z.input<typeof pultSchema>,
): Promise<ActionResult<PultPlan>> {
  return run(() => {
    const parsed = pultSchema.parse(input);
    return buildPultPlan(parsed.setId, parsed.classId);
  });
}
