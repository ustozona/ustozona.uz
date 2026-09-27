import { signOutMobile } from "@/server/dal/mobile-auth";

/* POST /api/mobile/v1/auth/sign-out — shu qurilma sessiyasini bekor qiladi. */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await signOutMobile(request.headers).catch(() => undefined);
  return new Response(null, { status: 204 });
}
