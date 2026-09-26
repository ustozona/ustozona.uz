# OʻzDTS — Informatika va axborot texnologiyalari (IAT)

Oʻquv maqsadlari, sinflar kesimida.

Manba: umumiy oʻrta taʼlim oʻquv dasturi loyihasi, ommaviy muhokama
portali `dts.rtmuzedu.uz` (2026-09-03 da koʻchirildi).

⚠️ Bu **loyiha** hujjati — muhokamadan keyin oʻzgarishi mumkin. Yakuniy
tahrir chiqqach solishtirilsin.

## Taʼlim bosqichlari

Portalda IAT fani **uchta alohida PDF** bilan berilgan — har biri bir
taʼlim bosqichi:

| Bosqich | Sinflar | Fayl | Holat |
|---|---|---|---|
| Boshlangʻich taʼlim | 1–4 | `..._boshlangʻich_taʼlim_oʻquv_dasturi.pdf` (1.4 MB) | ⬜ olinmagan |
| **Tayanch oʻrta taʼlim** | **5–9** | `..._tayanch_oʻrta_taʼlim_oʻquv_dasturi.pdf` (2.2 MB) | ✅ **toʻliq** |
| Oʻrta taʼlim | 10–11 | `..._oʻrta_taʼlim_oʻquv_dasturi.pdf` (2.1 MB) | ✅ **toʻliq** |

Bu ilova uchun ham ahamiyatli: tayyor toʻplam **bosqich boʻyicha**
bo'linishi tabiiy (bitta ulkan 1–11 toʻplam emas) — oʻqituvchi odatda
bitta bosqichda ishlaydi.

✅ **Ochiq savolning yarmi hal boʻldi (2026-09-03):** oʻrta taʼlim (10–11)
hujjati **aynan oʻsha 6 ta mazmun sohasini** (AD/MB/TX/KT/KY/SI) va aynan
oʻsha kod formatini ishlatadi. Yaʼni sohalar **kamida 5–11 boʻylab
barqaror** — radar oʻqlari tayanch va oʻrta bosqich aro ham bir xil
qoladi, yillar aro solishtirish ishlaydi.

⚠️ Qolgan savol: **boshlangʻich taʼlimda (1–4)** ham oʻsha 6 tami —
hali tekshirilmagan.

## Kod formati

```
IAT5.AD.01
 │   │  │   └── oʻquv maqsadi tartib raqami
 │   │  └────── fanning mazmun sohasi bosh harfi
 │   └───────── sinf raqami
 └───────────── fan bosh harfi
```

Rasmiy atama: **fan bosh harfi + sinf raqami + fanning mazmun sohasi
bosh harfi + oʻquv maqsadi tartib raqami**.

⚠️ Hujjatda kodlar **oxirida nuqta bilan** yozilgan (`IAT5.AD.01.`) —
import paytida tozalanadi (spec §14.9).

## Mazmun sohalari (domenlar) — tayanch oʻrta taʼlim (5–9)

| Mazmun sohasi | Kod | 5-sinf | 6-sinf | 7-sinf | 8-sinf | 9-sinf |
|---|---|---|---|---|---|---|
| Algoritm va dasturlash | `AD` | 4 | 8 | 9 | 8 | 8 |
| Maʼlumotlarni boshqarish | `MB` | 4 | 5 | 7 | 6 | 9 |
| Tarmoqlar va xavfsizlik | `TX` | 8 | 7 | 8 | 10 | 8 |
| Kompyuter tizimlari | `KT` | 8 | 6 | 6 | 7 | 7 |
| Kontent yaratish | `KY` | 6 | 6 | 4 | 5 | 4 |
| Sunʼiy intellekt | `SI` | 4 | 4 | 7 | 7 | 6 |
| **Jami** | | **34** | **36** | **41** | **43** | **42** |

6 ta soha — profil radari uchun mos oʻlcham (spec §14.4: 3–8).

⭐ **Mazmun sohalari sinfdan sinfga oʻzgarmaydi** — bir xil 6 ta soha
5-sinfda ham, 6-sinfda ham. Bu profil radarining **yillar aro
solishtirilishini** mumkin qiladi: oʻsha oʻqlar, boshqa yil. Soha ichidagi
maqsadlar soni esa oʻzgaradi (AD 4 → 8, TX 8 → 7), shuning uchun foizni
solishtirganda maxraj boshqa ekanini yodda tutish kerak.

---

## 5-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT5.AD.01 | Chiziqli va takrorlanuvchi jarayonlarga oid algoritmlarni tuzish. |
| IAT5.AD.02 | Blokli dasturlash muhitida boshqaruv (takrorlash), koʻrinish, ovoz, xabar almashish bloklaridan foydalanib dastur tuzish. |
| IAT5.AD.03 | Blokli dasturlash muhitida ikki yoki undan ortiq obyektlar oʻzaro taʼsir qiladigan sodda dasturlarni tuzish. |
| IAT5.AD.04 | Mantiqiy fikrlash asosida dastur natijasini oldindan taxmin qilish. |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT5.MB.01 | Elektron jadvallarda qator (row) va ustun (column)larni formatlash, shuningdek oʻlchamlarini oʻzgartirish, yacheykalarni birlashtirish, oʻchirish. |
| IAT5.MB.02 | Elektron jadvallarda yacheykadagi maʼlumotlarni formatlash (Wrap Text, Merge and Centre). |
| IAT5.MB.03 | Elektron jadvallarda funksiyalar (MAX, MIN, SUM, AVG, COUNT)dan foydalanish. |
| IAT5.MB.04 | Elektron jadvallarda formulalardan nusxa olish. |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT5.TX.01 | Tarmoqdagi qurilmalarning oʻrni va vazifasini tushuntirish. |
| IAT5.TX.02 | Internet ishdan chiqqanda yuzaga keladigan muammolarni aniqlash. |
| IAT5.TX.03 | Raqamli qurilmalar maʼlumotlarning simsiz va paketlar koʻrinishida uzatilishini tasvirlash. |
| IAT5.TX.04 | Raqamli kontentning serverlarda saqlanishini tushunish. |
| IAT5.TX.05 | Internetdagi muloqot madaniyati va hurmat tamoyillariga rioya qilish. |
| IAT5.TX.06 | Onlayn muloqotning afzalliklari, xavflari va kiberbulling shakllarini aniqlash. |
| IAT5.TX.07 | Shaxsiy maʼlumotlarni himoya qilish va xavfsizlik sozlamalarini toʻgʻri oʻrnatish. |
| IAT5.TX.08 | Kompyuter texnikasidan toʻgʻri foydalanish qoidalarini tushuntirish. |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT5.KT.01 | Kompyuterlar maʼlumotlarni ikkilik shaklda, yaʼni 0 va 1 raqamlari yordamida ifodalashini bilish. |
| IAT5.KT.02 | Bit, bayt, kilobayt va megabayt birliklarini aniqlash, ularni xotira hajmi hamda saqlash hajmi bilan bogʻlash. |
| IAT5.KT.03 | Kirish – Qayta ishlash – Chiqish modelini tavsiflash va uni turli qurilmalar, masalan, boshqaruv tizimlari, printerlar yoki audio ishlab chiqarish tizimlari misolida tushuntirish. |
| IAT5.KT.04 | Kompyuter tizimi har xil turdagi saqlash qurilmalarini oʻz ichiga olishini tushunish. |
| IAT5.KT.05 | Baʼzi apparat va dasturiy taʼminot turlari boshqa apparat yoki dasturiy vositalar bilan mos kelmasligi mumkinligini tushunish. |
| IAT5.KT.06 | Turli raqamli qurilmalarning internetga ulanish jarayonini tushuntirish va ularning sensor sifatida maʼlumot toʻplash yoki aktuator sifatida jismoniy harakat bajarish funksiyalarini kundalik vaziyatlardan misollar bilan tasvirlash. |
| IAT5.KT.07 | Qurilmalar oʻrtasida fayllarni uzatishning turli usullarini sanab berish. |
| IAT5.KT.08 | Qurilmadagi standart ilovalarni topish va ulardan foydalanish. |

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT5.KY.01 | Kiritilgan matn miqdori ortib borishi bilan yozish tezligi va aniqligini oshirish. |
| IAT5.KY.02 | Matnli hujjatga jadval qoʻshish va toʻldirish. |
| IAT5.KY.03 | Raqamli vositalardan foydalanib sodda multimedia mahsulot (masalan, elektron chiqindilar, iqlim oʻzgarishi va yashil taʼlim, suv sarfi, energiya tejamkorligi, havo haroratining oʻzgarishi) yaratish. |
| IAT5.KY.04 | Audio yozuvlarni yozish va tahrirlash. |
| IAT5.KY.05 | Video kliplarni yozish va tahrirlash. |
| IAT5.KY.06 | Maʼlumotni topish uchun ilovalar ichida qidiruv funksiyalaridan foydalanish. |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT5.SI.01 | Aqlli qurilmalar misolida sunʼiy intellektning qoʻllanilish holatlari va ilovalarini aniqlash. |
| IAT5.SI.02 | Sunʼiy intellekt vositalari yordamida oddiy muammoga yechim topish. |
| IAT5.SI.03 | Tabiiy tilni qayta ishlash (NLP) va undan foydalanish jarayonlarini tushuntirish. |
| IAT5.SI.04 | Sunʼiy intellektdan masʼuliyat bilan foydalanish zarurligini tushunish. |

