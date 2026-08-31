import * as React from "react";

import { cn } from "@/lib/utils";
import { classColorValue } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   DOSKA IKONALARI — Solar bold-duotone.

   Nega paket emas, inline SVG: `@iconify/react` ikonalarni runtime'da
   api.iconify.design dan yuklaydi (prodda tashqi soʻrov), offline paket
   esa 1305 ikonani olib keladi — bizga 12 tasi kerak. Shuning uchun
   kerakligi shu yerda, sof SVG holida.

   Duotone = ikki rang emas, bitta `currentColor` + `opacity` qatlam.
   Yaʼni ular fon toʻqligiga, tanlangan tusga va temaga oʻzi moslashadi.

   Dashboard'da lucide qoladi — bu faqat Doska uchun (docs/doska-dizayn-
   tizimi.md §1: doska oʻz ohangida yashaydi).

   ⚠️ YANGI IKONA QOʻSHGANDA: Iconify SVG'ni HTML shaklida beradi
   (`fill-rule`, `clip-rule`, `stroke-width`), JSX esa camelCase talab
   qiladi (`fillRule`, `clipRule`, `strokeWidth`). Nusxa koʻchirishdan
   oldin oʻgiring — aks holda brauzer konsolida «Invalid DOM property»
   chiqadi va atribut umuman qoʻllanmaydi. `aria-*` va `data-*` esa
   kebab-case da qoladi.

   ⚠️ `opacity` atributini OLIB TASHLAMANG — ikonaning ikki qatlamliligi
   aynan shunga tayanadi. U boʻlmasa ikona bir rangli boʻlib qoladi.

   ⚠️⚠️ `<g>` GA `fill` YOZMANG. Iconify SVG'ni `<g fill="currentColor">`
   bilan beradi — nusxa koʻchirganda BU ATRIBUTNI OʻCHIRING.

   Sabab (2026-08-21 da ikki marta adashtirgan): prezentatsiya atributi
   MEROSDAN kuchli. CSS `fill` ni `<svg>` ga qoʻysa ham, `<g fill="…">`
   uni toʻxtatadi va ichkaridagi yoʻllar `currentColor` da qolaveradi.
   Natijada tus faqat `[opacity]` li qatlamga tushar, qolgani matn
   rangida — yaʼni QORA — boʻlardi. «Kontur qora» shikoyatining asl
   sababi shu edi; tus hisoblash formulasini oʻzgartirish yordam
   bermagani ham shundan.

   Endi `fill` faqat bitta joyda — `.doska-icon` CSS qoidasida
   (globals.css) — va u meros orqali pastga tushadi.
   ════════════════════════════════════════════════════════════════════ */

type IconProps = { className?: string };

/** Soat — solar:clock-circle-bold-duotone */
export function IconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" opacity=".5"/><path fillRule="evenodd" d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.4697 12.5303C11.329 12.3897 11.25 12.1989 11.25 12V8C11.25 7.58579 11.5858 7.25 12 7.25Z" clipRule="evenodd"/></g>
    </svg>
  );
}

/** Taymer — solar:alarm-bold-duotone */
export function IconTimer({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M11.9998 21.9997C16.836 21.9997 20.7565 18.1159 20.7565 13.325C20.7565 8.53417 16.836 4.65039 11.9998 4.65039C7.16366 4.65039 3.24316 8.53417 3.24316 13.325C3.24316 18.1159 7.16366 21.9997 11.9998 21.9997Z" opacity=".5"/><path d="M11.9993 8.74707C12.4023 8.74707 12.729 9.07072 12.729 9.46996V13.0259L14.9477 15.2238C15.2326 15.5061 15.2326 15.9638 14.9477 16.2461C14.6627 16.5285 14.2006 16.5285 13.9157 16.2461L11.4833 13.8365C11.3464 13.701 11.2695 13.5171 11.2695 13.3254V9.46996C11.2695 9.07072 11.5962 8.74707 11.9993 8.74707Z"/><path fillRule="evenodd" d="M8.2405 2.33986C8.45409 2.67841 8.3502 3.1244 8.00844 3.33599L4.11657 5.74562C3.77481 5.95722 3.32461 5.8543 3.11102 5.51574C2.89742 5.17718 3.00131 4.7312 3.34307 4.5196L7.23494 2.10998C7.5767 1.89838 8.0269 2.0013 8.2405 2.33986Z" clipRule="evenodd"/><path fillRule="evenodd" d="M15.7595 2.33985C15.9731 2.0013 16.4233 1.89838 16.7651 2.10998L20.6569 4.5196C20.9987 4.7312 21.1026 5.17719 20.889 5.51574C20.6754 5.8543 20.2252 5.95722 19.8834 5.74562L15.9916 3.33599C15.6498 3.1244 15.5459 2.67841 15.7595 2.33985Z" clipRule="evenodd"/></g>
    </svg>
  );
}

