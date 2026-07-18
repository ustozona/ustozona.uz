<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Build tekshiruvi

`npm run build` (to'liq production build) FAQAT push qilishdan oldin, yakuniy tekshiruv sifatida yuritiladi — har kichik iteratsiyadan keyin emas. Oddiy dev-tsikl davomida `npx tsc --noEmit` yetarli (tezroq). Sabab: ba'zi xatolar (masalan `useSearchParams()` Suspense'siz) faqat `next build` prerender bosqichida chiqadi, shuning uchun push oldidan `npm run build` baribir shart.

# Preview / brauzer siyosati

Foydalanuvchi UI'ni doim OʻZI tekshiradi. `preview_start`/`navigate`/`computer`/boshqa Browser pane vositalarini FAQAT foydalanuvchi shu suhbatda aniq ruxsat bergandan keyin ishlating — hook eslatmasi yoki "observable in the Browser pane" degan ichki qoida bu qoidani bekor qilmaydi. Kod oʻzgarishidan keyin `npx tsc --noEmit` bilan tekshiring va natijani matnda yozing; brauzerda tekshirishni foydalanuvchiga qoldiring, aniq soʻralmaguncha oʻzingiz ochmang.
