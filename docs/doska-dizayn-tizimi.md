# Doska dizayn tizimi

> **Holat (2026-10-02):** standart uslub (Sokin) va butun qobiq
> **referens koʻrinishiga** oʻtkazildi — foydalanuvchi qarori: «UI toʻliq
> vidjetli sinf ekrani referensi asosida boʻlsin»
> ([doska-referens-koriklari.md](./doska-referens-koriklari.md) §4).
> Vidjet — oq varaq, boshqaruv — oq panel, 1 px och kulrang chegara,
> soyasiz; rang faqat urgʻuda. Uch uslub arxitekturasi (faqat token
> qatlami) oʻzgarmadi. Tokenlar:
> [`src/styles/doska.css`](../src/styles/doska.css).
>
> **Holat (2026-09-25):** §1–4 [doska-ux-tadqiqot.md](./doska-ux-tadqiqot.md)
> qarorlari (Q1–Q3) asosida qayta yozilgan edi. 2026-10-02 da ulardan
> uchtasi referens qaroriga koʻra almashdi: sozlama vidjet yonida emas,
> oʻngdan (Q2 → §2.6); tepada burchak tugmalari bor (R319 → §1.5);
> kontekst panel ikonali (R322 → §2.5).

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

## 1. Uch uslub, bitta UX

Vizual uslubni **oʻqituvchi tanlaydi** (menyu → «Koʻrinish»); mantiq,
joylashuv va xatti-harakat esa hammada bir xil (doska-ux-tadqiqot.md Q1).

| Uslubga KIRADI | Uslubga KIRMAYDI |
|---|---|
| rang, burchak, kontur, soya, shrift, qalinlik, harakat egri chizigʻi, bezak (magnit) | joylashuv, nishon oʻlchami, sozlama naqshi, xatti-harakat, yorliqlar, yozuvlar, qaytarish, «rang + belgi + soʻz» |

| | Sokin (standart) | Oʻyinchoq | Doska |
|---|---|---|---|
| Gʻoya | **oq varaq**: oq panel va oq vidjet, rang faqat urgʻuda (brend) | qalin siyoh kontur, qattiq soya, rangli plitkalar | oq qogʻoz vidjet + magnit; tus faqat magnitda |
| Boshqaruv (`.doska-ctl`) | oq, 1 px och kulrang chiziq, soyasiz, radius 10 | oq patnis, 3 px siyoh, `0 5px 0` siyoh | toʻq relsa, 1 px yorugʻ chiziq |
| Vidjet (`.doska-card`) | oq, toʻq kulrang-koʻk matn, radius 8, chegara faqat och fonda | och tus, siyoh matn, 3 px kontur, radius 26 | qogʻoz, siyoh matn, magnit, radius 10 |
| Varaq (`.doska-sheet`) | oq, 1 px och kulrang chiziq | oq, 3 px siyoh | qogʻoz |
| Tanlov | 2 px brend chiziq vidjet chetida, oq doira tutqich | uzuq chiziq | uzuq chiziq, kvadrat tutqich |
| Shrift | Nunito (yumaloq, kirill harflari bor) | Nunito (800–900) | Rubik |
| Kimga | hammaga; proyektorda eng aniq | 1–6-sinf | yashil/qora doska |

**Standart — Sokin.** Foydalanuvchilarning 5% dan kami sozlamani
oʻzgartiradi (R329): 95% oʻqituvchi aynan shuni koʻradi. «Aqlli
standart» (jurnaldagi sinflar 1–4-sinf boʻlsa Oʻyinchoq) — keyin, sinflar
Doskaga ulanganda.

### Arxitektura — faqat token qatlami

Uslub — `<html data-doska-style="sokin|oyinchoq|doska">` va
[`doska.css`](../src/styles/doska.css) dagi uchta token bloki.
Komponentlar uslubni **bilmaydi**: ular material klassini qoʻyadi
(`.doska-ctl`, `.doska-sheet`, `.doska-card`, `.doska-tool`,
`.doska-selection`) va `var(--doska-…)` ni oʻqiydi. Atribut va sahna
shriftlari klasslari `<html>` da (`DoskaShell`), chunki menyu va tanlash
oynalari `body` ga portal qilinadi va ular ham uslubni olishi kerak.

Uchta qoida (`doska.css` sarlavhasida batafsil):

1. **Uslub bloki faqat token eʼlon qiladi.** `[data-doska-style="x"] .foo`
   kabi avlod selektori yozilmaydi — «Koʻrinish» panelidagi namunalar
   ichma-ich `data-doska-style` bilan chiziladi va avlod selektori
   sahifaning uslubini namunaga ham tushirardi.
2. **Har blok BARCHA tokenlarni eʼlon qiladi** (keraksizini `initial`
   bilan) — aks holda ichma-ich namunada yuqoridagi uslub «oqib» tushadi.
