// AVTOMATIK YARATILGAN — qoʻlda tahrirlamang.
// Manba: docs/dts-iat.md  ·  Generator: scripts/gen-iat-template.js
//
// OʻzDTS — Informatika va axborot texnologiyalari (IAT), 5–11 sinf.
// Kod: IAT<sinf>.<mazmun sohasi>.<tartib>  (docs/standards-page-spec.md §14.9)
//
// ⚠️ `bloom` DTS hujjatida BERILMAGAN — maqsad feʼlidan TAXMIN qilingan.
// ⚠️ `assessType: "subjective"` ham taxmin (axloq/masʼuliyat/ijodiy loyiha).
// Ikkalasi ham oʻqituvchi tomonidan tuzatilishi kutiladi.

import type { StandardDomain, StandardItem } from "@/lib/standards-data";

/** IAT mazmun sohalari — 5–11 boʻylab OʻZGARMAYDI (spec §14.9). */
export const IAT_DOMAINS: StandardDomain[] = [
  { id: "AD", name: "Algoritm va dasturlash", order: 0 },
  { id: "MB", name: "Maʼlumotlarni boshqarish", order: 1 },
  { id: "TX", name: "Tarmoqlar va xavfsizlik", order: 2 },
  { id: "KT", name: "Kompyuter tizimlari", order: 3 },
  { id: "KY", name: "Kontent yaratish", order: 4 },
  { id: "SI", name: "Sunʼiy intellekt", order: 5 },
];

const s = (id: string, bloom: string, desc: string, domainId: string, extra: Partial<StandardItem> = {}): StandardItem =>
  ({ id, covered: false, bloom, desc, domainId, ...extra });

export interface IatGradeTemplate {
  grade: string;
  stage: string;
  standards: StandardItem[];
}

