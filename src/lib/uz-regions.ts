/* ════════════════════════════════════════════════════════════════════
   OʻZBEKISTON MAʼMURIY BOʻLINISHI — maktab manzili uchun.

   Nega roʻyxat, erkin matn emas: yoʻl xaritasidagi "Ustozona Boshqaruv"
   maktab → tuman → viloyat → vazirlik ierarxiyasida yigʻma hisobot
   beradi. Erkin matnda bu imkonsiz — bazada allaqachon "30",
   "23-MAKTAB", "Termiz tuman 23-maktab" kabi qiymatlar yotibdi
   (`teachers.school` ustuni shu holga tushgan).

   Har viloyatda avval SHAHARLAR (tuman maqomidagi), keyin tumanlar —
   alifbo tartibida. Maktab manzili uchun bu farq muhim: "Andijon
   shahri" va "Andijon tumani" boshqa-boshqa joylar.

   ⚠️ ROʻYXAT OʻZGARADI: Oʻzbekistonda yangi tumanlar tuzilib turadi
   (Taxiatosh — 2017, Boʻzatov — 2019). Yangilashda oʻzbekcha
   Vikipediyaga ISHONMANG: 2026-08 da u Qoraqalpogʻistonda 14 ta tuman
   sanab, matnida "16 ta" deb yozib turgan edi — ikkalasi yetishmayotgan
   edi. Inglizcha Vikipediya (viloyat sahifalari) yangiroq boʻldi.

   Manba: en.wikipedia.org viloyat sahifalari, 2026-08-22.
   ════════════════════════════════════════════════════════════════════ */

import { compareUz } from "./collation";

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

