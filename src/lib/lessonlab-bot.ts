import "server-only";

/* LessonLab boti — havola yasash uchun yagona manba.

   ⚠️ `server-only`: `LESSONLAB_BOT_USERNAME` — oddiy (NEXT_PUBLIC
   boʻlmagan) muhit oʻzgaruvchisi, yaʼni mijoz bundle'ida `undefined`
   boʻlib qolardi va havola `https://t.me/undefined?start=uzreg` deb
   yasalardi. Shuning uchun qiymat SERVERDA olinadi va mijoz
   komponentiga PROP sifatida uzatiladi.

   Standart qiymat `dal/account-link.ts` dagi bilan bir xil boʻlishi
   shart — ikkisi ajralib ketsa, bir havola ishlab ikkinchisi
   ishlamasdi. */
export const LESSONLAB_BOT_USERNAME =
  process.env.LESSONLAB_BOT_USERNAME || "uzlessonlabbot";

/** «Telegram bilan davom etish» — botga oʻtish havolasi.

    Payload'da SIR YOʻQ (`uzreg` hammaga bir xil) — ataylab. Sir faqat
    BOTDAN chiqadi: chiptani bot Telegram kimligini tasdiqlagandan
    keyin yaratadi. Teskarisi boʻlsa (havolada token bilan), havolani
    ilib olgan odam boshqa odamning telegramiga bogʻlangan akkaunt
    yaratib olardi. */
export const TELEGRAM_SIGNUP_URL = `https://t.me/${LESSONLAB_BOT_USERNAME}?start=uzreg`;