---

## 6-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT6.AD.01 | Blok-sxema koʻrinishida berilgan algoritmlarni tushunish va uning elementlarini izohlash. |
| IAT6.AD.02 | Takrorlanuvchi (takrorlanishlar soni berilgan, cheksiz takrorlanuvchi va shartga koʻra takrorlanuvchi) algoritmlarni blok-sxema orqali ifodalash. |
| IAT6.AD.03 | Blokli dasturlash muhitida boshqaruv (IF, THEN, ELSE), sezgirlik, oʻzgaruvchi, arifmetik (+, -) va taqqoslash operatorlari bloklaridan foydalanib dastur tuzish. |
| IAT6.AD.04 | Dasturlarda oʻzgaruvchilardan foydalanish va ularga aniq hamda tushunarli nom berishni tushunish. |
| IAT6.AD.05 | Blokli dasturlash muhitida chiziqli, tarmoqlanish va takrorlanish jarayonlarlarini oʻz ichiga olgan sodda dastur tuzish. |
| IAT6.AD.06 | Koʻp marta qayta ishlatiladigan kod qismlarini protsedura (sub-routine) orqali ifodalash. |
| IAT6.AD.07 | Kichik guruhlarda dasturlarni berilgan mezonlar asosida baholash. |
| IAT6.AD.08 | Turli dasturlash muhitlari (blokli yoki matnli)ni aniqlash va muayyan vaziyatlarda maqsadga muvofiq muhitni tanlash. |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT6.MB.01 | Elektron jadvalni chop etish. |
| IAT6.MB.02 | Hisob-kitoblarni bajarish uchun ichki funksiyalar (built-in functions)dan foydalanish. |
| IAT6.MB.03 | Formulalarni kiritishda yacheykaga murojaat qilish (cell referencing) usulidan foydalanish. |
| IAT6.MB.04 | Maʼlumotlarni yigʻish, tahlil qilish, masalalarni yechishni osonlashtirish uchun maʼlumotlarni turlarini aniqlash. |
| IAT6.MB.05 | Maʼlumotlarni taqdim etish va tahlil qilish uchun diagrammadan foydalanish. |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT6.TX.01 | Rasmlar, videolar, maʼlumotlar yoki fikrlarni almashish kabi onlayn harakatlar orqali raqamli iz yaratilishini tushunish. |
| IAT6.TX.02 | Onlayn striming odamlarning media va koʻngilochar kontentdan foydalanish usullarini qanday oʻzgartirganini tavsiflash. |
| IAT6.TX.03 | Onlayn kontentni nusxalashga nisbatan cheklovlar mavjudligini tushunish. |
| IAT6.TX.04 | Internetda ulashilgan har qanday kontent boshqa joylarga koʻchirilishi va boshqa odamlar tomonidan foydalanilishi mumkinligini tushunish. |
| IAT6.TX.05 | Internetga ulangan har qanday qurilma zararli dastur hujumlariga qarshi himoyasiz ekanligini tushuntirish. |
| IAT6.TX.06 | Onlayn tajovuzkor yoki noqonuniy xatti-harakatlar, jumladan kiberbulling haqida xabar berish muhimligini va buning uchun rasmiy tartib-qoidalar mavjudligini tushuntirish. |
| IAT6.TX.07 | Raqamli faoliyat bilan shugʻullanishdan oldin, shugʻullanish vaqtida va undan keyin oʻz xavfsizligi va farovonligini himoya qilish usullarini tavsiflash. |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT6.KT.01 | Analog maʼlumotlarni kompyuterda qayta ishlash uchun raqamlashtirish zarurligini tushuntirish. |
| IAT6.KT.02 | Nibble, bit, bayt, kilobayt, megabayt, gigabayt va terabayt tushunchalarini aniqlash va ularni xotira hajmi hamda saqlash bilan bogʻlash. |
| IAT6.KT.03 | Protsessorning kompyuterdagi rolini tushuntirish. |
| IAT6.KT.04 | Asosiy xotira va saqlash qurilmalarining vazifalarini tushuntirish. |
| IAT6.KT.05 | Funksionallik, narx, tezlik va dizayn kabi omillarni hisobga olgan holda apparat va dasturiy taʼminot komponentlarini qanday tanlashni tushuntirish. |
| IAT6.KT.06 | Raqamli texnologiya qanday qilib mavjud jarayonlarni tubdan oʻzgartiruvchi (disruptive) texnologiya boʻlishi mumkinligini tushuntirish. |

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT6.KY.01 | Berilgan vazifaga muvofiq matnli hujjat yaratish va tahrirlash. |
| IAT6.KY.02 | Shablonlar yordamida veb-sahifa dizaynini loyihalash. |
| IAT6.KY.03 | Hujjatga giperhavolalarni kiritish. |
| IAT6.KY.04 | Veb-sahifaning tarkibiy qismlarini aniqlash. |
| IAT6.KY.05 | Matn, rasmlar va vidjetlarni oʻz ichiga olgan veb-saytni nashr etish. |
| IAT6.KY.06 | Milliy-madaniy meros yoki tarixiy obidalarga oid veb-sahifa yaratish. |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT6.SI.01 | Dizayn fikrlash (design thinking) metodologiyasidan foydalangan holda loyiha yaratish. |
| IAT6.SI.02 | Sunʼiy intellekt texnikalarining turlarini va ularning qanday ishlashini tushuntirish (nazoratli, nazoratsiz, mustahkamlash, mashinaviy oʻqitish/chuqur oʻrganish). |
| IAT6.SI.03 | Artefaktlar va mahsulotlarni sinovdan oʻtkazish va qayta loyihalash. |
| IAT6.SI.04 | Sunʼiy intellekt tomonidan berilgan natijalarda xatoliklar boʻlishi mumkinligi va ularni inson nazorati zarurligini misollar bilan tushuntirish. |

