# Blog — post yozish / saqlash / qoralama / nashr modeli

> Holat: **taklif v2** (2026-08-30). Kod yozilmagan. Bogʻliq fayllar:
> `src/app/blog/studio/_components/BlogEditor.tsx`,
> `src/server/dal/blog.ts`, `src/server/actions/blog.ts`,
> `src/app/blog/[slug]/page.tsx`,
> `src/app/blog/[slug]/_components/CommentSection.tsx`,
> `src/lib/reading-time.ts`, `src/server/db/schema/blog.ts`.
>
> v2 qoʻshimchalari (2026-08-30, foydalanuvchi soʻrovi): nashr/qoralama
> maqolani tahrirlash (§1 allaqachon qamraydi), **ulashish havolasi** (§10),
> **koʻrishlar soni** (§11), oʻqish-vaqti yorligʻi matni (§12),
> **fikrlar qismini qayta qurish** (§13).

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

## 10. Ulashish havolasi

Nashr qilingan maqolada **«Ulashish»** tugmasi (muallif qatori yonida yoki
maqola oxirida):

- Asosiy amal: `navigator.clipboard.writeText(canonicalUrl)` → toast
  «Havola nusxalandi». `canonicalUrl` = `https://www.ustozona.uz/blog/{slug}`
  (apex emas — [[backend-v1-progress]] 308).
- Mobil (`navigator.share` bor): tizim ulashish oynasi (Telegram/eslatma/…).
- Telegram bizning auditoriya uchun asosiy kanal — ikkilamchi tugma
  «Telegramda ulashish» (`https://t.me/share/url?url=…&text=…`).
- Studio roʻyxatida ham nashr qilingan qatorda «Havolani nusxalash».
- Slug muzlagani (§6) shu yerda muhim — ulashilgan havola hech qachon
  buzilmasin.
- Schema kerak emas.

## 11. Koʻrishlar soni

`blog_posts` ga `view_count integer not null default 0`.

- Ommaviy sahifa on-demand revalidatsiya bilan keshlangani uchun (§9)
  hisoblagichni **klient beacon** oshiradi: `useEffect` da bir marta
  `fetch("/api/blog/{id}/view", { method: "POST", keepalive: true })`.
- Route handler: `UPDATE blog_posts SET view_count = view_count + 1` —
  `revalidate` CHAQIRMAYDI (aks holda har koʻrish keshni buzadi).
- Takror sanashdan himoya: `sessionStorage["blog-viewed-{id}"]` — bitta
  sessiyada refresh qayta sanamaydi. IP-daraja dedup v1 da yoʻq (past
  hajm, ortiqcha murakkablik).
- Koʻrsatish:
  - **Studio roʻyxati + muharrir** — muallif doim koʻradi («128 koʻrildi»).
  - **Ommaviy sahifa** — muallif qatorida, ixcham format («1,2 ming»).
    QAROR (2026-08-30): ommaviyda **har doim koʻrsatiladi**, 1 boʻlsa ham
    — chegara yoʻq («samimiy va halol»).

## 12. Oʻqish-vaqti yorligʻi

`readingTimeLabelUz`: `"X daqiqalik oʻqish"` → **`"Taxminiy oʻqish vaqti:
X daqiqa"`**.

- Imlo: «taxminiy» (taxmin ← تخمین), «tahminiy» EMAS.
- Hisob-kitob mantigʻi (`readingMinutes`) oʻzgarmaydi.
- Yagona ishlatilish joyi: `/blog/[slug]/page.tsx`.

## 13. Fikrlar qismini qayta qurish

Hozirgi holat (`CommentSection.tsx`): tekis roʻyxat, kichik avatar, javob
yoʻq, oʻz fikrini tahrirlash/oʻchirish yoʻq, moderatsiya yoʻq, saralash
yoʻq, toʻliq sana. Skrinshotdagi kabi — ogʻir boʻsh textarea doim ochiq.

Jahon tajribasi (Substack, Ghost, Medium, YouTube, GitHub):

