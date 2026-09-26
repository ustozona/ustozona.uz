# Admin panelni alohida domenga ajratish

> **Sana:** 2026-09-02 · **Holat:** MUHOKAMA QILINDI, hozircha QILINMAYDI
> **Sabab:** `/admin` sekin ishlayapti degan shikoyatdan kelib chiqdi.
> Sekinlik boshqa sababdan ekan (pastda, §1), lekin muhokama davomida
> «bunday panellar jahonda qanday quriladi» savoli ochildi va ajratish
> varianti oʻlchab chiqildi.
>
> **Qaror:** hozir ajratilmaydi. Keyingi qadam domen emas — JIT
> elevation (§7). Ajratish signali va tartibi §6 da.

---

## 1. Nima uchun bu hujjat paydo boʻldi (va nima aybdor EMAS)

2026-09-02 da panel «juda sekin, boshqa sahifaga oʻtmay qoladi» deb
baholandi. Ajratish taklif qilinishidan oldin sabab oʻlchandi:

| Nima | Natija |
|---|---|
| `/admin` asosiy agregat soʻrovi (prod, `EXPLAIN ANALYZE`) | **23 ms** |
| Baza hajmi | 52 user, 51 teacher, 4202 davomat |

Yaʼni **baza ham, domen ham aybdor emas edi**. Sekinlik RSC navigatsiya
qatlamida edi: `/admin` da birorta `loading.tsx` yoʻq edi, shu bois
dinamik marshrutga oʻtishda URL ham, ekran ham server javobigacha
oʻzgarmasdi. Tuzatildi (`src/app/admin/loading.tsx` va boʻlimlarniki).

**Buni shu yerga yozishning sababi:** kelajakda yana «panel sekin»
degan shikoyat kelsa, birinchi gumon domen yoki baza boʻlmasin.
Avval oʻlchang.

---

## 2. «Alohida domen» — aslida uchta mustaqil qaror

Bu bitta qaror koʻrinadi, lekin uchta oʻq bor va narxi har xil:

| Oʻq | Nima ajraladi | Nima beradi |
|---|---|---|
| **URL** | `admin.ustozona.uz` | Koʻrinish, xatchoʻp, psixologik chegara |
| **Deploy** | Alohida Vercel loyihasi | Blast radius: admin xatosi oʻqituvchini yiqitmaydi |
| **Origin** | Alohida brauzer origini | XSS izolyatsiyasi, tarmoq darajasida qulflash |

Ularni birga qilish **shart emas**. Eng arzoni — URL. Eng qimmati —
origin, chunki u impersonatsiyani buzadi (§4).

---

## 3. Hozirgi bogʻlanish — oʻlchangan

Admin qismi: **32 fayl, ~4400 qator**
(`src/app/admin`, `src/server/dal/admin`, `src/server/actions/admin`).

Lekin u tashqaridan **~40 modul** import qiladi:

- butun UI kit (`components/ui/*` — 20 ta)
- `server/auth`, `server/session`, `server/db/*`
- `lib/auth-roles`, `lib/utils`, `lib/uz-regions`

Va ikkita kutilmagan bogʻlanish:

- `@/store/useFeedbackStore` — Zustand store
- `@/app/dashboard/(with-sidebar)/feedback/_components/feedback-meta` —
  admin fikrlar boʻlimi **oʻqituvchi tomonidagi faylni** oʻqiyapti

⛔ **Xulosa: «nusxa koʻchirib alohida ilova qilish» varianti yoʻq.**
Toʻliq ajratish = monorepo + umumiy paket. Buni reja tuzayotganda
past baholamang.

---

## 4. Eng qiyin tugun — IMPERSONATSIYA

Bu allaqachon ishlaydigan funksiya va aynan u ajratishni qimmat qiladi.

`impersonateUserAction` (`src/server/actions/admin/users.ts`)
`auth.api.impersonateUser()` chaqiradi — u **joriy cookie'ni
almashtiradi**. Yaʼni: admin panelda tugma bosiladi, sessiya
oʻqituvchiniki boʻlib qoladi, admin oʻqituvchi ilovasiga oʻtadi.

