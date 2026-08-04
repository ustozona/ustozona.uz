import { auditPublishedGrades, repairPercentGrades } from "@/server/dal/admin/grades-audit";
import { ForbiddenError, UnauthorizedError } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   GET  /api/admin/grades-audit    — faqat oʻqish, hisobot
   POST /api/admin/grades-audit    — tuzatish (body: { confirm: "TUZAT" })

   Nega oddiy route handler, server action emas: buni admin brauzer
   manzil qatoridan ochib koʻra olishi kerak — vosita bir martalik va
   unga alohida ekran qurish ortiqcha.

   Nega tuzatish POST va tasdiq soʻzi bilan:
     • GET boʻlsa brauzer, proksi yoki havolani oldindan yuklaydigan
       har qanday narsa uni OʻZI chaqirib yuborardi — jurnal esa
       tasodifan oʻzgarardi.
     • `confirm` maydoni — noaniq bosishdan himoya. Tasodifiy POST
       (masalan eski yorliqdan) hech narsa qilmaydi.

   Ruxsat `requireAdmin()` da (DAL ichida) — super-admin. Bu yerda
   qayta tekshirilmaydi, aks holda qoida ikki joyda boʻlib, biri
   ikkinchisidan ortda qolardi.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";

function fail(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const message = err instanceof Error ? err.message : "Xatolik";
  return Response.json({ ok: false, error: "failed", message }, { status: 500 });
}

export async function GET() {
  try {
    return Response.json({ ok: true, audit: await auditPublishedGrades() });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request: Request) {
  let body: { confirm?: unknown };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (body.confirm !== "TUZAT") {
    return Response.json(
      {
        ok: false,
        error: "confirm_required",
        message: 'Tuzatish uchun tanada {"confirm":"TUZAT"} boʻlishi shart.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await repairPercentGrades();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return fail(err);
  }
}
