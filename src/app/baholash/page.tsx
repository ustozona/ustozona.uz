import { ProductPage } from "@/components/landing/ProductPage";

export const metadata = {
  title: "Ustozona Baholash — onlayn test tuzish, sinfda kviz",
  description:
    "Onlayn test tuzish, sinfda interaktiv kviz, qogʻoz test skaneri (OMR) va QR-kartalar — bittasi bahoga, hammasi jurnalga.",
};

export default function BaholashPage() {
  return (
    <ProductPage
      slug="baholash"
      capabilities={[
        "Toʻrt resurs turi: test, taqdimot, video, matn+savol — bitta joyda yaratiladi",
        "Jonli oʻtkazish (PIN/havola/QR) va oʻz tezligidagi uy vazifasi",
        "Qogʻoz test + telefon kamerasi bilan avtomatik tekshirish (OMR)",
        "Telefonsiz sinf uchun QR-kartalar",
        "Natija toʻgʻridan-toʻgʻri jurnalga koʻchadi — qoʻlda koʻchirish yoʻq",
      ]}
      differentiator="Tezlik hech qachon ballanmaydi — sekin, lekin toʻgʻri javob bergan bola yutqazmaydi. Oʻyin faqat qobiq: sinf ichida musobaqa boʻlsa ham, jurnalga faqat toʻgʻri/notoʻgʻri kiradi."
      plannedNote="Rejalashtirilgan: sxema, yaratish oqimi va savol muharriri hozir qurilmoqda. Qiziqishingiz bormi — Telegram orqali yozing, tayyor boʻlganda birinchilardan xabardor qilamiz."
    />
  );
}