Domen ajralsa bu zanjir uziladi: `admin.ustozona.uz` da yozilgan
cookie `www.ustozona.uz` ga bormaydi.

### 4.1 Yechim A — cookie'ni ota-domenga kengaytirish

better-auth'da bor (1.6.23 da tekshirildi,
`node_modules/better-auth/dist/cookies/index.mjs:22`):

```ts
advanced: { crossSubDomainCookies: { enabled: true, domain: ".ustozona.uz" } }
```

⚠️ **Bu GLOBAL sozlama** — u *hamma* auth cookie'ga `domain` qoʻyadi,
faqat adminnikiga emas. Natijada admin sessiyasi oʻqituvchi ilovasiga
ham koʻrinadigan boʻladi. Yaʼni izolyatsiya uchun domen ajratiladi,
keyin izolyatsiya cookie bilan qaytarib teshiladi.

Bu §5.2 (B varianti) da qabul qilsa boʻladigan murosa — deploy radiusi
baribir ajralgan boʻladi. Lekin §5.3 (C) ni butunlay maʼnosiz qiladi.

⚠️ **Ortga qaytarib boʻlmaydi:** `crossSubDomainCookies` yoqilgach uni
oʻchirish barcha foydalanuvchini tizimdan chiqarib yuboradi.

### 4.2 Yechim B — impersonatsiya chiptasi (jahon amaliyoti)

Katta SaaS'lar cookie baham koʻrmaydi. Oqim:

1. Admin panel qisqa umrli, bir martalik token yaratadi —
   `impersonation_tickets` jadvali:
   `token`, `actorId`, `targetUserId`, `expiresAt`, `usedAt`
2. Admin `www.ustozona.uz/impersonate?t=…` ga yoʻnaltiriladi
3. Oʻqituvchi ilovasi tokenni almashtiradi, **oʻz** sessiya cookie'sini
   yozadi, tokenni kuydiradi (`usedAt`)

Domenlar toʻliq mustaqil qoladi va audit yozuvi ham yaxshilanadi.
better-auth'da tayyor emas — kichik jadval + ikkita route. Taxminan
yarim kunlik ish.

**Qoida: B ga oʻtilsa, chipta AVVAL qilinadi, cookie kengaytirish
EMAS.**

---

## 5. Uch variant

### 5.1 A — subdomen, bitta deploy *(arzon)*

`admin.ustozona.uz` shu Vercel loyihasiga qoʻshiladi, proxy uni
`/admin` ga rewrite qiladi. Kod deyarli tegilmaydi.

Beradi: chiroyli URL, aniq chegara.
Bermaydi: deploy radiusi ajralmaydi — bitta build ikkalasini yiqitadi.

**Baho: kosmetika. Mehnat talab qiladi, haqiqiy muammoni yechmaydi.**

### 5.2 B — subdomen + alohida Vercel loyihasi *(oʻrtacha)*

Monorepo: `apps/web`, `apps/admin`, `packages/ui`, `packages/db`.
Ikki mustaqil deploy, bitta baza.

Bu AGENTS.md dagi qoʻrquvni yopadi — *«bitta umumiy deploy, bitta xato
ikkala dasturchiga taʼsir qiladi»*. Admin xatosi endi prodni tashlamaydi.

Narxi: UI kitni paketga koʻchirish, ikki CI, ikki env toʻplami, §3 dagi
ikki bogʻliqlikni uzish, va §4 boʻyicha impersonatsiya qarori.

### 5.3 C — butunlay boshqa domen *(qimmat, hozircha maʼnosiz)*

`ustozona-admin.com` kabi. Subdomen bermaydigan yagona narsani beradi —
cookie umuman baham koʻrilmasligi. Lekin impersonatsiyani noldan qayta
qurishni talab qiladi va hozirgi bosqichda hech qanday haqiqiy xavfni
yopmaydi.

---

## 6. Origin roʻyxatlari zanjiri — UCH JOY

Loyihada bu boʻyicha allaqachon bitta chandiq bor: 2026-08-08 da
apex↔www nomuvofiqligi barcha Server Action'ni jimgina yiqitgan
(sabab va alomatlari `next.config.ts` boshidagi izohda).

