import { cookies } from "next/headers";
import { authorizeUrl, createPendingAuth } from "@/server/lessonlab/oauth";
import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";

/* GET /api/lessonlab/start — LessonLab ruxsat sahifasiga yoʻnaltiradi.

   `code_verifier` httpOnly cookie'da qoladi: u FAQAT serverga kerak va
   brauzer skriptiga koʻrinmasligi shart. Muddati 10 daqiqa — ruxsat
   berish shuncha vaqtda tugaydi, undan keyin eski verifier qolib
   ketmaydi. */

export const dynamic = "force-dynamic";

function redirectUri(request: Request): string {
  return new URL("/api/lessonlab/callback", request.url).toString();
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !isTeacher(session.user)) {
    return Response.redirect(new URL("/login", request.url), 302);
  }

  const pending = createPendingAuth();
  const url = authorizeUrl(pending, redirectUri(request));
  if (!url) {
    return Response.redirect(
      new URL("/baholash?import=notconfigured", request.url), 302);
  }

  /* `?class=<uuid>` boʻlsa — TEST koʻchirish, boʻlmasa sinf/oʻquvchi.

     Nega maqsad aynan shu yerda tanlanadi: token callback tugagach
     UNUTILADI (uni saqlash yana bitta oʻgʻirlanadigan sir yaratardi).
     Demak «avval roʻyxat, keyin test» bitta token bilan boʻlmaydi —
     har biri oʻz rozilik bosqichiga ega.

     Sinf EGALIGI bu yerda tekshirilmaydi: `importTests()` uni
     `requireTeacher()` bilan oʻzi tekshiradi va cookie'dagi qiymatga
     ishonmaydi. */
  const targetClass = new URL(request.url).searchParams.get("class") ?? "";

  const jar = await cookies();
  const opts = {
    httpOnly: true, sameSite: "lax" as const, secure: true,
    path: "/api/lessonlab", maxAge: 600,
  };
  jar.set("ll_state", pending.state, opts);
  jar.set("ll_verifier", pending.verifier, opts);
  // Eski qiymat qolib ketmasin: roʻyxat koʻchirishdan oldin test
  // koʻchirilgan boʻlsa, cookie tirik qolib maqsadni buzardi.
  if (targetClass) jar.set("ll_class", targetClass, opts);
  else jar.delete("ll_class");
  return Response.redirect(url, 302);
}
