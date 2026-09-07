# Email aktivatsiya oqimi — v1 spesifikatsiyasi

**Holat:** kelishilgan, kod yozilmagan. Sana: 2026-09-07.

Maqsad: roʻyxatdan oʻtgan, lekin ishni boshlamagan oʻqituvchini birinchi
mazmunli natijaga olib chiqish. Email — hozircha **yagona** aloqa kanali.

---

## 1. Nega bu kerak — prod voronkasi (2026-09-07, Supabase)

| Bosqich | Kishi |
|---|---|
| Roʻyxatdan oʻtgan | 106 |
| Sinf yaratgan | 35 |
| Oʻquvchi kiritgan | 7 |
| Davomat yoki baho qoʻygan | 1 |
| Faqat bitta sessiya (qaytmagan) | 94 |

Kogortlar:

| Kogort | Kishi | Sinf ochgan | 2+ sessiya |
|---|---|---|---|
| 0–2 kun | 34 | 17 | 0 |
| 2–7 kun | 33 | 6 | 0 |
| 7–14 kun | 23 | 2 | 3 |
| 14+ kun | 16 | 10 | 9 |

Xulosa: toʻsiq motivatsiyada emas, **birinchi sessiyaning ichida**. Email
odamni qaytaradi; qaytgan joyi tuzatilmasa u yana ketadi. Shuning uchun bu
spesifikatsiya birinchi-sessiya checklist ishi bilan **birga** bajarilishi
kutiladi (alohida ish, bu hujjat qamrovidan tashqarida).

## 2. Email bazasining holati

| Guruh | Son | Yuborish mumkinmi |
|---|---|---|
| Google OAuth (`email_verified = true`) | 54 | Ha — manzil kafolatlangan |
| Parol bilan roʻyxatdan oʻtgan, tasdiqlanmagan | 48 | Faqat tasdiqlash xati |
| `@telegram.invalid` | 4 | **Hech qachon** |

Domen: 100 gmail.com, 1 icloud.com, 1 tashkilot, 4 soxta.

`email_verified` hozirgacha faqat Google avtomatik bergan holatlarda `true` —
Better Auth'da email tasdiqlash oʻchiq, yaʼni tasdiqlangan 54 ta **aynan**
Google foydalanuvchilari.

### 2.1 Yetkazuvchanlik cheklovi — buzilsa kanal butunlay yoʻqoladi

Auditoriya 94% Gmail. Gmail ommaviy yuboruvchiga SPF + DKIM + DMARC, bir
bosishli obunani bekor qilish va **spam shikoyati 0.3% dan past** boʻlishini
talab qiladi. Tasdiqlanmagan manzillarga ommaviy yuborish qaytishlarni
(bounce) keltiradi va `ustozona.uz` domeni obroʻsini tushiradi — undan keyin
**parolni tiklash xatlari ham** spamga tusha boshlaydi.

Shuning uchun 9-boʻlimdagi bosqichlar tartibi majburiy: avval tasdiqlangan
54 ta bilan domen «isitiladi», keyin qolganlari tiklanadi.

## 3. Kelishilgan qarorlar

| Savol | Qaror |
|---|---|
| Drip dvigateli | **Oʻz kodimizda** — Resend `scheduledAt` + `emails.cancel()`. Tashqi drip servisi ham, cron ham qoʻshilmaydi |
| Email tasdiqlash | **Yumshoq** — bloklamaydi, faqat soʻraydi |
| Rozilik | **Opt-out** — default yoqilgan, har xatda obunani bekor qilish havolasi |
| Yuboruvchi manzil | Aktivatsiya xatlari uchun **javob berish mumkin** boʻlgan manzil, `noreply@` EMAS |

### 3.1 Nega cron kerak emas

«Sinf ochdi, 24 soat oʻquvchi kiritmadi» kabi shart kechikish talab qiladi,
lekin foydalanuvchi qaytmagani uchun uni keyingi soʻrovda hisoblab boʻlmaydi.
Yechim — Resend'ning rejalashtirilgan yuborishi:

- trigger sodir boʻlganda xat **kelajakka** rejalashtiriladi (`scheduledAt`,
  30 kungacha) va qaytgan `id` bazaga yoziladi;
- foydalanuvchi kutilgan ishni bajarsa, oʻsha `id` `emails.cancel()` bilan
  bekor qilinadi.

Bu «suppression» ni ham bepul beradi: bajarilgan ish uchun xat ketmaydi.

⚠️ Bekor qilingan xatni **qayta rejalashtirib boʻlmaydi** — vaqtni surish
kerak boʻlsa `emails.update({ id, scheduledAt })` ishlatiladi, `cancel` emas.

## 4. Yuboruvchi manzil

