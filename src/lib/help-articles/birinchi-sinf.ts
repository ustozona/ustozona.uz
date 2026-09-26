import type { HelpArticle } from "../help-content";

export const ARTICLE_BIRINCHI_SINF: HelpArticle = {
  slug: "birinchi-sinf",
  categorySlug: "boshlash",
  title: "Birinchi sinfni yaratish va oʻquvchi qoʻshish",
  metaTitle: "Birinchi sinfni yaratish | Ustozona Yordam",
  intro:
    "Oʻquv yili sozlangach, navbatdagi qadam — sinf yaratish. Sinf Ustozonadagi barcha ishning markazi: darslar, jurnal, davomat va reja shu sinfga bogʻlanadi. Sinfni yaratib boʻlgach, unga oʻquvchilarni qoʻshasiz.",
  sections: [
    {
      id: "sinf-yaratish",
      short: "Sinf yaratish",
      icon: "layoutGrid",
      title: "Sinfni qanday yaratish mumkin",
      paragraphs: [
        "1. Sinflar sahifasiga oʻting va \"+ Yangi sinf\" tugmasini bosing (birinchi sinf boʻlsa, boʻsh holat ekranidagi \"Sinf qoʻshish\" tugmasi ham xuddi shu oynani ochadi).",
        "2. Ikonka va rangni tanlang — bu sinfni roʻyxatda va jurnalda ajratib turadi.",
        "3. Sinf uchun bosqichni (1-11) va harfini (A, B, V...) tanlang — ism avtomatik hisoblanadi (masalan \"5-A\"). Agar bu bosqichli sinf boʻlmasa (masalan toʻgarak), bosqich oʻrniga erkin nom kiritish maydoni chiqadi.",
        "4. Xohlasangiz, fan nomini kiriting (ixtiyoriy).",
        "5. \"Yaratish\" tugmasini bosing.",
      ],
    },
    {
      id: "oquvchi-qoshish",
      short: "Oʻquvchi qoʻshish",
      icon: "users",
      title: "Sinfga oʻquvchi qoʻshish",
      paragraphs: [
        "Yaratilgan sinf ichida \"Oʻquvchilar\" boʻlimiga oʻting va \"Yangi oʻquvchi\" tugmasini bosing. Uch usuldan birini tanlashingiz mumkin:",
        "• Bitta oʻquvchi — ism-familiya kiritasiz (kamida bittasi shart), xohlasangiz \"Qoʻshimcha\" boʻlimida jins, tugʻilgan sana, ota-ona ismi va telefon raqamini ham qoʻshasiz.",
        "• Roʻyxatni joylashtirish — bir nechta ismni bir vaqtda (nusxa-joylashtirish orqali) qoʻshasiz, tizim qatorlarni avtomatik ajratadi.",
        "• Fayldan yuklash — CSV yoki Excel (XLS/XLSX) faylni tortib tashlaysiz; namuna fayl havolasi shu yerda mavjud.",
        "Roʻyxat yoki fayl orqali qoʻshilganda, ism/familiya ustunlari almashtirilib ketgan boʻlsa, koʻrib chiqish jadvalida har qatorni tuzatishingiz yoki ustunlarni almashtirishingiz mumkin — shundan keyingina yakuniy qoʻshish amalga oshadi.",
      ],
    },
  ],
};
