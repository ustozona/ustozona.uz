import { getIndexNowKey } from "@/server/indexnow";

/* IndexNow egalik tekshiruvi: qidiruv tizimi shu manzilni ochib, ichida
   soʻrovdagi kalitni koʻrishi kerak. `public/` ga statik fayl qoʻyish
   ham mumkin edi, lekin unda kalit ikki joyda (fayl + env) yashab,
   ajralib qolishi mumkin — bu yerda manba bitta.

   `keyLocation` bilan soʻrovga qoʻshib yuboriladi (`server/indexnow.ts`),
   shuning uchun fayl nomi ildizda boʻlishi shart emas — lekin baribir
   ildizda: qoʻlda tekshirish oson boʻlsin. */
export const dynamic = "force-dynamic";

export async function GET() {
  const key = getIndexNowKey();
  if (!key) return new Response("Not found", { status: 404 });
  return new Response(key, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
