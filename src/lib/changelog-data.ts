import { MONTHS_UZ } from "@/lib/localization";

/* Yangilanishlar (changelog) — YAGONA MANBA. Statik roʻyxat: yangi yozuv
   har release bilan qoʻlda qoʻshiladi va deploy orqali chiqadi.

   YOZUV QOIDALARI (majburiy):
   - Yangi yozuv DOIM massiv BOSHIGA qoʻshiladi (unseen hisoblagichi shunga
     tayanadi — sana taqqoslanmaydi, uzunlik farqi sanaladi).
   - Matn foyda-markazli oʻqituvchi tilida: qanday qurilgani emas, oʻqituvchi
     endi nima qila olishi. Dev-jargon taqiq.
   - "tuzatildi" yozuvida qaysi ogʻriq ketgani yoziladi, texnik sabab emas.
   - body 1–3 qisqa gap; mayda oʻzgarishlarda body tashlab ketiladi —
     yozuv bir qatorli kompakt koʻrinishda chiqadi.
   - Apostroflar faqat ʻ (U+02BB) va ʼ (U+02BC), ASCII ' ishlatilmaydi.
   - Commit ≠ yozuv: bitta feature'ning bir necha commiti bitta yozuv boʻladi;
     hujjat/ichki-refactor/build-tuzatish commitlari kirmaydi. */

export type ChangelogType = "yangi" | "yaxshilandi" | "tuzatildi";

