import { ProductPage } from "@/components/landing/ProductPage";

export const metadata = {
  title: "Ustozona Doska — sinf ekrani, dars taymeri, tasodifiy ism",
  description:
    "Projektorga chiqariladigan sinf ekrani: taymer, svetofor, tasodifiy ism tanlash, guruhlarga boʻlish.",
};

export default function DoskaPage() {
  return (
    <ProductPage
      slug="doska"
      capabilities={[
        "Taymer, svetofor (Traffic Light), tasodifiy ism tanlash, guruhlarga boʻlish",
        "Soʻrovnoma va soʻz buluti — sinfning fikrini bir zumda koʻrish",
        "Chizish/annotatsiya qatlami",
        "Kirishsiz ochiladi — projektorni yoqib, 3 soniyada ishlatasiz",
      ]}
      differentiator="classroomscreen.com sizning oʻquvchilaringizni bilmaydi — Ustozona Doska biladi. Tasodifiy ism va guruhlar haqiqiy sinf roʻyxatidan olinadi, tasodifiy raqamlardan emas."
      plannedNote="Rejalashtirilgan: kanvas + vidjetlar tizimi hozir qurilmoqda. Qiziqishingiz bormi — Telegram orqali yozing, tayyor boʻlganda birinchilardan xabardor qilamiz."
    />
  );
}