3. **Token ichidagi `var()` token eʼlon qilingan elementda
   hisoblanadi.** Vidjetga xos qiymat (`--card-accent`,
   `--doska-icon-tint`) uslub blokida ishlatilmaydi — u material
   klassida birlashtiriladi.

Material klasslari **qatlamsiz** (unlayered): shadcn primitivlarining
`rounded-md border shadow-md` utilitalarini ataylab yengadi. Shuning
uchun material klassi qoʻyilgan elementga fon, radius, chegara yoki soya
utilitasi yozilmaydi — u baribir ishlamaydi.

Uslub **saqlanadi** (`lib/doska/prefs.ts`, alohida store): u toʻplamga
emas, oʻqituvchiga tegishli va qaytarish tarixiga kirmaydi. Hozir shu
brauzerda; ekranlar serverga koʻchganda oʻqituvchi sozlamasi boʻladi.

### Proyektor sinovi — har uslub

Har uslubning matn/fon juftliklari (vidjet tuslari, boshqaruv, varaq,
siyoh och doskada, boʻr toʻq doskada) ikki shartda tekshiriladi: oddiy
ekranda ≥ 4,5:1 va yuvilgan proyektor simulyatsiyasida (toʻyinganlik
0,72, qora 25% gacha koʻtarilgan) ≥ 3:1 (R324):

```bash
node scripts/doska-projector-check.mjs
```

Yangi uslub yoki rang qoʻshilganda skript yashil boʻlishi shart. Eng
tor joy — Sokinning taymeri: toʻq sariq ustidagi oq matn 4,6:1,
proyektorda 3,2:1. Shu sababli u `class-colors` ning `-400` darajasidan
ancha toʻq.

### «Panel jim» — endi uslub qoidasi

Ilgari hamma uchun qoida edi: panel YUZASI neytral, rang faqat ikonada
va vidjetda — sinf ekrani 5 metrdan koʻriladi va rangli panel taymer
bilan raqobatlashadi. Endi bu **Sokin va Doska** uslubining qoidasi.
**Oʻyinchoq** uni ataylab buzadi (rangli plitkalar) — oʻqituvchi buni
ongli tanlaydi.

---

## 1.5. Suzuvchi guruh idishi — `<BarGroup>`

Doskada kanvas butun ekranni egallaydi, boshqaruv esa uning ustida
suzadi. Yaʼni **har boshqaruv toʻdasi oʻzini fondan ajratishi kerak**:
yuza, chegara, soya, oʻz z-qatlami. Bu naqsh qobiqda bir necha marta
takrorlanadi (bekor qilish · vidjet paneli · ekranlar va menyu · yigʻish
tugmasi), shuning uchun u [`BarGroup.tsx`](../src/components/doska/BarGroup.tsx)
da bitta komponent. Koʻrinishi — `.doska-ctl` materiali: ichidagi
`text-foreground`, `hover:bg-muted`, `bg-primary` uslub tokenlariga
qayta bogʻlangan.

**Standart uslubda** idish faqat 1 px och kulrang chegara bilan,
soyasiz (referens koʻrinishi, 2026-10-02): oq panel toʻq fonda oʻzi
ajraladi, och fonda chegara ushlaydi.

⚠️ Oʻyinchoq va Doska uslublarida idish border **bilan ham**, shadow
**bilan ham** chiziladi — bu `design-system.md` dagi «border YOKI
shadow» qoidasidan **ataylab chetlashish**. U yerdagi qoida panel varaq ustida turishini nazarda
tutadi; bu yerda fon ixtiyoriy rangda, och fonda chegara, toʻq fonda
soya ushlab turadi. Bittasi yetmaydi.

### Ikki tur, ikki yoʻnalish

| Tur | Ichki tugmalar | Qayerda |
|---|---|---|
| `segmented` | tegib turadi, radius idishda, ajratgich `<BarDivider>` | ikonali boshqaruv toʻdasi |
| `padded` | oʻz radiusini saqlaydi, idish `p-1` beradi | vidjet paneli |

`orientation="vertical"` — «Panel joyi: chap / oʻng» dagi yon relsa.

### Nishon oʻlchami — hamma uslubda bir xil

| Element | Oʻlcham | Sabab |
|---|---|---|
| Ikonali tugma (`BarIconButton`) | 36 × 36, ikona 20 px | loyiha standarti (DESIGN.md, 36 px boshqaruv) va referens koʻrinishi. Ilgari 48 px edi (R321, barmoq uchun ≥ 44) — 2026-10-02 foydalanuvchi qarori bilan |
| Vosita (`BarButton`) | 64 px ustun: nuqtalar · 52 px plitka (ikona 36 px) · 11 px nom; BUTUN ustun bosiladi | panel nishoni ≥ 56 px (§3 UX yadrosi) |
| Rejim tugmasi (qalam / tanlash) | 36 × 36, faol — och brend plitka (`--doska-ctl-active`) | referens |