Subdomen qoʻshilsa **uch joy birga** yangilanadi:

| Fayl | Nima |
|---|---|
| `src/server/auth.ts` | `trustedOrigins` |
| `next.config.ts` | `experimental.serverActions.allowedOrigins` |
| `src/proxy.ts` | `PROTECTED_PREFIXES` oʻrniga host boʻyicha marshrutlash |

`next.config.ts` dagi «ikkalasi bir joyda turishi kerak» izohi
oʻshanda **uchtaga** aylanadi — izohni ham yangilang.

---

## 7. Domen bermaydigan, lekin muhimroq foyda

Ochigʻi: `/admin` → `admin.ustozona.uz` oʻzi xavfsizlikni koʻp
oshirmaydi. Himoya baribir `requireAdmin()` da va u toʻgʻri joyda —
har DAL funksiyasi boshida.

Alohida **host**ning haqiqiy yutugʻi bitta va u katta:
**tarmoq darajasida qulflash**. Alohida Vercel loyihasida
`admin.ustozona.uz` ga Firewall / IP allowlist / alohida SSO qoʻyish
mumkin — oʻgʻirlangan parol yetmaydi, chunki soʻrov panel eshigigacha
yetmaydi. Buni `/admin` sub-path'da qilib boʻlmaydi.

Lekin bugungi eng katta xavf oʻgʻirlangan sessiya, tasodifiy deploy
emas. Shuning uchun:

> **Keyingi qadam domen emas — JIT elevation.**
> `super_admin` roli doimiy boʻlmasin: kerak boʻlganda 30 daqiqaga
> koʻtariladi va oʻzi tushadi. Ajratishdan arzonroq, xavfni
> koʻproq kamaytiradi.

---

## 8. Qaror

1. **Hozir ajratilmaydi.** 52 foydalanuvchi, ikki dasturchi, bitta
   Vercel akkaunt — A varianti kosmetika, B esa hali erta.
2. **Keyingi ish — JIT elevation** (§7), domen emas.
3. **B ga oʻtish signali:** birinchi pullik maktab mijozi paydo
   boʻlganda YOKI jamoa 3+ dasturchiga yetganda. Oʻshanda deploy
   radiusi haqiqiy pul masalasiga aylanadi.
4. **B ga oʻtilsa tartib:** impersonatsiya chiptasi (§4.2) →
   monorepo ajratish (§5.2) → origin roʻyxatlari (§6) → tarmoq
   qulflash (§7). Bu tartib buzilmasin: cookie kengaytirish yoʻli
   (§4.1) tanlansa, ortga qaytish yoʻq.

---

## 9. Jahon amaliyoti — qisqa xulosa

Bunday mahsulotlarda admin uch qatlamga boʻlinadi:

| Qatlam | Kim | Qayerda yashaydi |
|---|---|---|
| **A — platforma operatsiyasi** | Ustozona jamoasi | Odatda alohida domen/deploy |
| **B — maktab admini (zavuch)** | Mijoz | **Mahsulot ichida** |
| **C — oʻqituvchi** | Mijoz | Dashboard |

Bizda B allaqachon toʻgʻri joyda — `workspace_members.role = "admin"`
(`docs/ish-maydoni-arxitektura.md` §11). Bu hujjat faqat **A qatlami**
haqida.

Boshqa keng tarqalgan naqshlar va bizdagi holat:

| Naqsh | Bizda |
|---|---|
| Panel jonli agregat hisoblamaydi (materialized view / nightly rollup) | ❌ hali jonli hisoblaydi — hozir 23 ms, keyin qayta koʻriladi |
| Har jadval server-side pagination + skeleton | ✅ 2026-09-02 da qilindi |
| Impersonatsiya doim koʻrinadigan chiziq + chiqish tugmasi | ✅ bor (`ImpersonationBanner`) |
| Har mutatsiya audit'ga | ✅ bor (`admin_audit_log`) |
| JIT elevation (vaqtincha super_admin) | ❌ keyingi qadam (§7) |
