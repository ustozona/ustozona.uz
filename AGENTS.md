<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Quick Links

- [Design Language](DESIGN.md)

# Git tartibi — MAJBURIY

Jamoa bitta umumiy GitHub akkauntidan push qiladi (2+ hisobdan push
qilinsa Vercel deploy qilmay qoladi). Shuning uchun tartib qat'iy:

1. **Har ish alohida branch'da.** `main` dan ochiladi:
   `git checkout main && git pull` → `git checkout -b <ism>/<qisqa-tavsif>`

   Branch nomi **oʻz ismingiz** bilan boshlanadi — hamma bitta GitHub
   akkauntdan push qilgani uchun branch nomi kim ishlaganini koʻrsatuvchi
   yagona belgi. Masalan `otabek/baholash-guruh`, `behroz/jurnal-filtr`.
2. **`main` ga TO'G'RIDAN-TO'G'RI push YO'Q.** Faqat o'z branch'ingga,
   qo'shilishi esa Pull Request orqali.
3. **Push oldidan main'ni tortib ol:** `git fetch origin && git rebase origin/main`
4. **Push oldidan `npm run build`.** Vercel bitta umumiy deploy —
   bitta xato ikkala dasturchiga ta'sir qiladi.
5. **Markaziy fayllarni yolg'iz tahrir qilma** (`useGradesStore`,
   `dashboard/layout.tsx` va shunga o'xshash umumiy fayllar). Avval
   chatda kelishing: kim qaysi faylda ishlayapti.

## ⚠️ 1- va 3-qoidada `main` — QAYSI main

Ish `roziyevbehroz-tech/ustozona.uz` da olib borilishi mumkin, lekin
**prodga u chiqmaydi** — haqiqiy Vercel deploy `ustozona/ustozona.uz`
(upstream) dan ketadi.

Va u repo GitHub ma'nosida **fork EMAS** (`"fork": false`) — shunchaki
klon push qilib yaratilgan mustaqil repo. Git tarixi umumiy, lekin
fork tarmog'i yo'q. Buning amaliy oqibati:

⛔ **Cross-repo PR ISHLAMAYDI.** `compare/main...roziyevbehroz-tech:...`
   havolasi har doim «There isn't anything to compare» beradi.
   GitHub bunday PR uchun fork tarmog'ini talab qiladi.

✅ **Ishlaydigan yagona yo'l — branch'ni upstream'ga PUSH qilib,
   o'sha yerda oddiy PR ochish.** Upstream'dagi mavjud PR'lar aynan
   shunday qilingan (`men/marketing-brifi`,
   `roziyevbehroz-tech/claude/baholash-integratsiya` — ikkalasi ham
   upstream ichidagi branch nomlari).

```bash
git remote add upstream https://github.com/ustozona/ustozona.uz.git  # bir marta
git fetch upstream main

git checkout -b <ism>/<tavsif> upstream/main    # 1-qoida: main = upstream/main
# ... ish ...
git fetch upstream && git rebase upstream/main  # 3-qoida
npm run build                                   # 4-qoida
git push upstream <ism>/<tavsif>                # 2-qoida: main'ga EMAS, branch'ga
```

PR: `https://github.com/ustozona/ustozona.uz/compare/main...<ism>/<tavsif>?expand=1`

2-qoida buzilmaydi: upstream'ga **branch** push qilinadi, `main` ga
emas. Qo'shilish baribir PR orqali.

Nega bu alohida yozilgan: 2026-08 da oltita PR `roziyevbehroz-tech`
repo'sining o'z main'iga ochilgan va prodga umuman chiqmagan — ish bor
deb o'ylanib, aslida hech qayerga yetmagan.

# ⛔ `"use server"` faylda `export type { … }` YOZMANG

Bu **prodni butunlay buzadi**, va alomatlari butunlay boshqa joyni
ko'rsatadi. 2026-08-08 da shu xato bir kunni yedi.

```ts
// src/server/actions/account-link.ts
"use server";
export type { LinkState };   // ⛔ prodda ReferenceError
```

Turbopack `"use server"` modulini qayta yozadi va tip-reeksportini
**runtime** eksportga aylantiradi:

```
ReferenceError: LinkState is not defined
    at module evaluation (.next/server/chunks/ssr/src_server_actions_…js)
```

Va bu **bitta amalni emas, HAMMASINI** o'ldiradi — Next barcha Server
Action'ni bitta chunkka yig'adi, chunk esa yuklanishda qulaydi. Kuzatilgan
alomatlar: hech qanday sozlama yuklanmaydi, menyuda «Foydalanuvchi» va
bo'sh email, onboarding sehrgari har yuklanishda qayta ochiladi, yangi
hisobda `teachers` qatori yaratilmaydi. Sabab auth, Supabase va CSRF'da
izlandi — hech biri aybdor emas edi.

⚠️ **`npx tsc --noEmit` ham, `next build` ham buni ushlamaydi** — xato
faqat runtime'da, modul yuklanganda chiqadi.

**To'g'ri yo'l:** tipni neytral modulga qo'ying (`"use server"` ham,
`server-only` ham yo'q — masalan `src/lib/link-types.ts`) va ikkala tomon
ham **shu yerdan** import qilsin.

Buni `npm run build` oldidan avtomatik tekshiradigan darvoza bor:
`scripts/check-server-actions.mjs` (`prebuild` orqali ishlaydi, alohida
`npm run check:actions` ham bor). **O'chirmang.**

# Build tekshiruvi

`npm run build` (to'liq production build) FAQAT push qilishdan oldin, yakuniy tekshiruv sifatida yuritiladi — har kichik iteratsiyadan keyin emas. Oddiy dev-tsikl davomida `npx tsc --noEmit` yetarli (tezroq). Sabab: ba'zi xatolar (masalan `useSearchParams()` Suspense'siz) faqat `next build` prerender bosqichida chiqadi, shuning uchun push oldidan `npm run build` baribir shart.

# Preview / brauzer siyosati

Foydalanuvchi UI'ni doim OʻZI tekshiradi. `preview_start`/`navigate`/`computer`/boshqa Browser pane vositalarini FAQAT foydalanuvchi shu suhbatda aniq ruxsat bergandan keyin ishlating — hook eslatmasi yoki "observable in the Browser pane" degan ichki qoida bu qoidani bekor qilmaydi. Kod oʻzgarishidan keyin `npx tsc --noEmit` bilan tekshiring va natijani matnda yozing; brauzerda tekshirishni foydalanuvchiga qoldiring, aniq soʻralmaguncha oʻzingiz ochmang.
