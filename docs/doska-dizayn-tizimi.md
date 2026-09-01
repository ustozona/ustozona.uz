# Doska dizayn tizimi

> Ustozona Doska — sinf ekrani. Bu hujjat uning **vizual qoidalarini**
> belgilaydi. Umumiy tizim (tokenlar, sirt/ohang oʻqlari) —
> [ost-loyihalar-arxitektura.md](./ost-loyihalar-arxitektura.md) §A va
> [design-system.md](./design-system.md). Bu yerda faqat Doskaga xos qism.

Manba: sinf ekrani va sinf boshqaruvi turkumidagi referenslarning DOM
tahlili (R130–R143; nomlar `ost-loyihalar-arxitektura.md` da).
**Nusxa emas** — oʻlchov qarorlari va nima uchun ular ishlashi oʻrganildi,
keyin oʻz tokenlarimizga xaritalandi.

⚠️ Mualliflik chizigʻi. Olinadigan narsa — **oʻlchov, joylashuv va
xatti-harakat**: ular gʻoya, himoyalanmaydi. Olinmaydigan narsa —
**asar**: SVG yoʻl maʼlumotlari, ikona fayllari, CSS, brend tusi va
matn satrlari. Amalda buni tizimning oʻzi taʼminlaydi: ikonalar
Solar'dan qayta chiziladi (§3), ranglar `class-colors.ts` dan, fonlar
sof CSS (§4). Referensdan bironta bayt koʻchirilmaydi.

---

## 1. Asosiy tamoyil: panel jim, kanvas jonli

Referensning vidjet panelida **fon neytral** — oq, ochiq kulrang
chegara. Ikonalar esa **rangli** — har biri oʻz tusida, ikki
shaffoflikda (qalam binafsha, taymer sariq, svetofor qizil).

Sabab jismoniy: sinf ekrani 5 metrdan koʻriladi va oʻquvchi **kontentga**
qarashi kerak, boshqaruvga emas. Panel rangli boʻlsa, u eʼtiborni oʻziga
tortadi va taymer bilan raqobatlashadi.

**Qoida:** panel YUZASI neytral (fon, chegara, hover) — rang faqat
ikona ichida, vidjetda va faol holat belgisida. Yaʼni rang maʼno
tashiydi, bezak boʻlmaydi.

⚠️ Bu `playful` ohangga zid emas. Ohang **kanvasga** tegishli: yumaloq
burchak, toʻyingan tus, qalin soya — hammasi vidjetda. Panel esa asbob,
u koʻrinmasligi kerak.

---

## 1.5. Suzuvchi guruh idishi — `<BarGroup>`

Doskada kanvas butun ekranni egallaydi, boshqaruv esa uning ustida
suzadi. Yaʼni **har boshqaruv toʻdasi oʻzini fondan ajratishi kerak**:
oq yuza, chegara, soya, oʻz z-qatlami. Bu naqsh qobiqda toʻrt marta
takrorlanadi (uy · toʻliq ekran+menyu · vidjet paneli · ekran
navigatsiyasi), shuning uchun u [`BarGroup.tsx`](../src/components/doska/BarGroup.tsx)
da bitta komponent.

⚠️ Idish border **bilan ham**, shadow **bilan ham** chiziladi — bu
`design-system.md` dagi «border YOKI shadow» qoidasidan **ataylab
chetlashish**. U yerdagi qoida panel varaq ustida turishini nazarda
tutadi; bu yerda fon ixtiyoriy rangda, och fonda chegara, toʻq fonda
soya ushlab turadi. Bittasi yetmaydi.

### Ikki tur

| Tur | Ichki tugmalar | Qayerda |
|---|---|---|
| `segmented` | tegib turadi, radius idishda, ajratgich `<BarDivider>` | ikonali boshqaruv toʻdasi |
| `padded` | oʻz radiusini saqlaydi, idish `p-2` beradi | yorliqli vidjet tugmalari |

Sabab oddiy: yorliqli tugma allaqachon 52px kenglikda va tegib tursa
qator devorga aylanadi; ikonali tugma esa 40px va ajratilsa toʻda
boʻlib koʻrinmaydi.