---

## 7-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT7.AD.01 | Blok-sxema shaklida taqdim etilgan algoritmlarni bajarish, tushunish, tahrirlash va xatolarini tuzatish. |
| IAT7.AD.02 | Blok-sxemalarning natijalarini oldindan taxmin qilish va ularni sinovdan oʻtkazish. |
| IAT7.AD.03 | Matnga asoslangan dastur qanday ishlashini tushunish. |
| IAT7.AD.04 | Qoʻshish (+), ayirish (-), koʻpaytirish (*) va boʻlish (/) kabi turli arifmetik operatorlardan foydalanib matnga asoslangan dastur tuzish. |
| IAT7.AD.05 | Matnga asoslangan dasturlarda oʻzgaruvchilardan foydalanish. |
| IAT7.AD.06 | Matnga asoslangan dasturlash tillarida dastur tuzish uchun butun son (integer), haqiqiy son (real/float) va satr (string) kabi maʼlumot turlarini aniqlash hamda ulardan foydalanish. |
| IAT7.AD.07 | Foydalanuvchi kiritgan maʼlumotni qabul qilib, natijani chiqaradigan matnga asoslangan dastur tuzish. |
| IAT7.AD.08 | Dasturni yaratish jarayonida xatolarning qanday paydo boʻlishini aniqlash va ularning sabablarini tushunish. |
| IAT7.AD.09 | Matnga asoslangan dasturdagi xatolarni tizimli ravishda aniqlash va ularni tuzatish. |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT7.MB.01 | Shartli formatlash nima ekanligini va elektron jadvallarda qanday ishlatilishini izohlash. |
| IAT7.MB.02 | Muayyan mezonlar asosida elektron jadval yacheykalariga shartli formatlashni qoʻllash qoidalarini tuzish. |
| IAT7.MB.03 | Shartli formatlash qoidalarini oddiy masalada qoʻllash. |
| IAT7.MB.04 | Maʼlumotlarni modellashtirishning turli sohalarda qanday qoʻllanilishini aniqlash. |
| IAT7.MB.05 | Modellarni yaratish uchun aniq maʼlumotlardan foydalanish ahamiyatini izohlash. |
| IAT7.MB.06 | Tayyor elektron jadval modelidan foydalanish. |
| IAT7.MB.07 | Shartli formatlashda yacheyka manzili yoki yacheykalar diapazonini belgilash. |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT7.TX.01 | Uyali tarmoqlardagi yutuqlarni tasvirlab berish va ularning avlodlarini solishtirish. |
| IAT7.TX.02 | URL nima ekanligini va u veb-saytlarga kirish uchun qanday ishlatilishini tasvirlab berish. |
| IAT7.TX.03 | Bluetooth, Wi-Fi va uyali tarmoqlarning asosiy xususiyatlarini aniqlash va ularning farqlarini tushuntirish. |
| IAT7.TX.04 | «Adolatli foydalanish» tushunchasini va uning tasvirlar, videolar hamda matn kabi kontentdan foydalanish jarayonida masʼuliyatli ravishda qoʻllashni tushuntirish. |
| IAT7.TX.05 | Plagiat nima ekanini, uning axloqiy xavflarini va manbalarni toʻgʻri koʻrsatishni muhimligini tushuntirish. |
| IAT7.TX.06 | Shifrlashni, maʼlumotlarni xavfsiz saqlashdagi uning rolini tushuntirish va shifrlash misollarini aniqlash. |
| IAT7.TX.07 | Veb-sayt xavfsizligini qanday tekshirishni tushuntirish. |
| IAT7.TX.08 | Xavfsiz boʻlmagan veb-saytlardan foydalanish xavf-xatarlarini aniqlash va ularni qanday oldini olishni tushuntirish. |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT7.KT.01 | Maʼlumotlarni siqish nima ekanligini va nima uchun zarurligini tushuntirish. |
| IAT7.KT.02 | Asosiy xotira, RAM va ROM nima ish bajarishini tushuntirish. |
| IAT7.KT.03 | Raqamli qurilmalar va tizimlarning dizaynini baholash. |
| IAT7.KT.04 | Amaliy dasturiy taʼminot va tizim dasturiy taʼminoti nima ish bajarishini tushuntirish va taqqoslash. |
| IAT7.KT.05 | Operatsion tizim va uning vazifasini tavsiflash. |
| IAT7.KT.06 | Utilit dasturlar nima ish bajarishini tushuntirish. |

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT7.KY.01 | Fayllarni boshqa kompyuterlar, tarmoqlar yoki bulutli serverlarda masofadan turib qanday saqlash mumkinligini tushuntirish. |
| IAT7.KY.02 | Hujjatlarni tahrirlash jarayonida «oʻzgarishlarni kuzatish» va «izoh» funksiyalaridan foydalanish. |
| IAT7.KY.03 | Google Drive yoki OneDrive kabi bulutli saqlash platformalarida «Buyuk allomalarimiz merosi» yoki «Milliy hunarmandchilik anʼanalari» kabi milliy qadriyatlarga oid loyihalar ustida jamoaviy fayllar yaratish, ishlash, saqlash va ulashish usullarini koʻrsatish. |
| IAT7.KY.04 | Qidiruv natijalarini yaxshilash uchun ilgʻor qidiruv usullaridan foydalanish. |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT7.SI.01 | Sunʼiy intellekt nima ekanligini taʼriflash. |
| IAT7.SI.02 | Sunʼiy intellektning kundalik hayotdagi qoʻllanilishini aniqlash. |
| IAT7.SI.03 | Sunʼiy intellektga asoslangan avtomatlashtirish sanoatlarda qanday qoʻllanilishini, uning afzalliklari va muammolarini tushuntirish. |
| IAT7.SI.04 | Sunʼiy intellekt tasvirlarni, yuzlarni yoki matnni qanday aniqlashini tavsiflash. |
| IAT7.SI.05 | Simulyatorlar yoki iqlim modellari kabi haqiqiy dunyo holatlarini modellashtiruvchi tizimlarini misollar orqali tushuntirish. |
| IAT7.SI.06 | Avtomatlashtirishni va uning mashinalarga inson yordamisiz vazifalarni bajarishda qanday yordam berishini tushuntirish. |
| IAT7.SI.07 | Sunʼiy intellekt qarorlarining turli sohalarga taʼsiri va inson nazoratiga boʻlgan zaruratni tahlil qilish. |

---