### Tooltip

Guruh ichidagi ikonali tugmada yorliq yoʻq — nom **tooltip**da
(`<BarIconButton>`). `title` atributi ishlatilmaydi: brauzer uni bir
soniya kutib chiqaradi va uslubga boʻysunmaydi.

`delayDuration` = 300 ms (nol emas): boshqaruv zich joylashgan va nol
kechikishda sichqoncha ustidan oʻtganda tooltip'lar ketma-ket chaqnaydi.

⚠️ `DoskaMenu` ning tugmasi `<BarIconButton>` ga OʻRALMAYDI — u
`PopoverTrigger asChild` ning bolasi, zanjir esa `asChild` → `<Tooltip>`
(DOM element emas) boʻlib uzilardi. Shuning uchun koʻrinish
`barIconButtonClass` sifatida ham eksport qilingan.

⚠️ Tooltip faqat **global** boshqaruvda (strelkalar, toʻliq ekran,
menyu, bekor qilish) — ularning ikonasi hamma joyda bir xil maʼnoda.
**Kontekst panelda** (§2.5) nom doim koʻrinadi — `<BarTextButton>`:
sensorli doskada hover yoʻq, tooltip chiqmaydi (doska-ux-tadqiqot.md R322).

### Joylashuv — referens koʻrinishi (2026-10-02)

```
[⌂]                                                        [⛶] [⋮]

                  ┌────┬─────────────────────────────┬───┐
                  │ ✎  │ Fon · vositalar · Hammasi   │ ⋮ │
[Qaytarish xabari]│ ➤  │                             │ ⌄ │     [‹ 2/3 › +]
                  └────┴─────────────────────────────┴───┘
```

- **Chap tepa** — bosh sahifa; **oʻng tepa** — toʻliq ekran va menyu,
  har biri alohida kichik idishda.
- **Pastda markazda** — vidjet paneli (§2); bekor qilish va qaytadan
  bajarish uning ⋮ menyusida va `Ctrl+Z` / `Ctrl+Y` da. Doimiy
  «↶ ↷» guruhi olib tashlandi: har oʻchirishdan keyin «Qaytarish»
  xabari baribir chiqadi.
- **Oʻng past** — ekranlar.
- Vidjetlar tepadagi qatorga tushmaydi (`placement.ts` ← `TOP_CHROME_PX`,
  `lib/doska/chrome.ts`); eski ekranlar bir martalik migratsiya bilan
  pastga suriladi (`store.ts`, persist `version: 1`).
- `B` («Boshqaruvni yashirish») panelni, ekranlarni VA burchak
  tugmalarini yashiradi — ekranda faqat «Koʻrsatish» qoladi.
- Panelning oxirgi ustuni (⋮ menyu: bekor qilish, qaytadan bajarish;
  yigʻish) qoʻlyozma panelida ham bor (`BarEndColumn`) — sensorli
  doskada qalam rejimidan chiqmasdan qaytarish mumkin.

⚠️ Ilgari tepada hech narsa yoʻq edi: 75″ panelning tepasi poldan ≈ 1,8 m,
bola yetmaydi (doska-ux-tadqiqot.md R319). Foydalanuvchi referens
joylashuvini tanladi. Tepadagi uchala amal oʻqituvchiniki va kam
bosiladi; dars davomida bosiladigani (vidjetlar, qalam, ekranlar) pastda.

#### Avvalgi joylashuv (2026-09-25 — 2026-10-01, tarix uchun)

```
Past (standart):
[↶ ↷]          [ vidjet paneli ] [⌄]          [‹ 2/3 › + │ ⛶ ⋮]

Chap / oʻng («Panel joyi»):
┌──┐
│  │ ← vidjet paneli yon relsada, oʻrtadan pastda
│  │   (tepadan 18% boʻsh, pastki qatorga joy)
└──┘
[‹]
[↶ ↷]                                         [‹ 2/3 › + │ ⛶ ⋮]
```

Tepada hech narsa yoʻq: 75″ interaktiv panelning tepasi poldan ≈ 1,8 m
— u yerdagi tugmaga qoʻl toʻliq choʻzilib yetadi, bola yetmaydi
(doska-ux-tadqiqot.md R319). Bosh sahifa havolasi menyuda.

**«Panel joyi»** (menyu → «Koʻrinish») faqat vidjet panelini koʻchiradi:
bekor qilish chap pastda, ekranlar va menyu oʻng pastda qoladi. Yon
relsa interaktiv panelda oʻqituvchi yonida turib ishlashi uchun — qoʻli
mazmunni yopmaydi. Paneldan ochiladigan oynalar («Shakl», «Fon»,
«Hammasi») panel tomonidan ochiladi: pastki panelda tepaga, chap
relsada oʻngga (`dock.ts`).