/**
 * Svetofor — OʻZIMIZ CHIZGAN (Solar'da yoʻq).
 *
 * `solar:traffic-bold-duotone` svetofor EMAS — u aylanma harakat
 * (roundabout) belgisi; panelda halqaga oʻxshab turgani shundan.
 * Solar telefon-ilova/moliya mavzusida, yoʻl belgilari unda kam.
 *
 * Solar turiga moslangan (docs/doska-dizayn-tizimi.md §3):
 *   • 24×24, mazmun 20×20 ichida (chetdan 2px)
 *   • massa qatlami = korpus, `opacity=".5"` bilan
 *   • detal qatlami = uchta chiroq, toʻliq
 *   • faqat `fill`, `stroke` yoʻq
 *
 * Chiroq radiusi 2.2, markazlari 6.5 / 12 / 17.5 — orasida 1.1px
 * qoladi. Kattaroq qilinsa 16px da chiroqlar qoʻshilib ketadi.
 * Kichik oʻlchamda tanib olishni KORPUS silueti tashiydi, chiroqlar
 * esa kattasida.
 *
 * ⚠️ BU IKONA IERARXIK EMAS — u KOʻP RANGLI (SF Symbols «multicolor»).
 * Korpus neytral (`currentColor`), chiroqlar esa haqiqiy qizil/sariq/
 * yashil. Sabab: svetofor — jismoniy obyekt, uning rangi maʼno
 * tashiydi, bezak emas.
 *
 * Korpus 80% shaffoflikda — 45% bilan solishtirilib tanlangan. Toʻq
 * korpusda chiroqlar kontrast boʻyicha yorqinroq chiqadi; ochiq
 * korpusda esa uchta rang oq fonga singib ketadi. `docs/doska-dizayn-tizimi.md` §3 da bu istisno
 * oldindan yozilgan («brend yashili tus sifatida ishlatilmaydi —
 * yagona istisno svetoforning yashil chirogʻi»).
 *
 * `fill` atributi elementning OʻZIDA turgani uchun `.doska-icon` CSS
 * qoidasidan kuchli — shuning uchun bu ikona `--doska-icon-tint` ni
 * eʼtiborsiz qoldiradi. (Aynan shu mexanizm oldin `<g fill>` bilan
 * tasodifan ish yegan edi; bu yerda esa ATAYLAB ishlatilyapti.)
 *
 * Ranglar `class-colors.ts` palitrasidan olinadi — xom OKLCH yozilmaydi.
 */
export function IconTrafficLight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <rect x="6" y="2" width="12" height="20" rx="4" fill="currentColor" opacity=".8" />
        <circle cx="12" cy="6.5" r="2.2" fill={classColorValue("red")} />
        <circle cx="12" cy="12" r="2.2" fill={classColorValue("amber")} />
        <circle cx="12" cy="17.5" r="2.2" fill={classColorValue("green")} />
      </g>
    </svg>
  );
}

/**
 * Matn — OʻZIMIZ CHIZGAN.
 *
 * Solar'ning matn ikonalari (`solar:text-bold-duotone` va h.k.) harf
 * shakliga tayanadi — «T», «Aa». Ular lotin alifbosini biladigan
 * koʻzga tez oʻqiladi, lekin panelda yonidagi «Matn» yorligʻi bilan
 * ikki marta bir narsani aytadi.
 *
 * Shuning uchun harf emas, MATNNING SHAKLI: sarlavha + uch qator.
 * Bu ikona vidjet nima chiqarishini koʻrsatadi, nomini takrorlamaydi.
 *
 * Sarlavha qatori — detal (toʻliq), abzas qatorlari — massa
 * (`opacity=".5"`). Oxirgi qator kaltaroq: abzas shu bilan tugaydi va
 * shakl «matn boʻlagi» boʻlib oʻqiladi, panjara emas.
 */