## 8-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT8.AD.01 | Tanlov (selection) ishlatilgan blok-sxemalarni bajarish, tushunish, tahrirlash, xatolarni tuzatish va sinovdan oʻtkazish. |
| IAT8.AD.02 | Psevdokodning oʻziga xosligini tushunish. |
| IAT8.AD.03 | Tanlov (selection) operatorlaridan foydalanib matnga asoslangan dastur tuzish. |
| IAT8.AD.04 | Butun son, haqiqiy son, belgi va satr kabi maʼlumot turlaridan foydalanib matnga asoslangan dastur tuzish. |
| IAT8.AD.05 | Kamida bitta oʻzgarmas (constant) qiymatdan foydalanib dastur tuzish. |
| IAT8.AD.06 | Masalalarni kichik qismlarga ajratish. |
| IAT8.AD.07 | Turli xil sinov maʼlumotlaridan foydalanish zaruratini izohlash. |
| IAT8.AD.08 | Dastur ishlab chiqishda dasturni sinovdan oʻtkazish, xatolarni tuzatish va bosqichma-bosqich yaxshilash jarayonidan foydalanish. |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT8.MB.01 | SUM, MIN, MAX, COUNT, AVERAGE va IF kabi funksiyalardan foydalanib maʼlumotlarni tahlil qilish. |
| IAT8.MB.02 | Elektron jadvallardagi funksiyalarni va ularning maʼlumotlarni tahlil qilishdagi rolini aniqlash. |
| IAT8.MB.03 | Elektron jadvallardan kundalik vaziyatlarda foydalanish. |
| IAT8.MB.04 | Jadvalda formulalar, bogʻlanishlar kiritish orqali masalani yechish modelidan foydalanish. |
| IAT8.MB.05 | Maʼlumotlarning vaqt oʻtishi bilan oʻzgarishini tahlil qilish. |
| IAT8.MB.06 | «Metamaʼlumotlar» (Metadata) qanday ishlashini tushuntirish. |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT8.TX.01 | Tarmoq turlarini aniqlash va ularni farqlash. |
| IAT8.TX.02 | Simsiz va simli tarmoqlarning afzalliklari hamda kamchiliklarini tavsiflash. |
| IAT8.TX.03 | Maʼlumot uzatish jarayonida xatoliklar yuz berishi mumkinligini tushuntirish. |
| IAT8.TX.04 | Elektron xabarlarda his-tuygʻularni yoki maʼnoni yetkazish uchun norasmiy usullardan foydalanish maqsadga muvofiqligini aniqlash. |
| IAT8.TX.05 | Onlayn kontentning sifati va ishonchliligini baholash. |
| IAT8.TX.06 | Turli xil onlayn muloqot usullarining afzalliklari va kamchiliklarini tavsiflash. |
| IAT8.TX.07 | Xavfsizlik devorlari (firewalls) nima ekanini va ular tarmoqlarni himoyalashda qanday yordam berishini tavsiflash. |
| IAT8.TX.08 | Antivirus dasturlarini aniqlash hamda ularning maʼlumotlarni xavfsiz saqlashdagi rolini tushuntirish. |
| IAT8.TX.09 | Veb-saytlar va giperhavolalarning muvofiqligi hamda xavfsizligini baholash. |
| IAT8.TX.10 | Fayllarni, shaxsiy maʼlumotlarni va onlayn farovonlikni himoya qilish uchun xavfsiz usullardan foydalanish. |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT8.KT.01 | Ikkilik raqamlar yordamida ifodalanishi mumkin boʻlgan maʼlumotlarning turlarini aniqlash. |
| IAT8.KT.02 | Ikkilik sonlarni oʻnlik sonlarga va oʻnlik sonlarni ikkilik sonlarga oʻtkazish. |
| IAT8.KT.03 | Belgilarni ifodalash uchun ASCII dan qanday foydalanilishini tavsiflash. |
| IAT8.KT.04 | Tasvirlar qanday raqamlashtirilishini tavsiflash. |
| IAT8.KT.05 | Tovushning ikkilik shaklda ifodalanishini tavsiflash. |
| IAT8.KT.06 | Raqamli texnologiya ish joyida qanday qoʻllanilishini tavsiflash. |
| IAT8.KT.07 | Buyumlar Interneti (IoT) ning afzalliklari va xavflarini tavsiflash. |

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT8.KY.01 | Katta hajmdagi matnni ravon va aniq yozish. |
| IAT8.KY.02 | Shablonlar nima ekanini va hujjatlar yaratishdagi rolini aniqlash. |
| IAT8.KY.03 | Hujjatlar yaratishda shablonlardan foydalanishning afzalliklarini tushuntirish. |
| IAT8.KY.04 | Tovush, video, matn va tasvirlarni birlashtirgan raqamli mahsulotlar (masalan, iqlim oʻzgarishi va yashil taʼlim, chiqindilarni aqlli qayta ishlashga oid mavzuda) bilan ishlash uchun qurilmalardan foydalanish. |
| IAT8.KY.05 | Ishonchli maʼlumotni topish uchun ilgʻor qidiruv usullaridan foydalanish. |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT8.SI.01 | Mashinaviy oʻqitishni (machine learning) taʼriflash. |
| IAT8.SI.02 | Mashinaviy oʻqitish qanday ishlashini tavsiflash. |
| IAT8.SI.03 | Mashinaviy oʻqitishning haqiqiy hayotdagi qoʻllanilishini tushuntirish. |
| IAT8.SI.04 | Kengaytirilgan reallikning (AR) tanish vaziyatlardagi qoʻllanilishini aniqlash. |
| IAT8.SI.05 | Sunʼiy intellekt bilan kengaytirilgan reallikning (AR) qoʻllanilishini sanab oʻtish. |
| IAT8.SI.06 | Avtonom dasturlash va sunʼiy intellektning robototexnikada qanday qoʻllanilishini tavsiflash. |
| IAT8.SI.07 | Sunʼiy intellekt bilan bogʻliq axloqiy qoidalarni taʼriflash. |

---

