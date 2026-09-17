import type { HelpArticle } from "../help-content";

export const ARTICLE_BOLIM_VA_DARSLAR: HelpArticle = {
  slug: "bolim-va-darslar",
  categorySlug: "darslar",
  title: "Boʻlim va darslarni qoʻshish",
  metaTitle: "Boʻlim va darslarni qoʻshish | Ustozona Yordam",
  intro:
    "Darslar sahifasi uch ustundan iborat: sinflar, boʻlimlar va tanlangan boʻlimning darslari. Avval sinfni tanlaysiz, keyin boʻlimlar yaratasiz, soʻng har boʻlim ichiga darslarni qoʻshasiz. Ish rejangiz Excel faylda boʻlsa, butun yillik rejani bir necha daqiqada kiritish va dars jadvaliga joylash mumkin.",
  sections: [
    {
      id: "bolim-qoshish",
      short: "Boʻlim qoʻshish",
      icon: "layoutGrid",
      title: "Boʻlim qoʻshish",
      paragraphs: [
        "Boʻlimlar ustunidagi \"Boʻlim qoʻshish\" tugmasini bosing. Uchta yoʻldan birini tanlaysiz: \"Bitta boʻlim\" — nom, sinflar va tavsifni qoʻlda kiritasiz; \"Nusxa koʻchirish\" — boʻlimlar roʻyxatini Word yoki Excelʼdan joylashtirasiz; \"Excel yuklash\" — roʻyxat boʻlgan faylni yuklaysiz.",
        "Roʻyxat yoki fayl tanlanganda oyna ikki qismga boʻlinadi: chapda matn yoki fayl, oʻngda tayyor roʻyxat. Chapda yozganingiz oʻngda darhol paydo boʻladi. Oʻngda ⠿ belgisidan ushlab tartibni oʻzgartirasiz, nomni tuzatasiz yoki keraksizini oʻchirasiz.",
        "Tepadagi \"Sinflarga bogʻlash\" maydonida bir nechta sinfni belgilasangiz, har sinfda shu boʻlimlar yaratiladi. Sinfda shu nomli boʻlim allaqachon boʻlsa, u \"Bor\" deb belgilanadi va qayta yaratilmaydi.",
      ],
    },
    {
      id: "dars-qoshish",
      short: "Dars qoʻshish",
      icon: "fileText",
      title: "Boʻlimga darslar qoʻshish",
      paragraphs: [
        "Darslar faqat boʻlim ichida yaratiladi. Boʻlimni tanlang va \"Yangi dars\"ni bosing. Bu yerda ham uchta yoʻl bor: \"Bitta dars\" — dars muharririni ochadi; \"Nusxa koʻchirish\" — mavzular roʻyxatini joylashtirasiz; \"Excel yuklash\" — ish reja faylini yuklaysiz. Har bir mavzu alohida dars boʻladi.",
        "Nusxa koʻchirganda har qatorga bitta mavzu yozing. Tartib raqamlari (\"1.\", \"12-dars\") va \"1-chorak\", \"2-yarim yillik\" kabi ajratkich qatorlar avtomatik olib tashlanadi.",
        "Bir nechta sinfni belgilasangiz, har mavzu shu sinflar uchun bitta umumiy dars boʻladi — alohida nusxalar yaratilmaydi. Boshqa sinflarda shu nomli boʻlim boʻlmasa, u avtomatik yaratiladi.",
      ],
      callout: {
        type: "tip",
        text: "Boʻlimda allaqachon bor mavzular \"Bor\" deb belgilanadi va standart holatda oʻtkazib yuboriladi. Bir faylni adashib ikki marta yuklasangiz ham darslar takrorlanmaydi.",
      },
    },
    {
      id: "excel-fayl",
      short: "Excel fayl",
      icon: "clipboardList",
      title: "Excel ish rejasini yuklash",
      paragraphs: [
        "Fayl .xlsx, .xls yoki .csv boʻlishi mumkin. Tizim barcha varaqlardan \"Mavzu\" (boʻlimlarda \"Boʻlim\") sarlavhali ustunni topadi, \"Soat\" ustuni boʻlsa uni ham oladi. Natija yashil xabarda koʻrinadi: \"Mavzular «Mavzu nomi» ustunidan, soatlar «Soat» ustunidan olindi\".",
        "Ustun notoʻgʻri tanlangan boʻlsa, \"Jadvalda koʻrsatish\"ni bosing. Faylning boshi jadval boʻlib ochiladi: mavzu ustuni yashil, soat ustuni sariq rangda. Ustun nomini bosib uni \"Mavzu\" yoki \"Soat\" deb belgilaysiz, qator raqamini bosib shu qatorni sarlavha qilasiz. Chizib qoʻyilgan qatorlar oʻtkazib yuboriladi. Faylda bir nechta varaq boʻlsa, fayl nomi ostida varaq tanlanadi.",
        "\"2+ soat → har soatga dars\" yoqilgan boʻlsa, 2 soatlik mavzu ikkita dars boʻladi. Roʻyxat ustidagi xulosada nechta qator oʻtkazib yuborilgani va nechta mavzu takrorlangani yoziladi. Xulosani bossangiz, oʻtkazilgan qatorlarni koʻrasiz va \"Qoʻshish\" bilan qaytarasiz.",
        "Faylingiz qanday boʻlishi kerakligini bilmasangiz, oynaning pastidagi \"Namuna faylni yuklab olish\" tugmasidan tayyor shablonni oling.",
      ],
    },
    {
      id: "jadvalga-joylash",
      short: "Jadvalga joylash",
      icon: "calendar",
      title: "Darslarni dars jadvaliga joylash",
      paragraphs: [
        "Mavzular tayyor boʻlgach \"Keyingi\"ni bosing. Darslar sinfning dars jadvalidagi navbatdagi boʻsh soatlarga ketma-ket qoʻyiladi: roʻyxatdagi 1-mavzu birinchi boʻsh darsga, 2-mavzu keyingisiga va hokazo. Taʼtil kunlari va boshqa darslar band qilgan soatlar oʻtkazib yuboriladi.",
        "Tepada toʻrtta raqam turadi: darslar soni, boshlanish va tugash sanasi, hamma darslar oʻquv yiliga sigʻdimi. Ostida oʻquv yili chizigʻi bor: kulrang — sinfdagi mavjud boʻlimlar, yashil — yangi qoʻshilayotgan boʻlim, chiziqli joylar — taʼtillar, qizil chiziq — bugun. Bir nechta sinf tanlangan boʻlsa, har sinf alohida qatorda koʻrinadi.",
        "Standart holatda navbat \"Birinchi boʻsh dars\"dan boshlanadi — oldingi boʻlimlar tugagan joydan davom etadi. \"Navbat boshlanishi\" tugmasi orqali \"Eng yaqin dars\" (bugundan keyingi) yoki \"Birinchi dars\" (oʻquv yili boshi)ni tanlash yoki kalendardan boshqa kunni belgilash mumkin. Har bir darsning aniq sanasini \"Har bir dars sanasini koʻrish\" roʻyxatida tekshirasiz.",
        "Darslarni hozircha kunlarga bogʻlamoqchi boʻlmasangiz, \"Sanasiz saqlash\"ni bosing — ularni keyin rejalashtiruvchida joylashtirasiz. Sinfning dars jadvali hali sozlanmagan boʻlsa, bu bosqich chiqmaydi va darslar sanasiz saqlanadi.",
      ],
      callout: {
        type: "warning",
        text: "Xulosada \"… ta sigʻmadi\" yozuvi chiqsa, oʻquv yilida shuncha darsga boʻsh soat qolmagan. Boshqa boshlanish sanasini tanlang yoki mavzular sonini kamaytiring.",
      },
    },
    {
      id: "bekor-qilish",
      short: "Bekor qilish",
      icon: "target",
      title: "Importni bekor qilish",
      paragraphs: [
        "Saqlagandan keyin ekran pastida \"… ta dars qoʻshildi\" xabari bir necha soniya turadi. Undagi \"Bekor qilish\" tugmasi shu importda yaratilgan hamma narsani — darslarni, ularning jadvaldagi joylarini va boshqa sinflarda yaratilgan boʻlimlarni — bir bosishda olib tashlaydi. Boʻlim importi ham xuddi shunday bekor qilinadi.",
      ],
    },
  ],
};