export type ChangelogEntry = {
  /** Barqaror slug, masalan "behavior-launch". */
  id: string;
  /** "YYYY-MM-DD" — koʻrsatish va sana-guruhlash uchun. */
  date: string;
  type: ChangelogType;
  title: string;
  /** 1–3 gap; yoʻq boʻlsa yozuv bir qatorli kompakt koʻrinadi. */
  body?: string;
  /** Tegishli sahifa, masalan "/dashboard/behavior". */
  href?: string;
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: "statistics-launch",
    date: "2026-07-18",
    type: "yangi",
    title: "Yangi boʻlim: Statistika",
    body:
      "Endi barcha sinflaringiz boʻyicha umumiy manzara bitta joyda: kim eʼtibor talab qilayotgani, qaysi sinfga koʻproq vaqt kerakligi, baholar taqsimoti, mavzu oʻzlashtirish, davomat va xulq trendlari. Sinfni tanlab ichkariga kirsangiz — topshiriq qiyinligi va sinf ichidagi tafsilotlar ham shu yerda.",
    href: "/dashboard/statistics",
  },
  {
    id: "home-redesign-command-center",
    date: "2026-07-18",
    type: "yangi",
    title: "Bosh sahifa kunni boshqarish markaziga aylandi",
    body:
      "Endi bosh sahifada kuningiz bir qarashda: «Ishlar navbati» vazifalar, tekshirilmagan ishlar va nazorat muddatlarini bitta roʻyxatga jamlaydi; «Eʼtibor kerak» davomati tushgan yoki oʻzlashtirishi pasaygan oʻquvchilarni oʻzi koʻrsatadi; oʻngda bugungi darslar roʻyxat yoki vaqt oʻqi koʻrinishida. Yaqin tugʻilgan kunlar ham shu yerda, kun yakunida esa oʻzingiz boshqaradigan iqtiboslar chiqadi.",
    href: "/dashboard",
  },
  {
    id: "multi-language-support",
    date: "2026-07-17",
    type: "yangi",
    title: "Ilova endi 6 tilda ishlaydi",
    body:
      "Sozlamalar boʻlimidan tilni tanlash mumkin — oʻzbekcha, qoraqalpoqcha, qirgʻizcha, qozoqcha, ruscha va inglizcha. Tanlangan til boʻyicha butun ilova (menyu, tugmalar, sahifalar) shu tilda koʻrsatiladi.",
    href: "/dashboard/settings",
  },
  {
    id: "student-profile-class-badge-fix",
    date: "2026-07-17",
    type: "tuzatildi",
    title: "Oʻquvchi profilidagi sinf belgisi tuzatildi",
    body:
      "Sinf rangi belgisi juda kichik boʻlgani uchun dumaloq koʻrinib qolardi — endi barcha joyda bir xil, burchaklari yumaloqlangan kvadrat shaklda chiqadi. Ismning tagida va \"Shaxsiy maʼlumotlar\" boʻlimida sinf ikki marta takrorlanardi — endi faqat bir joyda koʻrsatiladi.",
    href: "/dashboard/students",
  },
  {
    id: "student-auto-id",
    date: "2026-07-17",
    type: "yangi",
    title: "Har bir oʻquvchiga avtomatik ID beriladi",
    body:
      "Yangi oʻquvchi qoʻshilganda endi unga avtomatik tartib raqami (ID) biriktiriladi — qoʻlda kiritish shart emas.",
    href: "/dashboard/students",
  },
  {
    id: "card-passport-v2",
    date: "2026-07-16",
    type: "yaxshilandi",
    title: "Kartalar va roʻyxatlar yangi koʻrinishga oʻtdi",
    body:
      "Sinflar, darslar, oʻquvchilar va jadval boʻyicha barcha kartalar bir xil, yangi koʻrinishga keldi: dumaloq gradientli ikonalar, tanlanganda chapdan ingichka rangli chiziq. Oʻquvchi kartalaridagi ortiqcha maʼlumotlar (ID qatori) olib tashlandi, muhim koʻrsatkichlar aniqroq chiqadi.",
    href: "/dashboard/classes",
  },
  {
    id: "class-color-palette-expanded",
    date: "2026-07-16",
    type: "yaxshilandi",
    title: "Sinf ranglari palitrasi kengaytirildi",
    body:
      "Yangi sinf yaratganda rang endi avtomatik tanlanadi — barcha ranglar tugamaguncha bitta rang qaytarilmaydi. Rang tanlash oynasiga yana 7 ta yangi ottenka (sariq, laym, zumrad, moviy-yashil, binafsha, fuksiya, atirgul) qoʻshildi — jami 17 ta rangdan xohlaganingizni tanlashingiz mumkin.",
    href: "/dashboard/classes",
  },
  {
    id: "guided-tour-reliability",
    date: "2026-07-16",
    type: "yaxshilandi",
    title: "Qoʻllanma turlari endi ishonchliroq",
    body:
      "Kichik ekranda yoki bir tur oʻrtasida boshqa sahifaga oʻtib ketilganda tur endi notoʻgʻri \"koʻrilgan\" deb belgilanmaydi. Oʻtkazib yuborilgan tur \"bajarilgan\" bilan aralashmaydi, klaviatura orqali boshqarish (Esc, Oʻngga/Chapga) qoʻshildi.",
    href: "/dashboard",
  },
  {
    id: "profile-birthdate-save-fix",
    date: "2026-07-16",
    type: "tuzatildi",
    title: "Profilda tavallud sanani saqlash endi ishlaydi",
    body:
      "Sozlamalar > Profilda tugʻilgan kunni yil/kun/oy orqali tanlaganda baʼzida \"Saqlash\" tugmasi faollashmay qolardi — tuzatildi.",
    href: "/dashboard/settings",
  },
  {
    id: "students-add-flow",
    date: "2026-07-15",
    type: "tuzatildi",
    title: "Oʻquvchi qoʻshish endi ishlaydi",
    body:
      "\"Sinf tanlanmagan\" xatosi tufayli baʼzi hollarda oʻquvchi qoʻshib boʻlmayotgan edi — tuzatildi. Shu bilan birga oʻquvchi qoʻshish oynasi ham yangilandi: bitta oʻquvchi qoʻshish, roʻyxatni joylashtirish yoki CSV/Excel fayldan import qilish endi bitta qulay oynada. (Omadbek Odilovga sinovda topgan buglar uchun rahmat!)",
    href: "/dashboard/students",
  },
  {
    id: "lesson-editor-save-fix",
    date: "2026-07-15",
    type: "tuzatildi",
    title: "Dars muharriridagi saqlash endi ishonchli",
    body:
      "Ilgari dars muharririda yozgan matningiz baʼzida yoʻqolib qolardi — darslar roʻyxatiga qaytganingizda oʻzgarish saqlanmaganday koʻrinardi. Endi har bir yozuv darhol serverga saqlanadi va sahifadan chiqishda hech narsa yoʻqolmaydi.",
    href: "/dashboard/lessons",
  },
  {
    id: "notifications-polish",
    date: "2026-07-15",
    type: "yaxshilandi",
    title: "Bildirishnomalar qulayroq boʻldi",
    body:
      "Fikringiz holati oʻzgarganda bildirishnomada aynan qaysi bosqichda ekani (masalan, koʻrib chiqilmoqda) rangli belgi bilan darhol koʻrinadi. Bildirishnomani bosganingizda endi toʻgʻri fikr kartasiga olib boradi.",
    href: "/dashboard/feedback",
  },
  {
    id: "changelog-launch",
    date: "2026-07-15",
    type: "yangi",
    title: "Yangilanishlar sahifasi ishga tushdi",
    body:
      "Ustozonada nima oʻzgarganini endi shu yerdan kuzatib borasiz. Yangi imkoniyat chiqsa, yon panelda belgi paydo boʻladi.",
  },
  {
    id: "feedback-v2",
    date: "2026-07-15",
    type: "yaxshilandi",
    title: "Fikr-mulohaza kuchaydi",
    body:
      "Fikringizga jamoa rasmiy javob yozganda yoki uning holati oʻzgarganda bildirishnoma olasiz — undan bir bosishda oʻsha fikrga oʻtasiz.",
    href: "/dashboard/feedback",
  },
  {
    id: "prod-launch",
    date: "2026-07-14",
    type: "yangi",
    title: "Ustozona endi internetda: www.ustozona.uz",
    body:
      "Platforma rasmiy manzilda ishga tushdi. Hisobingizga Google orqali bir bosishda kirasiz.",
  },
  {
    id: "command-palette",
    date: "2026-07-14",
    type: "yangi",
    title: "Tezkor qidiruv — Ctrl+K",
    body:
      "Klaviaturadan Ctrl+K (Mac'da ⌘K) bossangiz, istalgan sahifa, sinf yoki oʻquvchini bir zumda topasiz. Sahifa yuqorisidagi yoʻlak orqali sinf va oʻquvchilar orasida ham tez almashasiz.",
  },
  {
    id: "student-profile-real",
    date: "2026-07-14",
    type: "yaxshilandi",
    title: "Oʻquvchi profili toʻlaqonli boʻldi",
    body:
      "Profildagi qaydlaringiz endi saqlanib qoladi, davomat boʻlimi esa haqiqiy yoʻqlama natijalarini koʻrsatadi.",
    href: "/dashboard/students",
  },
  {
    id: "motion-polish",
    date: "2026-07-14",
    type: "yaxshilandi",
    title: "Interfeys jonlandi",
    body:
      "Sahifalar silliq animatsiya bilan ochiladi, kartalar bosilganda javob sezgisi beradi — ishlash yanada yoqimli.",
  },
  {
    id: "attendance-simpler",
    date: "2026-07-14",
    type: "yaxshilandi",
    title: "Davomat sahifasi soddalashtirildi",
    href: "/dashboard/attendance",
  },
  {
    id: "multi-year",
    date: "2026-07-13",
    type: "yangi",
    title: "Koʻp oʻquv yili bilan ishlash",
    body:
      "Yangi oʻquv yiliga oʻtish osonlashdi: eski sinflarni arxivlab, yangi yilni toza jurnal bilan boshlaysiz. Oldingi yillar maʼlumoti yoʻqolmaydi — istalgan payt qaytib koʻrasiz.",
    href: "/dashboard/settings",
  },
  {
    id: "behavior-auto-points",
    date: "2026-07-13",
    type: "yangi",
    title: "Xulq balli avtomatik ham yigʻiladi",
    body:
      "Davomat va jurnal natijalari asosida oʻquvchining xulq balliga avtomatik qoʻshimchalar tushadi — qoʻlda kiritib oʻtirish shart emas.",
    href: "/dashboard/behavior",
  },
  {
    id: "settings-redesign",
    date: "2026-07-13",
    type: "yaxshilandi",
    title: "Sozlamalar qaytadan tartibga solindi",
    body:
      "Boʻlimlar mavzu boʻyicha guruhlangan, oʻzgartirishlar aniq “Saqlash” tugmasi bilan tasdiqlanadi — nimani oʻzgartirganingiz doim koʻrinib turadi.",
    href: "/dashboard/settings",
  },
  {
    id: "behavior-launch",
    date: "2026-07-12",
    type: "yangi",
    title: "Xulq-atvor sahifasi",
    body:
      "Oʻquvchilarga koʻnikmalar uchun ball berish, mukofotlar va sinf boʻyicha xulq hisoboti — hammasi bitta sahifada.",
    href: "/dashboard/behavior",
  },
  {
    id: "page-tours",
    date: "2026-07-11",
    type: "yangi",
    title: "Har sahifada yoʻl-yoʻriq",
    body:
      "Rejalashtiruvchi, jurnal, davomat va boshqa sahifalarda bosqichma-bosqich qoʻllanmalar bor — yuqoridagi qalpoqcha belgisidan istalgan payt chaqirasiz.",
  },
  {
    id: "guidehub",
    date: "2026-07-10",
    type: "yaxshilandi",
    title: "Qoʻllanmalar markazi: kerak paytda oʻzingiz ochasiz",
  },
  {
    id: "fullscreen",
    date: "2026-07-09",
    type: "yangi",
    title: "Toʻliq ekran rejimi tugmasi",
  },
  {
    id: "onboarding-v2",
    date: "2026-07-09",
    type: "yaxshilandi",
    title: "Boshlash sehrgari yangi koʻrinishda",
  },
  {
    id: "bell-settings",
    date: "2026-07-08",
    type: "yaxshilandi",
    title: "Qoʻngʻiroq jadvali va oʻquv yili sozlamalari",
    body:
      "Qoʻngʻiroq jadvalini kalendar koʻrinishida koʻrasiz, oʻquv yilining chorak va taʼtillarini esa lentada boshqarasiz.",
    href: "/dashboard/settings",
  },
  {
    id: "home-redesign",
    date: "2026-07-06",
    type: "yaxshilandi",
    title: "Bosh sahifa yangi koʻrinishda",
    body:
      "Bugungi darslaringiz, haftalik taqvim va salomlashuv kartasi — kuningizni bir qarashda rejalashtirasiz.",
    href: "/dashboard",
  },
  {
    id: "onboarding-launch",
    date: "2026-07-05",
    type: "yangi",
    title: "Yangi foydalanuvchilar uchun tayyor start",
    body:
      "Roʻyxatdan oʻtganingizda sinflaringizni kiritasiz, taqvim esa oʻquv yiliga mos avtomatik tayyorlanadi.",
  },
  {
    id: "account-delete-fix",
    date: "2026-07-04",
    type: "tuzatildi",
    title: "Hisobni oʻchirish xatosi bartaraf etildi",
    body:
      "Hisobni oʻchirsangiz ham qayta kirganda maʼlumotlar qaytib kelish holati kuzatilgan edi — endi oʻchirish butunlay ishlaydi.",
  },
  {
    id: "nav-simpler",
    date: "2026-07-04",
    type: "yaxshilandi",
    title: "Navigatsiya soddalashtirildi: toza yon panel va sarlavha",
  },
  {
    id: "backend-v1",
    date: "2026-07-03",
    type: "yangi",
    title: "Haqiqiy hisoblar va bulutda saqlash",
    body:
      "Maʼlumotlaringiz endi brauzerda emas, xavfsiz serverda saqlanadi. Istalgan qurilmadan kirsangiz — sinflaringiz, jurnalingiz joyida.",
  },
  {
    id: "timetable-uz",
    date: "2026-05-08",
    type: "yaxshilandi",
    title: "Dars jadvali oʻzbek tilida va 24-soat formatida",
    href: "/dashboard/timetable",
  },
  {
    id: "classes-polish",
    date: "2026-05-06",
    type: "yaxshilandi",
    title: "Bosh sahifa va sinflar sayqallandi",
  },
  {
    id: "standards-launch",
    date: "2026-05-05",
    type: "yangi",
    title: "Standartlar sahifasi",
    body:
      "Taʼlim standartlarini Bloom taksonomiyasi darajalari boʻyicha kuzatib borasiz.",
    href: "/dashboard/standards",
  },
  {
    id: "initial-release",
    date: "2026-05-01",
    type: "yangi",
    title: "Ustozona yoʻlga chiqdi",
    body:
      "Birinchi versiya: sinflar, davomat va dars jadvali. Hammasi oʻqituvchining kundalik ishini yengillashtirish uchun.",
  },
];

