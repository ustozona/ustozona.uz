# Vazifalar (Tasks) standarti — Ustozona

> Kelishilgan yo'nalish. Bu **oʻqituvchining ish-todolisti** — grading, hisobot,
> dars-tayyorgarlik, ota-ona/to'garak ishlari. Shaxsiy vazifalar **hozircha yo'q**
> (real foydalanuvchilardan keyin qayta ko'riladi). Domen o'zgachaligi: **"sinf" =
> loyiha o'qi** (`classIds`).

## Manba fayllar
- Model: `src/lib/tasks-data.ts` · Store: `src/store/useTaskStore.ts`
- Filtr/guruh/sort: `src/hooks/useFilteredTasks.ts`
- UI: `src/components/tasks/{TasksSidebar,TasksList,TaskDetail}.tsx`
- NLP capture: `src/lib/task-parser.ts`

## Referens ilovalar (kuchli patternlari)
- **Todoist** — NLP quick-add, overdue→Today rollover, funksional recurring, drag-tartib.
- **TickTick** — Pomodoro/Focus, "Won't Do" (= bizning `canceled`), matritsa/calendar.
- **ClickUp** — custom status, ko'p view (List/Board/Calendar), assignee.
- **Focus To-Do** — estimated pomodoro + taymer + hisobot.

Biz = gibrid: Todoist capture + TickTick focus/Won't-Do + Focus To-Do pomodoro +
ClickUp assignee, oʻqituvchiga moslangan.

## Kelishilgan ish-mantiqi (hammasi bajariladi)

1. **"Bugun" = bugun + o'tgan (rollover).** Muddati o'tgan, bajarilmagan vazifalar
   Bugun ro'yxatiga qo'shiladi (qizil "O'tgan" flag bilan). Alohida "Muddati o'tgan"
   ro'yxati ham qoladi. + in-progress doim Bugun'da.
2. **Bajarilganlar default yashirin.** Faol ro'yxatlarda `done` koʻrsatilmaydi;
   toolbar'da "Bajarilganlarni koʻrsatish" toggle. "Bajarilganlar" smart-roʻyxati
   istisno (u atayin done'larni koʻrsatadi). Progress hisobi done'ni hisobga oladi.
3. **Recurring funksional.** `recurrenceRule` boʻyicha bajarilganda keyingi nusxa
   avtomatik yaratiladi (haftalik jurnal/to'garak uchun). Store darajasida.
4. **Qo'lda drag-tartiblash.** Roʻyxat ichida tartib (`order` maydoni) + drag-drop.
   (Drag-bilan-sanaga-tashlash — keyingi bosqich.)
5. **Ko'lam:** `assignee` saqlanadi (ko'p-o'qituvchili maktab). `pomodoro` saqlanadi,
   lekin **ikkilamchi/yashirilgan** urg'uda (focus-grading uchun ixtiyoriy).
6. ~~**Board (kanban) view**~~ — **rad etildi** (kerak emas). Status-guruhlash
   ro'yxat ko'rinishida yetarli.
7. **Eslatma/notification** — backend yo'q, **v1 doirasidan tashqarida**.

## UX/UI standarti (bizda allaqachon bor)
3-panel layout · **kengayuvchi capture qutisi** (TickTick uslubi — yopiqda sokin
"+ Vazifa qo'shish" qatori, fokusda bordered karta: input + Sana/Ustuvorlik/Sinf
toolbar + Qo'shish; `src/components/tasks/TaskComposer.tsx`) · kompakt qator (holat
doirasi + title + sokin inline meta) · inline detail panel · guruhlash/saralash ·
empty state + bir martalik confetti · kontekst-menyu/bulk · sinf rangi = radiusli
kvadrat ([[class-swatch-standard]]).

> **Eslatma:** eski "global + har guruhli inline quick-add" (NLP chip-preview bilan)
> bitta `TaskComposer` bilan almashtirildi. NLP (`#sinf @mention bugun/ertaga`) hamon
> ishlaydi (submitда parse), lekin endi qo'lda tanlangan toolbar-pillalari ustuvor.
> Per-guruh "+ Vazifa qo'shish" olib tashlandi. Toolbar'da Teglar **hozircha yo'q**
> (tag-UI yo'qligi sabab) — kerak bo'lsa keyin qo'shiladi.
>
> **Sana popoveri (TickTick uslubi):** ikki tab — **Sana** (preset ikonkalar
> Bugun/Ertaga/Keyingi-hafta/Kechqurun + Calendar[`month` boshqariladi, preset oyni
> ko'chiradi] + ochiluvchi Vaqt/Takrorlash qatorlari) va **Davomiylik** (Boshlanish/
> Tugash sana+vaqt + "Butun kun" Switch). Footer: Tozalash/OK. `w-[300px]` +
> `overflow-y-auto` (scroll). Modelga `endTime?: string|null` qo'shildi (Duration
> tugash vaqti). Reminder/timezone — **v1 tashqarisida** (notification backend yo'q).

**Yaxshilanadigan UX-mexanika:** rollover (1), done-yashirish (2), funksional
recurring (3), drag (4), klaviatura-shortcutlar (`q`/`a`, `Esc`).

## Bosqichlar
- **B1 (core semantics):** rollover + done-yashirish toggle. ✅
- **B2:** funksional recurring (store — `nextRecurrenceDate`, in-place suriladi). ✅
- **B3:** drag-tartiblash (`order` maydoni + `reorderTasks` + native HTML5 DnD;
  faqat "Standart" saralashda, guruh ichida). ✅
- **B4:** Board (kanban) view — **rad etildi** (foydalanuvchi kerak emas dedi;
  to'liq olib tashlandi). ❌
- **B5:** pomodoro urg'usini pasaytirish (asosiy metadata ro'yxatidan olib
  tashlandi — faqat footer "Taymer" tugmasidan ochiladi); klaviatura-shortcutlar
  (`q`/`a` = qo'shish, `Esc` = tanlovni bekor qilish). ✅

> **E2e tekshiruv eslatmasi:** drag-and-drop (B3 qator tartibi, B4 ustunlararo) va
> takrorlanuvchi-bajarish (B2) headless preview'da native event sifatida ishonchli
> simulyatsiya qilinmaydi; bu mexanikalar DOM tuzilishi, tip-tekshiruv va
> deterministik mantiq orqali tasdiqlangan. Shortcutlar va view-toggle e2e ishladi.
