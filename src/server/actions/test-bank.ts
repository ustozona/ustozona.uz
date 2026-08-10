"use server";

import { z } from "zod";
import {
  assignBankTest, bankFacets, listBankTests,
} from "@/server/dal/test-bank";
import { BANK_TIERS } from "@/lib/test-bank-types";
import type {
  AssignBankTestResult, BankFacets, BankPage, BankTier,
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
  classId: z.string().min(1),
});

export async function assignBankTestAction(
  input: z.input<typeof assignSchema>
): Promise<AssignBankTestResult> {
  const { testId, classId } = assignSchema.parse(input);
  return assignBankTest(testId, classId);
}
