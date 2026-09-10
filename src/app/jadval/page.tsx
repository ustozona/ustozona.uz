import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JadvalBackground from "@/components/jadval/JadvalBackground";
import JadvalWorkspace from "@/components/jadval/JadvalWorkspace";
import { getSession } from "@/server/session";
import { isSuperAdmin } from "@/lib/auth-roles";

export const metadata: Metadata = {
  title: "Dars jadvali — maktab jadvalini onlayn tuzish",
  description:
    "Oʻquv ishlari boʻyicha direktor oʻrinbosari uchun: maktab dars jadvalini tuzish, ziddiyatlarni koʻrish, «Jami soat»ni oʻquv rejasiga solishtirish va chop etish. Roʻyxatdan oʻtmasdan boshlanadi.",
  alternates: { canonical: "/jadval" },
  /* Yashirin davrda qidiruvga tushmasin (pastdagi darvozaga qarang). */
  robots: { index: false, follow: false },
};

/* ════════════════════════════════════════════════════════════════════
   /jadval — MAKTAB DARS JADVALI.

   `/doska` naqshi: bu yoʻlda mahsulot tavsifi emas, ILOVANING OʻZI
   turadi va u ataylab login talab qilmaydi. Zavuch Ustozona haqida
   eshitmagan odam boʻlishi mumkin — undan avval roʻyxatdan oʻtishni
   soʻrasak, u eski dasturiga qaytadi (docs/dars-jadvali-spec.md §3).

   Hujjat brauzerda (`localStorage`) boshlanadi; «Saqlash» bosilganda
   roʻyxatdan oʻtish soʻraladi va serverga koʻchiriladi.

   ⛔ Dashboard yon menyusida bu sahifaga havola YOʻQ — ost-loyiha
   mustaqil (§9).
   ════════════════════════════════════════════════════════════════════ */

/* ⛔ VAQTINCHA YASHIRIN (2026-09-10) — vosita hali tayyor emas: serverga
   saqlash va yaratilgandan keyin tahrirlash yoʻq, jadval faqat
   brauzerda yashaydi. Real maktab bunda ishlay olmaydi.

   Prodda sahifa faqat super-admin uchun ochiladi, qolganlarga 404 —
   yaʼni «bor, lekin buzilgan» emas, umuman yoʻq koʻrinadi. Lokal devda
   ochiq. Qolgan ishlar va qaytish sharti: docs/roadmap-muhokama.md §6.6.
   Tayyor boʻlgach shu darvoza va `robots` bandi olib tashlanadi. */
async function canSeeJadval(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const session = await getSession();
  return !!session && isSuperAdmin(session.user);
}

export default async function JadvalPage() {
  if (!(await canSeeJadval())) notFound();

  return (
    <>
      {/* Ishchi maydon foni — panellar oq ustida oq boʻlib qolmasligi
          uchun. Dashboard shell'idagi bilan bir xil naqsh. */}
      <JadvalBackground />
      <JadvalWorkspace />
    </>
  );
}
