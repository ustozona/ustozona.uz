import { getMobileToday, isDateKey } from "@/server/dal/mobile-teacher";
import { mobileError, requireBearer } from "../_errors";

/* GET /api/mobile/v1/today?date=YYYY-MM-DD — `Authorization: Bearer`.
   Ustozning shu kungi darslari (jadvaldan) va faol sinflari. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const date = new URL(request.url).searchParams.get("date");
  if (!isDateKey(date)) return Response.json({ error: "bad_date" }, { status: 400 });
  try {
    const today = await getMobileToday(date);
    return Response.json(today, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "today");
  }
}