| Element | Hozir | Taklif |
|---|---|---|
| Kompozer joyi | roʻyxatdan keyin | sarlavha ostida, roʻyxatdan **oldin** (asosiy amal koʻrinib turadi) |
| Kompozer holati | doim 3-qatorli textarea | fokusgacha **bitta qator** «Fikr yozing…», fokusda ochiladi + «Yuborish» |
| Vaqt | toʻliq sana | **nisbiy** («2 kun oldin»), `title=` da toʻliq sana |
| Oʻz fikri | amal yoʻq | hover ⋯ → **Tahrirlash / Oʻchirish**; «(tahrirlangan)» belgisi; yumshoq oʻchirish |
| Moderatsiya | yoʻq | **post muallifi** oʻz maqolasidagi istalgan fikrni oʻchira oladi |
| Muallif belgisi | yoʻq | post muallifi yozganda «Muallif» chipi (YouTube naqshi) |
| Javoblar | yoʻq | **bir daraja** ichki javob (Substack/YouTube; cheksiz emas) — `parent_id` |
| Saralash | eng eski birinchi | default **eng yangi birinchi** + «Eski/Yangi» toggle |
| Reaksiya (❤️) | yoʻq | keyinga — alohida jadval kerak |
| Sahifalash | yoʻq | keyinga; > 20 boʻlганда «Koʻproq koʻrsatish» |

Vizual: 36–40px avatar, bloklar orasida `gap` (ogʻir border emas —
[[panel-language-v1]] boʻyicha border bor, soya yoʻq), hoverda yengil fon,
qizil-hoshiyali «quti» hissi yoʻqoladi.

Schema (`blog_comments`):

```ts
parentId: text("parent_id").references((): AnyPgColumn => blogComments.id, { onDelete: "cascade" }),
editedAt: timestamp("edited_at", { withTimezone: true }),
deletedAt: timestamp("deleted_at", { withTimezone: true }),
```

Yumshoq oʻchirish: javobi bor fikr → matn «[oʻchirilgan]», tuzilma qoladi;
javobi yoʻq → qatordan olib tashlanadi (yoki qattiq delete).

## 8. Bosqichlar

> QAROR (2026-08-30): 2 ta PR. Koʻrishlar soni — hammaga koʻrinadi.
> Fikrlarga bir daraja javob — PR 2 ga kiradi.

**PR 1 — nashr modeli yadrosi + kichik yutuqlar (bitta migratsiya):**
- `published_snapshot` + `status.archived` + backfill; ommaviy oʻqish
  snapshot'dan (§3)
- `draftMode()` preview + «Koʻrish» doim yoqilgan + preview banner (§5)
- «Nashr qilish» / «Yangilash» / «Nashrdan olish» tugmalari +
  saqlanmagan-oʻzgarish belgisi + qizil «Saqlanmadi» (§4, §7)
- slug birinchi nashrda muzlaydi (§6)
- oʻqish-vaqti yorligʻi matni (§12)
- ulashish tugmasi (§10)
- `view_count` + beacon + studio roʻyxatida koʻrsatish (§11)

**PR 2 — fikrlar qismini qayta qurish (§13):**
- kompozer collapse + yuqoriga koʻchirish, nisbiy vaqt, oʻz fikrini
  tahrirlash/oʻchirish, muallif moderatsiyasi, «Muallif» chipi, saralash
- bir daraja javoblar (`parent_id`)

**PR 3 — keyinga:**
- `blog_redirects` (slug oʻzgarishi), `scheduled` holati, «koʻrikka
  yuborish» (admin tasdigʻi), fikrlarga reaksiya (❤️), sahifalash

## 9. Ustozona konteksti

- Har oʻqituvchi oʻz postiga ega (allaqachon shunday, `feedback.ts` naqshi).
- Kesh: ommaviy sahifa on-demand revalidatsiya, faqat nashr/yangilashda.
- Fikrlar hisobga bogʻlangan (migratsiya `0039`) — bu modelga tegmaydi.
