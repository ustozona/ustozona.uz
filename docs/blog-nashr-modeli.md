# Blog — post yozish / saqlash / qoralama / nashr modeli

> Holat: **taklif** (2026-08-29). Kod yozilmagan. Bogʻliq fayllar:
> `src/app/blog/studio/_components/BlogEditor.tsx`,
> `src/server/dal/blog.ts`, `src/server/actions/blog.ts`,
> `src/app/blog/[slug]/page.tsx`.

## 0. Nega qaytadan koʻrilyapti

Hozirgi model qoralama va nashrni ajratmaydi: `savePost` `content`/`title`/
`excerpt` ni aynan `getPublishedPostBySlug` oʻqiydigan qatorga yozadi.
`/blog/[slug]` — dinamik route, ya'ni **har avto-saqlash darhol jonli**.
Oqibatlari:

1. Nashr qilingan maqolada xato tuzatish yoki paragrafni qayta yozish —
   yarim tayyor matn hamma oʻquvchiga va Google botiga koʻrinadi.
2. «Koʻrish» qoralamada oʻchirilgan — aynan kerak paytida ishlamaydi.
   Nashr qilinganda esa ortiqcha (jonli sahifa allaqachon = qoralama).
3. «Nashr qilish» — toggle. «Oxirgi oʻzgarishlarni chiqar» degan amal yoʻq;
   asosiy tugma «Nashrdan olish» (kam kerak, biroz xavfli) boʻlib qoladi.
4. Slug har sarlavha tahririda qayta hisoblanadi → nashr qilingan postning
   URL'i jimgina oʻzgaradi, eski havolalar 404 (redirect yoʻq).

## 1. Asosiy tamoyil

**Ishchi nusxa ≠ nashr qilingan versiya.** Muallif yozgani hech qachon
toʻgʻridan-toʻgʻri jonli sahifaga tushmaydi — jonli sahifa faqat «Nashr et»/
«Yangila» bosilganda oʻzgaradi. Jahon tajribasi (Ghost, WordPress, Medium,
Substack, Sanity) shu yadroga tayanadi.

Hosila belgi: **«saqlanmagan oʻzgarishlar bor»** = nashr qilingan, lekin
ishchi nusxa nashr suratchasidan farq qiladi.

## 2. Holatlar

| Holat | Ma'nosi | Ommaviy URL |
|---|---|---|
| `draft` | Hech qachon ommaviy boʻlmagan yoki qaytarib olingan | Yoʻq (faqat preview) |
| `published` | Jonli | Bor |
| `archived` | Ilgari ommaviy edi, endi yashirin | URL band → 410 yoki redirect |
| `scheduled` *(v2)* | T vaqtida avtomatik chiqadi | Yoʻq (hozircha) |

## 3. Maʼlumot modeli

`blog_posts` ga qoʻshiladi:

```ts
// nashr qilingan (muzlatilgan) surat — ommaviy sahifa SHUNI oʻqiydi
publishedSnapshot: jsonb("published_snapshot").$type<{
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
} | null>(),
```

- `status` enum ga `archived` qoʻshiladi (hozir `draft | published`).
- Mavjud ustunlar (`title`, `content`, ...) = **ishchi nusxa**. Muharrir
  faqat shularga yozadi.
- `getPublishedPostBySlug` → `publishedSnapshot` dan oʻqiydi (ishchi
  ustunlardan emas).
- `getMyPostById` (muharrir) → ishchi ustunlardan oʻqiydi.
- `listPublishedPosts` → snapshot ichidagi `title`/`excerpt`/`coverImageUrl`.

Migratsiya: mavjud `published` postlar uchun `publishedSnapshot` ni
joriy ishchi ustunlardan bir marta toʻldirish (backfill).

## 4. Saqlash

**Avto-saqlash** — ishni yoʻqotmaslik uchun. Faqat ishchi ustunlarga.
`revalidatePath("/blog")` avto-saqlashda CHAQIRILMAYDI.
Indikator uch holat: `Saqlanmoqda…` / `Saqlandi` / **`Saqlanmadi`** (qizil,
xato aniq koʻrinadi).