/** Viloyat → tuman/shahar roʻyxati. Barcha 14 viloyat qamrab olingan. */
export const UZ_DISTRICTS: Record<string, string[]> = {
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

  "Andijon viloyati": [
    "Andijon shahri",
    "Xonobod shahri",
    "Andijon tumani",
    "Asaka tumani",
    "Baliqchi tumani",
    "Boʻston tumani",
    "Buloqboshi tumani",
    "Izboskan tumani",
    "Jalaquduq tumani",
    "Marhamat tumani",
    "Oltinkoʻl tumani",
    "Paxtaobod tumani",
    "Qoʻrgʻontepa tumani",
    "Shahrixon tumani",
    "Ulugʻnor tumani",
    "Xoʻjaobod tumani",
  ],

  "Buxoro viloyati": [
    "Buxoro shahri",
    "Kogon shahri",
    "Buxoro tumani",
    "Gʻijduvon tumani",
    "Jondor tumani",
    "Kogon tumani",
    "Olot tumani",
    "Peshku tumani",
    "Qorakoʻl tumani",
    "Qorovulbozor tumani",
    "Romitan tumani",
    "Shofirkon tumani",
    "Vobkent tumani",
  ],

  "Fargʻona viloyati": [
    "Fargʻona shahri",
    "Margʻilon shahri",
    "Qoʻqon shahri",
    "Quvasoy shahri",
    "Bagʻdod tumani",
    "Beshariq tumani",
    "Buvayda tumani",
    "Dangʻara tumani",
    "Fargʻona tumani",
    "Furqat tumani",
    "Oltiariq tumani",
    "Oʻzbekiston tumani",
    "Qoʻshtepa tumani",
    "Quva tumani",
    "Rishton tumani",
    "Soʻx tumani",
    "Toshloq tumani",
    "Uchkoʻprik tumani",
    "Yozyovon tumani",
  ],

  "Jizzax viloyati": [
    "Jizzax shahri",
    "Arnasoy tumani",
    "Baxmal tumani",
    "Doʻstlik tumani",
    "Forish tumani",
    "Gʻallaorol tumani",
    "Mirzachoʻl tumani",
    "Paxtakor tumani",
    "Sharof Rashidov tumani",
    "Yangiobod tumani",
    "Zafarobod tumani",
    "Zarbdor tumani",
    "Zomin tumani",
  ],

  "Namangan viloyati": [
    "Namangan shahri",
    "Chortoq tumani",
    "Chust tumani",
    "Kosonsoy tumani",
    "Mingbuloq tumani",
    "Namangan tumani",
    "Norin tumani",
    "Pop tumani",
    "Toʻraqoʻrgʻon tumani",
    "Uchqoʻrgʻon tumani",
    "Uychi tumani",
    "Yangiqoʻrgʻon tumani",
  ],

  "Navoiy viloyati": [
    "Navoiy shahri",
    "Gʻozgʻon shahri",
    "Zarafshon shahri",
    "Karmana tumani",
    "Konimex tumani",
    "Navbahor tumani",
    "Nurota tumani",
    "Qiziltepa tumani",
    "Tomdi tumani",
    "Uchquduq tumani",
    "Xatirchi tumani",
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

  "Samarqand viloyati": [
    "Samarqand shahri",
    "Kattaqoʻrgʻon shahri",
    "Bulungʻur tumani",
    "Ishtixon tumani",
    "Jomboy tumani",
    "Kattaqoʻrgʻon tumani",
    "Narpay tumani",
    "Nurobod tumani",
    "Oqdaryo tumani",
    "Pastdargʻom tumani",
    "Paxtachi tumani",
    "Payariq tumani",
    "Qoʻshrabot tumani",
    "Samarqand tumani",
    "Toyloq tumani",
    "Urgut tumani",
  ],

  "Sirdaryo viloyati": [
    "Guliston shahri",
    "Shirin shahri",
    "Yangiyer shahri",
    "Boyovut tumani",
    "Guliston tumani",
    "Mirzaobod tumani",
    "Oqoltin tumani",
    "Sardoba tumani",
    "Sayxunobod tumani",
    "Sirdaryo tumani",
    "Xovos tumani",
  ],

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

  "Toshkent viloyati": [
    "Nurafshon shahri",
    "Angren shahri",
    "Bekobod shahri",
    "Chirchiq shahri",
    "Ohangaron shahri",
    "Olmaliq shahri",
    "Yangiyoʻl shahri",
    "Bekobod tumani",
    "Boʻka tumani",
    "Boʻstonliq tumani",
    "Chinoz tumani",
    "Ohangaron tumani",
    "Oqqoʻrgʻon tumani",
    "Oʻrtachirchiq tumani",
    "Parkent tumani",
    "Piskent tumani",
    "Quyichirchiq tumani",
    "Toshkent tumani",
    "Yangiyoʻl tumani",
    "Yuqorichirchiq tumani",
    "Zangiota tumani",
    "Qibray tumani",
  ],

  "Toshkent shahri": [
    "Bektemir tumani",
    "Chilonzor tumani",
    "Mirobod tumani",
    "Mirzo Ulugʻbek tumani",
    "Olmazor tumani",
    "Sergeli tumani",
    "Shayxontohur tumani",
    "Uchtepa tumani",
    "Yakkasaroy tumani",
    "Yangihayot tumani",
    "Yashnobod tumani",
    "Yunusobod tumani",
  ],

  "Xorazm viloyati": [
    "Urganch shahri",
    "Xiva shahri",
    "Bogʻot tumani",
    "Gurlan tumani",
    "Hazorasp tumani",
    "Qoʻshkoʻpir tumani",
    "Shovot tumani",
    "Tuproqqalʼa tumani",
    "Urganch tumani",
    "Xiva tumani",
    "Xonqa tumani",
    "Yangiariq tumani",
    "Yangibozor tumani",
  ],
};

/* ── Alifbo tartibi ───────────────────────────────────────────────────

   Roʻyxatlar yuqorida qoʻlda "shaharlar → tumanlar" tartibida yozilgan
   (oʻqib chiqish oson boʻlsin uchun), lekin foydalanuvchi ularni ALIFBO
   boʻyicha izlaydi. Shu bois eksportdan oldin bir marta saralanadi.

   ⚠️ Oddiy `.sort()` EMAS: oʻzbek lotin alifbosida Oʻ, Gʻ, Sh, Ch
   alifbo oxirida turadi (`compareUz` — src/lib/collation.ts). */

const sortedRegions = [...UZ_REGIONS].sort(compareUz);
const sortedDistricts: Record<string, string[]> = Object.fromEntries(
  Object.entries(UZ_DISTRICTS).map(([r, list]) => [r, [...list].sort(compareUz)])
);

/** Viloyatlar — oʻzbek alifbosi tartibida. */
export const UZ_REGIONS_SORTED: readonly string[] = sortedRegions;

/** Shu viloyat uchun tuman/shahar roʻyxati — oʻzbek alifbosi tartibida. */
export function districtsOf(region: string | null | undefined): string[] {
  if (!region) return [];
  return sortedDistricts[region] ?? [];
}
