import { ProductPage } from "@/components/landing/ProductPage";

export const metadata = {
  title: "Shogird — ota-ona uchun elektron kundalik, Telegram",
  description:
    "Ota-ona va oʻquvchi uchun Telegram ilovasi — baho, davomat va xulqni akkaunt ochmasdan koʻrish.",
  alternates: { canonical: "/shogird" },
};

export default function ShogirdPage() {
  return (
    <ProductPage
      slug="shogird"
      capabilities={[
        "Baho, davomat va xulq — faqat koʻrish, alohida ilova yuklamasdan",
        "Telegram orqali ochiladi, akkaunt/parol shart emas",
        "Bolangizning oʻz traektoriyasi vaqt boʻyicha",
      ]}
      differentiator="Sinf reytingi va tengdoshlar bilan taqqoslash koʻrsatilmaydi — faqat bolaning oʻz yoʻli. Termometr, termostat emas: nazorat emas, koʻrinish beriladi."
      plannedNote="Rejalashtirilgan: Telegram mini-ilova hozir loyihalashtirilmoqda. Qiziqishingiz bormi — Telegram orqali yozing, tayyor boʻlganda birinchilardan xabardor qilamiz."
    />
  );
}
