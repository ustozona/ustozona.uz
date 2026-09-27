import { pollMobileTgAuth } from "@/server/dal/mobile-auth";

/* POST /api/mobile/v1/auth/telegram/poll — ilova har 2 soniyada soʻraydi.
   Sir URL'da emas, tanada — loglarga tushmasin. */

export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9_-]{16,64}$/;
const SECRET = /^[A-Za-z0-9_-]{16,128}$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { requestId?: unknown; secret?: unknown }
    | null;
  const requestId = typeof body?.requestId === "string" ? body.requestId : "";
  const secret = typeof body?.secret === "string" ? body.secret : "";
  if (!ID.test(requestId) || !SECRET.test(secret)) {
    return Response.json({ status: "invalid" }, { status: 400 });
  }
  const result = await pollMobileTgAuth(requestId, secret);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
