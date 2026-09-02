import type { Metadata } from "next";
import JadvalWorkspace from "@/components/jadval/JadvalWorkspace";

export const metadata: Metadata = {
  title: "Dars jadvali — maktab jadvalini onlayn tuzish",
  description:
    "Oʻquv ishlari boʻyicha direktor oʻrinbosari uchun: maktab dars jadvalini tuzish, ziddiyatlarni koʻrish, «Jami soat»ni oʻquv rejasiga solishtirish va chop etish. Roʻyxatdan oʻtmasdan boshlanadi.",
  alternates: { canonical: "/jadval" },
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

export default function JadvalPage() {
  return <JadvalWorkspace />;
}