**«Nashr qilish» / «Yangilash»** — ommaviy koʻrinishni oʻzgartiradigan
yagona amal:
1. ishchi nusxa → `publishedSnapshot` ga koʻchiriladi;
2. birinchi nashrda `publishedAt` qoʻyiladi va **slug muzlatiladi**;
3. `revalidatePath("/blog")` + `revalidatePath("/blog/[slug]", "page")`;
4. toast: «Nashr qilindi · Bekor qilish» (undo).

## 5. Preview

Next.js **`draftMode()`** (cookie asosli, egalik boʻyicha himoyalangan):

- `enterPreviewAction(postId)` — `requireTeacher` + egalik tekshiradi →
  `draftMode().enable()` → `/blog/{slug}` ga redirect.
- `/blog/[slug]/page.tsx`: `draftMode().isEnabled` va koʻruvchi egasi boʻlsa
  → ishchi ustunlardan oʻqiydi; aks holda `publishedSnapshot`.
- Sahifada doimiy banner: «Preview — nashr qilinmagan» + «Chiqish»
  (`exitPreviewAction`).
- «Koʻrish» tugmasi **doim yoqilgan** (qoralama ham, nashr qilinganning
  saqlanmagan oʻzgarishlari ham).

## 6. Slug / URL

- Qoralama paytida sarlavhadan hosil qilinadi, tahrirlanadi.
- **Birinchi nashrda muzlatiladi.** `savePost` faqat
  `status === "draft" && publishedAt === null` boʻlsa slug'ni qayta hisoblaydi.
- Keyin oʻzgartirish — alohida `changeSlugAction` + `blog_redirects` jadvali
  (301). *(v2; v1'da slug shunchaki muzlaydi.)*

## 7. Tugmalar

| Holat | Asosiy tugma | Menyu (ikkilamchi) |
|---|---|---|
| Qoralama | **Nashr qilish** | Oʻchirish |
| Nashr qilingan, oʻzgarishsiz | «Nashr qilingan ✓» (oʻchiq) | Nashrdan olish · Oʻchirish |
| Nashr qilingan, oʻzgarish bor | **Yangilash** | Nashrdan olish · Oʻzgarishlarni tashlash |
| Har doim | **Koʻrish** (preview) | — |

- Muharrirdagi va studio roʻyxatidagi tugma — bitta komponent, bir xil yorliq.
- «Nashrdan olish» — «Ishonchingiz komilmi? Post koʻrinmay qoladi».
- Holat qatori: «Nashr qilingan · 3 ta saqlanmagan oʻzgarish» / «Qoralama».

## 8. Bosqichlar

**Bosqich A — schema'siz, tez:**
- `draftMode()` preview + «Koʻrish» doim yoqilgan
- `togglePublish` da `await save()`; xato boʻlsa nashr toʻxtaydi
- indikatorga qizil «Saqlanmadi» holati
- slug birinchi nashrdan keyin muzlaydi

**Bosqich B — schema:**
- `published_snapshot` + `status.archived` migratsiyasi + backfill
- ommaviy oʻqish snapshot'dan
- «Yangilash» / «Nashrdan olish» tugmalari, saqlanmagan-oʻzgarish belgisi

**Bosqich C — keyinga:**
- `blog_redirects` (slug oʻzgarishi), `scheduled` holati, «koʻrikka yuborish»
  (admin tasdigʻi bilan nashr — koʻp-mualliflik uchun)

## 9. Ustozona konteksti

- Har oʻqituvchi oʻz postiga ega (allaqachon shunday, `feedback.ts` naqshi).
- Kesh: ommaviy sahifa on-demand revalidatsiya, faqat nashr/yangilashda.
- Fikrlar hisobga bogʻlangan (migratsiya `0039`) — bu modelga tegmaydi.