## 9-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT9.AD.01 | Psevdokod shaklida berilgan algoritmlarni bajarish, tushunish, tahrirlash va xatolarni tuzatish. |
| IAT9.AD.02 | Bir xil vazifani yechish uchun tuzilgan algoritm, blok-sxema va psevdokodlarni tahlil qilish va solishtirish. |
| IAT9.AD.03 | Hisoblagich bilan boshqariladigan (count-controlled) va shart bilan boshqariladigan takrorlanishlardan foydalanib matnga asoslangan dastur tuzish. |
| IAT9.AD.04 | Tarjimon dasturlari, jumladan kompilyator va interpretatorning asosiy xususiyatlarini tushunish. |
| IAT9.AD.05 | Dasturda hisoblagich oʻzgaruvchisidan foydalanib dastur tuzish. |
| IAT9.AD.06 | Protseduralar yoki funksiyalar yordamida matnga asoslangan dastur tuzish. |
| IAT9.AD.07 | Sintaktik, mantiqiy va bajarilish xatolarini aniqlash va tuzatish. |
| IAT9.AD.08 | Dasturni sinovdan oʻtkazish rejasini ishlab chiqish va qoʻllash. |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT9.MB.01 | «What-if tahlili» vositasini aniqlash va undan qaror qabul qilish jarayonida qanday foydalanishni izohlash. |
| IAT9.MB.02 | Maqsadli «what-if» savolini sinab koʻrish uchun maqsadli natijani hisoblash vositasidan foydalanish. |
| IAT9.MB.03 | Kundalik turmushda foydalaniladigan tizimlarni modellashtirish uchun elektron jadvalni loyihalash va sinovdan oʻtkazish. |
| IAT9.MB.04 | Tuzilgan elektron jadvalning maʼlum maqsad uchun mosligini baholash. |
| IAT9.MB.05 | Masalani yechish uchun tegishli maʼlumotlarni toʻplash va shu maʼlumotlar asosida diagramma yaratish. |
| IAT9.MB.06 | Diagramma maʼlumotlarini tahlil qilib, asosiy maʼlumotlarni aniqlash. |
| IAT9.MB.07 | «Katta maʼlumotlar» («Big data») atamasini taʼriflash va uning qoʻllanilishini izohlash. |
| IAT9.MB.08 | Maʼlumotlar bazasi va uning maqsadini izohlash. |
| IAT9.MB.09 | Elektron jadvalda funksiyalarni toʻgʻri kiritilganini tekshirish va xatoliklarni tuzatish. |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT9.TX.01 | Turli tarmoq topologiyalarini aniqlash. |
| IAT9.TX.02 | Maʼlumotlarni uzatishda ishlatiladigan protokollarning rolini tushuntirish. |
| IAT9.TX.03 | Maʼlumot uzatish jarayonida yuz beradigan xatoliklarni tushunish va sabablarini aniqlash. |
| IAT9.TX.04 | Boshqalar tomonidan yaratilgan tasvirlar, musiqa va videolardan foydalanganda axloqiy qoidalarga rioya qilish. |
| IAT9.TX.05 | Onlayn hamjamiyatlarda hurmat va masʼuliyat bilan muloqot qilish. |
| IAT9.TX.06 | Onlayn platformalarning afzalliklari va xavflarini aniqlash. |
| IAT9.TX.07 | Raqamli texnologiyalardan xavfsiz va muvozanatli foydalanish uchun sogʻlom odatlarni rivojlantirish. |
| IAT9.TX.08 | Tarmoq xavfsizligini joriy etishda amalga oshiriladigan tanlovlarni tushuntirish. |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT9.KT.01 | Koʻpaytirish yoki boʻlish yordamida xotira birliklari oʻrtasida oʻtkazishlarni bajarish. |
| IAT9.KT.02 | Kompyuterda buyruqlarni qayta ishlash jarayonini tushuntiruvchi «Buyruq olish – Tahlil qilish – Bajarish» siklining qanday ishlashini tavsiflash. |
| IAT9.KT.03 | Foydalanuvchi tajribasi, foydalanish imkoniyati va rivojlanayotgan texnologiyalar, shuningdek, prototiplar kabi omillarga asoslangan raqamli qurilmalar dizaynidagi yaxshilanishlarni aniqlash. |
| IAT9.KT.04 | Mavjud texnologiyalarni loyihalashda noxolislik va foydalanish imkoniyati bilan bogʻliq muammolarni muhokama qilish. |
| IAT9.KT.05 | Hisoblash qurilmalari va ularning dasturiy taʼminotida yuzaga keladigan muammolarni tizimli ravishda aniqlash va tuzatish. |
| IAT9.KT.06 | Operatsion tizim tomonidan bajariladigan vazifalarni tavsiflash: xotirani, fayllarni, qurilmalarni, quvvatni, boshqarish. |
| IAT9.KT.07 | Yordamchi dasturlarni, jumladan drayverlarni, xavfsizlik dasturlarini va defragmentatsiyani tavsiflash. |

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT9.KY.01 | Raqamli vositalar sanʼat, musiqa, kino va dizayn kabi sohalardagi ijodiy ishlarni qanday oʻzgartirganini tushuntirish. |
| IAT9.KY.02 | Raqamli tafovutni tasvirlab berish va undan teng foydalanish yoʻllarini taklif qilish. |
| IAT9.KY.03 | Oʻrganish jarayoni, ijodkorlik va rivojlanishni aks ettiruvchi raqamli portfolio yaratish. |
| IAT9.KY.04 | Raqamli vositalardan masʼuliyat bilan foydalanib, mazmunli loyihalar (masalan, Oʻzbekistonning diqqatga sazovor joylari, milliy qadriyatlari, urf-odatlari va madaniy merosiga oid) yaratish. |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT9.SI.01 | Sunʼiy intellekt turlarini tavsiflash. |
| IAT9.SI.02 | Sunʼiy intellekt qoʻllanadigan sohalarni (masalan, avtonom boshqariladigan avtomobil, yuzni tanish, tibbiy diagnostika, sifat nazorati hamda suv, yer, havo, tabiat monitoringi) tavsiflash. |
| IAT9.SI.03 | Sunʼiy intellektdan foydalanishning afzalliklari va muammolarini tushunish. |
| IAT9.SI.04 | Matn, rasm, ovoz yoki video ishlab chiqarishda sunʼiy intellekt vositalarida foydalanish. |
| IAT9.SI.05 | Sunʼiy intellekt vositalarini ijodiy faoliyatda samarali qoʻllash. |
| IAT9.SI.06 | Sunʼiy intellekt texnologiyalarining qoʻllanishini etik, huquqiy va ijtimoiy jihatdan baholash. |

---

## Mazmun sohalari — oʻrta taʼlim (10–11)

Aynan oʻsha 6 ta soha, oʻsha kodlar.

| Mazmun sohasi | Kod | 10-sinf | 11-sinf |
|---|---|---|---|
| Algoritm va dasturlash | `AD` | 6 | 7 |
| Maʼlumotlarni boshqarish | `MB` | 6 | 7 |
| Tarmoqlar va xavfsizlik | `TX` | 7 | 5 |
| Kompyuter tizimlari | `KT` | 10 | 11 |
| Kontent yaratish | `KY` | 6 | 13 |
| Sunʼiy intellekt | `SI` | 6 | 8 |
| **Jami** | | **41** | **51** |

✅ Oʻrta taʼlim bosqichi (10–11) **toʻliq**: 92 ta oʻquv maqsadi.

---

