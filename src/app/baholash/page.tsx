import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { isTeacher } from "@/lib/auth-roles";

/* ════════════════════════════════════════════════════════════════════
   /baholash — ARXIVLANGAN (2026-09-27).

   Bu yerda «Ustozona Baholash» ish maydoni turardi: testni sinfga
   oʻyin, uy vazifasi yoki qogʻoz test sifatida berish, varaq/karta
   chop etish, skaner va LessonLab importi. Yon menyuda yoʻq edi va
   oʻqituvchi uni topmasdi — imkoniyat bor, yoʻl yoʻq edi.

   Endi HAMMASI Topshiriqlar boʻlimida («Darsda oʻtkazish» / «Uyga
   berish», natija ekrani, `⋯` → LessonLab) —
   docs/topshiriq-boshlash-markazi.md §8.
   Eski ish maydoni kodi git tarixida.

   Sahifa koʻrinmaydi, lekin eski havola va xatchoʻplar uchun
   yoʻnaltiradi: oʻqituvchi → Topshiriqlar (import natijasi
   parametrlari saqlanadi), mehmon → bosh sahifa.

   ⚠️ TIRIK QOLADI: `/baholash/skaner/[ticket]` (telefon skaneri —
   imzolangan chipta bilan ochiladi) va `/api/baholash/*` (PDF, skaner).
   Vaqtinchalik yoʻnaltirish (307) — doimiysi brauzer keshida qolib,
   mehmon sifatida kirgan oʻqituvchini keyin ham bosh sahifaga
   tashlab yuborardi.
   ════════════════════════════════════════════════════════════════════ */

export const metadata = {
  robots: { index: false, follow: false },
};

const KEPT_PARAMS = [
  "import",
  "classes",
  "students",
  "tests",
  "updated",
  "conflicts",
  "skipped",
  "report",
];

export default async function BaholashArchivedPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session && isTeacher(session.user)) {
    const params = searchParams ? await searchParams : undefined;
    const qs = new URLSearchParams();
    for (const key of KEPT_PARAMS) {
      const value = params?.[key];
      if (typeof value === "string") qs.set(key, value);
    }
    const query = qs.toString();
    redirect(`/dashboard/assignments${query ? `?${query}` : ""}`);
  }
  redirect("/");
}
