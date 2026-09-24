# Tashqi bloklar arxivi

Ochiq litsenziyali tashqi toʻplamlardan **asl holicha** olingan UI
bloklari. Bu yer — zaxira va referens: ilovaga ulanmagan, buildʼga
kirmaydi, hech qayerdan import qilinmaydi. Kerak boʻlganda blok shu
yerdan tanlanadi va Ustozona dizayn tizimiga moslab `src/` ga koʻchiriladi.

## Toʻplamlar

| Toʻplam | Papka | Bloklar | Litsenziya | Olingan |
|---|---|---|---|---|
| Dashboard bloklari — KPI, grafiklar, jadvallar, filtrlar, admin, onboarding | [`dashboard-bloklari/`](dashboard-bloklari/README.md) | 323 (28 kategoriya) | MIT | 2026-09-24 |

Statistika yoki admin sahifasi uchun blok qidirilayotgan boʻlsa —
[`dashboard-bloklari/README.md`](dashboard-bloklari/README.md) dagi
«Ustozona uchun: qayerda nima» boʻlimidan boshlang.

## Qoidalar

1. **Arxivdagi fayllar tahrirlanmaydi.** Ular asl nusxa — keyin yangi
   versiya bilan solishtirish va litsenziya talabi uchun. Moslashtirish
   faqat koʻchirilgan nusxada, `src/` ichida qilinadi.
2. **Arxivdan import qilinmaydi.** `@/…` yoʻli `src/` ga qaraydi; arxivdagi
   `@/components/Card` kabi importlar loyihada mavjud emas va shunday
   qolishi kerak.
3. **Ilovaga olish — `ustozona-dizayn` skill tartibida.** Xom Tailwind
   klasslari (`text-gray-500`, `bg-emerald-100`, `dark:…`) tokenlarga,
   karta `<Panel>` ga, ikonlar `lucide-react` ga map qilinadi. Har
   toʻplam READMEʼsida aniq map jadvali bor.
4. **Litsenziya matni saqlanadi.** Har toʻplam papkasida asl `LICENSE.md`
   oʻzgarishsiz turadi. Blokdan katta boʻlak (ayniqsa grafik primitivlari)
   `src/` ga oʻtsa — fayl boshiga bitta izoh:
   `// MIT — docs/tashqi-bloklar/<toʻplam>/LICENSE.md`.
5. **Ishlatilgan joyni belgilang.** Blok ilovaga olinsa, toʻplam
   READMEʼsidagi «Ishlatilgan joylar» jadvaliga qator qoʻshing.

## Nega buildʼga tegmaydi

Arxivdagi `.tsx` fayllar loyihada yoʻq modullarni import qiladi, shuning
uchun ular uch joyda istisno qilingan:

| Vosita | Qayerda | Nima qiladi |
|---|---|---|
| TypeScript (`tsc`, `next build`) | `tsconfig.json` → `exclude` | Tip tekshiruvidan chiqaradi |
| ESLint | `eslint.config.mjs` → `globalIgnores` | Lint qilinmaydi |
| Tailwind v4 | `src/app/globals.css` → `@source not` | Klasslari CSSʼga tushmaydi |

Uchalasi ham butun `docs/tashqi-bloklar/` papkasini qamraydi — yangi
toʻplam qoʻshilganda konfiguratsiyaga tegish shart emas.

⚠️ Tailwind qismi muhim: v4 loyihadagi har matn faylini klass qidirib
skanerlaydi. Istisnosiz arxivdagi yuzlab xom klass (`bg-emerald-100`,
`dark:bg-[#090E1A]` …) ishlatilmasa ham CSSʼga qoʻshilib ketadi.

## Yangi toʻplam qoʻshish

1. Litsenziyani tekshiring — MIT / Apache-2.0 / ISC kabi erkin boʻlsin.
   Pullik yoki «faqat koʻrish uchun» bloklar arxivga kirmaydi.
2. `docs/tashqi-bloklar/<nom>/` papkasi: asl manba fayllari, asl
   `LICENSE.md`, oʻzbekcha `README.md` (bogʻliqliklar + map jadvali +
   manba commitʼi) va kerak boʻlsa `katalog/`. Asl fayllar va bizning
   hujjat alohida papkalarda turadi — yangilashda asl qism butunlay
   almashtiriladi.
3. Yuqoridagi «Toʻplamlar» jadvaliga qator qoʻshing.
4. `npx tsc --noEmit` — arxiv tip tekshiruviga tushmayotganini tasdiqlang.