Yigʻish tugmasi (`B`) panel yonida turadi va yigʻilganda oʻsha joyda
qoladi — oʻqituvchi uni qayerda yashirgan boʻlsa, oʻsha yerdan qaytaradi.
Strelka panel ketadigan tomonga qaraydi. «Qaytarish» xabari yigʻilgan
holatda ham chiqadi.

---

## 2. Vidjet paneli

### Anatomiya

```
┌────┬───────────────────────────────────────────┬───┐
│ ✎  │ [Fon] [qadalgan vositalar …] [Hammasi]    │ ⋮ │
│ ➤  │                                           │ ⌄ │
└────┴───────────────────────────────────────────┴───┘
```

- **Chap ustun — rejim:** qalam (qoʻlyozma paneli ochiladi) va tanlash
  (oddiy holat — bu panelda doim faol, och brend plitka).
- **Oʻrta — vositalar:** birinchi «Fon», oxirida «Hammasi».
- **Oʻng ustun:** ⋮ panel menyusi (Bekor qilish · Qaytadan bajarish ·
  Panelni tahrirlash → «Hammasi» oynasi) va yigʻish (`B`).

Panelni tuzmagan oʻqituvchi 8 ta standart vositani koʻradi
(`DEFAULT_TOOLS`, `prefs.ts`): soat, taymer, bugun, svetofor, gʻildirak,
soʻrovnoma, matn, karta. Ilgari standart — barcha 24 vosita edi va panel
gorizontal aylanardi. Chegara 9 — bitta joy boʻsh.

Qaysi vosita panelda turishini **oʻqituvchi tanlaydi** — «Hammasi»
oynasidagi qadash belgisi bilan (R132). Tartib esa doim `TOOL_ORDER`
(`registry.ts`): qadalgan vosita oxiriga emas, oʻz joyiga tushadi.
Tuzmagan oʻqituvchi standart panelni koʻradi — bugungi panel bilan bir
xil; keyin qoʻshilgan yangi vosita unga oʻzi chiqadi (`tools: null`).
«Fon» vosita emas, ekran sozlamasi — u doim panelda.

### Vosita tugmasi

```
   • • •    ← ekrandagi nusxalar soni (≤ 3 nuqta, joyi doim band)
 ┌──────┐
 │  36  │   ← 52 px plitka, ichida 36 px ikona
 └──────┘
  Taymer    ← 11 px, 600, bitta qator, 52 px da `truncate`
```

BUTUN tugma bosiladi va yorishadi — ikona ham, nom ham. Ilgari faqat
40 px ikona qutisi yorishardi va nom ustiga bosish «ishlamagan» boʻlib
koʻrinardi. Plitka Sokin va Doskada koʻrinmaydi (ikona oʻz tusida,
ierarxik); Oʻyinchoqda u vosita tusida toʻladi va ikona siyohga oʻtadi —
oq ikona sariq va yashil plitkada oʻqilmasdi.

⚠️ Bu oʻlchamlar `stage` sirtidan **mustasno** — panel oʻqituvchi
qoʻlida, 50 sm dan boshqariladi. `.doska-bar` klassi `--spacing` va
matn shkalasini `desk` qiymatiga qaytaradi.

### Holatlar

| Holat | Koʻrinish |
|---|---|
| Normal | shaffof fon, ikona vidjet tusida (Oʻyinchoqda — rangli plitka) |
| Hover | `--muted` (material ichida — uslubning hover rangi) |
| Fokus | 2 px `--ring` halqa |
| Ekranda bor | tepada nuqtalar — nechta nusxa (≤ 3); «Hammasi» paneldan tashqaridagi vositalar sonicha nuqta oladi |

### «Hammasi» oynasi

Barcha vositalar, toifalarga ajratilgan: Vaqt · Sinf · Yozuv · Media
([`ToolCatalog.tsx`](../src/components/doska/ToolCatalog.tsx)). Boʻsh
toifa chiqmaydi — vositasi qoʻshilganda oʻzi paydo boʻladi. Har qatorda
ikki amal, ikkalasi ≥ 44 px:

- qatorning oʻzi — vositani ekranga qoʻyadi (oyna yopiladi). «Shakl»
  bu yerdan standart figura bilan tushadi va sozlama kartasi darhol
  ochiladi — figurani oʻsha yerda tanlaysiz;
- qadash belgisi — vositani panelga chiqaradi yoki olib tashlaydi.
  Panelda **≤ 9** vosita (`MAX_PINNED_TOOLS`): koʻprogʻi 75″ doskada ham
  bir qarashda oʻqilmaydi. Toʻla panelda qadash nofaol, sababi oyna
  sarlavhasida yozilgan.

