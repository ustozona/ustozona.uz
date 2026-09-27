import { z } from "zod";
import { getMobileAttendance, isDateKey, setMobileAttendance } from "@/server/dal/mobile-teacher";
import { mobileError, requireBearer } from "../_errors";

/* GET  /api/mobile/v1/attendance?classId=…&date=YYYY-MM-DD — roʻyxat va belgilar.
   POST /api/mobile/v1/attendance {classId, date, marks:[{studentId,status}]}.
   Ikkalasi ham `Authorization: Bearer`; ruxsat — saytdagi DAL tekshiruvlari. */

export const dynamic = "force-dynamic";

const id = z.string().min(1).max(200);
const bodySchema = z.object({
  classId: id,
  date: z.string().refine((v) => isDateKey(v)),
  marks: z.array(z.object({ studentId: id, status: z.string().min(1).max(100) })).max(500),
});

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const classId = params.get("classId");
  const date = params.get("date");
  if (!classId || classId.length > 200 || !isDateKey(date)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const sheet = await getMobileAttendance(classId, date);
    return Response.json(sheet, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "attendance.get");
  }
}

export async function POST(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { classId, date, marks } = parsed.data;
  try {
    await setMobileAttendance(classId, date, marks);
    const sheet = await getMobileAttendance(classId, date);
    return Response.json(sheet, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "attendance.post");
  }
}
