import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/* Preview bannerdagi «Chiqish» — draftMode cookie'ni oʻchiradi va
   ommaviy koʻrinishga qaytadi. `to` faqat ichki `/blog/...` yoʻliga
   ruxsat etiladi (ochiq-redirect oldini olish). */
export async function GET(request: Request) {
  const draft = await draftMode();
  draft.disable();
  const to = new URL(request.url).searchParams.get("to");
  redirect(to && /^\/blog\/[a-z0-9-]+$/i.test(to) ? to : "/blog");
}