/** Koʻrilmagan yozuvlar soni. Hisoblagich usuli: localStorage'da oxirgi
    koʻrilgan yozuvlar SONI saqlanadi — bir kunda ikki reliz chiqsa ham
    ikkinchisi yoʻqolmaydi (sana taqqoslashda yoʻqolardi). */
export function unseenChangelogCount(seenCount: number | null): number {
  if (seenCount === null) return CHANGELOG_ENTRIES.length;
  return Math.max(0, CHANGELOG_ENTRIES.length - seenCount);
}

/** Sana boʻyicha guruhlar (eng yangisi birinchi). Isteʼmolchi useMemo'da
    bir marta chaqiradi. Sort — qoʻlda tahrirda tartib buzilsa himoya. */
export function groupChangelogByDate(): { date: string; items: ChangelogEntry[] }[] {
  const sorted = [...CHANGELOG_ENTRIES].sort((a, b) =>
    a.date === b.date ? 0 : a.date < b.date ? 1 : -1
  );
  const groups: { date: string; items: ChangelogEntry[] }[] = [];
  for (const entry of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === entry.date) last.items.push(entry);
    else groups.push({ date: entry.date, items: [entry] });
  }
  return groups;
}

/** "YYYY-MM-DD" → "15-iyul, 2026". */
export function fmtChangelogDateUz(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const month = MONTHS_UZ[(m ?? 1) - 1] ?? "";
  return `${d}-${month.toLowerCase()}, ${y}`;
}
