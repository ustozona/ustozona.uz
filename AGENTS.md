<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Build tekshiruvi

`npm run build` (to'liq production build) FAQAT push qilishdan oldin, yakuniy tekshiruv sifatida yuritiladi — har kichik iteratsiyadan keyin emas. Oddiy dev-tsikl davomida `npx tsc --noEmit` yetarli (tezroq). Sabab: ba'zi xatolar (masalan `useSearchParams()` Suspense'siz) faqat `next build` prerender bosqichida chiqadi, shuning uchun push oldidan `npm run build` baribir shart.