## 10-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT10.AD.01 | Sunʼiy intellekt modellarida qoʻllaniladigan algoritmlarning ishlash tamoyillarini tushuntirish |
| IAT10.AD.02 | Dastur va algoritmlarning notoʻgʻri natijalar berish sabablarini aniqlash hamda sinovdan oʻtkazish maʼlumotlari yordamida ularni tekshirish |
| IAT10.AD.03 | Maʼlumotlarni tasniflash yoki guruhlashga oid sodda dasturlar yaratish va sinovdan oʻtkazish |
| IAT10.AD.04 | Algoritm samaradorligini oshirish uchun parametrlarni oʻzgartirish, natijalarni taqqoslash va optimallashtirish usullarini qoʻllash |
| IAT10.AD.05 | Dasturiy yechimlarni yaratishda maʼlumotlar xavfsizligi va foydalanuvchi huquqlarini hisobga olish kerakligini izohlash |
| IAT10.AD.06 | Dasturiy va algoritmik xatolarning natijalarga taʼsirini tahlil qilish hamda ularni tuzatish usullarini qoʻllash |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT10.MB.01 | Elektron jadvalda maʼlumotlarni belgilash, diagramma turini tanlash, oʻqlarni nomlash, qiymatlarni formatlash (oʻnli kasrlar, valyuta belgisi), ikkilamchi maʼlumotlar seriyasini qoʻshish va oʻq shkalalarni sozlash orqali grafik yoki diagrammani tuzish |
| IAT10.MB.02 | Diagramma elementlari (ranglar sxemasi, toʻldirish naqshlari, ajratilgan sektorlar, legenda, sarlavha, yorliqlar)ni moslashtirish orqali vizual jihatdan tushunarli hamda yuqori sifatli grafik/diagramma dizaynini taqdim etish |
| IAT10.MB.03 | Formulalar, funksiyalar (SUM, AVERAGE, IF, VLOOKUP, XLOOKUP va boshqalar), nisbiy va absolyut manzillarning elektron jadvaldagi rolini tahlil qilish, formulalardagi xatolarni, notoʻgʻri havolalarni, nomuvofiq formatlarni aniqlash |
| IAT10.MB.04 | Yacheykalar bilan ishlash (qoʻshish, oʻchirish, birlashtirish), saralash, qidiruv operatorlari (AND, OR, >, < va boshqalar) bilan filtrlash, shartli formatlash, maʼlumot turlariga koʻra formatlash hamda sahifa strukturasini sozlash orqali elektron jadval tuzish |
| IAT10.MB.05 | Yaratilgan elektron jadvalning strukturasi, samaradorligi va formatlash aniqligini baholash |
| IAT10.MB.06 | Murakkab formula va funksiyalar, maʼlumotlar diapazoni, diagrammalar, shartli formatlash, filtrlash hamda chop etish sozlamalaridan foydalangan holda elektron jadval modeli (masalan, hisob-kitob varaqasi, moliyaviy jadval, rejalashtirish jadvali, soʻrovnoma natijalari, ob-havo maʼlumotlari, maktab natijalari)ni tuzish |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT10.TX.01 | LAN, WLAN, WAN, intranet, ekstranet va internetning maqsadi, imkoniyatlari va cheklovlarini tahlil qilish hamda turli vaziyatlar uchun mos tarmoq turini tanlash |
| IAT10.TX.02 | Tarmoq qurilmalarining (masalan, Wi-Fi, Bluetooth, router, NIC, hub, switch, bridge va boshqalar) vazifasi hamda oʻzaro bogʻliqligini tushunish, shuningdek, ularni boshqarish |
| IAT10.TX.03 | Bulutli hisoblash, elektron konferensiya (video, audio, veb) va maʼlumot almashish xizmatlaridan real vaziyatlarda foydalanish hamda ularning afzalliklari va cheklovlariga asoslanib mos xizmatni tanlash |
| IAT10.TX.04 | Maʼlumotlarni himoya qilish uchun parollarni boshqarish, autentifikatsiya usullarini qoʻllash, zararli dasturlardan himoyalanish vositalaridan foydalanish |
| IAT10.TX.05 | Xavfsizlik muammolari (elektr xavflari, yongʻin, uskunalarning nosozligi) sabablari, oqibatlarini va ularning oldini olish chora-tadbirlarini tushuntirish |
| IAT10.TX.06 | Shaxsiy maʼlumotlarning maxfiy saqlanishi va himoyalanishi zarurligini, tahdidlarning xususiyatlari hamda taʼsirini tushuntirish |
| IAT10.TX.07 | Shaxsiy maʼlumotlarni himoya qilish usullari va vositalaridan foydalanish |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT10.KT.01 | Kompyuter qurilmalari (CPU, xotira, kiritish-chiqarish qurilmalari va yordamchi saqlash vositalari)ning xususiyatlari, oʻzaro bogʻliqligi hamda qoʻllanish sohalarini tushuntirish |
| IAT10.KT.02 | Tizimli va amaliy dasturlar, operatsion tizim interfeyslari, drayverlarning vazifalari, xususiyatlari hamda kundalik hayotdagi qoʻllanilishini izohlash |
| IAT10.KT.03 | Kiritish qurilmalarining xususiyatlari, afzalliklari va cheklovlarini taqqoslash hamda ularning turli vazifalar uchun mosligini baholash |
| IAT10.KT.04 | Chiqarish qurilmalarining xususiyatlari, afzalliklari va cheklovlarini taqqoslash hamda ularning turli vazifalar uchun mosligini baholash |
| IAT10.KT.05 | Kompyuter modellashtirishning turli sohalarda (masalan, binolarni loyihalash, suv toshqinlarini boshqarish, transport harakatini boshqarish va ob-havoni bashorat qilish) qoʻllanilishini tushuntirish. |
| IAT10.KT.06 | Anʼanaviy va mobil kompyuterlarning afzalliklari va cheklovlarini, shuningdek, VR va AR texnologiyalarining taʼsirini hisobga olgan holda muayyan vazifa uchun samarali kompyuter tizimi konfiguratsiyasini tanlash va tanlovini asoslash |
| IAT10.KT.07 | Axborotnomalar, plakatlar, veb-saytlar, multimedia taqdimotlari, audio, video, media oqimlari va elektron nashrlar kabi aloqa vositalarining xususiyatlarini tushunish hamda ulardan foydalanish |
| IAT10.KT.08 | Kompyuter modellashtirishning turli sohalarda (masalan, binolarni loyihalash, suv toshqinlarini boshqarish, transport harakatini boshqarish va ob-havoni bashorat qilish) qoʻllanilishini tushuntirish. |
| IAT10.KT.09 | Ekspert tizimlarining afzalliklari va cheklovlarini inson tomonidan bajariladigan jarayonlar bilan taqqoslash orqali tahlil qilish |
| IAT10.KT.10 | Axborot kommunikatsiya texnologiyalarining turli sohalarda (masalan, maktab boshqaruv tizimlari, bankomatlar, elektron toʻlovlar, tibbiyotda axborot tizimlari, 3D chop etish, tanib olish tizimlari, sunʼiy yoʻldosh tizimlari) qoʻllanilishiga oid hayotiy vaziyatlar uchun mos texnologik yechimlarni tanlash va ulardan foydalanishni tushuntirish |

