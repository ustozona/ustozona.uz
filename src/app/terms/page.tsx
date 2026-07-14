import { LegalPage } from "@/components/landing/LegalPage";
import { TELEGRAM_HANDLE, TELEGRAM_URL } from "@/lib/landing-nav";

export const metadata = {
  title: "Foydalanish shartlari — Ustozona",
  description:
    "Ustozona platformasidan foydalanish qoidalari, masʼuliyat chegaralari va hisobni oʻchirish tartibi.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Foydalanish shartlari" updatedAt="2026-yil 14-iyul">
      <p>
        Ustozonadan foydalanish orqali siz quyidagi shartlarga rozilik
        bildirasiz. Ular sodda tilda yozilgan — chalkash yuridik iboralarsiz.
      </p>

      <h2>1. Xizmat nima</h2>
      <p>
        Ustozona — oʻqituvchi uchun <strong>shaxsiy ish quroli</strong>:
        elektron jurnal, davomat, xulq ballari, dars jadvali va dars
        ishlanmalari. Bu rasmiy davlat jurnalining oʻrnini bosmaydi va
        rasmiy hujjat sifatida kuchga ega emas.
      </p>

      <h2>2. Narx</h2>
      <p>
        Oʻqituvchi uchun asosiy imkoniyatlar <strong>bepul</strong>. Bank
        kartasi talab qilinmaydi. Kelajakda pullik tariflar joriy etilishi
        mumkin — bunday holda bepul reja shartlari oldindan, aniq va ochiq
        eʼlon qilinadi. Sizni ogohlantirmasdan pullik rejaga oʻtkazmaymiz.
      </p>

      <h2>3. Hisobingiz</h2>
      <ul>
        <li>Parolingiz maxfiyligi uchun siz javobgarsiz.</li>
        <li>Hisobingiz orqali qilingan harakatlar siz tomonidan qilingan hisoblanadi.</li>
        <li>Hisobni boshqa shaxsga bermang — oʻquvchilar maʼlumoti xavf ostida qoladi.</li>
      </ul>

      <h2>4. Oʻquvchilar maʼlumoti</h2>
      <p>
        Oʻquvchilar haqidagi maʼlumotni siz kiritasiz va u uchun{" "}
        <strong>siz javobgarsiz</strong>: toʻgʻriligi uchun ham, uni kiritishga
        ruxsatingiz borligi uchun ham. Biz bu maʼlumotni faqat sizning
        nomingizdan saqlaymiz va qayta ishlaymiz. Batafsil:{" "}
        <a href="/privacy">Maxfiylik siyosati</a>.
      </p>

      <h2>5. Nima mumkin emas</h2>
      <ul>
        <li>Tizimni qonunga xilof maqsadda ishlatish.</li>
        <li>Boshqa foydalanuvchilar maʼlumotiga ruxsatsiz kirishga urinish.</li>
        <li>Xizmatning ishlashiga zarar yetkazish (yuklama hujumlari, avtomatlashtirilgan zararli soʻrovlar).</li>
        <li>Xizmatdan olingan maʼlumotni sizga tegishli boʻlmagan shaxslarga tarqatish.</li>
      </ul>

      <h2>6. Xizmat “boricha” taqdim etiladi</h2>
      <p>
        Platforma rivojlanish bosqichida. Biz uzluksiz ishlashiga harakat
        qilamiz, lekin uzilishlar, xatolar yoki maʼlumot yoʻqolishi ehtimolini
        toʻliq istisno qila olmaymiz. Shu sababli muhim maʼlumotni davriy
        ravishda <strong>eksport qilib qoʻyishingizni</strong> tavsiya qilamiz
        (Sozlamalar → Maʼlumotlar).
      </p>
      <p>
        Xizmatdan foydalanish natijasida yuzaga kelgan bilvosita zararlar uchun
        javobgarlik zimmamizga olinmaydi.
      </p>

      <h2>7. Oʻzgarishlar va toʻxtatish</h2>
      <p>
        Imkoniyatlarni yaxshilash uchun xizmatni oʻzgartirishimiz mumkin.
        Ushbu shartlarni buzgan hisoblar toʻxtatilishi mumkin. Hisobingizni
        istalgan vaqtda oʻzingiz oʻchirishingiz mumkin — Sozlamalar boʻlimidan.
      </p>

      <h2>8. Bogʻlanish</h2>
      <p>
        Savollar uchun —{" "}
        <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
          Telegram: {TELEGRAM_HANDLE}
        </a>
        .
      </p>
    </LegalPage>
  );
}