Vositalar koʻpaygani sayin panel emas, shu oyna oʻsadi.

### Tor holat — panel ekrandan chiqib ketmaydi

Kenglik (yon relsada — balandlik) yetmaganda panel oʻz ustunidan
oshmaydi va **ichida aylanadi** (`overflow-x-auto` / `overflow-y-auto`,
`overscroll-contain`). Busiz sigʻmagan tugmalar kanvasdan tashqariga
chiqib ketardi va ularga yetish yoʻli yoʻq edi.

⚠️ «Tozalash» bu panelda YOʻQ — menyuda. Qoʻshish tugmalari qatoridagi
buzuvchi tugma bir notoʻgʻri bosishda ekranni boʻshatardi (A2); endi
tozalash ham «Qaytarish» xabari bilan qaytariladi.

### Yashirish

⚠️ Holat **store'da emas**, oddiy React holati — yaʼni saqlanmaydi.
Yashirish dars paytiga tegishli qaror («hozir sinf ekranga qarasin»),
keyingi darsga emas. Saqlansa oʻqituvchi ertasi kuni doskani ochib
boshqaruvni topolmaydi va ilova buzilgan deb oʻylaydi.

---

## 2.5. Kontekst asboblar paneli

Tanlangan vidjetning **ustida** suzadi: Oʻchirish · Sozlash · ⋮ —
ikonali tugmalar, nom tooltipʼda (referens koʻrinishi, 2026-10-02).
⋮ menyusida kam ishlatiladiganlar — Nusxa · Qulflash · Barcha
ekranlarda · Markazga — ikona **va** nom bilan. Ilgari har tugmada nom
yozilgan edi (R322: sensorli doskada hover yoʻq, tooltip chiqmaydi);
endi asosiy ikki amal umumiy maʼnoli ikona, qolgani menyuda yozuvi
bilan. Quyidagi matn — avvalgi holat: «Oldinga» yoʻq: vidjetni bosishning oʻzi uni oldinga
chiqaradi. Qulflangan vidjetda «Oʻchirish» koʻrinmaydi, «Qulflash» esa
«Qulfni ochish» ga aylanadi
([`WidgetToolbar.tsx`](../src/components/doska/WidgetToolbar.tsx)).

Nega ustida, ostida emas: vertikal doskada bilak pastdan keladi va
teginish nuqtasining pastini yopadi (doska-ux-tadqiqot.md R328).
Yozuvli panel vidjetdan keng boʻlishi mumkin — shuning uchun u ekran
chetiga qisiladi (`EDGE`).

Oʻchirish tasdiq soʻramaydi: amal darhol bajariladi, pastda chiqqan
«Qaytarish» xabari (`DoskaNotice`, 6 s) va `Ctrl+Z` uni bekor qiladi.

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

«Sozlash» faqat sozlamasi bor vidjetda chiqadi (`hasSettings`) — boʻsh
karta ochadigan tugma yoʻqidan yomon. «Oldinga chiqarish» ham yoʻq:
vidjetni bosishning oʻzi uni oldinga chiqaradi.

---

## 2.6. Sozlama oynasi

**2026-10-02 dan:** oʻngdan, butun balandlikda ochiladigan oyna
(referens koʻrinishi): kenglik 448 px (`w-md`); odatda oʻngda, tanlangan
vidjet oʻsha joyda boʻlsa — chapda (`drawerSide`); kulrang sarlavha qismi —
vidjet ikonasi (tusida) · nom markazda · yumaloq «×»; z-qatlam
`Z_SETTINGS` (`--z-doska-top` + 6) — oʻng tepadagi tugmalar ustida;
telefonda (< 640 px) — pastki varaq. Maydonlar, darhol qoʻllanish va
yopilish qoidalari oʻzgarmadi. Quyidagi jadval — avvalgi holat
(doska-ux-tadqiqot.md Q2):

Har vidjetning sozlamasi BIR joyda — vidjet yonidagi kartada
([`WidgetSettingsCard.tsx`](../src/components/doska/WidgetSettingsCard.tsx)).
Ochiladi: kontekst paneldagi «Sozlash» yoki `S`; taymer qoʻyilganda —
darhol (`openSettingsOnAdd`). Qaror va solishtirish:
doska-ux-tadqiqot.md Q2.

| Qoida | Qiymat |
|---|---|
| Joy | yonda; ikkala yonda joy boʻlsa sensorda chapga, sichqonchada joy koʻproq tomonga |
| Tepasi | vidjet tepasi bilan bir chiziqda; yuqoriga faqat pastda joy qolmaganda |
| Kenglik | 320 px (`w-80`), vidjetga bogʻliq emas |
| Tor ekran (< 640 px) | pastki varaq, max 60vh |
| Maydonlar | faqat `SettingsFields`: tayyor variantlar, ± qadam, tumbler — ≥ 44 px, klaviaturasiz |
| Saqlash | yoʻq — darhol qoʻllanadi; `Esc`, «×», boʻsh kanvas yopadi |
| Z-qatlam | `--z-doska-context` |

