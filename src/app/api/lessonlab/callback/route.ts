import { cookies } from "next/headers";
import { exchangeCode } from "@/server/lessonlab/oauth";
import { importRoster, importTests } from "@/server/dal/lessonlab-import";
import { bridgeTelegramIdentity } from "@/server/dal/cross-platform";

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
  // `/start` da tanlangan maqsad: boʻsh boʻlsa sinf/oʻquvchi
  // koʻchiriladi, sinf ID boʻlsa — oʻsha sinfga testlar.
  const targetClass = jar.get("ll_class")?.value ?? "";
  // Bir martalik qiymatlar — natijadan qatʼi nazar darhol oʻchiriladi
  jar.delete("ll_state");
  jar.delete("ll_verifier");
  jar.delete("ll_class");

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

    // KIMLIK KOʻPRIGI — importdan OLDIN.
    // Oʻqituvchi hozir Telegram orqali «bu men» deb tasdiqladi, ya'ni
    // `teachers.id ↔ bot_users.id` faktini yozish uchun aynan shu payt
    // eng ishonchli. Importdan keyin yozilsa, import yiqilganda koʻprik
    // ham yozilmay qolardi — holbuki rozilik allaqachon berilgan.
    //
    // `importRoster` bogʻlanishni oʻzi yozadi, koʻprik esa TESKARI
    // yoʻnalish uchun kerak: bot Ustozona sinflarini shu orqali topadi.
    await bridgeTelegramIdentity(tokens.access_token);

    const report = targetClass
      ? await importTests(tokens.access_token, targetClass)
      : await importRoster(tokens.access_token);
    return back(request, {
      import: "ok",
      classes: String(report.classesCreated),
      students: String(report.studentsCreated),
      tests: String(report.testsCreated),
      conflicts: String(report.conflicts.length),
      skipped: String(report.skipped.length),
    });
  } catch {
    // Batafsil xato URL'ga chiqmaydi — u foydalanuvchi koʻradigan joy
    return back(request, { import: "failed" });
  }
}