export function IconText({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <rect x="3" y="10" width="18" height="1.8" rx=".9" opacity=".5" />
        <rect x="3" y="14.4" width="18" height="1.8" rx=".9" opacity=".5" />
        <rect x="3" y="18.8" width="11" height="1.8" rx=".9" opacity=".5" />
        <rect x="3" y="3.6" width="14" height="3.2" rx="1.6" />
      </g>
    </svg>
  );
}

/**
 * Yopishqoq qogʻoz — OʻZIMIZ CHIZGAN.
 *
 * Tanib olishni burchakning BUKLANGANI tashiydi: buklanmasa shakl
 * oddiy kvadratga aylanadi va «fon», «rasm», «ekran» ikonalaridan
 * farq qilmay qoladi.
 *
 * Ikki yoʻl bir-birini toʻldiradi — massa qogʻozning oʻzi
 * (`opacity=".5"`), detal esa buklangan burchak (toʻliq). Ular tegib
 * turadi, orasida tirqish yoʻq: shuning uchun burchak «kesilgan» emas,
 * «koʻtarilgan» boʻlib koʻrinadi.
 *
 * Radius 4 — vidjet kartochkasining `--radius` (playful, 20px/24px
 * miqyosida) nisbatiga yaqin, yaʼni ikona chiqaradigan narsaga oʻxshaydi.
 */
export function IconStickyNote({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5h-3a4 4 0 0 0-4 4v3H8a4 4 0 0 1-4-4V8Z" opacity=".5" />
        <path d="M20 13h-3a4 4 0 0 0-4 4v3z" />
      </g>
    </svg>
  );
}

/**
 * Shakl — OʻZIMIZ CHIZGAN.
 *
 * Ikkita figura yonma-yon: aylana (massa) va uchburchak (detal).
 * Bitta figura chizilsa ikona «uchburchak» degan MAʼNONI oladi va
 * toʻqqiz shakldan bittasini vaʼda qilib qoʻyadi; ikkitasi esa
 * «shakllar» degan TURKUMNI bildiradi.
 *
 * Ular biroz ustma-ust tushadi — ajratilgan ikki figura 16px da ikki
 * dogʻga aylanadi, kesishgani esa bitta siluet boʻlib qoladi.
 */
export function IconShape({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <circle cx="15" cy="15" r="7" opacity=".5" />
        <path d="M8.5 2.5 14.6 13.2a1 1 0 0 1-.87 1.5H1.77a1 1 0 0 1-.87-1.5L7.03 2.5a.85.85 0 0 1 1.47 0Z" />
      </g>
    </svg>
  );
}