export const IAT_TEMPLATES: IatGradeTemplate[] = [
  {
    grade: "5", stage: "Tayanch oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT5.AD.01", "yaratish", "Chiziqli va takrorlanuvchi jarayonlarga oid algoritmlarni tuzish.", "AD"),
      s("IAT5.AD.02", "yaratish", "Blokli dasturlash muhitida boshqaruv (takrorlash), koʻrinish, ovoz, xabar almashish bloklaridan foydalanib dastur tuzish.", "AD"),
      s("IAT5.AD.03", "yaratish", "Blokli dasturlash muhitida ikki yoki undan ortiq obyektlar oʻzaro taʼsir qiladigan sodda dasturlarni tuzish.", "AD"),
      s("IAT5.AD.04", "bilish", "Mantiqiy fikrlash asosida dastur natijasini oldindan taxmin qilish.", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT5.MB.01", "bilish", "Elektron jadvallarda qator (row) va ustun (column)larni formatlash, shuningdek oʻlchamlarini oʻzgartirish, yacheykalarni birlashtirish, oʻchirish.", "MB"),
      s("IAT5.MB.02", "bilish", "Elektron jadvallarda yacheykadagi maʼlumotlarni formatlash (Wrap Text, Merge and Centre).", "MB"),
      s("IAT5.MB.03", "qollash", "Elektron jadvallarda funksiyalar (MAX, MIN, SUM, AVG, COUNT)dan foydalanish.", "MB"),
      s("IAT5.MB.04", "bilish", "Elektron jadvallarda formulalardan nusxa olish.", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT5.TX.01", "tushunish", "Tarmoqdagi qurilmalarning oʻrni va vazifasini tushuntirish.", "TX"),
      s("IAT5.TX.02", "tahlil", "Internet ishdan chiqqanda yuzaga keladigan muammolarni aniqlash.", "TX"),
      s("IAT5.TX.03", "bilish", "Raqamli qurilmalar maʼlumotlarning simsiz va paketlar koʻrinishida uzatilishini tasvirlash.", "TX"),
      s("IAT5.TX.04", "tushunish", "Raqamli kontentning serverlarda saqlanishini tushunish.", "TX"),
      s("IAT5.TX.05", "bilish", "Internetdagi muloqot madaniyati va hurmat tamoyillariga rioya qilish.", "TX", { assessType: "subjective" }),
      s("IAT5.TX.06", "tahlil", "Onlayn muloqotning afzalliklari, xavflari va kiberbulling shakllarini aniqlash.", "TX"),
      s("IAT5.TX.07", "bilish", "Shaxsiy maʼlumotlarni himoya qilish va xavfsizlik sozlamalarini toʻgʻri oʻrnatish.", "TX"),
      s("IAT5.TX.08", "qollash", "Kompyuter texnikasidan toʻgʻri foydalanish qoidalarini tushuntirish.", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT5.KT.01", "bilish", "Kompyuterlar maʼlumotlarni ikkilik shaklda, yaʼni 0 va 1 raqamlari yordamida ifodalashini bilish.", "KT"),
      s("IAT5.KT.02", "tahlil", "Bit, bayt, kilobayt va megabayt birliklarini aniqlash, ularni xotira hajmi hamda saqlash hajmi bilan bogʻlash.", "KT"),
      s("IAT5.KT.03", "tushunish", "Kirish – Qayta ishlash – Chiqish modelini tavsiflash va uni turli qurilmalar, masalan, boshqaruv tizimlari, printerlar yoki audio ishlab chiqarish tizimlari misolida tushuntirish.", "KT"),
      s("IAT5.KT.04", "tushunish", "Kompyuter tizimi har xil turdagi saqlash qurilmalarini oʻz ichiga olishini tushunish.", "KT"),
      s("IAT5.KT.05", "tushunish", "Baʼzi apparat va dasturiy taʼminot turlari boshqa apparat yoki dasturiy vositalar bilan mos kelmasligi mumkinligini tushunish.", "KT"),
      s("IAT5.KT.06", "yaratish", "Turli raqamli qurilmalarning internetga ulanish jarayonini tushuntirish va ularning sensor sifatida maʼlumot toʻplash yoki aktuator sifatida jismoniy harakat bajarish funksiyalarini kundalik vaziyatlardan misollar bilan tasvirlash.", "KT"),
      s("IAT5.KT.07", "bilish", "Qurilmalar oʻrtasida fayllarni uzatishning turli usullarini sanab berish.", "KT"),
      s("IAT5.KT.08", "qollash", "Qurilmadagi standart ilovalarni topish va ulardan foydalanish.", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT5.KY.01", "yaratish", "Kiritilgan matn miqdori ortib borishi bilan yozish tezligi va aniqligini oshirish.", "KY"),
      s("IAT5.KY.02", "bilish", "Matnli hujjatga jadval qoʻshish va toʻldirish.", "KY"),
      s("IAT5.KY.03", "yaratish", "Raqamli vositalardan foydalanib sodda multimedia mahsulot (masalan, elektron chiqindilar, iqlim oʻzgarishi va yashil taʼlim, suv sarfi, energiya tejamkorligi, havo haroratining oʻzgarishi) yaratish.", "KY"),
      s("IAT5.KY.04", "yaratish", "Audio yozuvlarni yozish va tahrirlash.", "KY"),
      s("IAT5.KY.05", "yaratish", "Video kliplarni yozish va tahrirlash.", "KY"),
      s("IAT5.KY.06", "qollash", "Maʼlumotni topish uchun ilovalar ichida qidiruv funksiyalaridan foydalanish.", "KY"),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT5.SI.01", "tahlil", "Aqlli qurilmalar misolida sunʼiy intellektning qoʻllanilish holatlari va ilovalarini aniqlash.", "SI"),
      s("IAT5.SI.02", "bilish", "Sunʼiy intellekt vositalari yordamida oddiy muammoga yechim topish.", "SI"),
      s("IAT5.SI.03", "qollash", "Tabiiy tilni qayta ishlash (NLP) va undan foydalanish jarayonlarini tushuntirish.", "SI"),
      s("IAT5.SI.04", "qollash", "Sunʼiy intellektdan masʼuliyat bilan foydalanish zarurligini tushunish.", "SI", { assessType: "subjective" }),
    ],
  },
  {
    grade: "6", stage: "Tayanch oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT6.AD.01", "tahlil", "Blok-sxema koʻrinishida berilgan algoritmlarni tushunish va uning elementlarini izohlash.", "AD"),
      s("IAT6.AD.02", "bilish", "Takrorlanuvchi (takrorlanishlar soni berilgan, cheksiz takrorlanuvchi va shartga koʻra takrorlanuvchi) algoritmlarni blok-sxema orqali ifodalash.", "AD"),
      s("IAT6.AD.03", "yaratish", "Blokli dasturlash muhitida boshqaruv (IF, THEN, ELSE), sezgirlik, oʻzgaruvchi, arifmetik (+, -) va taqqoslash operatorlari bloklaridan foydalanib dastur tuzish.", "AD"),
      s("IAT6.AD.04", "qollash", "Dasturlarda oʻzgaruvchilardan foydalanish va ularga aniq hamda tushunarli nom berishni tushunish.", "AD"),
      s("IAT6.AD.05", "yaratish", "Blokli dasturlash muhitida chiziqli, tarmoqlanish va takrorlanish jarayonlarlarini oʻz ichiga olgan sodda dastur tuzish.", "AD"),
      s("IAT6.AD.06", "bilish", "Koʻp marta qayta ishlatiladigan kod qismlarini protsedura (sub-routine) orqali ifodalash.", "AD"),
      s("IAT6.AD.07", "baholash", "Kichik guruhlarda dasturlarni berilgan mezonlar asosida baholash.", "AD"),
      s("IAT6.AD.08", "baholash", "Turli dasturlash muhitlari (blokli yoki matnli)ni aniqlash va muayyan vaziyatlarda maqsadga muvofiq muhitni tanlash.", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT6.MB.01", "bilish", "Elektron jadvalni chop etish.", "MB"),
      s("IAT6.MB.02", "yaratish", "Hisob-kitoblarni bajarish uchun ichki funksiyalar (built-in functions)dan foydalanish.", "MB"),
      s("IAT6.MB.03", "qollash", "Formulalarni kiritishda yacheykaga murojaat qilish (cell referencing) usulidan foydalanish.", "MB"),
      s("IAT6.MB.04", "baholash", "Maʼlumotlarni yigʻish, tahlil qilish, masalalarni yechishni osonlashtirish uchun maʼlumotlarni turlarini aniqlash.", "MB"),
      s("IAT6.MB.05", "baholash", "Maʼlumotlarni taqdim etish va tahlil qilish uchun diagrammadan foydalanish.", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT6.TX.01", "tushunish", "Rasmlar, videolar, maʼlumotlar yoki fikrlarni almashish kabi onlayn harakatlar orqali raqamli iz yaratilishini tushunish.", "TX"),
      s("IAT6.TX.02", "qollash", "Onlayn striming odamlarning media va koʻngilochar kontentdan foydalanish usullarini qanday oʻzgartirganini tavsiflash.", "TX"),
      s("IAT6.TX.03", "tushunish", "Onlayn kontentni nusxalashga nisbatan cheklovlar mavjudligini tushunish.", "TX"),
      s("IAT6.TX.04", "tushunish", "Internetda ulashilgan har qanday kontent boshqa joylarga koʻchirilishi va boshqa odamlar tomonidan foydalanilishi mumkinligini tushunish.", "TX"),
      s("IAT6.TX.05", "tushunish", "Internetga ulangan har qanday qurilma zararli dastur hujumlariga qarshi himoyasiz ekanligini tushuntirish.", "TX"),
      s("IAT6.TX.06", "tushunish", "Onlayn tajovuzkor yoki noqonuniy xatti-harakatlar, jumladan kiberbulling haqida xabar berish muhimligini va buning uchun rasmiy tartib-qoidalar mavjudligini tushuntirish.", "TX"),
      s("IAT6.TX.07", "tushunish", "Raqamli faoliyat bilan shugʻullanishdan oldin, shugʻullanish vaqtida va undan keyin oʻz xavfsizligi va farovonligini himoya qilish usullarini tavsiflash.", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT6.KT.01", "tushunish", "Analog maʼlumotlarni kompyuterda qayta ishlash uchun raqamlashtirish zarurligini tushuntirish.", "KT"),
      s("IAT6.KT.02", "tahlil", "Nibble, bit, bayt, kilobayt, megabayt, gigabayt va terabayt tushunchalarini aniqlash va ularni xotira hajmi hamda saqlash bilan bogʻlash.", "KT"),
      s("IAT6.KT.03", "tushunish", "Protsessorning kompyuterdagi rolini tushuntirish.", "KT"),
      s("IAT6.KT.04", "tushunish", "Asosiy xotira va saqlash qurilmalarining vazifalarini tushuntirish.", "KT"),
      s("IAT6.KT.05", "tushunish", "Funksionallik, narx, tezlik va dizayn kabi omillarni hisobga olgan holda apparat va dasturiy taʼminot komponentlarini qanday tanlashni tushuntirish.", "KT"),
      s("IAT6.KT.06", "tushunish", "Raqamli texnologiya qanday qilib mavjud jarayonlarni tubdan oʻzgartiruvchi (disruptive) texnologiya boʻlishi mumkinligini tushuntirish.", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT6.KY.01", "yaratish", "Berilgan vazifaga muvofiq matnli hujjat yaratish va tahrirlash.", "KY"),
      s("IAT6.KY.02", "yaratish", "Shablonlar yordamida veb-sahifa dizaynini loyihalash.", "KY"),
      s("IAT6.KY.03", "bilish", "Hujjatga giperhavolalarni kiritish.", "KY"),
      s("IAT6.KY.04", "tahlil", "Veb-sahifaning tarkibiy qismlarini aniqlash.", "KY"),
      s("IAT6.KY.05", "bilish", "Matn, rasmlar va vidjetlarni oʻz ichiga olgan veb-saytni nashr etish.", "KY"),
      s("IAT6.KY.06", "yaratish", "Milliy-madaniy meros yoki tarixiy obidalarga oid veb-sahifa yaratish.", "KY"),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT6.SI.01", "yaratish", "Dizayn fikrlash (design thinking) metodologiyasidan foydalangan holda loyiha yaratish.", "SI", { assessType: "subjective" }),
      s("IAT6.SI.02", "tushunish", "Sunʼiy intellekt texnikalarining turlarini va ularning qanday ishlashini tushuntirish (nazoratli, nazoratsiz, mustahkamlash, mashinaviy oʻqitish/chuqur oʻrganish).", "SI"),
      s("IAT6.SI.03", "yaratish", "Artefaktlar va mahsulotlarni sinovdan oʻtkazish va qayta loyihalash.", "SI"),
      s("IAT6.SI.04", "tushunish", "Sunʼiy intellekt tomonidan berilgan natijalarda xatoliklar boʻlishi mumkinligi va ularni inson nazorati zarurligini misollar bilan tushuntirish.", "SI"),
    ],
  },
  {
    grade: "7", stage: "Tayanch oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT7.AD.01", "yaratish", "Blok-sxema shaklida taqdim etilgan algoritmlarni bajarish, tushunish, tahrirlash va xatolarini tuzatish.", "AD"),
      s("IAT7.AD.02", "bilish", "Blok-sxemalarning natijalarini oldindan taxmin qilish va ularni sinovdan oʻtkazish.", "AD"),
      s("IAT7.AD.03", "tushunish", "Matnga asoslangan dastur qanday ishlashini tushunish.", "AD"),
      s("IAT7.AD.04", "yaratish", "Qoʻshish (+), ayirish (-), koʻpaytirish (*) va boʻlish (/) kabi turli arifmetik operatorlardan foydalanib matnga asoslangan dastur tuzish.", "AD"),
      s("IAT7.AD.05", "qollash", "Matnga asoslangan dasturlarda oʻzgaruvchilardan foydalanish.", "AD"),
      s("IAT7.AD.06", "yaratish", "Matnga asoslangan dasturlash tillarida dastur tuzish uchun butun son (integer), haqiqiy son (real/float) va satr (string) kabi maʼlumot turlarini aniqlash hamda ulardan foydalanish.", "AD"),
      s("IAT7.AD.07", "yaratish", "Foydalanuvchi kiritgan maʼlumotni qabul qilib, natijani chiqaradigan matnga asoslangan dastur tuzish.", "AD"),
      s("IAT7.AD.08", "yaratish", "Dasturni yaratish jarayonida xatolarning qanday paydo boʻlishini aniqlash va ularning sabablarini tushunish.", "AD"),
      s("IAT7.AD.09", "tahlil", "Matnga asoslangan dasturdagi xatolarni tizimli ravishda aniqlash va ularni tuzatish.", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT7.MB.01", "tahlil", "Shartli formatlash nima ekanligini va elektron jadvallarda qanday ishlatilishini izohlash.", "MB"),
      s("IAT7.MB.02", "yaratish", "Muayyan mezonlar asosida elektron jadval yacheykalariga shartli formatlashni qoʻllash qoidalarini tuzish.", "MB"),
      s("IAT7.MB.03", "qollash", "Shartli formatlash qoidalarini oddiy masalada qoʻllash.", "MB"),
      s("IAT7.MB.04", "tahlil", "Maʼlumotlarni modellashtirishning turli sohalarda qanday qoʻllanilishini aniqlash.", "MB"),
      s("IAT7.MB.05", "yaratish", "Modellarni yaratish uchun aniq maʼlumotlardan foydalanish ahamiyatini izohlash.", "MB"),
      s("IAT7.MB.06", "qollash", "Tayyor elektron jadval modelidan foydalanish.", "MB"),
      s("IAT7.MB.07", "bilish", "Shartli formatlashda yacheyka manzili yoki yacheykalar diapazonini belgilash.", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT7.TX.01", "baholash", "Uyali tarmoqlardagi yutuqlarni tasvirlab berish va ularning avlodlarini solishtirish.", "TX"),
      s("IAT7.TX.02", "bilish", "URL nima ekanligini va u veb-saytlarga kirish uchun qanday ishlatilishini tasvirlab berish.", "TX"),
      s("IAT7.TX.03", "tahlil", "Bluetooth, Wi-Fi va uyali tarmoqlarning asosiy xususiyatlarini aniqlash va ularning farqlarini tushuntirish.", "TX"),
      s("IAT7.TX.04", "qollash", "«Adolatli foydalanish» tushunchasini va uning tasvirlar, videolar hamda matn kabi kontentdan foydalanish jarayonida masʼuliyatli ravishda qoʻllashni tushuntirish.", "TX", { assessType: "subjective" }),
      s("IAT7.TX.05", "tushunish", "Plagiat nima ekanini, uning axloqiy xavflarini va manbalarni toʻgʻri koʻrsatishni muhimligini tushuntirish.", "TX", { assessType: "subjective" }),
      s("IAT7.TX.06", "tahlil", "Shifrlashni, maʼlumotlarni xavfsiz saqlashdagi uning rolini tushuntirish va shifrlash misollarini aniqlash.", "TX"),
      s("IAT7.TX.07", "tushunish", "Veb-sayt xavfsizligini qanday tekshirishni tushuntirish.", "TX"),
      s("IAT7.TX.08", "tahlil", "Xavfsiz boʻlmagan veb-saytlardan foydalanish xavf-xatarlarini aniqlash va ularni qanday oldini olishni tushuntirish.", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT7.KT.01", "tushunish", "Maʼlumotlarni siqish nima ekanligini va nima uchun zarurligini tushuntirish.", "KT"),
      s("IAT7.KT.02", "tushunish", "Asosiy xotira, RAM va ROM nima ish bajarishini tushuntirish.", "KT"),
      s("IAT7.KT.03", "baholash", "Raqamli qurilmalar va tizimlarning dizaynini baholash.", "KT"),
      s("IAT7.KT.04", "baholash", "Amaliy dasturiy taʼminot va tizim dasturiy taʼminoti nima ish bajarishini tushuntirish va taqqoslash.", "KT"),
      s("IAT7.KT.05", "tushunish", "Operatsion tizim va uning vazifasini tavsiflash.", "KT"),
      s("IAT7.KT.06", "tushunish", "Utilit dasturlar nima ish bajarishini tushuntirish.", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT7.KY.01", "tushunish", "Fayllarni boshqa kompyuterlar, tarmoqlar yoki bulutli serverlarda masofadan turib qanday saqlash mumkinligini tushuntirish.", "KY"),
      s("IAT7.KY.02", "qollash", "Hujjatlarni tahrirlash jarayonida «oʻzgarishlarni kuzatish» va «izoh» funksiyalaridan foydalanish.", "KY"),
      s("IAT7.KY.03", "yaratish", "Google Drive yoki OneDrive kabi bulutli saqlash platformalarida «Buyuk allomalarimiz merosi» yoki «Milliy hunarmandchilik anʼanalari» kabi milliy qadriyatlarga oid loyihalar ustida jamoaviy fayllar yaratish, ishlash, saqlash va ulashish usullarini koʻrsatish.", "KY"),
      s("IAT7.KY.04", "qollash", "Qidiruv natijalarini yaxshilash uchun ilgʻor qidiruv usullaridan foydalanish.", "KY"),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT7.SI.01", "tushunish", "Sunʼiy intellekt nima ekanligini taʼriflash.", "SI"),
      s("IAT7.SI.02", "tahlil", "Sunʼiy intellektning kundalik hayotdagi qoʻllanilishini aniqlash.", "SI"),
      s("IAT7.SI.03", "tushunish", "Sunʼiy intellektga asoslangan avtomatlashtirish sanoatlarda qanday qoʻllanilishini, uning afzalliklari va muammolarini tushuntirish.", "SI"),
      s("IAT7.SI.04", "tushunish", "Sunʼiy intellekt tasvirlarni, yuzlarni yoki matnni qanday aniqlashini tavsiflash.", "SI"),
      s("IAT7.SI.05", "tushunish", "Simulyatorlar yoki iqlim modellari kabi haqiqiy dunyo holatlarini modellashtiruvchi tizimlarini misollar orqali tushuntirish.", "SI"),
      s("IAT7.SI.06", "tushunish", "Avtomatlashtirishni va uning mashinalarga inson yordamisiz vazifalarni bajarishda qanday yordam berishini tushuntirish.", "SI"),
      s("IAT7.SI.07", "baholash", "Sunʼiy intellekt qarorlarining turli sohalarga taʼsiri va inson nazoratiga boʻlgan zaruratni tahlil qilish.", "SI"),
    ],
  },
  {
    grade: "8", stage: "Tayanch oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT8.AD.01", "yaratish", "Tanlov (selection) ishlatilgan blok-sxemalarni bajarish, tushunish, tahrirlash, xatolarni tuzatish va sinovdan oʻtkazish.", "AD"),
      s("IAT8.AD.02", "tushunish", "Psevdokodning oʻziga xosligini tushunish.", "AD"),
      s("IAT8.AD.03", "yaratish", "Tanlov (selection) operatorlaridan foydalanib matnga asoslangan dastur tuzish.", "AD"),
      s("IAT8.AD.04", "yaratish", "Butun son, haqiqiy son, belgi va satr kabi maʼlumot turlaridan foydalanib matnga asoslangan dastur tuzish.", "AD"),
      s("IAT8.AD.05", "yaratish", "Kamida bitta oʻzgarmas (constant) qiymatdan foydalanib dastur tuzish.", "AD"),
      s("IAT8.AD.06", "tahlil", "Masalalarni kichik qismlarga ajratish.", "AD"),
      s("IAT8.AD.07", "tahlil", "Turli xil sinov maʼlumotlaridan foydalanish zaruratini izohlash.", "AD"),
      s("IAT8.AD.08", "qollash", "Dastur ishlab chiqishda dasturni sinovdan oʻtkazish, xatolarni tuzatish va bosqichma-bosqich yaxshilash jarayonidan foydalanish.", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT8.MB.01", "baholash", "SUM, MIN, MAX, COUNT, AVERAGE va IF kabi funksiyalardan foydalanib maʼlumotlarni tahlil qilish.", "MB"),
      s("IAT8.MB.02", "tahlil", "Elektron jadvallardagi funksiyalarni va ularning maʼlumotlarni tahlil qilishdagi rolini aniqlash.", "MB"),
      s("IAT8.MB.03", "qollash", "Elektron jadvallardan kundalik vaziyatlarda foydalanish.", "MB"),
      s("IAT8.MB.04", "qollash", "Jadvalda formulalar, bogʻlanishlar kiritish orqali masalani yechish modelidan foydalanish.", "MB"),
      s("IAT8.MB.05", "baholash", "Maʼlumotlarning vaqt oʻtishi bilan oʻzgarishini tahlil qilish.", "MB"),
      s("IAT8.MB.06", "tushunish", "«Metamaʼlumotlar» (Metadata) qanday ishlashini tushuntirish.", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT8.TX.01", "tahlil", "Tarmoq turlarini aniqlash va ularni farqlash.", "TX"),
      s("IAT8.TX.02", "tushunish", "Simsiz va simli tarmoqlarning afzalliklari hamda kamchiliklarini tavsiflash.", "TX"),
      s("IAT8.TX.03", "tushunish", "Maʼlumot uzatish jarayonida xatoliklar yuz berishi mumkinligini tushuntirish.", "TX"),
      s("IAT8.TX.04", "tahlil", "Elektron xabarlarda his-tuygʻularni yoki maʼnoni yetkazish uchun norasmiy usullardan foydalanish maqsadga muvofiqligini aniqlash.", "TX"),
      s("IAT8.TX.05", "baholash", "Onlayn kontentning sifati va ishonchliligini baholash.", "TX"),
      s("IAT8.TX.06", "tushunish", "Turli xil onlayn muloqot usullarining afzalliklari va kamchiliklarini tavsiflash.", "TX"),
      s("IAT8.TX.07", "tushunish", "Xavfsizlik devorlari (firewalls) nima ekanini va ular tarmoqlarni himoyalashda qanday yordam berishini tavsiflash.", "TX"),
      s("IAT8.TX.08", "tahlil", "Antivirus dasturlarini aniqlash hamda ularning maʼlumotlarni xavfsiz saqlashdagi rolini tushuntirish.", "TX"),
      s("IAT8.TX.09", "baholash", "Veb-saytlar va giperhavolalarning muvofiqligi hamda xavfsizligini baholash.", "TX"),
      s("IAT8.TX.10", "qollash", "Fayllarni, shaxsiy maʼlumotlarni va onlayn farovonlikni himoya qilish uchun xavfsiz usullardan foydalanish.", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT8.KT.01", "tahlil", "Ikkilik raqamlar yordamida ifodalanishi mumkin boʻlgan maʼlumotlarning turlarini aniqlash.", "KT"),
      s("IAT8.KT.02", "bilish", "Ikkilik sonlarni oʻnlik sonlarga va oʻnlik sonlarni ikkilik sonlarga oʻtkazish.", "KT"),
      s("IAT8.KT.03", "tushunish", "Belgilarni ifodalash uchun ASCII dan qanday foydalanilishini tavsiflash.", "KT"),
      s("IAT8.KT.04", "tushunish", "Tasvirlar qanday raqamlashtirilishini tavsiflash.", "KT"),
      s("IAT8.KT.05", "tushunish", "Tovushning ikkilik shaklda ifodalanishini tavsiflash.", "KT"),
      s("IAT8.KT.06", "tushunish", "Raqamli texnologiya ish joyida qanday qoʻllanilishini tavsiflash.", "KT"),
      s("IAT8.KT.07", "tushunish", "Buyumlar Interneti (IoT) ning afzalliklari va xavflarini tavsiflash.", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT8.KY.01", "yaratish", "Katta hajmdagi matnni ravon va aniq yozish.", "KY"),
      s("IAT8.KY.02", "tahlil", "Shablonlar nima ekanini va hujjatlar yaratishdagi rolini aniqlash.", "KY"),
      s("IAT8.KY.03", "tushunish", "Hujjatlar yaratishda shablonlardan foydalanishning afzalliklarini tushuntirish.", "KY"),
      s("IAT8.KY.04", "qollash", "Tovush, video, matn va tasvirlarni birlashtirgan raqamli mahsulotlar (masalan, iqlim oʻzgarishi va yashil taʼlim, chiqindilarni aqlli qayta ishlashga oid mavzuda) bilan ishlash uchun qurilmalardan foydalanish.", "KY"),
      s("IAT8.KY.05", "qollash", "Ishonchli maʼlumotni topish uchun ilgʻor qidiruv usullaridan foydalanish.", "KY"),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT8.SI.01", "tushunish", "Mashinaviy oʻqitishni (machine learning) taʼriflash.", "SI"),
      s("IAT8.SI.02", "tushunish", "Mashinaviy oʻqitish qanday ishlashini tavsiflash.", "SI"),
      s("IAT8.SI.03", "tushunish", "Mashinaviy oʻqitishning haqiqiy hayotdagi qoʻllanilishini tushuntirish.", "SI"),
      s("IAT8.SI.04", "tahlil", "Kengaytirilgan reallikning (AR) tanish vaziyatlardagi qoʻllanilishini aniqlash.", "SI"),
      s("IAT8.SI.05", "bilish", "Sunʼiy intellekt bilan kengaytirilgan reallikning (AR) qoʻllanilishini sanab oʻtish.", "SI"),
      s("IAT8.SI.06", "tushunish", "Avtonom dasturlash va sunʼiy intellektning robototexnikada qanday qoʻllanilishini tavsiflash.", "SI"),
      s("IAT8.SI.07", "tushunish", "Sunʼiy intellekt bilan bogʻliq axloqiy qoidalarni taʼriflash.", "SI", { assessType: "subjective" }),
    ],
  },
  {
    grade: "9", stage: "Tayanch oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT9.AD.01", "yaratish", "Psevdokod shaklida berilgan algoritmlarni bajarish, tushunish, tahrirlash va xatolarni tuzatish.", "AD"),
      s("IAT9.AD.02", "baholash", "Bir xil vazifani yechish uchun tuzilgan algoritm, blok-sxema va psevdokodlarni tahlil qilish va solishtirish.", "AD"),
      s("IAT9.AD.03", "yaratish", "Hisoblagich bilan boshqariladigan (count-controlled) va shart bilan boshqariladigan takrorlanishlardan foydalanib matnga asoslangan dastur tuzish.", "AD"),
      s("IAT9.AD.04", "tushunish", "Tarjimon dasturlari, jumladan kompilyator va interpretatorning asosiy xususiyatlarini tushunish.", "AD"),
      s("IAT9.AD.05", "yaratish", "Dasturda hisoblagich oʻzgaruvchisidan foydalanib dastur tuzish.", "AD"),
      s("IAT9.AD.06", "yaratish", "Protseduralar yoki funksiyalar yordamida matnga asoslangan dastur tuzish.", "AD"),
      s("IAT9.AD.07", "tahlil", "Sintaktik, mantiqiy va bajarilish xatolarini aniqlash va tuzatish.", "AD"),
      s("IAT9.AD.08", "yaratish", "Dasturni sinovdan oʻtkazish rejasini ishlab chiqish va qoʻllash.", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT9.MB.01", "tahlil", "«What-if tahlili» vositasini aniqlash va undan qaror qabul qilish jarayonida qanday foydalanishni izohlash.", "MB"),
      s("IAT9.MB.02", "qollash", "Maqsadli «what-if» savolini sinab koʻrish uchun maqsadli natijani hisoblash vositasidan foydalanish.", "MB"),
      s("IAT9.MB.03", "yaratish", "Kundalik turmushda foydalaniladigan tizimlarni modellashtirish uchun elektron jadvalni loyihalash va sinovdan oʻtkazish.", "MB"),
      s("IAT9.MB.04", "baholash", "Tuzilgan elektron jadvalning maʼlum maqsad uchun mosligini baholash.", "MB"),
      s("IAT9.MB.05", "yaratish", "Masalani yechish uchun tegishli maʼlumotlarni toʻplash va shu maʼlumotlar asosida diagramma yaratish.", "MB"),
      s("IAT9.MB.06", "tahlil", "Diagramma maʼlumotlarini tahlil qilib, asosiy maʼlumotlarni aniqlash.", "MB"),
      s("IAT9.MB.07", "tahlil", "«Katta maʼlumotlar» («Big data») atamasini taʼriflash va uning qoʻllanilishini izohlash.", "MB"),
      s("IAT9.MB.08", "tahlil", "Maʼlumotlar bazasi va uning maqsadini izohlash.", "MB"),
      s("IAT9.MB.09", "bilish", "Elektron jadvalda funksiyalarni toʻgʻri kiritilganini tekshirish va xatoliklarni tuzatish.", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT9.TX.01", "tahlil", "Turli tarmoq topologiyalarini aniqlash.", "TX"),
      s("IAT9.TX.02", "tushunish", "Maʼlumotlarni uzatishda ishlatiladigan protokollarning rolini tushuntirish.", "TX"),
      s("IAT9.TX.03", "tahlil", "Maʼlumot uzatish jarayonida yuz beradigan xatoliklarni tushunish va sabablarini aniqlash.", "TX"),
      s("IAT9.TX.04", "bilish", "Boshqalar tomonidan yaratilgan tasvirlar, musiqa va videolardan foydalanganda axloqiy qoidalarga rioya qilish.", "TX", { assessType: "subjective" }),
      s("IAT9.TX.05", "bilish", "Onlayn hamjamiyatlarda hurmat va masʼuliyat bilan muloqot qilish.", "TX", { assessType: "subjective" }),
      s("IAT9.TX.06", "tahlil", "Onlayn platformalarning afzalliklari va xavflarini aniqlash.", "TX"),
      s("IAT9.TX.07", "qollash", "Raqamli texnologiyalardan xavfsiz va muvozanatli foydalanish uchun sogʻlom odatlarni rivojlantirish.", "TX"),
      s("IAT9.TX.08", "tushunish", "Tarmoq xavfsizligini joriy etishda amalga oshiriladigan tanlovlarni tushuntirish.", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT9.KT.01", "yaratish", "Koʻpaytirish yoki boʻlish yordamida xotira birliklari oʻrtasida oʻtkazishlarni bajarish.", "KT"),
      s("IAT9.KT.02", "yaratish", "Kompyuterda buyruqlarni qayta ishlash jarayonini tushuntiruvchi «Buyruq olish – Tahlil qilish – Bajarish» siklining qanday ishlashini tavsiflash.", "KT"),
      s("IAT9.KT.03", "tahlil", "Foydalanuvchi tajribasi, foydalanish imkoniyati va rivojlanayotgan texnologiyalar, shuningdek, prototiplar kabi omillarga asoslangan raqamli qurilmalar dizaynidagi yaxshilanishlarni aniqlash.", "KT"),
      s("IAT9.KT.04", "qollash", "Mavjud texnologiyalarni loyihalashda noxolislik va foydalanish imkoniyati bilan bogʻliq muammolarni muhokama qilish.", "KT"),
      s("IAT9.KT.05", "tahlil", "Hisoblash qurilmalari va ularning dasturiy taʼminotida yuzaga keladigan muammolarni tizimli ravishda aniqlash va tuzatish.", "KT"),
      s("IAT9.KT.06", "tushunish", "Operatsion tizim tomonidan bajariladigan vazifalarni tavsiflash: xotirani, fayllarni, qurilmalarni, quvvatni, boshqarish.", "KT"),
      s("IAT9.KT.07", "tushunish", "Yordamchi dasturlarni, jumladan drayverlarni, xavfsizlik dasturlarini va defragmentatsiyani tavsiflash.", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT9.KY.01", "tushunish", "Raqamli vositalar sanʼat, musiqa, kino va dizayn kabi sohalardagi ijodiy ishlarni qanday oʻzgartirganini tushuntirish.", "KY"),
      s("IAT9.KY.02", "qollash", "Raqamli tafovutni tasvirlab berish va undan teng foydalanish yoʻllarini taklif qilish.", "KY"),
      s("IAT9.KY.03", "yaratish", "Oʻrganish jarayoni, ijodkorlik va rivojlanishni aks ettiruvchi raqamli portfolio yaratish.", "KY", { assessType: "subjective" }),
      s("IAT9.KY.04", "yaratish", "Raqamli vositalardan masʼuliyat bilan foydalanib, mazmunli loyihalar (masalan, Oʻzbekistonning diqqatga sazovor joylari, milliy qadriyatlari, urf-odatlari va madaniy merosiga oid) yaratish.", "KY", { assessType: "subjective" }),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT9.SI.01", "tushunish", "Sunʼiy intellekt turlarini tavsiflash.", "SI"),
      s("IAT9.SI.02", "tushunish", "Sunʼiy intellekt qoʻllanadigan sohalarni (masalan, avtonom boshqariladigan avtomobil, yuzni tanish, tibbiy diagnostika, sifat nazorati hamda suv, yer, havo, tabiat monitoringi) tavsiflash.", "SI"),
      s("IAT9.SI.03", "tushunish", "Sunʼiy intellektdan foydalanishning afzalliklari va muammolarini tushunish.", "SI"),
      s("IAT9.SI.04", "qollash", "Matn, rasm, ovoz yoki video ishlab chiqarishda sunʼiy intellekt vositalarida foydalanish.", "SI"),
      s("IAT9.SI.05", "qollash", "Sunʼiy intellekt vositalarini ijodiy faoliyatda samarali qoʻllash.", "SI"),
      s("IAT9.SI.06", "baholash", "Sunʼiy intellekt texnologiyalarining qoʻllanishini etik, huquqiy va ijtimoiy jihatdan baholash.", "SI", { assessType: "subjective" }),
    ],
  },
  {
    grade: "10", stage: "Oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT10.AD.01", "tushunish", "Sunʼiy intellekt modellarida qoʻllaniladigan algoritmlarning ishlash tamoyillarini tushuntirish", "AD"),
      s("IAT10.AD.02", "tahlil", "Dastur va algoritmlarning notoʻgʻri natijalar berish sabablarini aniqlash hamda sinovdan oʻtkazish maʼlumotlari yordamida ularni tekshirish", "AD"),
      s("IAT10.AD.03", "yaratish", "Maʼlumotlarni tasniflash yoki guruhlashga oid sodda dasturlar yaratish va sinovdan oʻtkazish", "AD"),
      s("IAT10.AD.04", "baholash", "Algoritm samaradorligini oshirish uchun parametrlarni oʻzgartirish, natijalarni taqqoslash va optimallashtirish usullarini qoʻllash", "AD"),
      s("IAT10.AD.05", "tahlil", "Dasturiy yechimlarni yaratishda maʼlumotlar xavfsizligi va foydalanuvchi huquqlarini hisobga olish kerakligini izohlash", "AD"),
      s("IAT10.AD.06", "baholash", "Dasturiy va algoritmik xatolarning natijalarga taʼsirini tahlil qilish hamda ularni tuzatish usullarini qoʻllash", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT10.MB.01", "yaratish", "Elektron jadvalda maʼlumotlarni belgilash, diagramma turini tanlash, oʻqlarni nomlash, qiymatlarni formatlash (oʻnli kasrlar, valyuta belgisi), ikkilamchi maʼlumotlar seriyasini qoʻshish va oʻq shkalalarni sozlash orqali grafik yoki diagrammani tuzish", "MB"),
      s("IAT10.MB.02", "bilish", "Diagramma elementlari (ranglar sxemasi, toʻldirish naqshlari, ajratilgan sektorlar, legenda, sarlavha, yorliqlar)ni moslashtirish orqali vizual jihatdan tushunarli hamda yuqori sifatli grafik/diagramma dizaynini taqdim etish", "MB"),
      s("IAT10.MB.03", "baholash", "Formulalar, funksiyalar (SUM, AVERAGE, IF, VLOOKUP, XLOOKUP va boshqalar), nisbiy va absolyut manzillarning elektron jadvaldagi rolini tahlil qilish, formulalardagi xatolarni, notoʻgʻri havolalarni, nomuvofiq formatlarni aniqlash", "MB"),
      s("IAT10.MB.04", "yaratish", "Yacheykalar bilan ishlash (qoʻshish, oʻchirish, birlashtirish), saralash, qidiruv operatorlari (AND, OR, >, < va boshqalar) bilan filtrlash, shartli formatlash, maʼlumot turlariga koʻra formatlash hamda sahifa strukturasini sozlash orqali elektron jadval tuzish", "MB"),
      s("IAT10.MB.05", "baholash", "Yaratilgan elektron jadvalning strukturasi, samaradorligi va formatlash aniqligini baholash", "MB"),
      s("IAT10.MB.06", "yaratish", "Murakkab formula va funksiyalar, maʼlumotlar diapazoni, diagrammalar, shartli formatlash, filtrlash hamda chop etish sozlamalaridan foydalangan holda elektron jadval modeli (masalan, hisob-kitob varaqasi, moliyaviy jadval, rejalashtirish jadvali, soʻrovnoma natijalari, ob-havo maʼlumotlari, maktab natijalari)ni tuzish", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT10.TX.01", "baholash", "LAN, WLAN, WAN, intranet, ekstranet va internetning maqsadi, imkoniyatlari va cheklovlarini tahlil qilish hamda turli vaziyatlar uchun mos tarmoq turini tanlash", "TX"),
      s("IAT10.TX.02", "tushunish", "Tarmoq qurilmalarining (masalan, Wi-Fi, Bluetooth, router, NIC, hub, switch, bridge va boshqalar) vazifasi hamda oʻzaro bogʻliqligini tushunish, shuningdek, ularni boshqarish", "TX"),
      s("IAT10.TX.03", "baholash", "Bulutli hisoblash, elektron konferensiya (video, audio, veb) va maʼlumot almashish xizmatlaridan real vaziyatlarda foydalanish hamda ularning afzalliklari va cheklovlariga asoslanib mos xizmatni tanlash", "TX"),
      s("IAT10.TX.04", "qollash", "Maʼlumotlarni himoya qilish uchun parollarni boshqarish, autentifikatsiya usullarini qoʻllash, zararli dasturlardan himoyalanish vositalaridan foydalanish", "TX"),
      s("IAT10.TX.05", "tushunish", "Xavfsizlik muammolari (elektr xavflari, yongʻin, uskunalarning nosozligi) sabablari, oqibatlarini va ularning oldini olish chora-tadbirlarini tushuntirish", "TX"),
      s("IAT10.TX.06", "tushunish", "Shaxsiy maʼlumotlarning maxfiy saqlanishi va himoyalanishi zarurligini, tahdidlarning xususiyatlari hamda taʼsirini tushuntirish", "TX"),
      s("IAT10.TX.07", "qollash", "Shaxsiy maʼlumotlarni himoya qilish usullari va vositalaridan foydalanish", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT10.KT.01", "tushunish", "Kompyuter qurilmalari (CPU, xotira, kiritish-chiqarish qurilmalari va yordamchi saqlash vositalari)ning xususiyatlari, oʻzaro bogʻliqligi hamda qoʻllanish sohalarini tushuntirish", "KT"),
      s("IAT10.KT.02", "tahlil", "Tizimli va amaliy dasturlar, operatsion tizim interfeyslari, drayverlarning vazifalari, xususiyatlari hamda kundalik hayotdagi qoʻllanilishini izohlash", "KT"),
      s("IAT10.KT.03", "baholash", "Kiritish qurilmalarining xususiyatlari, afzalliklari va cheklovlarini taqqoslash hamda ularning turli vazifalar uchun mosligini baholash", "KT"),
      s("IAT10.KT.04", "baholash", "Chiqarish qurilmalarining xususiyatlari, afzalliklari va cheklovlarini taqqoslash hamda ularning turli vazifalar uchun mosligini baholash", "KT"),
      s("IAT10.KT.05", "yaratish", "Kompyuter modellashtirishning turli sohalarda (masalan, binolarni loyihalash, suv toshqinlarini boshqarish, transport harakatini boshqarish va ob-havoni bashorat qilish) qoʻllanilishini tushuntirish.", "KT"),
      s("IAT10.KT.06", "baholash", "Anʼanaviy va mobil kompyuterlarning afzalliklari va cheklovlarini, shuningdek, VR va AR texnologiyalarining taʼsirini hisobga olgan holda muayyan vazifa uchun samarali kompyuter tizimi konfiguratsiyasini tanlash va tanlovini asoslash", "KT"),
      s("IAT10.KT.07", "qollash", "Axborotnomalar, plakatlar, veb-saytlar, multimedia taqdimotlari, audio, video, media oqimlari va elektron nashrlar kabi aloqa vositalarining xususiyatlarini tushunish hamda ulardan foydalanish", "KT"),
      s("IAT10.KT.08", "yaratish", "Kompyuter modellashtirishning turli sohalarda (masalan, binolarni loyihalash, suv toshqinlarini boshqarish, transport harakatini boshqarish va ob-havoni bashorat qilish) qoʻllanilishini tushuntirish.", "KT"),
      s("IAT10.KT.09", "baholash", "Ekspert tizimlarining afzalliklari va cheklovlarini inson tomonidan bajariladigan jarayonlar bilan taqqoslash orqali tahlil qilish", "KT"),
      s("IAT10.KT.10", "baholash", "Axborot kommunikatsiya texnologiyalarining turli sohalarda (masalan, maktab boshqaruv tizimlari, bankomatlar, elektron toʻlovlar, tibbiyotda axborot tizimlari, 3D chop etish, tanib olish tizimlari, sunʼiy yoʻldosh tizimlari) qoʻllanilishiga oid hayotiy vaziyatlar uchun mos texnologik yechimlarni tanlash va ulardan foydalanishni tushuntirish", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT10.KY.01", "yaratish", "Tasvirlarni tahrirlash jarayonida ularni aniqlik bilan joylashtirish, oʻlchamini oʻzgartirish, kesish, aylantirish, akslantirish amallaridan foydalanib raqamli tasvir yaratish", "KY"),
      s("IAT10.KY.02", "yaratish", "Tasvirlarning rang chuqurligi, yorqinligi, kontrastini sozlash, guruhlash, qatlamlash hamda hajmini optimallashtirish orqali vizual kontent (masalan, Oʻzbekistonning diqqatga sazovor joylari va madaniy merosiga oid) yaratish", "KY"),
      s("IAT10.KY.03", "baholash", "Hujjatlarni loyihalashda formatlash amallarining (shrift turi, oʻlchami, rangi, tekislash, qalin/italik/ostiga chizilgan, qator oraligʻi va chekinish) hujjat dizayniga taʼsirini tahlil qilish va hujjat maqsadiga mos uslubni qoʻllash", "KY"),
      s("IAT10.KY.04", "yaratish", "Tahrirlash amallari (obyektlar kiritish, tahrirlash, nusxalash, koʻchirish, joylashtirish) yordamida tartibli hujjat yaratish", "KY"),
      s("IAT10.KY.05", "yaratish", "Obyektlardan foydalanib bir xil uslub va maketga ega sahifa dizaynlarini yaratish hamda unga avtomatlashtirilgan elementlarni (sana, sahifa raqami, fayl maʼlumotlari) joylashtirish", "KY"),
      s("IAT10.KY.06", "yaratish", "Korporativ brend uslubiga mos keladigan yagona format (sarlavha uslublari, matn uslublari, rang palitrasi, shriftlar, qator oraligʻi)ni yaratish hamda ularni hujjat yoki taqdimotda yagona dizayn sifatida qoʻllash", "KY"),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT10.SI.01", "tushunish", "Sunʼiy intellekt orqali qoʻllaniladigan asosiy model turlarini va sohalarini tushuntirish", "SI"),
      s("IAT10.SI.02", "tushunish", "Sunʼiy intellekt tizimlari baʼzi vaziyatlarda kontekstni toʻliq tushunmasligi yoki notoʻgʻri talqin qilishi mumkinligini tushuntirish", "SI"),
      s("IAT10.SI.03", "yaratish", "Matn va rasm tasnifi orqali sunʼiy intellektda sodda loyihalarni bajarish", "SI"),
      s("IAT10.SI.04", "qollash", "Modelni optimallashtirishning boshlangʻich tushunchalarini qoʻllash", "SI"),
      s("IAT10.SI.05", "tushunish", "Sunʼiy intellekt texnologiyalaridan foydalanishda kuzatuv, manipulyatsiya va shaxsiy hayotga taʼsir bilan bogʻliq masalalarni tushuntirish", "SI"),
      s("IAT10.SI.06", "tahlil", "SI xatolari kundalik hayotda qanday oqibatlarga olib kelishi mumkinligini aniqlash", "SI"),
    ],
  },
  {
    grade: "11", stage: "Oʻrta taʼlim",
    standards: [
      // ── Algoritm va dasturlash (AD) ──
      s("IAT11.AD.01", "baholash", "Algoritmik yechimlarning samaradorligi, aniqligi va cheklovlarini tahlil qilish", "AD"),
      s("IAT11.AD.02", "tahlil", "Algoritmlar va dasturlarning ishlash jarayonini hujjatlashtirish, izohlash va vizuallashtirish", "AD"),
      s("IAT11.AD.03", "yaratish", "Dasturlash vositalari, kutubxonalar va avtomatlashtirish elementlaridan foydalanib dasturiy yechimlar yaratish", "AD"),
      s("IAT11.AD.04", "yaratish", "Muayyan masalani hal qilish uchun dasturiy loyiha ishlab chiqish, amalga oshirish va baholash", "AD"),
      s("IAT11.AD.05", "yaratish", "Masalaning qoʻyilishi → Model → Algoritm → Dasturlash → Sinov → Baholash bosqichlari asosida dasturiy mahsulot yaratish", "AD"),
      s("IAT11.AD.06", "qollash", "Dasturiy mahsulotlarni ishlab chiqishda masʼuliyatli yondashuv tamoyillarini qoʻllash", "AD", { assessType: "subjective" }),
      s("IAT11.AD.07", "baholash", "Avtomatik yaratilgan kontent va dasturiy tizimlardan foydalanishning xavflari hamda cheklovlarini baholash", "AD"),
      // ── Maʼlumotlarni boshqarish (MB) ──
      s("IAT11.MB.01", "yaratish", "Maʼlumotlar turlarini tanlash, kalitlarni yaratish va tahrirlash, jadvallar orasidagi bogʻlanishlarni oʻrnatish va boshqarish orqali relyatsion maʼlumotlar bazasi strukturasi (masalan, kutubxona katalogi, oʻquvchilar bazasi, inventar tizimi yoki klinika maʼlumotlari) loyihasini ishlab chiqish", "MB"),
      s("IAT11.MB.02", "yaratish", "Relyatsion maʼlumotlar bazalarida forma dizayni xususiyatlarini tushunish hamda maʼlumotlarni kiritish uchun formalar yaratish", "MB"),
      s("IAT11.MB.03", "baholash", "Relyatsion maʼlumotlar bazalarida mantiqiy, taqqoslash, joker belgilar yordamida qidiruvlarni amalga oshirish", "MB"),
      s("IAT11.MB.04", "bilish", "Relyatsion maʼlumotlar bazalarida bir yoki bir nechta mezon asosida maʼlumotlarni saralash", "MB"),
      s("IAT11.MB.05", "yaratish", "Relyatsion maʼlumotlar bazalarida hisoblashlarni bajarish uchun funksiya va formulalardan foydalanish", "MB"),
      s("IAT11.MB.06", "bilish", "Relyatsion maʼlumotlar bazalarida hisobotlar strukturasini shakllantirish", "MB"),
      s("IAT11.MB.07", "baholash", "Relyatsion maʼlumotlar bazalarining xususiyatlari, imkoniyatlari, afzalliklari va kamchiliklarini tahlil qilish", "MB"),
      // ── Tarmoqlar va xavfsizlik (TX) ──
      s("IAT11.TX.01", "yaratish", "Turli auditoriya guruhlarining ehtiyojlari, qiziqishlari va cheklovlarini tahlil qilish hamda ularga mos AKT yechimlarini ishlab chiqish", "TX"),
      s("IAT11.TX.02", "tahlil", "Mualliflik huquqi qonunchiligi va asosiy tamoyillarini tushuntirish hamda mualliflik huquqi buzilishining oldini olish usullarini izohlash.", "TX"),
      s("IAT11.TX.03", "baholash", "Elektron pochtaning xususiyatlari, foydalanish imkoniyatlari, cheklovlari, xavfsizlik jihatlarini, netiket va spamning xususiyatlari hamda ularning oldini olish usullarini tahlil qilish", "TX"),
      s("IAT11.TX.04", "baholash", "Internet xizmatlari (blog, viki, forum, ijtimoiy tarmoqlar) va internet protokollarining (HTTP, HTTPS, FTP, SSL) funksiyalarini taqqoslash, ularning afzalliklari, xavflari va cheklovlarini tahlil qilish hamda turli kommunikatsiya vaziyatlari uchun mos usullarni asoslash", "TX"),
      s("IAT11.TX.05", "baholash", "Qidiruv tizimlaridan samarali foydalanish va topilgan maʼlumotlarning ishonchliligi va dolzarbligini baholash", "TX"),
      // ── Kompyuter tizimlari (KT) ──
      s("IAT11.KT.01", "baholash", "Xotira va saqlash qurilmalarining xususiyatlari, imkoniyatlari va cheklovlarini taqqoslash hamda ularning turli sohalarda qoʻllanilish samaradorligini izohlash", "KT"),
      s("IAT11.KT.02", "baholash", "Kundalik vaziyatlar (zaxira nusxa olish, video montaj, koʻchma saqlash, korxona serverlari, uy sharoitlari va boshqalar) uchun mos saqlash qurilmasini tanlash va tanlovini asoslash", "KT"),
      s("IAT11.KT.03", "baholash", "Mikroprotsessor asosida boshqariladigan aqlli qurilmalarning qoʻllanilishi, ularning turmush tarzi, xavfsizlik, maʼlumotlar himoyasi va ijtimoiy munosabatlarga boʻlgan ijobiy hamda salbiy taʼsirini tahlil qilish", "KT"),
      s("IAT11.KT.04", "tahlil", "Axborot texnologiyalaridan foydalanishda sogʻliq bilan bogʻliq muammolarning (RSI, bel ogʻrigʻi, koʻz charchashi, bosh ogʻrigʻi) sabablarini va ularni oldini olish boʻyicha amaliy profilaktika choralarini izohlash", "KT"),
      s("IAT11.KT.05", "baholash", "Kuzatish, suhbatlar, anketalar va mavjud hujjatlarni tekshirishning tadqiqot usullarining xususiyatlarini, qoʻllanilishini, afzalliklari hamda cheklovlarini tahlil qilish, shuningdek, yangi tizim uchun mos apparat va dasturiy taʼminotni aniqlash", "KT"),
      s("IAT11.KT.06", "tushunish", "Tizim uchun zarur fayl/maʼlumotlar tuzilmalarini, kiritish formatlarini, chiqish formatlarini va tekshirish tartiblarini loyihalashni tushunish", "KT"),
      s("IAT11.KT.07", "baholash", "Tizimni sinovdan oʻtkazishning loyihalari, turli strategiyalari (modul, funksional, tizim testlari), rejalarini amalga oshirish va tizimni joriy etish usullari (toʻgʻridan-toʻgʻri, parallel, pilot, bosqichma-bosqich) orasidagi farqlarni asoslash", "KT"),
      s("IAT11.KT.08", "baholash", "Yangi tizim uchun foydalanuvchi talablari, kirish-chiqish formatlari va maʼlumotlar tuzilmalarini hisobga olgan holda ularga mos apparat-dasturiy taʼminotlarni tanlash hamda bu tanlovni hayotiy misollar bilan asoslash", "KT"),
      s("IAT11.KT.09", "baholash", "Yaratilgan tizimni samaradorlik, foydalanish qulayligi va maqsadga muvofiqlik mezonlari asosida baholash, joriy yechimni asosiy talablar bilan solishtirish hamda tizimdagi cheklovlar va takomillashtirish yoʻnalishlarini aniqlash.", "KT"),
      s("IAT11.KT.10", "yaratish", "Fayllarni izlash, ochish, nomlash, saqlash, ierarxik katalog/papkada qayta saqlash hamda arxivlash jarayonlarini amaliy bajarish", "KT"),
      s("IAT11.KT.11", "tushunish", "Turli fayl formatlari (docx, csv, pdf, jpg, png, zip va boshqalar)ning xususiyatlarini tushunish hamda ularni import va eksport qilish", "KT"),
      // ── Kontent yaratish (KY) ──
      s("IAT11.KY.01", "baholash", "Tekshirish (range, length, type, format, presence) va tasdiqlash (visual checking, double-entry) usullarining maqsadi, xususiyatlari hamda ular yordamida aniqlanadigan xatolarni (transpozitsiya, imlo xatolari, notoʻgʻri belgilar oraligʻi, nomuvofiq format) tahlil qilish", "KY"),
      s("IAT11.KY.02", "tahlil", "Avtomatlashtirilgan vositalardan (imlo va grammatika tekshiruvi), tekshirish tartiblari, tasdiqlash usullaridan foydalanib matn va maʼlumotlardagi xatolarni aniqlash hamda tuzatish", "KY"),
      s("IAT11.KY.03", "yaratish", "Sahifa parametrlarini (oʻlcham, yoʻnalish, chetlar, ustunlar), matnni formatlash vositalarini (qalin, kursiv, ostiga chizish, yuqori/pastki indeks), qatorlar oraligʻi, roʻyxatlar, topish–almashtirish funksiyalari, xatchoʻp va giperhavolalarni qoʻllash orqali strukturali hujjat yaratish", "KY"),
      s("IAT11.KY.04", "yaratish", "Dizayn elementlari (muqova, abzas oraligʻi, qator intervali, tabulyatsiya, sahifa chegaralari, sarlavha maketlari va boshqalar)dan foydalanib hujjat maketini ishlab chiqish", "KY"),
      s("IAT11.KY.05", "baholash", "Slayd tuzilishi, asosiy slayd (master slide), slayd tartiblari, animatsiyalar va oʻtishlarning taqdimot mazmuniga taʼsirini tahlil qilish hamda turli maqsadlar uchun (maʼruza, reklama, oʻquv taqdimoti, hisobot) mos dizayn elementlarini asoslash", "KY"),
      s("IAT11.KY.06", "yaratish", "Slaydlarga matn, rasm, video, audio, diagramma, jadval, shakl, eslatma, giperhavola, harakat tugmalarini joylashtirish va ularni tahrirlash, hamda slaydlar bilan ishlash (qoʻshish, oʻchirish, koʻchirish), shuningdek, animatsiya va oʻtishlarni qoʻllash orqali taqdimot yaratish", "KY"),
      s("IAT11.KY.07", "yaratish", "Asosiy slayd dizaynidan (fon, shrift, ranglar, logotip, joylashuvlar) foydalanib yagona uslubdagi taqdimot yaratish va uni turli koʻrinishlarda (ekran, taqdimotchi rejimi, tarqatma materiallar) namoyish qilish", "KY"),
      s("IAT11.KY.08", "tahlil", "HTML, CSS hamda veb-sahifa tuzilmasining asosiy qismlari, head va body boʻlimlarining vazifalarini izohlash", "KY"),
      s("IAT11.KY.09", "qollash", "HTML ning asosiy teglari va atributlarining maqsadi, ishlash tamoyillarini tushunish hamda ularni amalda qoʻllash", "KY"),
      s("IAT11.KY.10", "tahlil", "Tashqi va ichki CSS stillarining xususiyati, sinf (class) va identifikator (id) oʻrtasidagi farqlarni, ierarxiyasi hamda ustuvorlik tamoyillarini, shuningdek, ularning veb-sahifa koʻrinishiga taʼsirini izohlash", "KY"),
      s("IAT11.KY.11", "bilish", "Veb-sahifaga asosiy (matn, rasm, jadval, video, audio, `<div>` bloklari, roʻyxatlar va boshqa) elementlarni joylashtirish hamda ularning atributlarini sozlash", "KY"),
      s("IAT11.KY.12", "qollash", "CSS yordamida veb-sahifa elementlarini formatlashni (shrift, rang, fon, boʻsh joy, tekislash, chegaralarni belgilash, jadval stillari va roʻyxat koʻrinishlari) qoʻllash", "KY"),
      s("IAT11.KY.13", "yaratish", "HTML strukturasi va CSS stillaridan foydalanib semantik tuzilishga ega, vizual jihatdan izchil va funksional veb-sahifa (masalan, milliy madaniy meros yoki tarixiy obidalarga oid) yaratish", "KY"),
      // ── Sunʼiy intellekt (SI) ──
      s("IAT11.SI.01", "baholash", "Sunʼiy intellekt tizimlarining imkoniyatlari va cheklovlari tahlil qilish", "SI"),
      s("IAT11.SI.02", "tushunish", "Tushuntiriluvchanlik (explainability) nima ekanini tushuntirish", "SI"),
      s("IAT11.SI.03", "tushunish", "Generativ sunʼiy intellekt va avtomatlashtirishni tushuntirish", "SI"),
      s("IAT11.SI.04", "yaratish", "Sunʼiy intellekt loyihasini bajarish", "SI"),
      s("IAT11.SI.05", "baholash", "Muammo → Maʼlumot → Model → Baholash → Etik tahlil → Taqdimot modelini tushuntirish", "SI", { assessType: "subjective" }),
      s("IAT11.SI.06", "qollash", "Sunʼiy intellektdan foydalanishda masʼuliyatli yondashuv tamoyillarini tushunish va ularni amaliy faoliyatda qoʻllash", "SI", { assessType: "subjective" }),
      s("IAT11.SI.07", "baholash", "Sunʼiy intellekt qarorlarining huquqiy va ijtimoiy oqibatlarini tahlil qilish", "SI", { assessType: "subjective" }),
      s("IAT11.SI.08", "tushunish", "Sunʼiy ravishda yaratilgan yoki oʻzgartirilgan media materiallarning va manipulyativ axborotning mumkin boʻlgan salbiy oqibatlarini tushunish", "SI"),
    ],
  },
];