### Tooltip

Guruh ichidagi ikonali tugmada yorliq yoʻq — nom **tooltip**da
(`<BarIconButton>`). `title` atributi ishlatilmaydi: brauzer uni bir
soniya kutib chiqaradi va uslubga boʻysunmaydi, dars oʻrtasida esa bu
«tugma nima qilishini bilmadim» degani.

`delayDuration` = 300 ms (nol emas): boshqaruv zich joylashgan va nol
kechikishda sichqoncha ustidan oʻtganda tooltip'lar ketma-ket chaqnaydi.

⚠️ `DoskaMenu` ning tugmasi `<BarIconButton>` ga OʻRALMAYDI — u
`PopoverTrigger asChild` ning bolasi, zanjir esa `asChild` → `<Tooltip>`
(DOM element emas) boʻlib uzilardi. Shuning uchun koʻrinish
`barIconButtonClass` sifatida ham eksport qilingan.

---

## 2. Vidjet paneli

### Anatomiya

```
┌─────────────────────────────────────────────┐
│ [rejim]  │  vidjetlar grid  │  [menyu]      │  ← 3 boʻlim
└─────────────────────────────────────────────┘
```

| Element | Qiymat | Nega |
|---|---|---|
| Panel foni | `--surface-2` (oq) | kanvasdan ajralsin |
| Panel chegarasi | 1px `--border` | `stage` sirtida 0.5px koʻrinmaydi |
| Panel radiusi | 10px | vidjetnikidan (22px) **kichik** — asbob, kontent emas |
| Ichki masofa | 8px | |
| Z-qatlam | `--z-doska-bar` (1000100) | §5 |

### Vidjet tugmasi

```
   ▁▁▁     ← 3px indikator joyi (ekranda shu vidjet bormi)
 ┌─────┐
 │ 28  │   ← 40×40 tugma, ichida 28px ikona
 └─────┘
 taymer    ← 11px, 1 qator, max 52px
```

| Oʻlcham | Qiymat |
|---|---|
| Tugma | 40×40px |
| Ikona | 28×28px (tugma ichida 6px padding) |
| Tugmalar orasi | 12px (6px margin × 2) |
| Nom | 11px, `font-medium`, bitta qator, `text-ellipsis` |
| Nom kengligi | max 52px |
| Indikator | 3px balandlik, tugma **tepasida** |

⚠️ Bu oʻlchamlar `stage` sirtidan **mustasno** — panel oʻqituvchi
qoʻlida, 50 sm dan boshqariladi, sinf esa unga qaramaydi. Shuning uchun
panel `desk` shkalasida qoladi. Buni kodda ochiq belgilash kerak, aks
holda `--spacing` override uni ham kattalashtiradi.

### Holatlar

| Holat | Koʻrinish |
|---|---|
| Normal | shaffof fon, ikona vidjet tusida (§3) |
| Hover | `--fill-ghost-hover` fon |
| Fokus | 2px `--ring` halqa, 2px offset |
| Ekranda bor | tepada 3px `--primary` chiziq |

### Faol rejim indikatori

Referens faol rejim ostiga **absolute** joylashgan kvadrat
qoʻyadi va uni `transition-all` bilan siljitadi — yaʼni tugmalar
oʻzgarmaydi, faqat belgi harakatlanadi.

Bu naqsh olinadi: bizda ham chizish/tanlash rejimi qoʻshilganda
indikator siljisin, sakramasin. `playful` ohangdagi spring egri chizigʻi
bunga aynan mos.

### Tor holat — panel ekrandan chiqib ketmaydi

Panel oʻqituvchining planshetida ham ochiladi. Kenglik yetmaganda u
`max-w-[calc(100vw-1.5rem)]` bilan chegaralanadi va **ichida
gorizontal aylanadi**.

Busiz sigʻmagan tugmalar kanvasdan tashqariga chiqib ketardi: 640px
ekranda «Fon» va «Tozalash» koʻrinmas edi va ularga yetishning **hech
qanday yoʻli yoʻq** edi.

`overscroll-x-contain` shart — aylantirish panel oxiriga yetganda
brauzerning «orqaga» ishorasiga oʻtib ketmasin.