/** Fon — solar:gallery-bold-duotone */
export function IconBackground({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M18 8C18 9.10457 17.1046 10 16 10C14.8954 10 14 9.10457 14 8C14 6.89543 14.8954 6 16 6C17.1046 6 18 6.89543 18 8Z"/><path fillRule="evenodd" d="M11.9426 1.25H12.0574C14.3658 1.24999 16.1748 1.24998 17.5863 1.43975C19.031 1.63399 20.1711 2.03933 21.0659 2.93414C21.9607 3.82895 22.366 4.96897 22.5603 6.41371C22.75 7.82519 22.75 9.63423 22.75 11.9426V12.0309C22.75 13.9397 22.75 15.5023 22.6463 16.7745C22.5422 18.0531 22.3287 19.1214 21.8509 20.0087C21.6401 20.4001 21.3812 20.7506 21.0659 21.0659C20.1711 21.9607 19.031 22.366 17.5863 22.5603C16.1748 22.75 14.3658 22.75 12.0574 22.75H11.9426C9.63423 22.75 7.82519 22.75 6.41371 22.5603C4.96897 22.366 3.82895 21.9607 2.93414 21.0659C2.14086 20.2726 1.7312 19.2852 1.51335 18.0604C1.29935 16.8573 1.2602 15.3603 1.25207 13.5015C1.25 13.0287 1.25 12.5286 1.25 12.001L1.25 11.9426C1.24999 9.63423 1.24998 7.82519 1.43975 6.41371C1.63399 4.96897 2.03933 3.82895 2.93414 2.93414C3.82895 2.03933 4.96897 1.63399 6.41371 1.43975C7.82519 1.24998 9.63423 1.24999 11.9426 1.25ZM6.61358 2.92637C5.33517 3.09825 4.56445 3.42514 3.9948 3.9948C3.42514 4.56445 3.09825 5.33517 2.92637 6.61358C2.75159 7.91356 2.75 9.62177 2.75 12C2.75 12.5287 2.75 13.0257 2.75205 13.4949C2.76025 15.369 2.80214 16.7406 2.99017 17.7978C3.17436 18.8333 3.48774 19.4981 3.9948 20.0052C4.56445 20.5749 5.33517 20.9018 6.61358 21.0736C7.91356 21.2484 9.62177 21.25 12 21.25C14.3782 21.25 16.0864 21.2484 17.3864 21.0736C18.6648 20.9018 19.4355 20.5749 20.0052 20.0052C20.2151 19.7953 20.3872 19.5631 20.5302 19.2976C20.8619 18.6816 21.0531 17.8578 21.1513 16.6527C21.2494 15.4482 21.25 13.9459 21.25 12C21.25 9.62177 21.2484 7.91356 21.0736 6.61358C20.9018 5.33517 20.5749 4.56445 20.0052 3.9948C19.4355 3.42514 18.6648 3.09825 17.3864 2.92637C16.0864 2.75159 14.3782 2.75 12 2.75C9.62177 2.75 7.91356 2.75159 6.61358 2.92637Z" clipRule="evenodd"/><path d="M20.6069 19.1463L17.7765 16.599C16.737 15.6634 15.1889 15.5702 14.0446 16.3744L13.7464 16.5839C12.9513 17.1428 11.8695 17.0491 11.1822 16.3618L6.89252 12.0721C6.03631 11.2159 4.66289 11.1702 3.75162 11.9675L2.75049 12.8435C2.75077 13.0665 2.75128 13.2835 2.7522 13.4949C2.7604 15.369 2.80229 16.7406 2.99032 17.7978C3.17451 18.8333 3.48788 19.4981 3.99494 20.0052C4.5646 20.5749 5.33532 20.9018 6.61372 21.0736C7.9137 21.2484 9.62192 21.25 12.0001 21.25C14.3784 21.25 16.0866 21.2484 17.3866 21.0736C18.665 20.9018 19.4357 20.5749 20.0054 20.0052C20.2153 19.7953 20.3873 19.5631 20.5303 19.2976C20.5568 19.2485 20.5823 19.1981 20.6069 19.1463Z" opacity=".5"/></g>
    </svg>
  );
}

