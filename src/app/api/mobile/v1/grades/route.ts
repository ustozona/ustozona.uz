import { z } from "zod";
import { createMobileColumn, getMobileGrades, isDateKey, setMobileGrades } from "@/server/dal/mobile-teacher";
import { mobileError, requireBearer } from "../_errors";

/* GET  /api/mobile/v1/grades?classId=…[&columnId=…] — ustunlar va baholar.
   POST /api/mobile/v1/grades {classId, columnId?|newColumn?, scores}
   Ikkalasi ham `Authorization: Bearer`; ruxsat — saytdagi DAL. */

export const dynamic = "force-dynamic";

const id = z.string().min(1).max(200);
const bodySchema = z.object({
  classId: id,
  columnId: id.optional(),
  newColumn: z
    .object({
      title: z.string().trim().min(1).max(300),
      maxScore: z.number().int().min(1).max(1000),
      date: z.string().refine((v) => isDateKey(v)),
    })
    .optional(),
  scores: z.array(z.object({ studentId: id, score: z.number().min(0).max(1000).nullable() })).max(500),
});

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const classId = params.get("classId");
  const columnId = params.get("columnId");
  if (!classId || classId.length > 200 || (columnId && columnId.length > 200)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    return Response.json(await getMobileGrades(classId, columnId), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "grades.get");
  }
}

export async function POST(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { classId, columnId, newColumn, scores } = parsed.data;
  if (!columnId && !newColumn) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    const target = columnId ?? (await createMobileColumn(classId, newColumn!.title, newColumn!.maxScore, newColumn!.date));
    await setMobileGrades(classId, target, scores);
    return Response.json(await getMobileGrades(classId, target), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "grades.post");
  }
}
