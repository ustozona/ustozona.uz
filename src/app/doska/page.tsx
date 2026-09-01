import type { Metadata } from "next";

import { DoskaShell } from "@/components/doska/DoskaShell";

/* Sarlavha eski mahsulot sahifasidan saqlab qolindi — «sinf taymeri»,
   «dars taymeri» kabi soʻrovlar aynan shu sahifaga tushishi kerak. */
export const metadata: Metadata = {
  title: "Doska — sinf ekrani, dars taymeri, svetofor",
  description:
    "Taymer, svetofor, soat — projektorga chiqariladigan sinf ekrani. Roʻyxatdan oʻtmasdan, darhol ishlaydi.",
  alternates: { canonical: "/doska" },
};

/* ════════════════════════════════════════════════════════════════════
   /doska — SINF EKRANI.

   Bu yoʻlda ilovaning OʻZI turadi, mahsulot tavsifi emas: Doska
   ishlaydi, shuning uchun unga «tez orada» sahifasi kerak emas.
   Mahsulot tavsifi asosiy landing'ning «Mahsulotlar» boʻlimida.
   Hali tayyor boʻlmagan ost-loyihalar (Baholash, Shogird, Boshqaruv)
   esa `ProductPage` da qoladi.

   Kirmasdan ochiladi: oʻqituvchi darsga kirdi, projektorni yoqdi,
   3 soniyada taymer kerak (R134). Ekran localStorage'da saqlanadi;
   kirgandan keyin serverga koʻchiriladi va sinf roʻyxati ulanadi —
   bu keyingi bosqich.

   Sirt/ohang bu yerda eʼlon qilinmaydi: `src/proxy.ts` yoʻl boʻyicha
   `stage` + `doska` + `playful` sarlavhalarini qoʻyadi, root layout
   ularni `<html>` ga yozadi.
   ════════════════════════════════════════════════════════════════════ */
export default function DoskaPage() {
  return <DoskaShell />;
}
