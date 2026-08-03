"use server";

import { z } from "zod";
import { joinByCode, listRosterByCode, type JoinResult } from "@/server/dal/play/join";
import { getSessionContent, type PlaySessionContent } from "@/server/dal/play/content";
import { submitResponse, type SubmitResponseInput } from "@/server/dal/play/responses";
import { gameShellUrl } from "@/server/lessonlab/baholash";

/* Ishtirokchi (akkauntsiz) tomon — yupqa qatlam: zod-parse → DAL.
   `requireTeacher()` HECH QACHON bu faylda ishlatilmaydi. */

const joinSchema = z.object({
  joinCode: z.string().min(4).max(10),
  studentId: z.string().min(1).nullable(),
  displayName: z.string().min(1).max(100),
});

export async function joinSessionAction(input: z.infer<typeof joinSchema>): Promise<JoinResult> {
  const parsed = joinSchema.parse(input);
  return joinByCode(parsed.joinCode, parsed.studentId, parsed.displayName);
}

export async function listRosterByCodeAction(joinCode: string): Promise<{ id: string; name: string }[]> {
  return listRosterByCode(joinCode);
}

export async function getSessionContentAction(token: string): Promise<PlaySessionContent> {
  return getSessionContent(token);
}

const submitSchema = z.object({
  token: z.string().min(1),
  itemId: z.string().min(1),
  answer: z.record(z.string(), z.unknown()),
  elapsedMs: z.number().optional(),
});

export async function submitResponseAction(
  input: z.infer<typeof submitSchema>
): Promise<{ isCorrect: boolean | null }> {
  const parsed = submitSchema.parse(input) as SubmitResponseInput;
  const row = await submitResponse(parsed);
  return { isCorrect: row?.isCorrect ?? null };
}

/** Oʻyin qobigʻining toʻliq havolasi — qobiq boshqa domenda turadi,
    uning manzili faqat serverda (env) maʼlum.

    `null` qaytsa — qobiq sozlanmagan yoki notoʻgʻri nom berilgan;
    chaqiruvchi oddiy ekranda davom etadi. Sessiya baribir ishlaydi:
    oʻyin — qobiq, majburiy emas. */
export async function gameShellUrlAction(input: {
  shellId: string;
  token: string;
  origin: string;
}): Promise<string | null> {
  const parsed = z
    .object({
      shellId: z.string().min(1).max(50),
      token: z.string().min(1),
      origin: z.string().url(),
    })
    .parse(input);
  return gameShellUrl(parsed);
}
