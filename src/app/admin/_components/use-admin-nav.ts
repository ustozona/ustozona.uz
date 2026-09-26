"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/* ════════════════════════════════════════════════════════════════════
   ADMIN JADVALLARI — FILTR/SAHIFA NAVIGATSIYASI

   Muammo: `router.push(href)` dinamik marshrutga oʻtganda server
   javobini kutadi, lekin bu kutish HECH QAYERDA koʻrinmaydi. Filtrni
   almashtirgan odam eski natijalarga qarab turadi va tanlovi
   ishlamadi deb oʻylaydi.

   ⚠️ `loading.tsx` bu yerda YORDAM BERMAYDI. Segment oʻzgarmayapti —
   faqat `searchParams` oʻzgaradi, yaʼni Next Suspense chegarasini
   qayta koʻrsatmaydi va sahifa joyida turaveradi. Shu bois kutishni
   `useTransition` orqali oʻzimiz koʻrsatamiz.

   Ishlatilishi:

     const { pending, go } = useAdminNav();
     ...
     <div className={pendingClass(pending)}>…jadval…</div>

   `go` — `router.push` ning transition ichidagi varianti; `pending`
   server javobi kelguncha `true`.
   ════════════════════════════════════════════════════════════════════ */

export function useAdminNav() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const go = React.useCallback(
    (href: string) => {
      startTransition(() => router.push(href));
    },
    [router],
  );

  return { pending, go };
}

/** Kutish paytida kontentni xiralashtiradi va bosishni bloklaydi.

    Kontent OʻCHIRILMAYDI, faqat xiralashadi: eski natija koʻrinib
    tursa odam nima oʻzgarayotganini kuzatadi va ekran sakramaydi.
    `transition-opacity` sekin (200 ms) — tez javoblarda miltillash
    boʻlmasligi uchun.

    ⚠️ BOʻSH NATIJA HOLATIGA HAM QOʻYING (`<Empty>` shoxi). Faqat
    toʻla roʻyxatga qoʻyilsa, 0 qatorli filtrdan boshqasiga oʻtganda
    ekranda hech narsa oʻzgarmaydi — paginatsiya ham yashiringan
    boʻladi — yaʼni bu hook tuzatayotgan muammoning aynan oʻzi
    boʻsh holatda qaytadi. */
export function pendingClass(pending: boolean): string {
  return pending
    ? "pointer-events-none opacity-60 transition-opacity duration-200"
    : "transition-opacity duration-200";
}