`RESEND_FROM_EMAIL` hozir `Ustozona <noreply@ustozona.uz>`. Tranzaksion
xatlar (parol tiklash) uchun shu qoladi. Aktivatsiya xatlari esa alohida,
javob beriladigan manzildan ketadi.

Sabab ikkita: javoblar «nega toʻxtadingiz?» degan savolga eng qimmatli
javobni beradi; va Gmail javobni ijobiy signal deb hisoblab yetkazuvchanlikni
koʻtaradi.

Yangi env: `RESEND_ACTIVATION_FROM` (masalan `Otabek — Ustozona <otabek@ustozona.uz>`).

## 5. Segmentlar va xatlar

Har xat: bitta maqsad, bitta tugma, qisqa matn, oʻzbek tilida.

| # | Trigger | Kechikish | Bekor qilinadi (suppression) | Maqsad |
|---|---|---|---|---|
| A1 | Roʻyxatdan oʻtdi, sinf yoʻq | 24 soat | Sinf yaratilsa | Birinchi sinfni ochish |
| A2 | Sinf yaratildi, oʻquvchi yoʻq | 24 soat | Oʻquvchi kiritilsa | Roʻyxatni kiritish |
| A3 | Oʻquvchi bor, davomat/baho yoʻq | 48 soat | Davomat yoki baho yozilsa | Birinchi dars belgisi |
| A4 | 7 kun kirmadi (oxirgi sessiyadan) | 7 kun | Kirsa | Qaytarish |
| V1 | Parol bilan roʻyxatdan oʻtdi, tasdiqlanmagan | darhol | Tasdiqlansa | Manzilni tiklash |

Bir vaqtda faqat **bitta** navbatdagi xat rejalashtirilgan boʻladi: A1 bekor
qilinganda A2 rejalashtiriladi va hokazo — zanjir.

Bir foydalanuvchiga jami eng koʻpi 4 ta aktivatsiya xati. Zanjir tugagach
avtomatik xat yuborilmaydi.

## 6. Maʼlumot modeli

Yangi jadval `email_activation` (bir foydalanuvchiga bitta qator):

| Ustun | Tur | Izoh |
|---|---|---|
| `user_id` | text PK | `user.id` ga FK, cascade |
| `opted_out` | boolean | Obunani bekor qilgan |
| `stage` | text | `a1` \| `a2` \| `a3` \| `a4` \| `done` |
| `scheduled_email_id` | text null | Resend'dagi rejalashtirilgan xat id'si |
| `scheduled_for` | timestamp null | Qachonga rejalashtirilgan |
| `sent_log` | jsonb | Yuborilgan xatlar: `[{stage, at}]` |
| `updated_at` | timestamp | |

`opted_out` — sozlamalardagi toggle va obunani bekor qilish sahifasi shu
ustunni yozadi. Tranzaksion xatlar (parol tiklash) bunga **bogʻliq emas**.

⚠️ `sent_log` JSONB — Postgres kalit tartibini oʻzgartiradi; taqqoslashda
`stableStringify` naqshiga rioya qiling.

## 7. Kod tuzilishi

```
src/server/email/
  activation.ts       — scheduleNext(userId), cancelPending(userId), sendNow(...)
  templates/          — A1..A4, V1 HTML matnlari
src/server/dal/
  email-activation.ts — jadval bilan ishlash (yagona yozish nuqtasi)
src/app/unsubscribe/  — token bilan opt-out route (autentifikatsiyasiz)
```

`src/server/email.ts` (parol tiklash) tegilmaydi.

Trigger chaqiriladigan joylar — mavjud server action'lar ichida, natija
muvaffaqiyatli boʻlgandan keyin:

| Hodisa | Joy |
|---|---|
| Roʻyxatdan oʻtish | Better Auth hook (`src/server/auth.ts`) |
| Sinf yaratildi | sinf yaratish action'i |
| Oʻquvchi kiritildi | oʻquvchi yaratish action'i |
| Davomat / baho | `actions/attendance.ts`, `actions/grades.ts` |
| Kirish (sessiya) | Better Auth session hook — A4 ni suradi |

Trigger chaqiruvi **hech qachon** asosiy amalni yiqitmasin: xato faqat
loglanadi, action natijasi oʻzgarmaydi.

⛔ Bu fayllar `"use server"` boʻlsa, ulardan `export type { … }` yozilmaydi —
`AGENTS.md` dagi qoida. Tiplar neytral modulda.

## 8. Xavfsizlik va hurmat qoidalari

- `@telegram.invalid` va boshqa yuborib boʻlmaydigan domenlar **qattiq
  filtr** bilan chetlab oʻtiladi (yuborish funksiyasining ichida, chaqiruv
  joyida emas).
- Har xatda `List-Unsubscribe` sarlavhasi va matn ichida havola.
- Obunani bekor qilish **bir bosishda**, login talab qilmaydi (imzolangan
  token).
