import { z } from "zod";
import { requireTeacher } from "@/server/session";
import { buildSheetPlan } from "@/server/dal/baholash-sheets";
import { mobileError, requireBearer } from "../../_errors";

/* POST /api/mobile/v1/remote/roster {setId, classId} — `Authorization: Bearer`.

   Ilovaning QR-karta kamerasi uchun sinf roʻyxati: karta raqami → ism
   (kamerada «Ali · B»). Brauzer pultidagi `remoteScanTicketAction` bilan
   bir manba (`buildSheetPlan`), lekin egalik pult chiptasidan emas —
   Bearer sessiyadagi oʻqituvchidan tekshiriladi: test va sinf shu
   oʻqituvchiniki boʻlmasa 404.

   Faqat tartib raqami va ism — oʻquvchi id, toʻgʻri javob va baho
   telefonga YUBORILMAYDI (baho Doskada hisoblanadi). */

export const dynamic = "force-dynamic";

const id = z.string().min(1).max(200);
const bodySchema = z.object({ setId: id, classId: id });

export async function POST(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    const teacher = await requireTeacher();
    let plan;
    try {
      plan = await buildSheetPlan(parsed.data.setId, parsed.data.classId, teacher.id);
    } catch {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    return Response.json(
      {
        title: plan.title,
        className: plan.className,
        questionCount: plan.questionCount,
        roster: plan.roster.map((r) => ({ no: r.no, name: r.name })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return mobileError(err, "remote.roster");
  }
}
