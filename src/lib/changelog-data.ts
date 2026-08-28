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
    id: "jamoa-ish-maydoni",
    date: "2026-08-26",
    type: "yangi",
    title: "Endi maktab boʻlib birga ishlash mumkin — bir necha oʻqituvchi, bitta oʻquvchilar roʻyxati",
    body:
      "Sozlamalar › Jamoa boʻlimida hamkasbingizga taklif kodi berasiz. U qoʻshilganda sinflari va oʻquvchilari bilan birga keladi — qabul qilishdan oldin nima koʻchishini roʻyxat bilan koʻradi. Har sinfning egasi bor: darsni kim oʻtishini u belgilaydi, bitta sinfga bir necha oʻqituvchi biriktirilishi mumkin. Bola haqidagi baho, davomat va qaydlarni esa faqat oʻsha bolaga dars beradigan oʻqituvchi koʻradi — bir maktabda ishlashning oʻzi hech narsani ochmaydi.",
    href: "/dashboard/settings",
  },
  {
    id: "help-center-launch",
    date: "2026-08-26",
    type: "yangi",
    title: "Yangi boʻlim: Yordam markazi",
    body:
      "Endi ustozona.uz/help sahifasida barcha mavzular boʻyicha qoʻllanma maqolalarni topasiz — chapdan boʻlimni tanlaysiz yoki qidiruvdan foydalanasiz. Har maqola oxirida foydali boʻldimi deb soʻraladi, keyingi mavzuga oʻtish tugmasi ham bor. Hali yozilmagan mavzular \"Tez orada\" deb belgilangan.",
    href: "/help",
  },
  {
    id: "feedback-slash-internal-links",
    date: "2026-08-25",
    type: "yaxshilandi",
    title: "Fikr-mulohazada ilova ichidagi sahifalarga havola berish oson boʻldi",
    body:
      "Xabar yozayotganda \"/\" bossangiz, ilova ichidagi sahifalar roʻyxati chiqadi — tanlasangiz havola oʻzi qoʻshiladi. Rasm biriktirilgan boʻlsa, endi ustiga bosib kattalashtirib koʻrish mumkin.",
    href: "/dashboard/feedback",
  },
  {
    id: "landing-til-tanlash",
    date: "2026-08-24",
    type: "yangi",
    title: "Bosh sahifa endi 7 tilda — oʻzbekcha (lotin va kirill), qoraqalpoqcha, qirgʻizcha, qozoqcha, ruscha, inglizcha",
    body:
      "Ustozona bosh sahifasidagi barcha boʻlimlar tarjima qilindi va yuqori burchakka til tanlagich qoʻshildi. Oʻzbek tilining kirill yozuvi ham qoʻshildi — sozlamalarda ham, bosh sahifada ham tanlash mumkin.",
  },
  {
    id: "topshiriq-qoralama-royxatda",
    date: "2026-08-16",
    type: "yaxshilandi",
    title: "Tugallanmagan topshiriq endi roʻyxatda turadi va yoʻqolmaydi",
    body:
      "Muharrirni yopsangiz hech nima soʻralmaydi — qoralama Topshiriqlar roʻyxatida karta boʻlib turadi, bosib davom ettirasiz. Boshqa sinfda «+» bossangiz ham eski qoralamangiz oʻchib ketmaydi, oʻsha ochiladi. Kichraytirish tugmasi va burchakdagi yorliq kerak boʻlmay qoldi.",
    href: "/dashboard/assignments",
  },
  {
    id: "topshiriq-holat-raqami",
    date: "2026-08-16",
    type: "yaxshilandi",
    title: "Topshiriq sarlavhasida endi «nechtasi baholandi» koʻrinadi",
    body:
      "«Baholanmoqda» degan noaniq yozuv oʻrniga toʻlib boruvchi halqa va aniq raqam: 12/25. Bugun oʻtadigan ish «Bugun» deb belgilanadi, bir necha sinfga berilgan topshiriqda esa hali oʻtmagan sinf hisobga olinmaydi. Doimiy «Saqlandi» yozuvi olib tashlandi — endi u faqat oʻzgarish serverga yetmasa gapiradi.",
    href: "/dashboard/assignments",
  },
  {
    id: "topshiriq-maks-ball-ogohlantirish",
    date: "2026-08-16",
    type: "tuzatildi",
    title: "Maks. ballni oʻzgartirsangiz, nechta baho qayta hisoblangani aytiladi",
    body:
      "Ilgari 10 ballik ishni 100 ballik qilib qoʻysangiz, katakdagi «8» oʻsha-oʻsha turardi-yu, 80% jimgina 8% ga aylanardi. Endi «25 ta baho qayta hisoblandi» deb yoziladi va darhol bekor qilsa boʻladi.",
    href: "/dashboard/assignments",
  },
  {
    id: "test-oraliq-ekran-olib-tashlandi",
    date: "2026-08-16",
    type: "yaxshilandi",
    title: "Testga oʻtish qisqardi — oraliq «Testlar» roʻyxati olib tashlandi",
    body:
      "Topshiriqdan test tuzsangiz yoki sessiya oʻtkazsangiz, endi toʻgʻridan-toʻgʻri oʻsha joyga tushasiz: ortiqcha bir oyna yoʻqoldi. Sinfning barcha testlari Topshiriqlar sahifasida turadi. Bir xil nomli test ikki marta yaratilib qoladigan xato ham tuzatildi.",
    href: "/dashboard/assignments",
  },
  {
    id: "topshiriq-maks-ball-chiplari",
    date: "2026-08-16",
    type: "yaxshilandi",
    title: "Maks. ball uchun tez tanlash — koʻp ishlatgan qiymatlaringiz bir bosishda",
    href: "/dashboard/assignments",
  },
  {
    id: "topshiriq-yoriqnoma",
    date: "2026-08-16",
    type: "yangi",
    title: "Topshiriqqa yoʻriqnoma yozib qoʻyiladi",
    body:
      "Sarlavha ostidagi yangi maydonga topshiriq shartini yozasiz — «5-mashq, 2-bandigacha» yoki qanday baholanishi. Keyin ochganingizda oʻsha yerda turadi, esdan chiqmaydi.",
    href: "/dashboard/assignments",
  },
  {
    id: "topshiriq-mazmun-biriktirish",
    date: "2026-08-16",
    type: "yaxshilandi",
    title: "Topshiriqqa test istalgan payt biriktiriladi",
    body:
      "Ilgari topshiriq turini faqat yaratayotganda tanlash mumkin edi — keyin fikringiz oʻzgarsa yoʻl yoʻq edi. Endi mazmun topshiriqning oʻz muharririda turadi: tayyor ustunga yangi test tuzasiz yoki bankdan olgan, ilgari tuzgan testingizni tanlab biriktirasiz. Test biriktirilishi bilan jurnalda ustun paydo boʻladi — qogʻozda oʻtkazsangiz ham baho oʻsha ustunga yoziladi.",
    href: "/dashboard/assignments",
  },
  {
    id: "sinf-import-eksport",
    date: "2026-08-10",
    type: "yangi",
    title: "Sinflarni bir yoʻla qoʻshish va faylga chiqarish",
    body:
      "«Yangi sinf» yonidagi tugmachadan sinflar roʻyxatini joylashtirasiz yoki jadval faylini berasiz — «Sinf» ustuni boʻlsa oʻquvchilar ham oʻz sinfiga tushadi. Tasdiqdan oldin nechta yangi sinf ochilishi koʻrinadi, allaqachon bor sinf qayta yaratilmaydi. Shu yerdan barcha sinflarni oʻquvchilari bilan faylga chiqarsa ham boʻladi.",
    href: "/dashboard/classes",
  },
  {
    id: "baholash-card-scanner",
    date: "2026-08-06",
    type: "yangi",
    title: "Telefonsiz sinf uchun QR-kartalar",
    body:
      "Har oʻquvchiga bitta karta chop etiladi — javob berish uchun kartani burab koʻtaradi (A/B/C/D), qurilma kerak emas. Kamerani sinfga qaratsangiz, barcha javoblar bir zumda oʻqiladi.",
    href: "/baholash",
  },
  {
    id: "baholash-live-scanner",
    date: "2026-08-06",
    type: "yaxshilandi",
    title: "Qogʻoz test — endi bitta-bitta surat kerak emas",
    body:
      "Javob varaqlarini telefon kamerasiga tutib turasiz — har varaq oʻzi topilib oʻqiladi, natija darhol ekranda koʻrinadi. Suratga olib yuklash yoʻli ham ishlayveradi.",
    href: "/baholash",
  },
  {
    id: "baholash-phone-handoff",
    date: "2026-08-05",
    type: "yangi",
    title: "Qogʻoz test — telefonga havola yubormasdan oʻtish",
    body:
      "Kompyuterda \"Telefonda skanerlash\" tugmasini bossangiz, ekranda QR chiqadi. Telefon kamerasini shunga tutsangiz, tizimga kirmasdan skaner sahifasi ochiladi.",
    href: "/baholash",
  },
  {
    id: "baholash-paper-scan-launch",
    date: "2026-08-05",
    type: "yangi",
    title: "Qogʻoz test — javob varaqlarini Ustozonaning oʻzida tekshirish",
    body:
      "Baholash boʻlimida endi javob varaqlarini chop etib, telefon kamerasi bilan tekshirish mumkin. Natija darhol sinf jurnaliga tayyor holda tushadi — qoʻlda kiritish shart emas.",
    href: "/baholash",
  },
  {
    id: "assignments-draft-tests-visible",
    date: "2026-08-05",
    type: "tuzatildi",
    title: "Tuzilgan test endi Topshiriqlar sahifasida koʻrinadi",
    body:
      "Topshiriqlar boʻlimida yangi test yaratganingizdan keyin sahifa boʻsh koʻrinib, ish yoʻqolgandek tuyulardi. Endi tuzilgan testlar alohida roʻyxatda turadi va jurnalga hali chiqmaganini ochiq aytadi.",
    href: "/dashboard/assignments",
  },
  {
    id: "assignment-draft-persist",
    date: "2026-08-02",
    type: "yangi",
    title: "Topshiriq qoralamasi endi yoʻqolmaydi",
    href: "/dashboard/grades",
  },
  {
    id: "assignment-date-mode-toggle",
    date: "2026-08-02",
    type: "yaxshilandi",
    title: "Topshiriqda Sana va Soʻngmuddat tanlovi ravshanlashdi",
    href: "/dashboard/grades",
  },
  {
    id: "flexible-periods",
    date: "2026-08-01",
    type: "yaxshilandi",
    title: "Oʻquv yili — choraklar endi majburiy emas",
    body:
      "Sozlamalar → Oʻquv yilida shablon tanlaysiz: 4 chorak, 2 semestr, 3 trimestr yoki umuman davrsiz. Har davrning nomi va sanasini oʻzingiz yozasiz, kerak boʻlsa qoʻshasiz yoki oʻchirasiz. Yil nomini ham qoʻlda oʻzgartirish mumkin — masalan \"Yozgi kurs 2026\".",
    href: "/dashboard/settings",
  },
  {
    id: "class-name-structured",
    date: "2026-08-01",
    type: "yaxshilandi",
    title: "Sinf nomi — daraja va harf alohida tanlanadi",
    body:
      "Sinf yaratganda nomni qoʻlda yozish oʻrniga darajani (5, 6, 7…) va parallel harfini (A, B, D…) tanlaysiz, nom esa oʻzi hosil boʻladi. Toʻgarak kabi guruhlar uchun erkin nom maydoni qoldi. Shuning barakasida eski oʻquv yiliga qaytganingizda sinf oʻsha yildagi nomi bilan koʻrinadi — 5-A yana 5-A boʻladi.",
    href: "/dashboard/classes",
  },
  {
    id: "blog-launch",
    date: "2026-08-01",
    type: "yangi",
    title: "Yangi boʻlim: Blog",
    body:
      "Endi oʻz maqolalaringizni yozib, nashr qilishingiz mumkin — hamma oʻqituvchilarning postlari ustozona.uz/blog sahifasida birga koʻrinadi, kimdir fikr ham bildira oladi. Yozish uchun \"Yozish\" tugmasidan foydalaning.",
    href: "/blog",
  },
  {
    id: "today-rail-create-link",
    date: "2026-07-28",
    type: "yangi",
    title: "Bugungi darslar — rejasiz slotga yaratish/ulash",
    body: "Kartaga hover qilganda \"Reja yoʻq\" yozuvi oʻrniga ikkita tez amal chiqadi: yangi mavzu yaratish yoki mavjud mavzuni shu darsga ulash — rejalashtiruvchidagi bilan bir xil.",
    href: "/dashboard",
  },
  {
    id: "next-lessons-status-icons",
    date: "2026-07-28",
    type: "yaxshilandi",
    title: "Kelgusi darslar — holat belgilari",
    body: "Har bir dars qatoridagi holat belgisi endi nuqta oʻrniga tushunarli ikonka bilan koʻrsatiladi (bajarildi, rejalashtirilgan, rejasiz, qoralama).",
    href: "/dashboard",
  },
  {
    id: "home-hero-quotes",
    date: "2026-07-28",
    type: "yangi",
    title: "Bosh sahifa — kunlik iqtibos",
    body: "Boshqa sahifaga oʻtib qaytganingizda salom oʻrniga tasodifiy iqtibos koʻrinadi. Roʻyxat kengaytirildi; oʻzingiznikini qoʻshsangiz matnni qalin, kursiv, tagi chizilgan yoki rangli qilib belgilash mumkin.",
    href: "/dashboard",
  },
  {
    id: "planner-class-holiday-filters",
    date: "2026-07-28",
    type: "yangi",
    title: "Rejalashtiruvchi — sinf va bayram filtri qoʻshildi",
    body: "Endi kalendarda faqat kerakli sinflarni koʻrsatish (qidiruv bilan tanlash) va bloklangan kunlar/bayramlar roʻyxatini bir joyda koʻrish mumkin.",
    href: "/dashboard/planner",
  },
  {
    id: "planner-day-detail-panel",
    date: "2026-07-28",
    type: "yangi",
    title: "Rejalashtiruvchi — kunni bosib kunlik panel",
    body: "Oy koʻrinishida istalgan kunga bossangiz, chap tomonda oʻsha kunning toʻliq jadvali ochiladi. Darslarni shu yerdan sudrab boshqa vaqtga koʻchirish ham mumkin — klaviatura bilan ham.",
    href: "/dashboard/planner",
  },
  {
    id: "planner-full-day-zoom",
    date: "2026-07-27",
    type: "yaxshilandi",
    title: "Rejalashtiruvchi — toʻliq sutka va masshtab",
    body: "Hafta koʻrinishi endi butun sutkani qamraydi va 08:00 dan ochiladi, shuning uchun erta ertalabki va kechki darslar ham joylashadi. Pastdagi masshtab tugmasi bilan kunni zichroq yoki kengroq koʻrsatasiz.",
    href: "/dashboard/planner",
  },
  {
    id: "planner-direct-lesson-editor",
    date: "2026-07-27",
    type: "yaxshilandi",
    title: "Rejalashtiruvchi — dars muharriri bir bosishda",
    body: "Boʻsh joydagi Yaratish va dars menyusidagi Tahrirlash endi oraliq oynasiz, toʻgʻridan-toʻgʻri dars muharririga olib oʻtadi.",
    href: "/dashboard/planner",
  },
  {
    id: "calendar-event-card-redesign",
    date: "2026-07-27",
    type: "yaxshilandi",
    title: "Kalendar — dars bloklari yangi dizaynda",
    body: "Bosh sahifa, Rejalashtiruvchi va Jadvaldagi dars kartalari bir xil, yangi koʻrinishga oʻtdi: dars ulangan joy toʻyingan rangda, boʻsh joy esa xiraroq — ikkisi bir qarashda farqlanadi.",
    href: "/dashboard/planner",
  },
  {
    id: "planner-sticky-day-header",
    date: "2026-07-27",
    type: "tuzatildi",
    title: "Rejalashtiruvchi — kun sarlavhasi endi joyida turadi",
    href: "/dashboard/planner",
  },
  {
    id: "today-rail-hide-sunday",
    date: "2026-07-27",
    type: "yaxshilandi",
    title: "Bosh sahifa — yakshanbani haftalik tasmadan yashirish mumkin",
    href: "/dashboard",
  },
  {
    id: "lesson-editor-emoji-callout-zoom",
    date: "2026-07-26",
    type: "yangi",
    title: "Dars muharriri — Emojili blok va sahifa kattalashtirish qoʻshildi",
    body: "Endi darsga erkin \"Emojili blok\" (istalgan emoji + rang, oʻz sarlavhasi bilan) qoʻshish mumkin — qatʼiy tur tanlash shart emas. AI yordamchi ham mos joyda shunday blok taklif qiladi. Sahifa burchagida yangi kattalashtirish tugmalari (+/−) paydo boʻldi.",
    href: "/dashboard/lessons",
  },
  {
    id: "lesson-editor-callout-fixes",
    date: "2026-07-26",
    type: "tuzatildi",
    title: "Dars muharriri — callout bloklaridagi bir qator kamchilik tuzatildi",
    body: "Callout va Emojili bloklarni Backspace/Delete bilan oʻchirishda ular bir-birining ichiga kirib qolish holati tuzatildi. Blok sarlavhasini endi oddiy Bold (B) tugmasi bilan qalin/oddiy qilish mumkin. Matn oʻlchami ixchamlashtirildi, chop etishda rang endi saqlanadi.",
    href: "/dashboard/lessons",
  },
  {
    id: "lesson-schedule-flow",
    date: "2026-07-25",
    type: "yaxshilandi",
    title: "Dars muharriri — sana biriktirish qulayroq boʻldi",
    body: "Bir nechta sinfga dars biriktirilganda \"Jadval\" boʻlimi endi bitta umumiy roʻyxat — barcha sinflarning darslari bir sana ostida birga koʻrinadi. Sana tanlashda kalendar sinf jadvalidagi kunlarni rangi bilan koʻrsatadi, vaqtni esa bittalab, tez ketma-ket qoʻshish mumkin.",
    href: "/dashboard/lessons",
  },
  {
    id: "lesson-editor-redesign",
    date: "2026-07-25",
    type: "yaxshilandi",
    title: "Dars muharriri — koʻrinishi va bir qator kamchiliklari tuzatildi",
    body: "Tafsilotlar va AI panellari endi boshqa sahifalar bilan bir xil koʻrinishda; havola qoʻshish qulayroq, rasm biriktirish tezroq boʻldi, sarlavha tahriri esa endi tezroq saqlanadi. Sarlavha ostida oxirgi tahrir vaqti koʻrinadi.",
    href: "/dashboard/lessons",
  },
  {
    id: "lesson-math-formulas",
    date: "2026-07-25",
    type: "yaxshilandi",
    title: "Dars muharriri — matematik formulalar toʻgʻri koʻrinadi",
    body: "AI yordamchi bergan matematik formulalar endi darsda ham xuddi suhbatdagidek chiroyli chiqadi: kasr, ildiz, daraja va quyi indekslar oʻz oʻrnida turadi. Avval ular darsga qoʻshilganda chalkash matnga aylanib qolardi.",
    href: "/dashboard/lessons",
  },
  {
    id: "lesson-ai-assistant-launch",
    date: "2026-07-24",
    type: "yangi",
    title: "Dars muharriri — AI yordamchi ishga tushdi",
    body: "Dars muharririda AI yordamchi endi ishlaydi: dars rejasi, mashqlar va test savollarini taklif qiladi, joriy dars matnini hisobga oladi va javobni bir bosishda darsga qoʻshish mumkin. Xohlasangiz, sinfning anonim statistikasi (oʻrtacha baho, davomat, xulq) asosida moslashtirilgan takliflar oladi yoki darslik/PDF yuklab, faqat shu hujjat asosida javob soʻrash mumkin. Har bir oʻqituvchi uchun kunlik xabar limiti bor.",
    href: "/dashboard/lessons",
  },
  {
    id: "tasks-lesson-duration",
    date: "2026-07-24",
    type: "yaxshilandi",
    title: "Vazifalar — dars vaqti va fokus hisobi aniqlashtirildi",
    body: "Dars-vazifalarida endi boshlanish va tugash vaqti birga koʻrsatiladi (masalan 08:00–08:45). Fokus vaqti shu dars davomiyligidan avtomatik hisoblanadi — Rejadagi vaqt statistikasi ham shu asosda toʻgʻri koʻrsatiladi.",
    href: "/dashboard/tasks",
  },
  {
    id: "tasks-quick-add-calendar",
    date: "2026-07-24",
    type: "yaxshilandi",
    title: "Vazifalar — mini-kalendar va yangi vazifa qoʻshish qulayroq boʻldi",
    body: "\"Bugun\"/\"Ertaga\" roʻyxatlarida haftalik mini-kalendar orqali istalgan kunni tez tanlash mumkin. Yangi vazifa qoʻshish kartasi kengaytirilgan koʻrinishga ega boʻldi (sana/bayroq/sinf bitta qatorda). \"Bugun\" endi faqat aynan bugungi vazifalarni koʻrsatadi — muddati oʻtganlar alohida \"Muddati oʻtgan\" boʻlimida.",
    href: "/dashboard/tasks",
  },
  {
    id: "tasks-stats-panel",
    date: "2026-07-24",
    type: "yangi",
    title: "Vazifalar — oʻng panelda statistika qoʻshildi",
    body: "Hech qanday vazifa tanlanmaganda oʻng panel endi boʻsh turmaydi: rejadagi vaqt, rejadagi vazifalar, sarflangan vaqt va bajarilganlar foizi bir qarashda koʻrinadi. Toʻliq statistikaga oʻtish tugmasi ham shu yerda.",
    href: "/dashboard/tasks",
  },
  {
    id: "tasks-context-menu",
    date: "2026-07-23",
    type: "yaxshilandi",
    title: "Vazifalarda oʻng-klik menyu qoʻshildi",
    body: "Vazifa ustida oʻng-klik qilib muddatni, ustuvorlikni yoki sinfni tezda oʻzgartirish, nusxa yaratish yoki bekor qilish mumkin. Pomodoro vaqtini belgilash gʻildirak-tanlagich bilan yangilandi.",
    href: "/dashboard/tasks",
  },
  {
    id: "tasks-ui-refresh",
    date: "2026-07-23",
    type: "yaxshilandi",
    title: "Vazifalar sahifasi qulayroq boʻldi",
    body: "Tezkor qoʻshish qatori ixchamlashtirildi, ustuvorlik bayroq bilan koʻrsatiladi, muddati oʻtgan vazifalar qizil rangda ajralib turadi. Chap panel va tafsilot oynasi ham yangi koʻrinishga ega.",
    href: "/dashboard/tasks",
  },
  {
    id: "tasks-hub-launch",
    date: "2026-07-23",
    type: "yangi",
    title: "Vazifalar — avtomatik vazifalar markazi qoʻshildi",
    body: "Darslar va topshiriqlar endi oʻz-oʻzidan vazifaga aylanadi, oʻquvchilar tugʻilgan kunini eslatib turadi. Ustuvorlik, teglar, takrorlanish va pomodoro taymeri bilan — barchasi bitta joyda.",
    href: "/dashboard/tasks",
  },
  {
    id: "panel-language-v1",
    date: "2026-07-22",
    type: "yaxshilandi",
    title: "Panel va kartalar butun ilova boʻyicha bir xil koʻrinishga keltirildi",
    body: "Sinflar, Davomat, Jurnal, Vazifalar va boshqa boʻlimlardagi panellar endi bitta uslubda: yagona chegara, radius va sarlavha balandligi. Ilgari bir-biridan sal farq qilib turadigan boʻlimlar endi bir xil his qiladi.",
  },
  {
    id: "toggle-ui-polish",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Koʻrinish almashtirgichlar (togglelar) yagona dizaynga keltirildi",
    body: "Barcha togglelar endi bitta uslubda: outline chegara, tanlangani primary rangda, hoverda faqat foni oʻzgaradi va oʻlchami standart tugma bilan bir xil.",
  },
  {
    id: "tactile-button-depth",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Asosiy tugmalar va segmentli tanlovlar bosiladigan koʻrinishga ega boʻldi",
    body: "Tugmalar endi yorugʻlik-soya effekti bilan haqiqiy tugmadek his qiladi, tanlangan segmentlar esa botiq koʻrinadi.",
  },
  {
    id: "student-notes-rebuild",
    date: "2026-07-21",
    type: "yangi",
    title: "Oʻquvchi qaydlari qayta qurildi: qisqa/toʻliq yozuv, erkin teglar va tahrirlash",
    body: "Endi qaydga sarlavha qoʻshish, oʻzingiz teg yaratish, qidirish va saralash mumkin. Har bir qaydni keyinchalik tahrirlash yoki oʻchirish ham qoʻshildi.",
    href: "/dashboard/students",
  },
  {
    id: "student-profile-tabs-pill-style",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Oʻquvchi profili boʻlim tablari Statistika uslubiga moslashtirildi",
    href: "/dashboard/students",
  },
  {
    id: "student-profile-bloom-coming-soon",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Blum darajalari kartasiga \"Tez orada\" belgisi qoʻyildi",
    href: "/dashboard/students",
  },
  {
    id: "student-profile-single-edit-mode",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Oʻquvchi profili: shaxsiy maʼlumotlar bitta tugma bilan tahrirlanadi",
    body:
      "Ism, jinsi, tugʻilgan sana va aloqa maydonlari endi faqat \"Tahrirlash\" bosilganda oʻzgartiriladi va faqat \"Saqlash\" bosilganda saqlanadi — tasodifiy oʻzgarishning oldi olindi.",
    href: "/dashboard/students",
  },
  {
    id: "student-breadcrumb-class-crumb",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Oʻquvchilar/profil: breadcrumb'da sinf ham koʻrinadi",
    body:
      "Sinf tanlab oʻquvchi ochilganda header breadcrumb'ida endi sinf nomi ham chiqadi — bosilsa boshqa sinfga tez oʻtish mumkin.",
    href: "/dashboard/students",
  },
  {
    id: "student-preview-card-redesign",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Oʻquvchi profili: yon panel qayta ishlab chiqildi",
    body:
      "Davomat, baho va xulq koʻrsatkichlari endi ikonka va foiz bilan bitta qatorda koʻrinadi. \"Koʻrsatkichlar\" va \"Aloqa\" boʻlimlari aniq ajratildi, \"Profilni koʻrish\" tugmasi endi doim panelning tagida turadi.",
    href: "/dashboard/students",
  },
  {
    id: "statistics-period-filter-unified",
    date: "2026-07-21",
    type: "yaxshilandi",
    title: "Statistika: davr filtri yagona menyuga birlashtirildi",
    body:
      "Hafta/Oy/Chorak/Yil tanlovi va davr qiymati endi bitta qidiriladigan menyuda. Sinflar jadvalida oʻquvchilar soni endi son bilan koʻrsatiladi, chalkash \"Signal\" ustuni olib tashlandi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-overview-redesign",
    date: "2026-07-20",
    type: "yaxshilandi",
    title: "Statistika: Umumiy boʻlim qayta ishlab chiqildi",
    body:
      "Darslar va Topshiriqlar KPI kartalari, Xulq-atvor va Topshiriqlar bajarilishi donut-kartalari qoʻshildi. Kartalar joylashuvi tartibga solindi, Baholar taqsimoti va Davomat trendi grafiklari yaxshilandi.",
    href: "/dashboard/statistics",
  },
  {
    id: "bulk-action-floating-bar",
    date: "2026-07-20",
    type: "yaxshilandi",
    title: "Guruhaviy amallar endi suzuvchi panelda",
    body:
      "Oʻquvchilar va Sinflar sahifalarida bir nechta qatorni belgilaganda endi roʻyxat ustida alohida suzuvchi panel chiqadi — sarlavha va boshqa tugmalar joyidan siljimaydi.",
    href: "/dashboard/students",
  },
  {
    id: "students-table-view",
    date: "2026-07-20",
    type: "yangi",
    title: "Oʻquvchilar: jadval koʻrinishi va tez amallar qoʻshildi",
    body:
      "Roʻyxatni endi jadval sifatida ham koʻrish mumkin — ustunni bosib saralang, bir nechta oʻquvchini belgilab birga holatini oʻzgartiring yoki oʻchiring. Qidiruv va faol filtrni koʻrish tezlashdi.",
    href: "/dashboard/students",
  },
  {
    id: "student-attendance-strip-fullyear",
    date: "2026-07-20",
    type: "yaxshilandi",
    title: "Oʻquvchi profili: Davomat tasmasi butun oʻquv yilini koʻrsatadi",
    body:
      "Tasma endi butun oʻquv yili dars kunlarini koʻrsatadi — hali oʻtilmagan kunlar xira rangda turadi. Kun ustiga bosganda endi faqat sana chiqadi.",
    href: "/dashboard/students",
  },
  {
    id: "statistics-class-kpi-expand",
    date: "2026-07-20",
    type: "yangi",
    title: "Statistika: sinf tafsilotiga yangi KPI kartalar qoʻshildi",
    body:
      "Faol oʻquvchilar va Davomat qatoriga endi Darslar va Topshiriqlar soni ham qoʻshildi — sinf haqida bir qarashda toʻliqroq rasm.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-behavior-completion-donuts",
    date: "2026-07-20",
    type: "yaxshilandi",
    title: "Statistika: Ijobiy xulq va Bajarilganlik endi doira chartda",
    body:
      "Sinf tafsilotida bu ikki koʻrsatkich endi foiz-karta emas — Umumiy xulq (ijobiy/salbiy, koʻnikma boʻyicha) va Bajarilganlik (bajarilgan/bajarilmagan topshiriqlar) doira chart sifatida, Jins nisbati kartasi qatorida chiqadi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-simplified",
    date: "2026-07-20",
    type: "yaxshilandi",
    title: "Statistika: sahifa soddalashtirildi",
    body:
      "Baholar, Davomat va Xulq alohida boʻlim boʻlmay qoldi — grafiklari endi Umumiy boʻlimning oʻzida turadi. Sinf tanlanganda ham barcha koʻrsatkichlar boʻlim almashtirmasdan bitta lentada koʻriladi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-class-risk-ranking",
    date: "2026-07-19",
    type: "yangi",
    title: "Statistika: eng koʻp eʼtibor talab qiladigan sinflar reytingi qoʻshildi",
    body:
      "Umumiy boʻlimda endi signal soni boʻyicha eng muammoli 3 ta sinf koʻrinadi — bosilsa oʻsha sinfga oʻtiladi. Jins taqsimoti kartasiga oʻgʻil/qiz kesimida oʻrtacha baho va davomat qoʻshildi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-overview-redesign",
    date: "2026-07-19",
    type: "yaxshilandi",
    title: "Statistika: Umumiy boʻlim qayta tuzildi",
    body:
      "KPI kartalar mantiqiy tartibga keltirildi: Sinflar → Oʻquvchilar → Davomat → Eʼtibor. Oʻquvchilar nisbati kartasi markazida jami son bilan yangilandi, foydasiz „Jins kesimida oʻrtachalar“ kartasi olib tashlandi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-domain-aggregates",
    date: "2026-07-19",
    type: "yangi",
    title: "Statistika: Baholar/Davomat/Xulq tablariga maktab boʻyicha grafiklar qoʻshildi",
    body:
      "Sinf tanlanmaganda endi bu boʻlimlarda haftalik davomat trendi, baholar taqsimoti, xulq iqlimi va sinflar reytingi koʻrinadi. Roʻyxatlardagi qatorlar endi butunlay bosiluvchi — ortiqcha tugmalar olib tashlandi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-risk-view",
    date: "2026-07-19",
    type: "yaxshilandi",
    title: "Statistika: „Eʼtibor kerak“ boʻlimi oʻquvchi-markazli qilib qayta qurildi",
    body:
      "Endi xavfdagi oʻquvchilar bitta roʻyxatda, risk darajasi boʻyicha saralangan holda koʻrinadi — bir oʻquvchi bir necha kartada takrorlanmaydi. Davomat KPI'siga oldingi davr bilan solishtirma trend qoʻshildi.",
    href: "/dashboard/statistics",
  },
  {
    id: "statistics-students-tab",
    date: "2026-07-19",
    type: "yangi",
    title: "Statistika sahifasiga „Oʻquvchilar“ boʻlimi qoʻshildi",
    body:
      "Endi barcha sinflaringizdagi oʻquvchilarni bitta jadvalda koʻrishingiz mumkin: davomat, baho, trend va xavf darajasi boʻyicha saralang.",
    href: "/dashboard/statistics",
  },
  {
    id: "classes-page-rename",
    date: "2026-07-19",
    type: "yaxshilandi",
    title: "„Mening sinflarim“ boʻlimi endi qisqacha „Sinflar“ deb ataladi",
    href: "/dashboard/classes",
  },
  {
    id: "changelog-link-labels-fix",
    date: "2026-07-19",
    type: "tuzatildi",
    title: "Yangilanishlar sahifasidagi havola belgilari toʻgʻrilandi",
    href: "/dashboard/changelog",
  },
  {
    id: "classes-table-view",
    date: "2026-07-19",
    type: "yangi",
    title: "Mening sinflarim sahifasiga Jadval koʻrinishi qoʻshildi",
    body:
      "Endi sinflaringizni Karta, Roʻyxat yoki ixcham Jadval koʻrinishida koʻrishingiz mumkin. Jadval koʻrinishida bir nechta sinfni belgilab, birdaniga arxivlash yoki oʻchirish ham mumkin.",
    href: "/dashboard/classes",
  },
  {
    id: "statistics-table-polish",
    date: "2026-07-19",
    type: "tuzatildi",
    title: "Statistika jadvalidagi mayda nosozliklar tuzatildi",
    body:
      "Davomat foizi baʼzan uzun kasr son bilan chiqib qolardi — endi doim yaxlitlangan koʻrinadi. Sarlavha tagidagi keraksiz chiziq va foydasiz belgilash/amal ustunlari olib tashlandi.",
    href: "/dashboard/statistics",
  },
  {
    id: "tasks-calendar-launch",
    date: "2026-07-19",
    type: "yangi",
    title: "Vazifalar sahifasida kalendar koʻrinishi",
    body:
      "Endi Vazifalar sahifasida roʻyxat bilan bir qatorda kalendar ham bor: kun, hafta, oy, chorak va yil boʻyicha darslar, vazifa muddatlari, taʼtillar va tugʻilgan kunlar bitta joyda koʻrinadi. Har qanday belgi ustiga bosib toʻgʻridan-toʻgʻri tegishli joyga oʻtish mumkin.",
  },
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
