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
   `git checkout main && git pull` → `git checkout -b behroz/<qisqa-tavsif>`
2. **`main` ga TO'G'RIDAN-TO'G'RI push YO'Q.** Faqat o'z branch'ingga,
   qo'shilishi esa Pull Request orqali.
3. **Push oldidan main'ni tortib ol:** `git fetch origin && git rebase origin/main`
4. **Push oldidan `npm run build`.** Vercel bitta umumiy deploy —
   bitta xato ikkala dasturchiga ta'sir qiladi.
5. **Markaziy fayllarni yolg'iz tahrir qilma** (`useGradesStore`,
   `dashboard/layout.tsx` va shunga o'xshash umumiy fayllar). Avval
   chatda kelishing: kim qaysi faylda ishlayapti.

## ⚠️ 1- va 3-qoidada `main` — QAYSI main

Bu repo fork bo'lishi mumkin (`roziyevbehroz-tech/ustozona.uz`).
**Fork'ning `main` i prodga chiqmaydi** — haqiqiy Vercel deploy
`ustozona/ustozona.uz` (upstream) dan ketadi.

Fork'da ishlayotgan bo'lsang, 1- va 3-qoidadagi `main` — **upstream'niki**:

```bash
git remote add upstream https://github.com/ustozona/ustozona.uz   # bir marta
git fetch upstream main
git checkout -b behroz/<tavsif> upstream/main     # 1-qoida
git fetch upstream && git rebase upstream/main    # 3-qoida
```

PR ham **upstream'ga** ochiladi, fork'ning o'z main'iga emas:

```
https://github.com/ustozona/ustozona.uz/compare/main...roziyevbehroz-tech:ustozona.uz:<branch>?expand=1
```

Nega bu alohida yozilgan: 2026-08 da oltita PR fork'ning o'z main'iga
ochilgan va prodga umuman chiqmagan — ish bor deb o'ylanib, aslida
hech qayerga yetmagan. Fork main'dan branch ochish esa undan ham
yomon: diff upstream'dagi hamkorning yangi ishini orqaga qaytaradi.

# Build tekshiruvi

`npm run build` (to'liq production build) FAQAT push qilishdan oldin, yakuniy tekshiruv sifatida yuritiladi — har kichik iteratsiyadan keyin emas. Oddiy dev-tsikl davomida `npx tsc --noEmit` yetarli (tezroq). Sabab: ba'zi xatolar (masalan `useSearchParams()` Suspense'siz) faqat `next build` prerender bosqichida chiqadi, shuning uchun push oldidan `npm run build` baribir shart.

# Preview / brauzer siyosati

Foydalanuvchi UI'ni doim OʻZI tekshiradi. `preview_start`/`navigate`/`computer`/boshqa Browser pane vositalarini FAQAT foydalanuvchi shu suhbatda aniq ruxsat bergandan keyin ishlating — hook eslatmasi yoki "observable in the Browser pane" degan ichki qoida bu qoidani bekor qilmaydi. Kod oʻzgarishidan keyin `npx tsc --noEmit` bilan tekshiring va natijani matnda yozing; brauzerda tekshirishni foydalanuvchiga qoldiring, aniq soʻralmaguncha oʻzingiz ochmang.