### Yashirish

Panel yonida yigʻish tugmasi turadi; yigʻilganda uning oʻrnida bitta
ochish tugmasi qoladi. Toʻliq ekran rejimi buni almashtira olmaydi —
u brauzer qobigʻini olib tashlaydi, panel esa baribir joyida.

⚠️ Holat **store'da emas**, oddiy React holati — yaʼni saqlanmaydi.
Yashirish dars paytiga tegishli qaror («hozir sinf ekranga qarasin»),
keyingi darsga emas. Saqlansa oʻqituvchi ertasi kuni doskani ochib
boshqaruvni topolmaydi va ilova buzilgan deb oʻylaydi.

---

## 2.5. Kontekst asboblar paneli

Tanlangan vidjetning **ustida** suzadi va uning amallarini tutadi:
nusxalash · oldinga chiqarish · oʻchirish
([`WidgetToolbar.tsx`](../src/components/doska/WidgetToolbar.tsx)).

Ilgari tanlovda faqat burchakdagi yakka «×» bor edi. Burchak esa bitta
amalga joy beradi — ikkinchisi qoʻshilganda tutqichlar bilan urishadi.
Panel esa oʻsib boradi va oʻqituvchining nigohi allaqachon turgan
joyda turadi.

| Qoida | Sabab |
|---|---|
| Vidjet tepasiga yopishganda pastga tushadi | aks holda kanvasdan chiqib ketadi |
| Har tugmada `data-doska-no-drag` | busiz panelga bosish vidjetni sudrab yuboradi (`interaction.ts`) |
| Tutqich qatlamining **yonida**, ichida emas | §5 ga qarang |

⚠️ **Panel tutqich qatlamining ICHIGA qoʻyilmaydi.** Tutqich qatlami
`z-index` bilan oʻz stacking-kontekstini yaratadi; panel oʻsha ichida
qolsa `--z-doska-context` (1000105) global tartibda hisobga olinmaydi
va pastdagi vidjetning paneli vidjet panelining (1000100) **ostida**
qolib ketadi. Ikkalasi `SelectionOverlay` dan yonma-yon qaytariladi.

### Nima qoʻyilmaydi

«Sozlamalar» tugmasi **hozircha yoʻq** — vidjetlarning oʻz sozlama
oynasi yoʻq, boʻsh oyna ochadigan tugma esa yoʻqidan yomon. U vidjet
sozlamalari qurilganda qoʻshiladi.

---

## 3. Vidjet kartochkasi (kanvasda)

Panel jim, vidjet esa jonli — bu yerda `playful` ohang toʻliq ishlaydi.

| Element | Qiymat |
|---|---|
| Radius | `--radius` (playful ohangda 20px) |
| Fon | `--doska-{tus}-bg` |
| Matn | `--doska-{tus}-fg` |
| Chuqurlik | `0 4px 0 --doska-{tus}-edge` — ofset soya, blur yoʻq |
| Matn oʻlchami | `clamp(2rem, 24cqw, 6rem)` — konteynerga bogʻliq |

### Rang qayerdan keladi

**Ikki xil rang tizimi, ular aralashmaydi:**

| Tur | Vazifa | Manba |
|---|---|---|
| **Vidjet tusi** | identifikatsiya — qaysi vidjet qayerda | `class-colors.ts` (17 rang) |
| **Brend rangi** | harakat, faol holat, tanlov | `[data-product="doska"]` → yashil |

**Tus semantik emas, ajratuvchi.** Soat koʻk, taymer sariq, svetofor
qizil. Maqsad: 5 metrdan qaysi vidjet qayerdaligini **rang boʻyicha**
tanish. Yangi vidjetga qoʻshni vidjetdan farq qiladigan tus beriladi
(`registry.ts` dagi `tint` maydoni).

⚠️ **Yangi palitra ixtiro qilinmaydi.** [`class-colors.ts`](../src/lib/class-colors.ts)
da 17 rang bor va ularning idrok yorqinligi (L) bir diapazonda
kalibrlangan — yaʼni ular bir oilaga oʻxshaydi. Xom OKLCH yozish oʻsha
kalibrovkani buzadi.

