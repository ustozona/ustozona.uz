"use server";

import { z } from "zod";
import {
  assignBankTest, bankFacets, bankTestQuestions, listBankTests,
} from "@/server/dal/test-bank";
import { BANK_TIERS } from "@/lib/test-bank-types";
import type {
  AssignBankTestResult, BankFacets, BankPage, BankPreview, BankTier,
} from "@/lib/test-bank-types";

/* ⛔ BU FAYLDA `export type { … }` YOZMANG.

   `"use server"` modulida tip-reeksporti Turbopack tomonidan RUNTIME
   eksportga aylantiriladi va BARCHA Server Action'lar bitta chunkda
   qulaydi (`ReferenceError`). Turlar `@/lib/test-bank-types` da —
   client komponentlar ham OʻSHA YERDAN import qiladi.
   Batafsil: AGENTS.md. */

const tierSchema = z.enum(BANK_TIERS);

const querySchema = z.object({
  classId: z.string().min(1),
  tier: tierSchema,
  // `null` — filtr yoʻq; `""` — ataylab «fansiz/sinfsiz». Ikkalasi
  // BOSHQA maʼno, shuning uchun `""` boʻsh deb tashlanmaydi.
  subject: z.string().max(120).nullable().optional(),
  grade: z.string().max(60).nullable().optional(),
  search: z.string().max(120).nullable().optional(),
  page: z.number().int().min(0).max(500).optional(),
});

export async function listBankTestsAction(
  input: z.input<typeof querySchema>
): Promise<BankPage> {
  const q = querySchema.parse(input);
  return listBankTests(q.classId, {
    tier: q.tier,
    subject: q.subject,
    grade: q.grade,
    search: q.search,
    page: q.page,
  });
}

export async function bankFacetsAction(tier: BankTier): Promise<BankFacets> {
  return bankFacets(tierSchema.parse(tier));
}

const assignSchema = z.object({
  // LessonLab `bot_tests.id` — SERIAL, yaʼni musbat butun son.
  testId: z.number().int().positive(),
  // Koʻp sinf: bitta testni 8A, 8B, 8D ga bir bosishda berish.
  // Chegara 40 — bitta oʻqituvchida bundan koʻp sinf boʻlmaydi, va u
  // tasodifiy/zararli katta roʻyxatni toʻxtatadi (har sinf = alohida
  // toʻplam + savollar, yaʼni haqiqiy yozuv hajmi).
  classIds: z.array(z.string().min(1)).min(1).max(40),
  /** «Berish va boshlash» — sessiya ham darhol ochiladi. */
  startSession: z.boolean().optional(),
});

export async function assignBankTestAction(
  input: z.input<typeof assignSchema>
): Promise<AssignBankTestResult> {
  const { testId, classIds, startSession } = assignSchema.parse(input);
  // Takroriy sinf id'si — bir sinfga ikkita toʻplam yaratardi va
  // ikkinchisi `unique_violation` bilan yiqilardi.
  return assignBankTest(testId, [...new Set(classIds)], { startSession });
}

export async function bankTestQuestionsAction(testId: number): Promise<BankPreview> {
  return bankTestQuestions(z.number().int().positive().parse(testId));
}
