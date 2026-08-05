import { previewOmrScan } from "@/server/dal/baholash-scan";
import { isConfigured, LessonLabError } from "@/server/lessonlab/baholash";
import { UnauthorizedError } from "@/server/session";
import { verifyScanTicket } from "@/server/baholash/scan-ticket";

/* ════════════════════════════════════════════════════════════════════
   POST /api/baholash/scan   (multipart: image + setId + classId)

   Varaq surati → oʻqilgan javoblar. HECH NARSA YOZILMAYDI — bu faqat
   koʻrib chiqish qadami. Yozish `applyOmrScanAction()` da, oʻqituvchi
   ekrandagi natijani tasdiqlagandan keyin.

   NEGA SERVER ACTION EMAS: kirish — binar rasm. Server action argumenti
   JSON boʻlib serializatsiya qilinadi, yaʼni rasm base64 ga aylanib
   hajmi ~33% oshardi. Route handler `FormData` ni xom holda oladi.

   ⚠️ HAJM: Vercel serverless soʻrov tanasi ~4.5 MB bilan cheklangan,
   telefon surati esa bemalol 5-8 MB boʻladi. Shuning uchun mijoz
   rasmni yuborishdan oldin kichraytiradi (`ScanPanel.tsx`), bu yerda
   esa faqat oxirgi himoya chegarasi turadi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
/* Rasm ogʻir, LessonLab dvigateli sekin — standart 10 soniya yetmaydi. */
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png"];

export async function POST(request: Request) {
  if (!isConfigured()) {
    return Response.json(
      { ok: false, error: "not_configured", message: "LessonLab dvigateli sozlanmagan" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ ok: false, error: "invalid_form" }, { status: 400 });
  }

  /* Kimlik ikki yoʻldan kelishi mumkin:

       cookie sessiyasi  — noutbukdagi oʻqituvchi (odatdagi yoʻl)
       chipta            — telefondagi sahifa, u yerda cookie YOʻQ

     Chipta boʻlsa test/sinf ham OʻSHANDAN olinadi, formadan emas:
     aks holda chiptasi bor odam boshqa testga javob yozardi. */
  const rawTicket = String(form.get("ticket") ?? "");
  const ticket = rawTicket ? verifyScanTicket(rawTicket) : null;
  if (rawTicket && !ticket) {
    return Response.json(
      { ok: false, error: "bad_ticket", message: "Havola eskirgan — QR ni qaytadan oching" },
      { status: 401 }
    );
  }

  const setId = ticket?.setId ?? String(form.get("setId") ?? "");
  const classId = ticket?.classId ?? String(form.get("classId") ?? "");
  const file = form.get("image");
  if (!setId || !classId) {
    return Response.json({ ok: false, error: "set_and_class_required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "image_required" }, { status: 400 });
  }

  const contentType = file.type || "image/jpeg";
  if (!ALLOWED.includes(contentType)) {
    return Response.json(
      { ok: false, error: "bad_type", message: "Faqat JPEG yoki PNG surat" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      {
        ok: false,
        error: "too_large",
        message: "Surat juda katta — kichikroq sifatda qayta suratga oling",
      },
      { status: 413 }
    );
  }

  try {
    const preview = await previewOmrScan({
      setId,
      classId,
      image: new Uint8Array(await file.arrayBuffer()),
      contentType,
      actorId: ticket?.teacherId,
    });
    return Response.json({ ok: true, preview }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof LessonLabError) {
      // Dvigatel xatosi oʻz holicha oʻtadi: «varaq kadrga sigʻmagan»
      // bilan «xizmat oʻchiq» ni farqlash oʻqituvchiga kerak.
      return Response.json(
        { ok: false, error: err.code, message: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Varaq oʻqilmadi";
    return Response.json({ ok: false, error: "failed", message }, { status: 400 });
  }
}
