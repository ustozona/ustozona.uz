import { startMobileTgAuth } from "@/server/dal/mobile-auth";

/* POST /api/mobile/v1/auth/telegram/start — mobil ilova kirish soʻrovi.
   Mantiq: `dal/mobile-auth.ts`. */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { platform?: unknown } | null;
  const platform = typeof body?.platform === "string" ? body.platform : "";
  const result = await startMobileTgAuth(platform);
  return Response.json(result, {
    status: result.ok ? 200 : result.reason === "disabled" ? 503 : 500,
    headers: { "Cache-Control": "no-store" },
  });
}
