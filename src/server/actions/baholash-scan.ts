"use server";

import { z } from "zod";
import { applyOmrScan, type ApplyReport } from "@/server/dal/baholash-scan";

/* Qogʻoz varaqni jurnalga kiritish — yupqa qatlam: zod-parse → DAL.

   Oʻqish (`/api/baholash/scan`) va yozish (shu yerda) ATAYLAB ajratilgan:
   surat oʻqilishi bilan hech narsa yozilmaydi. Oradagi qadam —
   oʻqituvchining koʻzi: QR raqami toʻgʻri bolaga tushganini faqat u
   tasdiqlay oladi (sinf roʻyxati chop etilgandan keyin oʻzgargan
   boʻlishi mumkin). */

const schema = z.object({
  setId: z.string().min(1),
  classId: z.string().min(1),
  sheets: z
    .array(
      z.object({
        studentId: z.string().min(1),
        // Savol raqami → `A`..`D` | `X` | null (boʻsh).
        answers: z.record(z.string(), z.string().nullable()),
      })
    )
    .min(1)
    // Bitta suratda 4 tagacha varaq, oʻqituvchi bir necha suratni
    // yigʻishi mumkin — lekin cheksiz emas: bitta soʻrov bitta sinfdan
    // oshmasin.
    .max(60),
});

export async function applyOmrScanAction(input: z.infer<typeof schema>): Promise<ApplyReport> {
  return applyOmrScan(schema.parse(input));
}
