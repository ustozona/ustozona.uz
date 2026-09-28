import { getMobileSync, isDateKey } from "@/server/dal/mobile-teacher";
import { mobileError, requireBearer } from "../_errors";

/* GET /api/mobile/v1/sync?date=YYYY-MM-DD — offline ilova uchun toʻliq
   surʼat (sinflar, roʻyxatlar, jadval, davomat, jurnal, xulq). */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const date = new URL(request.url).searchParams.get("date");
  if (!isDateKey(date)) return Response.json({ error: "bad_date" }, { status: 400 });
  try {
    return Response.json(await getMobileSync(date), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "sync");
  }
}