/** Tozalash — solar:trash-bin-trash-bold-duotone */
export function IconTrash({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M3 6.38597C3 5.90152 3.34538 5.50879 3.77143 5.50879L6.43567 5.50832C6.96502 5.49306 7.43202 5.11033 7.61214 4.54412C7.61688 4.52923 7.62232 4.51087 7.64185 4.44424L7.75665 4.05256C7.8269 3.81241 7.8881 3.60318 7.97375 3.41617C8.31209 2.67736 8.93808 2.16432 9.66147 2.03297C9.84457 1.99972 10.0385 1.99986 10.2611 2.00002H13.7391C13.9617 1.99986 14.1556 1.99972 14.3387 2.03297C15.0621 2.16432 15.6881 2.67736 16.0264 3.41617C16.1121 3.60318 16.1733 3.81241 16.2435 4.05256L16.3583 4.44424C16.3778 4.51087 16.3833 4.52923 16.388 4.54412C16.5682 5.11033 17.1278 5.49353 17.6571 5.50879H20.2286C20.6546 5.50879 21 5.90152 21 6.38597C21 6.87043 20.6546 7.26316 20.2286 7.26316H3.77143C3.34538 7.26316 3 6.87043 3 6.38597Z"/><path fillRule="evenodd" d="M9.42543 11.4815C9.83759 11.4381 10.2051 11.7547 10.2463 12.1885L10.7463 17.4517C10.7875 17.8855 10.4868 18.2724 10.0747 18.3158C9.66253 18.3592 9.29499 18.0426 9.25378 17.6088L8.75378 12.3456C8.71256 11.9118 9.01327 11.5249 9.42543 11.4815Z" clipRule="evenodd"/><path fillRule="evenodd" d="M14.5747 11.4815C14.9868 11.5249 15.2875 11.9118 15.2463 12.3456L14.7463 17.6088C14.7051 18.0426 14.3376 18.3592 13.9254 18.3158C13.5133 18.2724 13.2126 17.8855 13.2538 17.4517L13.7538 12.1885C13.795 11.7547 14.1625 11.4381 14.5747 11.4815Z" clipRule="evenodd"/><path d="M11.5956 22.0001H12.4044C15.1871 22.0001 16.5785 22.0001 17.4831 21.1142C18.3878 20.2283 18.4803 18.7751 18.6654 15.8686L18.9321 11.6807C19.0326 10.1037 19.0828 9.31524 18.6289 8.81558C18.1751 8.31592 17.4087 8.31592 15.876 8.31592H8.12405C6.59127 8.31592 5.82488 8.31592 5.37105 8.81558C4.91722 9.31524 4.96744 10.1037 5.06788 11.6807L5.33459 15.8686C5.5197 18.7751 5.61225 20.2283 6.51689 21.1142C7.42153 22.0001 8.81289 22.0001 11.5956 22.0001Z" opacity=".5"/></g>
    </svg>
  );
}

/** Bosh sahifa — solar:home-2-bold-duotone */
export function IconHome({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" opacity=".5"/><path d="M11.25 18C11.25 18.4142 11.5858 18.75 12 18.75C12.4142 18.75 12.75 18.4142 12.75 18V15C12.75 14.5858 12.4142 14.25 12 14.25C11.5858 14.25 11.25 14.5858 11.25 15V18Z"/></g>
    </svg>
  );
}

/** Toʻliq ekran — solar:full-screen-bold-duotone */
export function IconFullscreen({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M18.2892 2.88976C17.2615 2.75159 15.9068 2.75 14 2.75C13.5858 2.75 13.25 2.41421 13.25 2C13.25 1.58579 13.5858 1.25 14 1.25L14.0564 1.25C15.8942 1.24998 17.3498 1.24997 18.489 1.40314C19.6614 1.56076 20.6104 1.89288 21.3588 2.64124C22.1071 3.38961 22.4392 4.33856 22.5969 5.51098C22.75 6.65019 22.75 8.10583 22.75 9.94359V10C22.75 10.4142 22.4142 10.75 22 10.75C21.5858 10.75 21.25 10.4142 21.25 10C21.25 8.09318 21.2484 6.73851 21.1102 5.71085C20.975 4.70476 20.7213 4.12511 20.2981 3.7019C19.8749 3.27869 19.2952 3.02502 18.2892 2.88976ZM2 13.25C2.41421 13.25 2.75 13.5858 2.75 14C2.75 15.9068 2.75159 17.2615 2.88976 18.2892C3.02502 19.2952 3.27869 19.8749 3.7019 20.2981C4.12511 20.7213 4.70476 20.975 5.71085 21.1102C6.73851 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.65019 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64124 21.3588C1.89288 20.6104 1.56076 19.6614 1.40314 18.489C1.24997 17.3498 1.24998 15.8942 1.25 14.0564L1.25 14C1.25 13.5858 1.58579 13.25 2 13.25Z" clipRule="evenodd"/><g opacity=".5"><path d="M9.94358 1.25H10C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09318 2.75 6.73851 2.75159 5.71085 2.88976C4.70476 3.02502 4.12511 3.27869 3.7019 3.7019C3.27869 4.12511 3.02502 4.70476 2.88976 5.71085C2.75159 6.73851 2.75 8.09318 2.75 10C2.75 10.4142 2.41421 10.75 2 10.75C1.58579 10.75 1.25 10.4142 1.25 10V9.94358V9.94357C1.24998 8.10582 1.24997 6.65019 1.40314 5.51098C1.56076 4.33856 1.89288 3.38961 2.64124 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10582 1.24998 9.94357 1.25H9.94358Z"/><path d="M22 13.25C22.4142 13.25 22.75 13.5858 22.75 14V14.0564V14.0565C22.75 15.8942 22.75 17.3498 22.5969 18.489C22.4392 19.6614 22.1071 20.6104 21.3588 21.3588C20.6104 22.1071 19.6614 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0565 22.75H14.0564H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7213 19.8749 20.975 19.2952 21.1102 18.2892C21.2484 17.2615 21.25 15.9068 21.25 14C21.25 13.5858 21.5858 13.25 22 13.25Z"/></g></g>
    </svg>
  );
}

