import { z } from "zod";

/* Student notes sync batch — client diff ↔ server action shartnomasi.
   Append-only: itemsDelete faqat qoʻlda oʻchirishga eshik ochib qoʻyadi
   (hozircha UI'da yoʻq), tasks/feedback bilan bir xil shartnoma shakli. */

const id = z.string().min(1).max(200);

export const studentNoteUpsertSchema = z.object({
  id,
  studentId: id,
  title: z.string().min(1).max(200).nullable(),
  text: z.string().min(1).max(2000),
  tags: z.array(z.string().min(1).max(40)).max(12),
  color: z.string().min(1).max(20).nullable(),
  visibility: z.enum(["teachers", "guardians"]),
  createdAt: z.string(),
});

export const studentNotesBatchSchema = z.object({
  itemsUpsert: z.array(studentNoteUpsertSchema).max(500),
  itemsDelete: z.array(id).max(500),
});

export type StudentNoteUpsert = z.infer<typeof studentNoteUpsertSchema>;
export type StudentNotesBatch = z.infer<typeof studentNotesBatchSchema>;

export function emptyStudentNotesBatch(): StudentNotesBatch {
  return { itemsUpsert: [], itemsDelete: [] };
}

export function isEmptyStudentNotesBatch(b: StudentNotesBatch): boolean {
  return b.itemsUpsert.length === 0 && b.itemsDelete.length === 0;
}