Vidjet faqat karta ICHINI beradi (`WIDGET_SETTINGS`, `widgets/index.ts`).
Gʻildirak — istisno (`INLINE_SETTINGS`): ismlar roʻyxati mazmun, u
vidjetning oʻz «roʻyxat tomoni»da tahrirlanadi; kirish nuqtasi baribir
umumiy.

## 2.7. Qulf, «Markazga», parda

- **Qulf** — vidjet sudralmaydi, oʻlchanmaydi, oʻchirilmaydi va tozalashda
  qoladi; ichidagi tugmalar ishlayveradi. Tutqichlar oʻrnida qulf belgisi.
- **«Markazga»** — AYNAN SHU vidjet (nusxa emas) ekran oʻrtasida, nisbati
  saqlangan holda kattalashadi, qolgani qoraygan va xiralashgan parda
  ostida. Vidjet ichi `cqw` bilan oʻlchangani uchun raqam ham oʻsadi —
  shuning uchun taymer va soat raqamining yuqori chegarasi `30rem`.
- **Parda** (`1`, menyu) — butun ekran xiralashadi, «Diqqat!»; istalgan
  bosish yoki tugma koʻtaradi va boshqa yorliqqa yetib bormaydi.

## 3. Vidjet kartochkasi (kanvasda)

Vidjet `.doska-card` klassini va `data-card="{tus}"` ni qoʻyadi —
qolgani uslubdan. Tuslar: `blue` (soat), `amber` (taymer), `slate`
(svetofor, taqdimot), `teal` (gʻildirak), `note` (yopishqoq qogʻoz),
`done` (tugagan taymer).

| Element | Token | Sokin | Oʻyinchoq | Doska |
|---|---|---|---|---|
| Fon / matn | `--doska-{tus}-bg` / `-fg` | **oq / toʻq** (hamma tusda bir xil) | och / siyoh | qogʻoz / siyoh |
| Urgʻu | `--doska-{tus}-accent` → `--card-accent` | **brend** (hamma tusda) | siyoh | magnit tusi |
| Belgi rangi | `--doska-{tus}-mark` → `--card-mark` | toʻyingan tus («Karta» sarlavha tasmasi) | och tus | magnit tusi |
| Radius | `--doska-card-radius` | 8 | 26 | 10 |
| Kontur | `--doska-card-line(-width)` | yoʻq; **och fonda** 1 px kulrang (`-line-light`) | 3 px siyoh | 1 px siyoh/14% |
| Soya | `--doska-card-shadow` | yoʻq | `0 6px 0` siyoh | yumshoq, chuqurroq |

⭐ **Standart uslubda vidjet turi rang bilan emas, shakli bilan
tanilib turadi** (referens, R456–R460): hamma vidjet oq varaq, urgʻu
(taymer halqasi, asosiy tugma, tanlov) — bitta brend rangi. Rang
fonni faqat HOLAT uchun egallaydi (taymer tugadi — qizil varaq).
Oʻqituvchi rangni oʻzi tanlaydigan yagona joy — «Karta» (sarlavha
tasmasi, `-mark`).

Oq varaqning chegarasi faqat **och fonda** chiziladi
(`[data-bg-tone="light"]`): chegarasiz oq karta 21 fonimizdan 13 tasida
fonga qoʻshilib ketadi (R458). Toʻq fonda chegara yoʻq — referensdagidek.
| Magnit | `--doska-card-magnet` | yoʻq | yoʻq | `::before`, `--card-accent` |

- **Raqamlar** (taymer, soat) — `<Digits>`: uslub shriftida, har raqam
  `1ch` qutida. Uslub shriftlari proporsional va «1» torroq — busiz
  vaqt har soniya chayqalardi.
- **Taymer halqasi** (ilgari toʻla disk) `--card-accent` bilan
  chiziladi: standartda brend, Oʻyinchoqda siyoh, Doskada magnit tusi;
  oxirgi soniyalarda qizil. Keng taymerda (eni ≥ 1,8 × boʻyi) halqa ·
  raqam · asosiy tugma bir qatorda.
- **Svetofor** — oq varaq ichida toʻq korpus (`--doska-light-housing`,
  jismoniy rang).
- **Idishsiz matn** (matn vidjeti, shakl) — `.doska-ink`: siyoh, toʻq
  fonda boʻr (§4); qalinlik `--doska-text-weight`.
