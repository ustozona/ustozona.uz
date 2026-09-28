import { z } from "zod";
import { getMobileBehavior, giveMobileBehavior, isDateKey } from "@/server/dal/mobile-teacher";
import { mobileError, requireBearer } from "../_errors";

/* GET  /api/mobile/v1/behavior?classId=… — koʻnikmalar va oʻquvchi ballari.
   POST /api/mobile/v1/behavior {classId, skillId, studentIds, date}.
   Ikkalasi ham `Authorization: Bearer`; ruxsat — saytdagi DAL. */

export const dynamic = "force-dynamic";

const id = z.string().min(1).max(200);
const bodySchema = z.object({
  classId: id,
  skillId: id,
  studentIds: z.array(id).min(1).max(200),
  date: z.string().refine((v) => isDateKey(v)),
});

export async function GET(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const classId = new URL(request.url).searchParams.get("classId");
  if (!classId || classId.length > 200) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    return Response.json(await getMobileBehavior(classId), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "behavior.get");
  }
}

export async function POST(request: Request) {
  const denied = requireBearer(request);
  if (denied) return denied;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { classId, skillId, studentIds, date } = parsed.data;
  try {
    await giveMobileBehavior(classId, skillId, studentIds, date);
    return Response.json(await getMobileBehavior(classId), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return mobileError(err, "behavior.post");
  }
}
