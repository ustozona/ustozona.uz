/* ════════════════════════════════════════════════════════════════════
   OʻZBEKISTON MAʼMURIY BOʻLINISHI — maktab manzili uchun.

   Nega roʻyxat, erkin matn emas: yoʻl xaritasidagi "Ustozona Boshqaruv"
   maktab → tuman → viloyat → vazirlik ierarxiyasida yigʻma hisobot
   beradi. Erkin matnda bu imkonsiz — bazada allaqachon "30",
   "23-MAKTAB", "Termiz tuman 23-maktab" kabi qiymatlar yotibdi
   (`teachers.school` ustuni shu holga tushgan).

   ⚠️ TUMANLAR HAMMA VILOYATDA YOʻQ. Ataylab: birinchi foydalanuvchilar
   Surxondaryo, Qashqadaryo va Qoraqalpogʻistonda ishlaydi (asoschi,
   2026-08-22), shu uchta viloyat toʻldirildi. Qolganlarida tuman
   maydoni matn boʻlib qoladi — YOʻQ maʼlumotni toʻqib yozgandan koʻra
   yoʻqligini bildirgan maʼqul.

   ⚠️ Roʻyxat OʻZGARADI: Oʻzbekistonda yangi tumanlar tuzilib turadi
   (Taxiatosh — 2017, Boʻzatov — 2019). Yangilashda oʻzbekcha
   Vikipediyaga ishonmang: 2026-08 da u Qoraqalpogʻistonda 14 ta tuman
   sanab, "16 ta" deb yozib turgan edi — ikkalasi yetishmayotgan edi.
   ════════════════════════════════════════════════════════════════════ */

export const UZ_REGIONS = [
  "Qoraqalpogʻiston Respublikasi",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Fargʻona viloyati",
  "Jizzax viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
  "Toshkent viloyati",
  "Toshkent shahri",
  "Xorazm viloyati",
] as const;

export type UzRegion = (typeof UZ_REGIONS)[number];

/** Viloyat → tuman/shahar. Boʻsh roʻyxat = maʼlumot hali yigʻilmagan. */
export const UZ_DISTRICTS: Record<string, string[]> = {
  "Surxondaryo viloyati": [
    "Termiz shahri",
    "Denov shahri",
    "Angor tumani",
    "Bandixon tumani",
    "Boysun tumani",
    "Denov tumani",
    "Jarqoʻrgʻon tumani",
    "Muzrabot tumani",
    "Oltinsoy tumani",
    "Qiziriq tumani",
    "Qumqoʻrgʻon tumani",
    "Sariosiyo tumani",
    "Sherobod tumani",
    "Shoʻrchi tumani",
    "Termiz tumani",
    "Uzun tumani",
  ],
  "Qashqadaryo viloyati": [
    "Qarshi shahri",
    "Shahrisabz shahri",
    "Chiroqchi tumani",
    "Dehqonobod tumani",
    "Gʻuzor tumani",
    "Kasbi tumani",
    "Kitob tumani",
    "Koson tumani",
    "Koʻkdala tumani",
    "Mirishkor tumani",
    "Muborak tumani",
    "Nishon tumani",
    "Qamashi tumani",
    "Qarshi tumani",
    "Shahrisabz tumani",
    "Yakkabogʻ tumani",
  ],
  "Qoraqalpogʻiston Respublikasi": [
    "Nukus shahri",
    "Amudaryo tumani",
    "Beruniy tumani",
    "Boʻzatov tumani",
    "Chimboy tumani",
    "Ellikqalʼa tumani",
    "Kegeyli tumani",
    "Moʻynoq tumani",
    "Nukus tumani",
    "Qanlikoʻl tumani",
    "Qoraoʻzak tumani",
    "Qoʻngʻirot tumani",
    "Shumanay tumani",
    "Taxiatosh tumani",
    "Taxtakoʻpir tumani",
    "Toʻrtkoʻl tumani",
    "Xoʻjayli tumani",
  ],
};

/** Shu viloyat uchun tuman roʻyxati bormi (yoʻq boʻlsa — matn maydoni). */
export function districtsOf(region: string | null | undefined): string[] {
  if (!region) return [];
  return UZ_DISTRICTS[region] ?? [];
}
