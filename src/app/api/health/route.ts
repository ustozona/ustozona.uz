import { checkDbHealth } from "@/server/dal/health";

/* GET /api/health — baza ulanishini tekshiruvchi texnik endpoint.

   Mantiq `@/server/dal/health` da: DB klientini faqat DAL qatlami
   import qila oladi. Bu yerda faqat HTTP kodi tanlanadi. */

export const dynamic = "force-dynamic";

export async function GET() {
  const natija = await checkDbHealth();
  return Response.json(natija, { status: natija.ok ? 200 : 500 });
}
