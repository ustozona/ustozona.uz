import { ProductPage } from "@/components/landing/ProductPage";

export const metadata = {
  title: "Ustozona Boshqaruv — maktab boshqaruv paneli",
  description:
    "Maktab maʼmuriyati uchun panel: oʻqituvchilar faolligi, sinflar va umumiy koʻrinish.",
  alternates: { canonical: "/boshqaruv" },
};

export default function BoshqaruvPage() {
  return (
    <ProductPage
      slug="boshqaruv"
      capabilities={[
        "Maktab boʻyicha oʻqituvchilar faolligi va umumiy koʻrinish",
        "Sinflar va oʻtkazilgan baholashlar sanogʻi",
        "Bitta joydan maktab miqyosidagi nazorat",
      ]}
      differentiator="Aniq chegara: maʼmuriyat oʻqituvchining shaxsiy pedagogik qaydlarini (oʻquvchi haqidagi izohlar, fikr-mulohaza) koʻrmaydi. Boshqaruv — hisobot, nazorat emas."
      plannedNote="Rejalashtirilgan: maktab admin darvozasi va hisobot sahifalari hozir loyihalashtirilmoqda. Qiziqishingiz bormi — Telegram orqali yozing, tayyor boʻlganda birinchilardan xabardor qilamiz."
    />
  );
}
