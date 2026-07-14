import { LegalPage } from "@/components/landing/LegalPage";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/landing-nav";

export const metadata = {
  title: "Maxfiylik siyosati — Ustozona",
  description:
    "Ustozona qanday maʼlumot yigʻadi, uni qayerda saqlaydi va foydalanuvchi qanday nazorat qiladi.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Maxfiylik siyosati" updatedAt="2026-yil 14-iyul">
      <p>
        Ustozona — oʻqituvchilar uchun elektron jurnal, davomat va dars
        rejalashtirish platformasi. Bu hujjat qanday maʼlumot yigʻilishini,
        u qayerda saqlanishini va siz uni qanday nazorat qilishingizni
        tushuntiradi. Qisqa qilib: <strong>maʼlumotlaringiz sizniki</strong>,
        biz ularni sotmaymiz va reklama uchun ishlatmaymiz.
      </p>

      <h2>1. Qanday maʼlumot yigʻamiz</h2>
      <p><strong>Hisobingiz haqida:</strong></p>
      <ul>
        <li>Ism va familiya, elektron pochta manzili.</li>
        <li>
          Parol — <strong>ochiq holda saqlanmaydi</strong>, faqat qaytarib
          boʻlmaydigan kriptografik hash koʻrinishida.
        </li>
        <li>
          Google orqali kirsangiz — Google bergan ism, email va profil rasmi.
          Parolingizni biz koʻrmaymiz.
        </li>
      </ul>

      <p><strong>Siz tizimga kiritadigan maʼlumotlar:</strong></p>
      <ul>
        <li>Sinflar, oʻquvchilar roʻyxati (ism, jinsi, tugʻilgan sana, ota-ona telefoni — agar kiritsangiz).</li>
        <li>Baholar, davomat yozuvlari, xulq ballari.</li>
        <li>Dars jadvali, dars ishlanmalari, topshiriqlar va qaydlar.</li>
      </ul>

      <p><strong>Texnik maʼlumot:</strong> tizimga kirganingizni eslab qolish
      uchun zarur cookie fayllari. Reklama, kuzatuv (tracking) yoki uchinchi
      tomon analitika skriptlari <strong>ishlatilmaydi</strong>.</p>

      <h2>2. Nima uchun ishlatamiz</h2>
      <ul>
        <li>Xizmatni ishlatib berish uchun — jurnal, davomat, hisobotlar.</li>
        <li>Hisobingizni himoyalash va sizni tizimga kiritish uchun.</li>
        <li>Siz soʻragan yordamni koʻrsatish uchun.</li>
      </ul>
      <p>
        Maʼlumotlaringizni <strong>sotmaymiz</strong>, reklama beruvchilarga
        bermaymiz va sizning ruxsatingizsiz uchinchi shaxslarga oshkor
        qilmaymiz. Istisno — qonun talab qilgan holatlar.
      </p>

      <h2>3. Oʻquvchilar maʼlumoti — oʻqituvchining masʼuliyati</h2>
      <p>
        Oʻquvchilar haqidagi maʼlumotni tizimga <strong>siz</strong>{" "}
        kiritasiz. Biz ularni sizning nomingizdan qayta ishlaymiz: koʻrmaymiz,
        tahlil qilmaymiz va boshqa maqsadda ishlatmaymiz. Voyaga yetmagan
        oʻquvchilarning maʼlumotini kiritishga ruxsatingiz borligiga ishonch
        hosil qilish — sizning va maktabingizning masʼuliyati.
      </p>

      <h2>4. Qayerda saqlanadi</h2>
      <p>
        Maʼlumotlar Neon (PostgreSQL) bulut bazasida, Yevropa Ittifoqi hududida
        (Frankfurt) joylashgan serverlarda saqlanadi. Ulanish shifrlangan
        (TLS). Ilova Vercel platformasida ishlaydi.
      </p>
      <p>
        <strong>Zaxira nusxa:</strong> baza avtomatik ravishda ~24 soatlik
        tiklash oynasiga ega; bundan tashqari davriy toʻliq nusxalar olinadi.
      </p>

      <h2>5. Sizning nazoratingiz</h2>
      <ul>
        <li>
          <strong>Eksport:</strong> Sozlamalar → Maʼlumotlar boʻlimidan
          sinflar, oʻquvchilar va darslaringizni faylga yuklab olishingiz mumkin.
        </li>
        <li>
          <strong>Oʻchirish:</strong> hisobingizni oʻchirsangiz, unga bogʻliq
          barcha maʼlumot (sinflar, oʻquvchilar, baholar, davomat) bazadan
          oʻchiriladi. Zaxira nusxalarda ular chegaralangan muddat davomida
          qolishi mumkin.
        </li>
        <li><strong>Tuzatish:</strong> istalgan maʼlumotni ilova ichida oʻzgartirasiz.</li>
      </ul>

      <h2>6. Cookie fayllari</h2>
      <p>
        Faqat xizmat ishlashi uchun <strong>zarur</strong> cookie'lardan
        foydalanamiz — ular sizni tizimda ushlab turadi. Reklama yoki kuzatuv
        cookie'lari yoʻq.
      </p>

      <h2>7. Oʻzgarishlar</h2>
      <p>
        Ushbu siyosat oʻzgarsa, sahifadagi sana yangilanadi. Muhim
        oʻzgarishlar haqida ilova ichida xabar beramiz.
      </p>

      <h2>8. Bogʻlanish</h2>
      <p>
        Savol yoki soʻrovingiz boʻlsa —{" "}
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
          Telegram: {TELEGRAM_HANDLE}
        </a>
        .
      </p>
    </LegalPage>
  );
}
