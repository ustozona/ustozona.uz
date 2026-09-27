import { getMobileMe } from "@/server/dal/mobile-auth";

/* GET /api/mobile/v1/me — `Authorization: Bearer <token>` egasi. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const me = await getMobileMe(request.headers);
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(me, { headers: { "Cache-Control": "no-store" } });
}