/** Menyu — solar:menu-dots-bold-duotone */
export function IconMenu({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12Z"/><path d="M21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12Z"/><path d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" opacity=".5"/></g>
    </svg>
  );
}

/** Tanlash — solar:cursor-bold-duotone */
export function IconCursor({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M11.4334 16.4643L12.6361 15.2616L15.2616 12.6361L16.4643 11.4334C17.6955 10.2022 18.3111 9.58656 18.1658 8.92489C18.0204 8.26322 17.2035 7.96225 15.5696 7.3603L10.1205 5.35271C6.86106 4.15187 5.23136 3.55146 4.39141 4.39141C3.55146 5.23136 4.15187 6.86106 5.3527 10.1205L7.3603 15.5696C7.96225 17.2035 8.26322 18.0204 8.92489 18.1658C9.58656 18.3111 10.2022 17.6955 11.4334 16.4643Z" clipRule="evenodd"/><path d="M12.6357 15.2618L16.574 19.2001C16.9818 19.6079 17.1857 19.8117 17.4132 19.906C17.7164 20.0316 18.0572 20.0316 18.3605 19.906C18.5879 19.8117 18.7918 19.6078 19.1996 19.2001C19.6074 18.7923 19.8113 18.5884 19.9055 18.3609C20.0311 18.0577 20.0311 17.7169 19.9055 17.4137C19.8113 17.1862 19.6074 16.9823 19.1996 16.5745L15.2613 12.6362L12.6357 15.2618Z" opacity=".5"/></g>
    </svg>
  );
}

/** Chizish — solar:pen-new-round-bold-duotone */
export function IconPen({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><circle cx="12" cy="12" r="10" opacity=".5"/><path d="M13.9261 14.3018C14.1711 14.1107 14.3933 13.8885 14.8377 13.4441L20.378 7.90374C20.512 7.7698 20.4507 7.53909 20.2717 7.477C19.6178 7.25011 18.767 6.82414 17.9713 6.02835C17.1755 5.23257 16.7495 4.38186 16.5226 3.72788C16.4605 3.54892 16.2298 3.48761 16.0959 3.62156L10.5555 9.16192C10.1111 9.60634 9.88888 9.82854 9.69778 10.0736C9.47235 10.3626 9.27908 10.6753 9.12139 11.0062C8.98771 11.2867 8.88834 11.5848 8.68959 12.181L8.43278 12.9515L8.02443 14.1765L7.64153 15.3252C7.54373 15.6186 7.6201 15.9421 7.8388 16.1608C8.0575 16.3795 8.38099 16.4559 8.67441 16.3581L9.82308 15.9752L11.0481 15.5668L11.8186 15.31L11.8186 15.31C12.4148 15.1113 12.7129 15.0119 12.9934 14.8782C13.3243 14.7205 13.637 14.5273 13.9261 14.3018Z"/><path d="M22.1127 6.16905C23.2952 4.98656 23.2952 3.06936 22.1127 1.88687C20.9302 0.704377 19.013 0.704377 17.8306 1.88687L17.6524 2.06499C17.4806 2.23687 17.4027 2.47695 17.4456 2.7162C17.4726 2.8667 17.5227 3.08674 17.6138 3.3493C17.796 3.87439 18.14 4.56368 18.788 5.21165C19.4359 5.85961 20.1252 6.20364 20.6503 6.38581C20.9129 6.4769 21.1329 6.52697 21.2834 6.55399C21.5227 6.59693 21.7627 6.51905 21.9346 6.34717L22.1127 6.16905Z"/></g>
    </svg>
  );
}

