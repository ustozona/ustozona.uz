import type { HelpArticle } from "../help-content";

export const ARTICLE_DARS_JADVALINI_SOZLASH: HelpArticle = {
  slug: "dars-jadvalini-sozlash",
  categorySlug: "boshlash",
  title: "Dars jadvalini sozlash",
  metaTitle: "Dars jadvalini sozlash | Ustozona Yordam",
  intro:
    "Sinflaringiz tayyor boʻlgach, ularni haftalik dars jadvaliga joylashtirasiz. Bu ikki qadamdan iborat: avval qoʻngʻiroq jadvalini (dars boshlanish vaqtlari) sozlaysiz, keyin sinflarni kunlarga taqsimlaysiz.",
  sections: [
    {
      id: "qongiroq-jadvali",
      short: "Qoʻngʻiroq jadvali",
      icon: "clipboardCheck",
      title: "Qoʻngʻiroq jadvalini sozlash",
      paragraphs: [
        "Dars jadvali sahifasida yuqori oʻng burchakdagi \"⋯\" menyusidan \"Qoʻngʻiroq jadvali\"ni tanlang. Avval maktabingiz ish tartibini tanlang — bir smenali yoki ikki smenali (ikki smenali boʻlsa, 1- va 2-smena alohida sozlanadi).",
        "Har smena uchun tanaffus va katta tanaffus davomiyligini kiritasiz — dars boshlanish vaqti va darslar soni maktab standartlariga koʻra avtomatik hisoblanadi. Saqlaganingizda, agar vaqtlar oʻzgargan boʻlsa, allaqachon joylashtirilgan darslar yangi vaqtga avtomatik koʻchadi.",
      ],
    },
    {
      id: "sinflarni-joylashtirish",
      short: "Sinflarni joylashtirish",
      icon: "calendar",
      title: "Sinflarni jadvalga joylashtirish",
      paragraphs: [
        "Chap panelda barcha sinflaringiz roʻyxati, oʻngda esa haftalik jadval turadi. Kerakli sinf kartasini tortib, jadvaldagi kun/vaqt katagiga tashlang.",
        "Ikki koʻrinish mavjud: \"Kalendar\" rejimida istalgan vaqtga (15 daqiqalik qadam bilan) erkin joylashtirasiz; \"Katakcha\" rejimida esa qoʻngʻiroq jadvali asosida tayyor darslar katakchasiga bosib joylashtirasiz.",
        "Joylashtirilgan darsni surish uchun uni tortib boshqa joyga qoʻying, davomiyligini oʻzgartirish uchun chekkasidan torting. Darsni bosganda ochiladigan oynada vaqtini tahrirlash yoki oʻchirish mumkin.",
      ],
    },
    {
      id: "versiyalar",
      short: "Versiyalar",
      icon: "target",
      title: "Jadval oʻzgarsa nima boʻladi",
      paragraphs: [
        "Jadvalga oʻzgartirish kiritganingizda, tizim \"Qачondan kuchga kiradi?\" deb soʻraydi — oʻzgarishni joriy jadvalga darhol qoʻllash yoki tanlangan sanadan boshlab yangi versiya sifatida saqlash mumkin. Bu semestr davomida jadval oʻzgarsa (masalan yangi oʻquvchi kelsa), eski davr yozuvlari buzilmasligini taʼminlaydi.",
        "Oʻtgan (arxivlangan) versiyalar qulflangan holda saqlanadi — ularni tahrirlash uchun avval ochib olish kerak boʻladi.",
      ],
    },
  ],
};