⚠️ **Manbadagi takror:** `IAT10.KT.05` va `IAT10.KT.08` matni **bir xil**
(kompyuter modellashtirishning qoʻllanilishi). Bu hujjatdagi xato boʻlishi
mumkin — yakuniy tahrirda tekshirilsin. Import paytida ikkalasi ham
saqlanadi (kod boshqa), lekin oʻqituvchiga takror boʻlib koʻrinadi.

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT10.KY.01 | Tasvirlarni tahrirlash jarayonida ularni aniqlik bilan joylashtirish, oʻlchamini oʻzgartirish, kesish, aylantirish, akslantirish amallaridan foydalanib raqamli tasvir yaratish |
| IAT10.KY.02 | Tasvirlarning rang chuqurligi, yorqinligi, kontrastini sozlash, guruhlash, qatlamlash hamda hajmini optimallashtirish orqali vizual kontent (masalan, Oʻzbekistonning diqqatga sazovor joylari va madaniy merosiga oid) yaratish |
| IAT10.KY.03 | Hujjatlarni loyihalashda formatlash amallarining (shrift turi, oʻlchami, rangi, tekislash, qalin/italik/ostiga chizilgan, qator oraligʻi va chekinish) hujjat dizayniga taʼsirini tahlil qilish va hujjat maqsadiga mos uslubni qoʻllash |
| IAT10.KY.04 | Tahrirlash amallari (obyektlar kiritish, tahrirlash, nusxalash, koʻchirish, joylashtirish) yordamida tartibli hujjat yaratish |
| IAT10.KY.05 | Obyektlardan foydalanib bir xil uslub va maketga ega sahifa dizaynlarini yaratish hamda unga avtomatlashtirilgan elementlarni (sana, sahifa raqami, fayl maʼlumotlari) joylashtirish |
| IAT10.KY.06 | Korporativ brend uslubiga mos keladigan yagona format (sarlavha uslublari, matn uslublari, rang palitrasi, shriftlar, qator oraligʻi)ni yaratish hamda ularni hujjat yoki taqdimotda yagona dizayn sifatida qoʻllash |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT10.SI.01 | Sunʼiy intellekt orqali qoʻllaniladigan asosiy model turlarini va sohalarini tushuntirish |
| IAT10.SI.02 | Sunʼiy intellekt tizimlari baʼzi vaziyatlarda kontekstni toʻliq tushunmasligi yoki notoʻgʻri talqin qilishi mumkinligini tushuntirish |
| IAT10.SI.03 | Matn va rasm tasnifi orqali sunʼiy intellektda sodda loyihalarni bajarish |
| IAT10.SI.04 | Modelni optimallashtirishning boshlangʻich tushunchalarini qoʻllash |
| IAT10.SI.05 | Sunʼiy intellekt texnologiyalaridan foydalanishda kuzatuv, manipulyatsiya va shaxsiy hayotga taʼsir bilan bogʻliq masalalarni tushuntirish |
| IAT10.SI.06 | SI xatolari kundalik hayotda qanday oqibatlarga olib kelishi mumkinligini aniqlash |

---

## 11-SINF — oʻquv maqsadlari

### Algoritm va dasturlash (AD)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT11.AD.01 | Algoritmik yechimlarning samaradorligi, aniqligi va cheklovlarini tahlil qilish |
| IAT11.AD.02 | Algoritmlar va dasturlarning ishlash jarayonini hujjatlashtirish, izohlash va vizuallashtirish |
| IAT11.AD.03 | Dasturlash vositalari, kutubxonalar va avtomatlashtirish elementlaridan foydalanib dasturiy yechimlar yaratish |
| IAT11.AD.04 | Muayyan masalani hal qilish uchun dasturiy loyiha ishlab chiqish, amalga oshirish va baholash |
| IAT11.AD.05 | Masalaning qoʻyilishi → Model → Algoritm → Dasturlash → Sinov → Baholash bosqichlari asosida dasturiy mahsulot yaratish |
| IAT11.AD.06 | Dasturiy mahsulotlarni ishlab chiqishda masʼuliyatli yondashuv tamoyillarini qoʻllash |
| IAT11.AD.07 | Avtomatik yaratilgan kontent va dasturiy tizimlardan foydalanishning xavflari hamda cheklovlarini baholash |

### Maʼlumotlarni boshqarish (MB)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT11.MB.01 | Maʼlumotlar turlarini tanlash, kalitlarni yaratish va tahrirlash, jadvallar orasidagi bogʻlanishlarni oʻrnatish va boshqarish orqali relyatsion maʼlumotlar bazasi strukturasi (masalan, kutubxona katalogi, oʻquvchilar bazasi, inventar tizimi yoki klinika maʼlumotlari) loyihasini ishlab chiqish |
| IAT11.MB.02 | Relyatsion maʼlumotlar bazalarida forma dizayni xususiyatlarini tushunish hamda maʼlumotlarni kiritish uchun formalar yaratish |
| IAT11.MB.03 | Relyatsion maʼlumotlar bazalarida mantiqiy, taqqoslash, joker belgilar yordamida qidiruvlarni amalga oshirish |
| IAT11.MB.04 | Relyatsion maʼlumotlar bazalarida bir yoki bir nechta mezon asosida maʼlumotlarni saralash |
| IAT11.MB.05 | Relyatsion maʼlumotlar bazalarida hisoblashlarni bajarish uchun funksiya va formulalardan foydalanish |
| IAT11.MB.06 | Relyatsion maʼlumotlar bazalarida hisobotlar strukturasini shakllantirish |
| IAT11.MB.07 | Relyatsion maʼlumotlar bazalarining xususiyatlari, imkoniyatlari, afzalliklari va kamchiliklarini tahlil qilish |

### Tarmoqlar va xavfsizlik (TX)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT11.TX.01 | Turli auditoriya guruhlarining ehtiyojlari, qiziqishlari va cheklovlarini tahlil qilish hamda ularga mos AKT yechimlarini ishlab chiqish |
| IAT11.TX.02 | Mualliflik huquqi qonunchiligi va asosiy tamoyillarini tushuntirish hamda mualliflik huquqi buzilishining oldini olish usullarini izohlash. |
| IAT11.TX.03 | Elektron pochtaning xususiyatlari, foydalanish imkoniyatlari, cheklovlari, xavfsizlik jihatlarini, netiket va spamning xususiyatlari hamda ularning oldini olish usullarini tahlil qilish |
| IAT11.TX.04 | Internet xizmatlari (blog, viki, forum, ijtimoiy tarmoqlar) va internet protokollarining (HTTP, HTTPS, FTP, SSL) funksiyalarini taqqoslash, ularning afzalliklari, xavflari va cheklovlarini tahlil qilish hamda turli kommunikatsiya vaziyatlari uchun mos usullarni asoslash |
| IAT11.TX.05 | Qidiruv tizimlaridan samarali foydalanish va topilgan maʼlumotlarning ishonchliligi va dolzarbligini baholash |

### Kompyuter tizimlari (KT)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT11.KT.01 | Xotira va saqlash qurilmalarining xususiyatlari, imkoniyatlari va cheklovlarini taqqoslash hamda ularning turli sohalarda qoʻllanilish samaradorligini izohlash |
| IAT11.KT.02 | Kundalik vaziyatlar (zaxira nusxa olish, video montaj, koʻchma saqlash, korxona serverlari, uy sharoitlari va boshqalar) uchun mos saqlash qurilmasini tanlash va tanlovini asoslash |
| IAT11.KT.03 | Mikroprotsessor asosida boshqariladigan aqlli qurilmalarning qoʻllanilishi, ularning turmush tarzi, xavfsizlik, maʼlumotlar himoyasi va ijtimoiy munosabatlarga boʻlgan ijobiy hamda salbiy taʼsirini tahlil qilish |
| IAT11.KT.04 | Axborot texnologiyalaridan foydalanishda sogʻliq bilan bogʻliq muammolarning (RSI, bel ogʻrigʻi, koʻz charchashi, bosh ogʻrigʻi) sabablarini va ularni oldini olish boʻyicha amaliy profilaktika choralarini izohlash |
| IAT11.KT.05 | Kuzatish, suhbatlar, anketalar va mavjud hujjatlarni tekshirishning tadqiqot usullarining xususiyatlarini, qoʻllanilishini, afzalliklari hamda cheklovlarini tahlil qilish, shuningdek, yangi tizim uchun mos apparat va dasturiy taʼminotni aniqlash |
| IAT11.KT.06 | Tizim uchun zarur fayl/maʼlumotlar tuzilmalarini, kiritish formatlarini, chiqish formatlarini va tekshirish tartiblarini loyihalashni tushunish |
| IAT11.KT.07 | Tizimni sinovdan oʻtkazishning loyihalari, turli strategiyalari (modul, funksional, tizim testlari), rejalarini amalga oshirish va tizimni joriy etish usullari (toʻgʻridan-toʻgʻri, parallel, pilot, bosqichma-bosqich) orasidagi farqlarni asoslash |
| IAT11.KT.08 | Yangi tizim uchun foydalanuvchi talablari, kirish-chiqish formatlari va maʼlumotlar tuzilmalarini hisobga olgan holda ularga mos apparat-dasturiy taʼminotlarni tanlash hamda bu tanlovni hayotiy misollar bilan asoslash |
| IAT11.KT.09 | Yaratilgan tizimni samaradorlik, foydalanish qulayligi va maqsadga muvofiqlik mezonlari asosida baholash, joriy yechimni asosiy talablar bilan solishtirish hamda tizimdagi cheklovlar va takomillashtirish yoʻnalishlarini aniqlash. |
| IAT11.KT.10 | Fayllarni izlash, ochish, nomlash, saqlash, ierarxik katalog/papkada qayta saqlash hamda arxivlash jarayonlarini amaliy bajarish |
| IAT11.KT.11 | Turli fayl formatlari (docx, csv, pdf, jpg, png, zip va boshqalar)ning xususiyatlarini tushunish hamda ularni import va eksport qilish |