- Kuniga bir foydalanuvchiga eng koʻpi 1 ta aktivatsiya xati.
- Bekor qilgan foydalanuvchiga hech qachon aktivatsiya xati ketmaydi.

## 9. Bosqichlar

**1-bosqich — asos.** Jadval + migratsiya, `activation.ts`, unsubscribe
route, sozlamalardagi toggle, `RESEND_ACTIVATION_FROM`. Xat yuborilmaydi.

**2-bosqich — A1 yolgʻiz, tasdiqlangan 54 ta uchun.** Bitta xat, bitta
segment. Domen obroʻsini isitish va shablonni sinash. Kamida 3 kun
kuzatiladi: yetkazildi / ochildi / bosildi / shikoyat.

**3-bosqich — A2, A3, A4 zanjiri.**

**4-bosqich — V1 tasdiqlash xati**, tasdiqlanmagan 48 ta uchun. Bosganlar
A-zanjiriga qoʻshiladi.

Har bosqich alohida PR.

## 10. Oʻlchov

⚠️ `npm run metrics` **dev bazaga** (Neon) qaraydi, prodga emas. Kampaniya
natijasini oʻlchashdan oldin skript prod bazaga qaratilishi yoki alohida
soʻrov yozilishi kerak — aks holda raqamlar maʼnosiz.

Kuzatiladigan koʻrsatkichlar:

- Yetkazuvchanlik: yuborildi / yetkazildi / qaytdi / shikoyat (0.3% chegara)
- Har xat boʻyicha: ochildi, bosildi
- Aktivatsiya: xat yuborilgandan keyin 72 soat ichida kutilgan ishni
  bajarganlar ulushi
- Obunani bekor qilganlar soni

## 11. Qamrovdan tashqarida (v1 da yoʻq)

- Marketing / yangiliklar xatlari — bu faqat aktivatsiya
- A/B sinov
- Telegram kanali (11 kishi ulangan, lekin baza juda kichik)
- Mahsulot analitikasi

---

## 12. Amalga oshirish qaydlari (kod yozilgandan keyin)

**1-bosqich (bajarildi).** `email_activation` jadvali (migratsiya 0044),
RLS yoqilgan (0045 — prod naqshi: RLS yoqilgan, siyosatsiz), DAL,
dvigatel, `/unsubscribe`, sozlamalar toggle'i.

**2-bosqich (bajarildi, YUBORILMAGAN).** A1 shabloni, roʻyxatdan oʻtish
hooki, auditoriya darvozasi, mavjud kogort skripti.

### Bir bosishli obunani bekor qilish — ikki manzil

Gmail `List-Unsubscribe-Post` ni talab qiladi: foydalanuvchi Gmail
interfeysidagi tugmani bosganda Gmail **sahifani ochmaydi**, balki
manzilga **POST** yuboradi. Shuning uchun ikkita manzil bor:

| Manzil | Kim ishlatadi | Metod |
|---|---|---|
| `/unsubscribe?t=…` | odam (xat ichidagi havola) | GET, sahifa |
| `/api/unsubscribe?t=…` | pochta mijozi (sarlavha) | POST, javobsiz |

Token ikkalasida bir xil (HMAC, `BETTER_AUTH_SECRET`). Login talab
qilinmaydi — havolaning oʻzi dalil.

### Env darvozalari

| Oʻzgaruvchi | Default | Vazifa |
|---|---|---|
| `ACTIVATION_EMAILS` | `off` | `on` boʻlmaguncha xat Resend'ga chiqmaydi, konsolga yoziladi |
| `ACTIVATION_ALLOW_UNVERIFIED` | yoʻq (= faqat tasdiqlangan) | 4-bosqichda `on` qilinadi |
| `RESEND_ACTIVATION_FROM` | `RESEND_FROM_EMAIL` ga qaytadi | Javob beriladigan manzil |

### Mavjud kogort

Roʻyxatdan oʻtish hooki faqat YANGI foydalanuvchilarga ishlaydi. Undan
oldin kelganlar uchun bir martalik skript:

```
npm run activation:a1 -- --prod          # quruq yurish
npm run activation:a1 -- --prod --yes    # haqiqatan
```

Xat 1 soatga rejalashtiriladi (darhol emas) — roʻyxat notoʻgʻri chiqsa
Resend panelidan bekor qilishga vaqt qolsin.

### Hali qilinmagan

- A2/A3/A4 shablonlari (`qurish()` ular uchun `null` qaytaradi, dvigatel
  jimgina tashlab ketadi — xato bermaydi)
- Sinf yaratilganda `advance()` chaqiruvi. Sinf yaratish alohida amal
  emas, `applyGradesBatch` ichidagi `classesUpsert` orqali oʻtadi —
  trigger oʻsha yerga qoʻyiladi (3-bosqich)
- Yetkazuvchanlik kuzatuvi (Resend webhook: delivered / bounced /
  complained)