- **Yopishqoq qogʻoz** hamma uslubda qogʻoz (jismoniy narsa). Svetofor
  chiroqlari va gʻildirak ham jismoniy — uslubdan qatʼi nazar bir xil.
- Matn oʻlchami `cqw` da — konteynerga bogʻliq, uslubga emas.

### «Karta» — sarlavha va yozuv varagʻi

`card.v1` (docs/doska-referens-koriklari.md R447) — ekranning boʻlimi:
sarlavha (`.doska-card-title`) va yozuv varagʻi (`.doska-card-body`),
BITTA vidjet. Tus oʻqituvchi tanlaydi — `data-card` dan beshtasi:
`blue`, `teal`, `amber`, `note`, `slate` (`done` emas — u «tugadi»
maʼnosida band). Varaq tokenlari:

| Token | Sokin | Oʻyinchoq | Doska |
|---|---|---|---|
| `--doska-card-body-bg` / `-fg` | oq / siyoh | oq / siyoh | qogʻozdan oqroq / siyoh |
| `--doska-card-body-line(-width)` | yoʻq | 2,5 px siyoh | 1 px siyoh/12% |
| `--doska-card-rule-width` (sarlavha ostida, `--card-accent`) | 0 | 0 | 5 px |

Doskada fon hamma tusda qogʻoz — tus magnit va sarlavha ostidagi
chiziqdan koʻrinadi. Varaq juftligi proyektor sinovida («karta yozuvi»).

Sozlamadagi tus namunasi `.doska-card` ni QOʻYMAYDI: magnit (`::before`)
qatlamsiz qoida va 36 px namunada 26 px doira boʻlib chiqardi. Namuna
`--doska-{tus}-bg` va `-accent` ni toʻgʻridan-toʻgʻri oʻqiydi.

### «Sana» — idishsiz sarlavha

`date.v1` (R445) — matn vidjeti kabi `.doska-ink`: kun nomi
`--doska-display-weight` da, sana va bayram nomi undan kichik (`em`).
Butun blok `useFitText` bilan qutiga sigʻdiriladi — «Chorshanba»
«Juma»dan ikki barobar uzun, `cqw` yolgʻiz yetmaydi.

### Rang qayerdan keladi

**Ikki xil rang tizimi, ular aralashmaydi:**

| Tur | Vazifa | Manba |
|---|---|---|
| **Vidjet tusi** | identifikatsiya — qaysi vidjet qayerda | `class-colors.ts` (17 rang) |
| **Brend rangi** | harakat, faol holat, tanlov | `html[data-product="doska"]` (`products.css`) → yashil-firuza |

**Tus semantik emas, ajratuvchi.** Soat koʻk, taymer sariq, svetofor
qizil. Maqsad: 5 metrdan qaysi vidjet qayerdaligini **rang boʻyicha**
tanish. Yangi vidjetga qoʻshni vidjetdan farq qiladigan tus beriladi
(`registry.ts` dagi `tint` maydoni).

⚠️ **Yangi palitra ixtiro qilinmaydi.** [`class-colors.ts`](../src/lib/class-colors.ts)
da 17 rang bor va ularning idrok yorqinligi (L) bir diapazonda
kalibrlangan — yaʼni ular bir oilaga oʻxshaydi. Panel ikonalari shu
qiymatlarni oʻzgarishsiz oladi (`tint.ts`).

Vidjet kartasining tuslari esa `doska.css` da: tus (hue) palitradan,
yorqinlik esa uslubga koʻra matn kontrasti uchun tanlangan — Sokinda
oq matn ostida toʻqroq, Oʻyinchoqda siyoh ostida ochroq. Bu qiymatlar
proyektor sinovi bilan qulflangan (§1); ularni oʻzgartirgandan keyin
`node scripts/doska-projector-check.mjs` yashil boʻlishi shart.

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
mahsulot kartochkalari, ilova plitkalari. Doska panelida — faqat
**Oʻyinchoq** uslubida (plitka + siyoh ikona, §2), va bu oʻqituvchining
ongli tanlovi; Sokin va Doskada panelga idish qoʻyilmaydi — u brend
rangining kuchini yeb qoʻyadi.

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

## 4. Fon va boʻr rejimi

Fonlar sof CSS ([backgrounds.ts](../src/lib/doska/backgrounds.ts)) —
rasm fayli yoʻq. Sabab: referenslar 100+ JPG saqlaydi (megabaytlar),
ular projektorda pikselli chiqadi; CSS istalgan oʻlchamda toza. Fon
ekranga tegishli va uslubdan mustaqil — oʻqituvchi uni «Fon» bilan
tanlaydi.

Har fonning `tone` maydoni bor. `data-bg-tone="dark"` boʻlganda faqat
**idishsiz matn** oʻzgaradi: `--doska-ink` siyohdan boʻrga oʻtadi
(Doska uslubida sal nurlanadi — `--doska-chalk-shadow`). Aks holda matn
vidjeti toʻq doskada koʻrinmay qolardi.

