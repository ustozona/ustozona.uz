import { incrementViewCount } from "@/server/dal/blog";

/* Ommaviy koʻrishlar hisoblagichi — klient beacon (`ViewBeacon`) chaqiradi.
   Auth talab qilinmaydi. `incrementViewCount` faqat nashr qilingan
   postlarni sanaydi va `revalidate` CHAQIRMAYDI (aks holda har koʻrish
   ommaviy sahifa keshini buzardi). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await incrementViewCount(id);
  } catch {
    // beacon — jimgina yutiladi
  }
  return new Response(null, { status: 204 });
}
