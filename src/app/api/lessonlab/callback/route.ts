import { cookies } from "next/headers";
import { exchangeCode } from "@/server/lessonlab/oauth";
import { importRoster } from "@/server/dal/lessonlab-import";

/* GET /api/lessonlab/callback?code=…&state=…

   LessonLab oʻqituvchi roziligidan keyin shu yerga qaytaradi. Bu yerda
   kod tokenga almashtiriladi va sinf/oʻquvchilar koʻchiriladi.

   Token HECH QAYERGA saqlanmaydi — import tugagach unutiladi. Saqlansa,
   u oʻgʻirlanishi mumkin boʻlgan yana bir sir boʻlardi va uni bekor
   qilish mexanizmini ham qurish kerak boʻlardi. */

export const dynamic = "force-dynamic";

function back(request: Request, params: Record<string, string>) {
  const url = new URL("/baholash", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return Response.redirect(url, 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();

  const stateCookie = jar.get("ll_state")?.value ?? "";
  const verifier = jar.get("ll_verifier")?.value ?? "";
  // Bir martalik qiymatlar — natijadan qatʼi nazar darhol oʻchiriladi
  jar.delete("ll_state");
  jar.delete("ll_verifier");

  const error = url.searchParams.get("error");
  if (error) return back(request, { import: "denied" });

  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  // CSRF himoyasi: qaytgan `state` biz yuborganiga mos kelishi shart,
  // aks holda boshqa saytdan kelgan soxta callback boʻlishi mumkin.
  if (!code || !state || !stateCookie || state !== stateCookie || !verifier) {
    return back(request, { import: "badstate" });
  }

  try {
    const redirectUri = new URL("/api/lessonlab/callback", request.url).toString();
    const tokens = await exchangeCode(code, verifier, redirectUri);
    const report = await importRoster(tokens.access_token);
    return back(request, {
      import: "ok",
      classes: String(report.classesCreated),
      students: String(report.studentsCreated),
      conflicts: String(report.conflicts.length),
    });
  } catch {
    // Batafsil xato URL'ga chiqmaydi — u foydalanuvchi koʻradigan joy
    return back(request, { import: "failed" });
  }
}