⚠️ **Brend yashili tus sifatida ishlatilmaydi.** Agar yashil vidjetlar
orasida boʻlsa, faol holat belgisi (ham yashil) ular bilan qoʻshilib
ketadi va koʻrinmay qoladi. Bu Apple, Google, Notion'da bir xil qoida:
brend rangi faqat interaktivlik uchun. Yagona istisno — svetoforning
yashil chirogʻi, u jismoniy obyekt rangi.

### Ikona ranglash: IERARXIK

Solar duotone SVG'ida ikki qatlam bor — `opacity=".5"` li massa va usti
detal. Bizda **ikkalasi ham bitta tus** oladi, farq faqat shaffoflikda.
Bu Apple SF Symbols'ning «hierarchical» rejimi.

Amalda bu bitta CSS qoida va bitta oʻzgaruvchi:

```css
[data-icon-tinted] .doska-icon { fill: var(--doska-icon-tint, currentColor); }
```

`opacity` ga **tegilmaydi** — u SVG'ning oʻz atributi boʻlib qolaveradi.

#### Nega palitra emas

2026-08 da qisqa vaqt «palitra» rejimi ishlatildi: toʻq kontur + rangli
ichki (referens uslubi). U aniqroq koʻrinardi, lekin uch narxi
bor edi va ularning har biri kelajakka tegishli:

1. Toʻq kontur yorqin ichki qatlamga **tegib** turadi — ikkalasi ham
   maksimumda, orasida bufer yoʻq. Koʻz buni chegara emas, zarba deb
   oʻqiydi (*simultaneous contrast*). Konturni ochroq qilish muammoni
   siljitadi, yechmaydi.
2. **Miqyosga chidamaydi.** 16px da ikki rang loyqalashadi; panel 4
   vositadan 20 taga oʻsganda kamalakka aylanadi.
3. **Oʻz ikonamizni chizishni qiyinlashtiradi** — ikki xil rang har bir
   siljishni koʻrsatib qoʻyadi. Ierarxikda xato aralashib ketadi, va
   `opacity` qatlami boʻlmagan ikona ham buzilmaydi (u shunchaki bir
   rangli boʻlib chiqadi).

Narxi ham bor va u tan olinadi: **ierarxik palitradan kuchsizroq
koʻrinadi.** Buning evaziga panel oʻsganda buzilmaydi va yashil brend
rangi ekrandagi eng koʻzga tashlanadigan narsa boʻlib qolaveradi.

#### Tus qanday hisoblanadi — HISOBLANMAYDI

`src/lib/doska/tint.ts` tusni palitradan **qanday boʻlsa shundayligicha**
oladi. Hech qanday tuzatish yoʻq, va bu ataylab.

Uch tuzoq shu joyda ish yegan (2026-08-21) — ularni bilmasangiz
qaytadan tushasiz:

**1. `<g fill="…">` CSS'ni toʻxtatadi.** Iconify SVG'ni
`<g fill="currentColor">` bilan beradi. Prezentatsiya atributi
**merosdan kuchli** — CSS `fill` ni `<svg>` ga qoʻysa ham, `<g>` uni
oʻsha yerda toʻxtatadi va yoʻllar `currentColor` da qolaveradi.

Aynan shu «kontur qora» shikoyatining asl sababi edi: tus faqat
`[opacity]` li qatlamga tushardi (u yoʻlni CSS toʻgʻridan-toʻgʻri
tanlardi), qolgani esa matn rangida — qora — qolardi. Tus hisoblash
formulasi ikki marta qayta yozilgan, natija oʻzgarmagan, chunki muammo
formulada emas edi. **Yangi ikonada `<g>` dan `fill` ni oʻchiring.**

**2. Kontrast «tuzatishi» sariqni oʻldiradi.** Yorqinlik oq fonga 3:1
(WCAG 1.4.11) chiqquncha tushirilganda koʻk/qizil/binafsha deyarli
oʻzgarmaydi, sariq esa `#ffb900` dan `#c08b00` ga — oltindan xantalga —
quladi. Sariq oq fonda bir vaqtda sariq ham, 3:1 ham boʻla olmaydi.