### Kontent yaratish (KY)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT11.KY.01 | Tekshirish (range, length, type, format, presence) va tasdiqlash (visual checking, double-entry) usullarining maqsadi, xususiyatlari hamda ular yordamida aniqlanadigan xatolarni (transpozitsiya, imlo xatolari, notoʻgʻri belgilar oraligʻi, nomuvofiq format) tahlil qilish |
| IAT11.KY.02 | Avtomatlashtirilgan vositalardan (imlo va grammatika tekshiruvi), tekshirish tartiblari, tasdiqlash usullaridan foydalanib matn va maʼlumotlardagi xatolarni aniqlash hamda tuzatish |
| IAT11.KY.03 | Sahifa parametrlarini (oʻlcham, yoʻnalish, chetlar, ustunlar), matnni formatlash vositalarini (qalin, kursiv, ostiga chizish, yuqori/pastki indeks), qatorlar oraligʻi, roʻyxatlar, topish–almashtirish funksiyalari, xatchoʻp va giperhavolalarni qoʻllash orqali strukturali hujjat yaratish |
| IAT11.KY.04 | Dizayn elementlari (muqova, abzas oraligʻi, qator intervali, tabulyatsiya, sahifa chegaralari, sarlavha maketlari va boshqalar)dan foydalanib hujjat maketini ishlab chiqish |
| IAT11.KY.05 | Slayd tuzilishi, asosiy slayd (master slide), slayd tartiblari, animatsiyalar va oʻtishlarning taqdimot mazmuniga taʼsirini tahlil qilish hamda turli maqsadlar uchun (maʼruza, reklama, oʻquv taqdimoti, hisobot) mos dizayn elementlarini asoslash |
| IAT11.KY.06 | Slaydlarga matn, rasm, video, audio, diagramma, jadval, shakl, eslatma, giperhavola, harakat tugmalarini joylashtirish va ularni tahrirlash, hamda slaydlar bilan ishlash (qoʻshish, oʻchirish, koʻchirish), shuningdek, animatsiya va oʻtishlarni qoʻllash orqali taqdimot yaratish |
| IAT11.KY.07 | Asosiy slayd dizaynidan (fon, shrift, ranglar, logotip, joylashuvlar) foydalanib yagona uslubdagi taqdimot yaratish va uni turli koʻrinishlarda (ekran, taqdimotchi rejimi, tarqatma materiallar) namoyish qilish |
| IAT11.KY.08 | HTML, CSS hamda veb-sahifa tuzilmasining asosiy qismlari, head va body boʻlimlarining vazifalarini izohlash |
| IAT11.KY.09 | HTML ning asosiy teglari va atributlarining maqsadi, ishlash tamoyillarini tushunish hamda ularni amalda qoʻllash |
| IAT11.KY.10 | Tashqi va ichki CSS stillarining xususiyati, sinf (class) va identifikator (id) oʻrtasidagi farqlarni, ierarxiyasi hamda ustuvorlik tamoyillarini, shuningdek, ularning veb-sahifa koʻrinishiga taʼsirini izohlash |
| IAT11.KY.11 | Veb-sahifaga asosiy (matn, rasm, jadval, video, audio, `<div>` bloklari, roʻyxatlar va boshqa) elementlarni joylashtirish hamda ularning atributlarini sozlash |
| IAT11.KY.12 | CSS yordamida veb-sahifa elementlarini formatlashni (shrift, rang, fon, boʻsh joy, tekislash, chegaralarni belgilash, jadval stillari va roʻyxat koʻrinishlari) qoʻllash |
| IAT11.KY.13 | HTML strukturasi va CSS stillaridan foydalanib semantik tuzilishga ega, vizual jihatdan izchil va funksional veb-sahifa (masalan, milliy madaniy meros yoki tarixiy obidalarga oid) yaratish |

### Sunʼiy intellekt (SI)

| Kod | Oʻquv maqsadi |
|---|---|
| IAT11.SI.01 | Sunʼiy intellekt tizimlarining imkoniyatlari va cheklovlari tahlil qilish |
| IAT11.SI.02 | Tushuntiriluvchanlik (explainability) nima ekanini tushuntirish |
| IAT11.SI.03 | Generativ sunʼiy intellekt va avtomatlashtirishni tushuntirish |
| IAT11.SI.04 | Sunʼiy intellekt loyihasini bajarish |
| IAT11.SI.05 | Muammo → Maʼlumot → Model → Baholash → Etik tahlil → Taqdimot modelini tushuntirish |
| IAT11.SI.06 | Sunʼiy intellektdan foydalanishda masʼuliyatli yondashuv tamoyillarini tushunish va ularni amaliy faoliyatda qoʻllash |
| IAT11.SI.07 | Sunʼiy intellekt qarorlarining huquqiy va ijtimoiy oqibatlarini tahlil qilish |
| IAT11.SI.08 | Sunʼiy ravishda yaratilgan yoki oʻzgartirilgan media materiallarning va manipulyativ axborotning mumkin boʻlgan salbiy oqibatlarini tushunish |

---

## Ilovaga kiritishda eslatmalar

- Bu maʼlumot `standard-templates.ts` ga tayyor toʻplam boʻlib kiradi:
  `frameworkCode: "IAT"`, `grade: "5"`, `subject: "informatics"`,
  `domains: [AD, MB, TX, KT, KY, SI]` (tartib — hujjatdagidek).
- `bloom` maydoni DTS'da **berilmagan** — import paytida boʻsh qoladi
  yoki maqsad feʼlidan (tuzish / tushuntirish / aniqlash / tushunish)
  taxmin qilinadi. Taxmin foydalanuvchiga koʻrsatiladi.
- `foundational` va `assessType` ham DTS'da yoʻq — keyin qoʻlda
  belgilanadi.
- Qolgan sinflar (6–11) va boshqa fanlar shu tartibda qoʻshiladi.

Bogʻliq: `docs/standards-page-spec.md` §14.9.