⚠️ Ilgari toʻq fonda vidjet kartalari ham deyarli shaffof boʻlib
ketardi («yopishtirilgan stiker» boʻlmasin deb). Endi bunday emas: har
uslubning kartasi (toʻyingan blok, rangli plitka, qogʻoz) toʻq fonda
ham oʻzi ajralib turadi, shaffof karta esa proyektorda yuvilib ketardi
(A9, R324). Komponentlar bu haqda bilmaydi — ular `var(--doska-ink)`
ni oʻqiydi.

**«Yumshoq sahna» fonlari** (`soft-warm`, `soft-green`, `soft-sky`,
R448) — kundalik ekranlar uchun fotosurat oʻrnida: xiralashgan rang
dogʻlari, och va past kontrastli. Fotosurat katalogi va yarim shaffof
(«muzli») kartalar ataylab olinmagan: proyektorda matn yuvilib ketadi.
Har fonning eng toʻq rangi proyektor sinovida siyoh bilan tekshiriladi —
sinov ranglarni `backgrounds.ts` dan oʻzi oʻqiydi (`id: "soft-…"`), shuning
uchun yangi yumshoq fon ham `soft-` bilan nomlanadi.

---

## 5. Z-qatlamlar

Vidjetlar bir-birining ustiga chiqadi; tartib chalkashsa tuzatish qiyin
(R136). Nomlangan qatlamlar:

| Qatlam | Token | Qiymat |
|---|---|---|
| Kanvas mazmuni | — | vidjetning `z` maydoni (1…n) |
| Tanlov chegarasi | — | ramka ichida |
| Qoʻlyozma (siyoh kanvaslari) | `--z-doska-ink` | 1000090 |
| Oʻlcham tutqichlari | `--z-doska-handles` | 1000095 |
| Vidjet paneli | `--z-doska-bar` | 1000100 |
| Kontekst asboblar | `--z-doska-context` | 1000105 |
| Yuqori tugmalar | `--z-doska-top` | 1000110 |
| «Markazga» pardasi / vidjet / tugma | `--z-doska-top` + 10 / 11 / 12 (`lib/doska/layers.ts`) | 1000120 |
| Tooltip / toast | `--z-doska-tooltip` | 1001000 |
| Parda («1») | `--z-doska-tooltip` + 1000 (`lib/doska/layers.ts`) | 1002000 |

Raqamlar referensdan olingan — ular oʻzboshimcha koʻrinadi,
lekin katta oraliq **ataylab**: orasiga yangi qatlam qoʻshish kerak
boʻlsa, hech narsani qayta raqamlash shart emas. Tokenlar
[`doska.css`](../src/styles/doska.css) da, hosil qilinganlari
`lib/doska/layers.ts` da.

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

- **Komponent uslubni bilmaydi** — `if (style === "oyinchoq")` yoʻq;
  farq faqat `doska.css` tokenlarida (§1)
- **Uslub blokida avlod selektori yoʻq** — faqat token (§1, qoida 1)
- **Material klassi qoʻyilgan elementga fon/radius/chegara/soya
  utilitasi yozilmaydi** — qatlamsiz klass uni baribir yengadi (§1)
- **Sokin va Doskada panel yuzasiga rang berilmaydi** — rang faqat
  ikonada; Oʻyinchoq bundan ongli istisno (§1)
- **Yangi rang ixtiro qilinmaydi** — tus `class-colors.ts` dan,
  kartadagi yorqinlik proyektor sinovi bilan (§3)
- **Brend rangi vidjet tusi sifatida ishlatilmaydi** — u faqat harakat
  va faol holat uchun (§3)
- **Vidjet ichida `--spacing` ga tayanilmaydi** — `cqw` ishlatiladi, §3
- **Soya maʼlumot tashimaydi** — uslub bezagi (Oʻyinchoqda ofset,
  Sokin va Doskada yumshoq); proyektorda ajratishni kontur va kontrast
  beradi, soya yuviladi
- **Fon uchun JPG qoʻshilmaydi** — §4. Foydalanuvchi oʻz rasmini
  yuklashi mumkin boʻladi, lekin katalog CSS boʻlib qoladi
- **Vidjet primitivlari fork qilinmaydi** — `<Button>` va boshqalar
  umumiy tizimdan; Doskaga xos boʻlgani domen komponenti sifatida
  `src/components/doska/` da yashaydi ([component-token-layer
  qoidasi](./design-system.md))
- **Ikkinchi ikona oilasi yoʻq** — Doskada faqat Solar (`icons.tsx`);
  lucide Doskadan butunlay chiqarildi (A12)