Ustiga qoida **notoʻgʻri qoʻllangan** edi: WCAG 1.4.11 mazmunni
tushunish uchun ZARUR grafikaga tegishli. Panelda har tugmaning
koʻrinadigan matn yorligʻi bor («Soat», «Taymer») — maʼnoni oʻsha
tashiydi. Ikona uni kuchaytiradi, almashtirmaydi.

⚠️ Ikona **yakka**, yorliqsiz maʼno tashisa (faqat ikonali asboblar
qatori) kontrast talabi qaytadi — lekin uni oʻsha kontekstda hal qiling,
`tint.ts` ga tegmang.

**3. `color-mix` ishlatilmaydi.** U yaroqsiz boʻlsa `var()` fallback
ishlamaydi — xususiyat butunlay tushib qoladi va ikona nasl orqali qora
boʻlib qoladi.

### Qachon idish (container), qachon yoʻq

Ierarxik — **asos**. Rangli idish (yumshoq tusli yumaloq kvadrat) uning
ustiga qoʻshiladigan **modifikator**, va u faqat bitta shartda qoʻshiladi:

> Ikona **harakatni** emas, **narsani** bildirsa — sinf, fan, sozlamalar
> boʻlimi, mahsulot — va u **roʻyxat yoki katakda** tursa.

Zich gorizontal panelda (vidjet paneli, asboblar qatori) idish
**qoʻyilmaydi** — qoʻshni idishlar bir-biriga tegib rangli chiziqqa
aylanadi. 16px da ham qoʻyilmaydi: idish joy talab qiladi.

Shakl allaqachon band: **doira = sinf** (`ClassSwatch`), shuning uchun
**yumaloq kvadrat = vosita/boʻlim**.

Toʻyingan (toʻliq rangli) idish + oq ikona faqat **≥40px** da: landing
mahsulot kartochkalari, ilova plitkalari. Panelga hech qachon — u yashil
brend rangining kuchini yeb qoʻyadi.

### Oʻz ikonamizni chizish

Kerakli ikona Solar'da boʻlmasa oʻzimiz qilamiz. Arzondan qimmatga:

1. Solar'ning oʻzida qidirish (1305 ta ikona)
2. Solar'ning Figma community faylidan koʻchirib **tahrirlash** — tur,
   qalinlik va radius avtomatik meros boʻladi
3. Ikkitasini birlashtirish (kitob + lupa)
4. Noldan chizish — oxirgi chora

Shartlar:

- `viewBox="0 0 24 24"`, mazmun ~20×20 ichida (chetdan ~2px optik joy)
- bitta **massa** qatlami `opacity=".5"` bilan + ustida detal qatlamlari
- faqat `fill`, `stroke` yoʻq (Solar'da chiziq ham toʻldirilgan shakl)
- `DOSKA_ICONS` roʻyxatiga (`components/doska/icons.tsx`) yozib qoʻyish

⚠️ Boshqa duotone oilalarni (Phosphor va h.k.) **aralashtirmaymiz** —
ikki oila bir panelda darhol sezilib qoladi.

⚠️ Iconify SVG'ni HTML shaklida beradi (`fill-rule`, `clip-rule`), JSX
esa camelCase talab qiladi (`fillRule`, `clipRule`). Yangi ikona
qoʻshganda oʻgirish shart — aks holda atribut qoʻllanmaydi va konsolda
«Invalid DOM property» chiqadi.

### Nazorat sahifasi: `/doska/ikonalar`

Qoʻlda tahrirlangan ikonalar vaqt oʻtib siljiydi. Sahifa hammasini
16 / 28 / 48px da va butun palitrada yonma-yon chiqaradi — nomuvofiqlik
bir qarashda koʻrinadi. Ichki vosita, `noindex`.

⚠️ U `surfaceFor()` da ataylab `desk` ga qaytarilgan (`toneFor()` da esa
`serious`). `stage` da butun oʻlcham shkalasi kattayadi va ikonalarni
haqiqiy pikselda solishtirib boʻlmaydi.

**Oʻlcham konteynerdan keladi (`cqw`), sirtdan emas.** Vidjetni
kattalashtirsangiz raqam ham oʻsadi. `stage` sirti panelga va menyularga
taʼsir qiladi, vidjet ichiga emas — chunki vidjet oʻlchamini oʻqituvchi
sudrab belgilaydi.

---

## 4. Fon va bo'r rejimi

Fonlar sof CSS ([backgrounds.ts](../src/lib/doska/backgrounds.ts)) —
rasm fayli yoʻq. Sabab: referenslar 100+ JPG saqlaydi (megabaytlar),
ular projektorda pikselli chiqadi; CSS istalgan oʻlchamda toza.

Har fonning `tone` maydoni bor va u **render qarori**:

| `tone` | Vidjet koʻrinishi |
|---|---|
| `light` | toʻyingan rangli kartochka (standart) |
| `dark` | deyarli shaffof fon + bo'r rangidagi matn |

Toʻq doska ustida rangli kartochka «yopishtirilgan stikerdek» begona
koʻrinadi. Shuning uchun `data-bg-tone="dark"` boʻlganda `--doska-*`
tuslari qayta belgilanadi (globals.css) — **vidjet komponentlari bundan
bexabar**, ular baribir `var(--doska-*-bg)` ni oʻqiydi.

---

## 5. Z-qatlamlar

Vidjetlar bir-birining ustiga chiqadi; tartib chalkashsa tuzatish qiyin
(R136). Nomlangan qatlamlar:

| Qatlam | Token | Qiymat |
|---|---|---|
| Kanvas mazmuni | — | vidjetning `z` maydoni (1…n) |
| Tanlov chegarasi | — | ramka ichida |
| Oʻlcham tutqichlari | `--z-doska-handles` | 1000095 |
| Vidjet paneli | `--z-doska-bar` | 1000100 |
| Kontekst asboblar | `--z-doska-context` | 1000105 |
| Yuqori tugmalar | `--z-doska-top` | 1000110 |
| Tooltip / toast | `--z-doska-tooltip` | 1001000 |

Raqamlar referensdan olingan — ular oʻzboshimcha koʻrinadi,
lekin katta oraliq **ataylab**: orasiga yangi qatlam qoʻshish kerak
boʻlsa, hech narsani qayta raqamlash shart emas.

---

## 6. Responsive — container query, viewport emas

Referens `bar-sm/md/lg/xl` degan **maxsus** breakpointlar ishlatadi va
ular panelning oʻz kengligiga bogʻlangan.

Sabab: doska projektorda ham, oʻqituvchining noutbukida ham, planshetda
ham ochiladi. Viewport breakpoint'i bu uch holatni ajrata olmaydi —
panel esa oʻz joyiga qarab qaror qilishi kerak.

Bizda `@container` allaqachon ishlatiladi ([panel-header-centering
naqshi](./design-system.md)) — Doskada ham shu, `md:`/`lg:` emas.

---

## 7. Nima QILINMAYDI

- **Panel YUZASIGA rang berilmaydi** — fon, chegara, hover neytral;
  rang faqat ikonaning oʻzida (§1)
- **Yangi rang ixtiro qilinmaydi** — palitra `src/lib/class-colors.ts` dan (§3)
- **Brend yashili vidjet tusi sifatida ishlatilmaydi** — u faqat harakat
  va faol holat uchun (§3)
- **Vidjet ichida `--spacing` ga tayanilmaydi** — `cqw` ishlatiladi, §3
- **Blur soya yoʻq** — faqat ofset (`0 4px 0`); blur `playful` ohangda
  iflos koʻrinadi va projektorda umuman bilinmaydi
- **Fon uchun JPG qoʻshilmaydi** — §4. Foydalanuvchi oʻz rasmini
  yuklashi mumkin boʻladi, lekin katalog CSS boʻlib qoladi
- **Vidjet primitivlari fork qilinmaydi** — `<Button>` va boshqalar
  umumiy tizimdan; Doskaga xos boʻlgani domen komponenti sifatida
  `src/components/doska/` da yashaydi ([component-token-layer
  qoidasi](./design-system.md))