/** Qoʻshish — solar:add-square-bold-duotone */
export function IconAdd({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22Z" opacity=".5"/><path d="M12 8.25C12.4142 8.25 12.75 8.58579 12.75 9V11.25H15C15.4142 11.25 15.75 11.5858 15.75 12C15.75 12.4142 15.4142 12.75 15 12.75H12.75L12.75 15C12.75 15.4142 12.4142 15.75 12 15.75C11.5858 15.75 11.25 15.4142 11.25 15V12.75H9C8.58579 12.75 8.25 12.4142 8.25 12C8.25 11.5858 8.58579 11.25 9 11.25H11.25L11.25 9C11.25 8.58579 11.5858 8.25 12 8.25Z"/></g>
    </svg>
  );
}

/** Oldingi — solar:alt-arrow-left-bold-duotone */
export function IconArrowLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M11.5956 8.30273L8.16485 11.6296C7.94505 11.8428 7.94505 12.1573 8.16485 12.3704L14.7953 18.8001C15.2091 19.2013 16 18.9581 16 18.4297V12.7071L11.5956 8.30273Z"/><path d="M15.9999 11.2929L15.9999 5.5703C15.9999 5.04189 15.2089 4.79869 14.7952 5.1999L12.3135 7.60648L15.9999 11.2929Z" opacity=".5"/></g>
    </svg>
  );
}

/** Oʻquvchilar — solar:users-group-rounded-bold-duotone */
export function IconUsers({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><circle cx="15" cy="6" r="3" opacity=".5"/><ellipse cx="16" cy="17" opacity=".5" rx="5" ry="3"/><circle cx="9.001" cy="6" r="4"/><ellipse cx="9.001" cy="17.001" rx="7" ry="4"/></g>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   IKONALAR ROʻYXATI — `/doska/ikonalar` nazorat sahifasi uchun.

   Qoʻlda chizilgan yoki tahrirlangan ikonalar vaqt oʻtib SILJIYDI:
   biri kattaroq, biri qalinroq, biri chetga yaqinroq. Bu sahifa
   hammasini bir necha oʻlchamda yonma-yon chiqaradi, shuning uchun
   nomuvofiqlik bir qarashda koʻrinadi.

   ⚠️ Yangi ikona qoʻshsangiz shu roʻyxatga ham qoʻshing.
   ════════════════════════════════════════════════════════════════════ */
export const DOSKA_ICONS: { name: string; source: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { name: "IconClock", source: "solar:clock-circle", Icon: IconClock },
  { name: "IconTimer", source: "solar:alarm", Icon: IconTimer },
  { name: "IconTrafficLight", source: "oʻzimiz:svetofor", Icon: IconTrafficLight },
  { name: "IconText", source: "oʻzimiz:matn", Icon: IconText },
  { name: "IconStickyNote", source: "oʻzimiz:yopishqoq", Icon: IconStickyNote },
  { name: "IconShape", source: "oʻzimiz:shakl", Icon: IconShape },
  { name: "IconBackground", source: "solar:gallery", Icon: IconBackground },
  { name: "IconTrash", source: "solar:trash-bin-trash", Icon: IconTrash },
  { name: "IconHome", source: "solar:home-2", Icon: IconHome },
  { name: "IconFullscreen", source: "solar:full-screen", Icon: IconFullscreen },
  { name: "IconMenu", source: "solar:menu-dots", Icon: IconMenu },
  { name: "IconCursor", source: "solar:cursor", Icon: IconCursor },
  { name: "IconPen", source: "solar:pen-new-round", Icon: IconPen },
  { name: "IconAdd", source: "solar:add-square", Icon: IconAdd },
  { name: "IconArrowLeft", source: "solar:alt-arrow-left", Icon: IconArrowLeft },
  { name: "IconUsers", source: "solar:users-group-rounded", Icon: IconUsers },
];
