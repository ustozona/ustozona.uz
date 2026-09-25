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

/** Keyingi — solar:alt-arrow-right-bold-duotone */
export function IconArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M12.4044 8.30273L15.8351 11.6296C16.0549 11.8428 16.0549 12.1573 15.8351 12.3704L9.20467 18.8001C8.79094 19.2013 8 18.9581 8 18.4297V12.7071L12.4044 8.30273Z"/><path d="M8 11.2929L8 5.5703C8 5.04189 8.79094 4.79869 9.20467 5.1999L11.6864 7.60648L8 11.2929Z" opacity=".5"/></g>
    </svg>
  );
}

/** Bekor qilish — solar:undo-left-round-bold-duotone */
export function IconUndo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M7.53033 3.46967C7.23744 3.17678 6.76256 3.17678 6.46967 3.46967L3.46967 6.46967C3.17678 6.76256 3.17678 7.23744 3.46967 7.53033L6.46967 10.5303C6.76256 10.8232 7.23744 10.8232 7.53033 10.5303C7.82322 10.2374 7.82322 9.76256 7.53033 9.46967L5.06066 7L7.53033 4.53033C7.82322 4.23744 7.82322 3.76256 7.53033 3.46967Z" clipRule="evenodd"/><path d="M5.81066 6.25H15C18.1756 6.25 20.75 8.82436 20.75 12C20.75 15.1756 18.1756 17.75 15 17.75H8C7.58579 17.75 7.25 17.4142 7.25 17C7.25 16.5858 7.58579 16.25 8 16.25H15C17.3472 16.25 19.25 14.3472 19.25 12C19.25 9.65279 17.3472 7.75 15 7.75H5.81066L5.06066 7L5.81066 6.25Z" opacity=".5"/></g>
    </svg>
  );
}

/** Qaytadan bajarish — solar:undo-right-round-bold-duotone */
export function IconRedo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M16.4697 3.46967C16.7626 3.17678 17.2374 3.17678 17.5303 3.46967L20.5303 6.46967C20.8232 6.76256 20.8232 7.23744 20.5303 7.53033L17.5303 10.5303C17.2374 10.8232 16.7626 10.8232 16.4697 10.5303C16.1768 10.2374 16.1768 9.76256 16.4697 9.46967L18.9393 7L16.4697 4.53033C16.1768 4.23744 16.1768 3.76256 16.4697 3.46967Z" clipRule="evenodd"/><path d="M18.1893 6.25H9.00001C5.82437 6.25 3.25 8.82436 3.25 12C3.25 15.1756 5.82436 17.75 9 17.75H16C16.4142 17.75 16.75 17.4142 16.75 17C16.75 16.5858 16.4142 16.25 16 16.25H9C6.65279 16.25 4.75 14.3472 4.75 12C4.75 9.65279 6.6528 7.75 9.00001 7.75H18.1893L18.9393 7L18.1893 6.25Z" opacity=".5"/></g>
    </svg>
  );
}

/**
 * Nusxalash — OʻZIMIZ CHIZGAN.
 *
 * Ikki varaq bir-biridan surilgan. Orqadagi massa (`opacity=".5"`),
 * oldingisi detal — u toʻliq chizilgani uchun orqadagining faqat
 * chap-yuqori «L» boʻlagi koʻrinadi. Aynan shu boʻlak «bitta emas,
 * ikkita» degan maʼnoni tashiydi.
 *
 * Surilish 5px: kamroq boʻlsa 16px da ikki varaq bitta qalin
 * toʻrtburchakka aylanadi.
 */
export function IconCopy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <rect x="3" y="3" width="13" height="13" rx="4" opacity=".5" />
        <rect x="8" y="8" width="13" height="13" rx="4" />
      </g>
    </svg>
  );
}

/**
 * Oldinga chiqarish — OʻZIMIZ CHIZGAN.
 *
 * Taxlam ustidagi varaq: ostda ikki ingichka chiziq (massa), ustida
 * toʻliq kartochka (detal). Strelka ATAYLAB yoʻq — strelka «koʻchirish»
 * yoki «yuklash» bilan chalkashadi, taxlam esa aynan qatlam tartibini
 * bildiradi.
 */
export function IconBringForward({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <rect x="4" y="14.6" width="16" height="2.6" rx="1.3" opacity=".5" />
        <rect x="4" y="19" width="16" height="2.6" rx="1.3" opacity=".5" />
        <rect x="5.5" y="2.4" width="13" height="10" rx="3" />
      </g>
    </svg>
  );
}

/* ── Chevronlar — OʻZIMIZ CHIZGAN ────────────────────────────────────

   Ikkitasi bitta geometriyadan: uzunligi 10.4, qalinligi 2.8 boʻlgan
   ikki kapsula «^» yoki «v» hosil qiladi. Chap yelka detal (toʻliq),
   oʻng yelka massa (`opacity=".5"`) — shunda ular Solar oilasidagi
   ikki qatlamli tuzilishga mos tushadi.

   ⚠️ Bittasini `rotate-180` bilan ikkinchisiga aylantirmaymiz: burilgan
   ikonada qatlamlar ham oʻrin almashadi va yorqin yelka ikki tugmada
   qarama-qarshi tomonda turib qoladi.
   ──────────────────────────────────────────────────────────────────── */

/** Panelni ochish. */
export function IconChevronUp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <rect x="3.3" y="10.1" width="10.4" height="2.8" rx="1.4" transform="rotate(-45 8.5 11.5)" />
        <rect x="10.3" y="10.1" width="10.4" height="2.8" rx="1.4" transform="rotate(45 15.5 11.5)" opacity=".5" />
      </g>
    </svg>
  );
}

/** Panelni yashirish. */
export function IconChevronDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g>
        <rect x="3.3" y="11.1" width="10.4" height="2.8" rx="1.4" transform="rotate(45 8.5 12.5)" />
        <rect x="10.3" y="11.1" width="10.4" height="2.8" rx="1.4" transform="rotate(-45 15.5 12.5)" opacity=".5" />
      </g>
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

/** Taqdimot — solar:presentation-graph uslubida (oʻzimiz, soddalashtirilgan) */
export function IconPresentation({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><rect x="3" y="3" width="18" height="13" rx="2" opacity=".5"/><path fillRule="evenodd" d="M12 15.25C12.4142 15.25 12.75 15.5858 12.75 16V18.2L15.4 20.4C15.72 20.66 15.76 21.13 15.5 21.45C15.24 21.77 14.77 21.81 14.45 21.55L12 19.52L9.55 21.55C9.23 21.81 8.76 21.77 8.5 21.45C8.24 21.13 8.28 20.66 8.6 20.4L11.25 18.2V16C11.25 15.5858 11.5858 15.25 12 15.25Z" clipRule="evenodd"/><path d="M1.25 3C1.25 2.5858 1.5858 2.25 2 2.25H22C22.4142 2.25 22.75 2.5858 22.75 3C22.75 3.4142 22.4142 3.75 22 3.75H2C1.5858 3.75 1.25 3.4142 1.25 3Z"/><path d="M8 11.5L10.5 9L12.5 10.5L16 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g>
    </svg>
  );
}

/** Sozlash — solar:tuning-2-bold-duotone */
export function IconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M9.25 14C10.9069 14 12.25 15.3431 12.25 17C12.25 18.6569 10.9069 20 9.25 20C7.59315 20 6.25 18.6569 6.25 17C6.25 15.3431 7.59315 14 9.25 14Z"/><path d="M14.25 4C12.5931 4 11.25 5.34315 11.25 7C11.25 8.65685 12.5931 10 14.25 10C15.9069 10 17.25 8.65685 17.25 7C17.25 5.34315 15.9069 4 14.25 4Z"/><g opacity=".5"><path d="M17.1658 7.7085C17.2208 7.48132 17.25 7.24405 17.25 6.99997C17.25 6.72602 17.2133 6.46064 17.1445 6.2085H21.75C22.1642 6.2085 22.5 6.54428 22.5 6.9585C22.5 7.37271 22.1642 7.7085 21.75 7.7085L17.1658 7.7085Z"/><path d="M11.3555 6.2085C11.2867 6.46064 11.25 6.72602 11.25 6.99997C11.25 7.24405 11.2791 7.48132 11.3342 7.7085L1.75 7.7085C1.33579 7.7085 1 7.37271 1 6.9585C1 6.54428 1.33579 6.2085 1.75 6.2085H11.3555Z"/><path d="M6.35551 16.2085H1.75C1.33579 16.2085 1 16.5443 1 16.9585C1 17.3727 1.33579 17.7085 1.75 17.7085H6.33416C6.27915 17.4813 6.25 17.2441 6.25 17C6.25 16.726 6.28672 16.4606 6.35551 16.2085Z"/><path d="M12.1658 17.7085H21.75C22.1642 17.7085 22.5 17.3727 22.5 16.9585C22.5 16.5443 22.1642 16.2085 21.75 16.2085H12.1445C12.2133 16.4606 12.25 16.726 12.25 17C12.25 17.2441 12.2209 17.4813 12.1658 17.7085Z"/></g></g>
    </svg>
  );
}

/** Qulflash — solar:lock-keyhole-minimalistic-bold-duotone */
export function IconLock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.75736 10 5.17157 10 8 10H16C18.8284 10 20.2426 10 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16Z" opacity=".5"/><path d="M12 13.25C12.4142 13.25 12.75 13.5858 12.75 14V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V14C11.25 13.5858 11.5858 13.25 12 13.25Z"/><path d="M12 1.25C15.7279 1.25 18.75 4.27208 18.75 8V10.0547C18.3135 10.0221 17.8174 10.0092 17.25 10.0039V8C17.25 5.10051 14.8995 2.75 12 2.75C9.10051 2.75 6.75 5.10051 6.75 8V10.0039C6.18264 10.0092 5.68651 10.0221 5.25 10.0547V8C5.25 4.27208 8.27208 1.25 12 1.25Z"/></g>
    </svg>
  );
}

/** Qulfni ochish — solar:lock-keyhole-minimalistic-unlocked-bold-duotone */
export function IconUnlock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.75736 10 5.17157 10 8 10H16C18.8284 10 20.2426 10 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16Z" opacity=".5"/><path d="M12 13.25C12.4142 13.25 12.75 13.5858 12.75 14V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V14C11.25 13.5858 11.5858 13.25 12 13.25Z"/><path d="M12 1.25C15.1463 1.25 17.7878 3.40232 18.5371 6.31348C18.6401 6.71448 18.399 7.12332 17.998 7.22656C17.5969 7.32981 17.1882 7.08766 17.085 6.68652C16.502 4.42216 14.4451 2.75 12 2.75C9.10051 2.75 6.75 5.10051 6.75 8V10.0039C6.18264 10.0092 5.68651 10.0221 5.25 10.0547V8C5.25 4.27208 8.27208 1.25 12 1.25Z"/></g>
    </svg>
  );
}

/** Markazga — solar:maximize-square-minimalistic-bold-duotone */
export function IconSpotlight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" opacity=".5"/><path fillRule="evenodd" d="M14 7.75C13.5858 7.75 13.25 7.41421 13.25 7C13.25 6.58579 13.5858 6.25 14 6.25H17C17.4142 6.25 17.75 6.58579 17.75 7V10C17.75 10.4142 17.4142 10.75 17 10.75C16.5858 10.75 16.25 10.4142 16.25 10V8.81066L14.0303 11.0303C13.7374 11.3232 13.2626 11.3232 12.9697 11.0303C12.6768 10.7374 12.6768 10.2626 12.9697 9.96967L15.1893 7.75H14ZM11.0303 12.9697C11.3232 13.2626 11.3232 13.7374 11.0303 14.0303L8.81066 16.25H10C10.4142 16.25 10.75 16.5858 10.75 17C10.75 17.4142 10.4142 17.75 10 17.75H7C6.58579 17.75 6.25 17.4142 6.25 17V14C6.25 13.5858 6.58579 13.25 7 13.25C7.41421 13.25 7.75 13.5858 7.75 14V15.1893L9.96967 12.9697C10.2626 12.6768 10.7374 12.6768 11.0303 12.9697Z" clipRule="evenodd"/></g>
    </svg>
  );
}

/** Markazdan chiqish — solar:minimize-square-minimalistic-bold-duotone */
export function IconSpotlightExit({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" opacity=".5"/><path d="M10.4999 12.7499C10.9142 12.7499 11.2499 13.0857 11.2499 13.4999V16.4999C11.2499 16.9142 10.9142 17.2499 10.4999 17.2499C10.0857 17.2499 9.74994 16.9142 9.74994 16.4999V15.3105L7.53022 17.5302C7.23732 17.8231 6.76256 17.8231 6.46967 17.5302C6.17678 17.2373 6.17678 16.7626 6.46967 16.4697L8.6894 14.2499H7.49994C7.08573 14.2499 6.74994 13.9142 6.74994 13.4999C6.74994 13.0857 7.08573 12.7499 7.49994 12.7499H10.4999Z"/><path d="M16.4697 6.46967C16.7626 6.17678 17.2373 6.17678 17.5302 6.46967C17.8231 6.76256 17.8231 7.23732 17.5302 7.53022L15.3105 9.74994H16.4999C16.9142 9.74994 17.2499 10.0857 17.2499 10.4999C17.2499 10.9142 16.9142 11.2499 16.4999 11.2499H13.4999C13.0857 11.2499 12.7499 10.9142 12.7499 10.4999V7.49994C12.7499 7.08573 13.0857 6.74994 13.4999 6.74994C13.9142 6.74994 14.2499 7.08573 14.2499 7.49994V8.6894L16.4697 6.46967Z"/></g>
    </svg>
  );
}

/** Jim (svetofor) — solar:volume-cross-bold-duotone */
export function IconQuiet({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M21.7803 3.53033C22.0732 3.23744 22.0732 2.76256 21.7803 2.46967C21.4874 2.17678 21.0126 2.17678 20.7197 2.46967L16.2705 6.91886C16.2246 6.39532 16.1646 5.93197 16.077 5.52977C15.9052 4.74135 15.6003 4.05581 14.9609 3.60646C14.7259 3.44128 14.4642 3.30809 14.1923 3.21531C13.3741 2.9361 12.5608 3.15928 11.7348 3.56055C10.9212 3.95576 9.93412 4.60663 8.70324 5.41822L8.43647 5.59411C7.98856 5.88944 7.83448 5.98815 7.67513 6.05848C7.50452 6.13378 7.3252 6.18757 7.14132 6.21862C6.96956 6.24762 6.7866 6.25003 6.25008 6.25003L6.08906 6.24998C4.87215 6.24933 4.02659 6.24889 3.27496 6.59664C2.58016 6.9181 1.91141 7.54732 1.54828 8.22128C1.15566 8.94996 1.10959 9.712 1.04409 10.7955L1.03618 10.926C1.01373 11.2943 1 11.6585 1 12C1 12.3416 1.01373 12.7058 1.03618 13.0741L1.04409 13.2045C1.10959 14.2881 1.15566 15.0501 1.54828 15.7788C1.91141 16.4527 2.58016 17.082 3.27496 17.4034C3.88551 17.6859 4.55803 17.7386 5.44121 17.7481L2.71967 20.4697C2.42678 20.7626 2.42678 21.2374 2.71967 21.5303C3.01256 21.8232 3.48744 21.8232 3.78033 21.5303L21.7803 3.53033Z"/><g opacity=".5"><path d="M16.2382 9.07225L7.61424 17.6963C8.00956 18.1712 9.02592 18.8138 9.33873 19.0002C10.3775 19.6809 11.2373 20.2249 11.9702 20.5491C12.7125 20.8775 13.4501 21.0381 14.1921 20.7849C14.464 20.6921 14.7257 20.5589 14.9607 20.3937C15.6668 19.8975 15.9657 19.1135 16.1276 18.2141C16.2868 17.3297 16.3412 16.1578 16.409 14.6979L16.4117 14.6404C16.4635 13.5254 16.4998 12.5522 16.4998 12.0002C16.4998 11.9729 16.5 11.9363 16.5002 11.8916C16.503 11.3245 16.5122 9.46272 16.2382 9.07225Z"/><path d="M20.5143 6.31657C20.8918 6.14622 21.336 6.3142 21.5063 6.69176C21.9734 7.7269 22.4998 9.45974 22.4998 12.0002C22.4998 14.1917 22.108 15.783 21.6998 16.8444C21.496 17.3742 21.2892 17.7693 21.1273 18.0392C21.0464 18.174 20.9768 18.2774 20.9246 18.3505C20.8984 18.3871 20.8767 18.4161 20.86 18.4377C20.8516 18.4485 20.8446 18.4574 20.8389 18.4645L20.8314 18.4738L20.8284 18.4774L20.8271 18.4789C20.8271 18.4789 20.826 18.4803 20.2512 18.0013L20.826 18.4803C20.5608 18.7985 20.0879 18.8415 19.7697 18.5763C19.453 18.3124 19.4089 17.8428 19.6698 17.5246L19.6733 17.5202L19.6834 17.5068C19.6888 17.4996 19.6957 17.4902 19.704 17.4787C19.7337 17.437 19.7813 17.3669 19.8411 17.2674C19.9604 17.0685 20.1286 16.7512 20.2998 16.3059C20.6416 15.4173 20.9998 14.0086 20.9998 12.0002C20.9998 9.67383 20.5192 8.15116 20.1391 7.30865C19.9687 6.93109 20.1367 6.48692 20.5143 6.31657Z"/><path d="M19.3006 9.84771C19.2164 9.44214 18.8194 9.18162 18.4138 9.26583C18.0082 9.35003 17.7477 9.74706 17.8319 10.1526C17.9204 10.5789 17.9998 11.1874 17.9998 12.0002C17.9998 12.99 17.882 13.6773 17.7733 14.1014C17.7189 14.3137 17.6665 14.461 17.6316 14.5482C17.6141 14.5918 17.601 14.6205 17.5941 14.6349L17.5891 14.6452C17.3953 15.0058 17.5266 15.4563 17.8856 15.6558C18.2477 15.8569 18.7043 15.7265 18.9054 15.3644L18.2509 15.0008C18.9054 15.3644 18.9061 15.3631 18.9061 15.3631L18.9069 15.3617L18.9086 15.3586L18.9124 15.3515L18.9221 15.3332C18.9293 15.3191 18.9382 15.3014 18.9484 15.2798C18.9689 15.2368 18.9949 15.1788 19.0243 15.1053C19.0831 14.9581 19.1557 14.7492 19.2263 14.4739C19.3676 13.923 19.4998 13.1103 19.4998 12.0002C19.4998 11.0891 19.4107 10.3782 19.3006 9.84771Z"/></g></g>
    </svg>
  );
}

/** Pichirlab (svetofor) — solar:volume-small-bold-duotone */
export function IconWhisper({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M3.00312 11.7155C3.0421 9.87326 3.06159 8.95215 3.70045 8.16363C3.81705 8.0197 3.98814 7.8487 4.13153 7.73274C4.91718 7.09741 5.95444 7.09741 8.02898 7.09741C8.77016 7.09741 9.14074 7.09741 9.49401 7.00452C9.56741 6.98522 9.64004 6.96296 9.71173 6.93781C10.0567 6.81674 10.3661 6.60837 10.985 6.19161C13.4265 4.54738 14.6473 3.72527 15.672 4.08241C15.8684 4.15088 16.0586 4.24972 16.2284 4.37162C17.1142 5.00744 17.1815 6.48675 17.3161 9.44537C17.3659 10.5409 17.3999 11.4785 17.3999 12C17.3999 12.5215 17.3659 13.4591 17.3161 14.5546C17.1815 17.5132 17.1142 18.9926 16.2284 19.6284C16.0586 19.7503 15.8684 19.8491 15.672 19.9176C14.6473 20.2747 13.4265 19.4526 10.985 17.8084C10.3661 17.3916 10.0567 17.1833 9.71173 17.0622C9.64004 17.037 9.56741 17.0148 9.49401 16.9955C9.14074 16.9026 8.77016 16.9026 8.02898 16.9026C5.95444 16.9026 4.91718 16.9026 4.13153 16.2673C3.98814 16.1513 3.81705 15.9803 3.70045 15.8364C3.06159 15.0478 3.0421 14.1267 3.00312 12.2845C3.00107 12.1878 3 12.0928 3 12C3 11.9072 3.00107 11.8122 3.00312 11.7155Z"/><path fillRule="evenodd" d="M19.4505 8.41592C19.7981 8.21868 20.2365 8.34659 20.4296 8.70163L19.8002 9.05876C20.4296 8.70163 20.4296 8.70163 20.4296 8.70163L20.4303 8.70291L20.431 8.70428L20.4326 8.70727L20.4363 8.71425L20.4456 8.73224C20.4525 8.74604 20.4611 8.76345 20.4709 8.78454C20.4906 8.82672 20.5155 8.88359 20.5437 8.95571C20.6002 9.1 20.6699 9.30487 20.7376 9.57473C20.8733 10.1149 21.0002 10.9118 21.0002 12.0003C21.0002 13.0888 20.8733 13.8857 20.7376 14.4259C20.6699 14.6958 20.6002 14.9006 20.5437 15.0449C20.5155 15.117 20.4906 15.1739 20.4709 15.2161C20.4611 15.2372 20.4525 15.2546 20.4456 15.2684L20.4363 15.2864L20.4326 15.2934L20.431 15.2963L20.4303 15.2977C20.4303 15.2977 20.4296 15.299 19.8002 14.9419L20.4296 15.299C20.2365 15.654 19.7981 15.782 19.4505 15.5847C19.1059 15.3891 18.9798 14.9474 19.166 14.5938L19.1708 14.5838C19.1774 14.5696 19.1899 14.5415 19.2067 14.4987C19.2402 14.4132 19.2905 14.2687 19.3428 14.0606C19.4472 13.6448 19.5602 12.9709 19.5602 12.0003C19.5602 11.0297 19.4472 10.3558 19.3428 9.94003C19.2905 9.73189 19.2402 9.58745 19.2067 9.50194C19.1899 9.45915 19.1774 9.43099 19.1708 9.41687L19.166 9.40684C18.9798 9.05328 19.1059 8.61149 19.4505 8.41592Z" clipRule="evenodd" opacity=".5"/></g>
    </svg>
  );
}

/** Gaplashamiz (svetofor) — solar:chat-round-dots-bold-duotone */
export function IconTalk({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1C5.92487 1 1 5.92487 1 12C1 13.7596 1.41318 15.4228 2.14781 16.8977C2.34303 17.2897 2.40801 17.7377 2.29483 18.1607L1.63966 20.6093C1.35525 21.6723 2.32772 22.6447 3.39068 22.3603L5.83932 21.7052C6.26233 21.592 6.71033 21.657 7.10228 21.8522C8.5772 22.5868 10.2404 23 12 23Z" opacity=".5"/><path d="M10.9 12.0004C10.9 12.6079 11.3925 13.1004 12 13.1004C12.6075 13.1004 13.1 12.6079 13.1 12.0004C13.1 11.3929 12.6075 10.9004 12 10.9004C11.3925 10.9004 10.9 11.3929 10.9 12.0004Z"/><path d="M6.5 12.0004C6.5 12.6079 6.99249 13.1004 7.6 13.1004C8.20751 13.1004 8.7 12.6079 8.7 12.0004C8.7 11.3929 8.20751 10.9004 7.6 10.9004C6.99249 10.9004 6.5 11.3929 6.5 12.0004Z"/><path d="M15.3 12.0004C15.3 12.6079 15.7925 13.1004 16.4 13.1004C17.0075 13.1004 17.5 12.6079 17.5 12.0004C17.5 11.3929 17.0075 10.9004 16.4 10.9004C15.7925 10.9004 15.3 11.3929 15.3 12.0004Z"/></g>
    </svg>
  );
}

/** Boshlash — solar:play-bold-duotone */
export function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M23 12C23 10.9648 22.4695 9.92953 21.4086 9.35258L8.59661 2.38548C6.53435 1.26402 4 2.72368 4 5.0329L4 12H23Z" clipRule="evenodd"/><path d="M8.59662 21.6145L21.4086 14.6474C22.4695 14.0705 23 13.0352 23 12H4L4 18.9671C4 21.2763 6.53435 22.736 8.59662 21.6145Z" opacity=".5"/></g>
    </svg>
  );
}

/** Toʻxtatish — solar:pause-bold-duotone */
export function IconPause({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M2 6C2 4.11438 2 3.17157 2.58579 2.58579C3.17157 2 4.11438 2 6 2C7.88562 2 8.82843 2 9.41421 2.58579C10 3.17157 10 4.11438 10 6V18C10 19.8856 10 20.8284 9.41421 21.4142C8.82843 22 7.88562 22 6 22C4.11438 22 3.17157 22 2.58579 21.4142C2 20.8284 2 19.8856 2 18V6Z"/><path d="M14 6C14 4.11438 14 3.17157 14.5858 2.58579C15.1716 2 16.1144 2 18 2C19.8856 2 20.8284 2 21.4142 2.58579C22 3.17157 22 4.11438 22 6V18C22 19.8856 22 20.8284 21.4142 21.4142C20.8284 22 19.8856 22 18 22C16.1144 22 15.1716 22 14.5858 21.4142C14 20.8284 14 19.8856 14 18V6Z" opacity=".5"/></g>
    </svg>
  );
}

/** Qaytadan — solar:restart-bold-duotone */
export function IconRestart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M6.87348 7.87338C9.01606 5.7308 12.1674 5.20902 14.8007 6.31041L15.9309 5.18019C12.6515 3.53111 8.55119 4.07435 5.81282 6.81272C2.39573 10.2298 2.39573 15.77 5.81282 19.1871C9.2299 22.6042 14.7701 22.6042 18.1872 19.1871C20.1746 17.1997 21.0057 14.4933 20.6819 11.9072C20.6304 11.4962 20.2555 11.2048 19.8445 11.2562C19.4335 11.3077 19.142 11.6826 19.1935 12.0936C19.4622 14.24 18.7727 16.4802 17.1265 18.1264C14.2952 20.9577 9.70478 20.9577 6.87348 18.1264C4.04217 15.2951 4.04217 10.7047 6.87348 7.87338Z" clipRule="evenodd" opacity=".5"/><path d="M18.7212 4.20119C18.7212 3.89785 18.5384 3.62437 18.2582 3.50828C17.9779 3.3922 17.6553 3.45637 17.4408 3.67086L15.9314 5.18028L14.8012 6.3105L13.1982 7.9135C12.9837 8.128 12.9195 8.45059 13.0356 8.73085C13.1517 9.0111 13.4252 9.19383 13.7285 9.19383H17.9712C18.3854 9.19383 18.7212 8.85805 18.7212 8.44383V4.20119Z"/></g>
    </svg>
  );
}

/** Qoʻngʻiroq — solar:bell-bold-duotone */
export function IconBell({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M18.7491 9V9.7041C18.7491 10.5491 18.9903 11.3752 19.4422 12.0782L20.5496 13.8012C21.5612 15.3749 20.789 17.5139 19.0296 18.0116C14.4273 19.3134 9.57274 19.3134 4.97036 18.0116C3.21105 17.5139 2.43882 15.3749 3.45036 13.8012L4.5578 12.0782C5.00972 11.3752 5.25087 10.5491 5.25087 9.7041V9C5.25087 5.13401 8.27256 2 12 2C15.7274 2 18.7491 5.13401 18.7491 9Z" opacity=".5"/><path d="M7.24316 18.5454C7.8941 20.5506 9.77767 22.0002 11.9998 22.0002C14.222 22.0002 16.1055 20.5506 16.7565 18.5454C13.611 19.1357 10.3886 19.1357 7.24316 18.5454Z"/></g>
    </svg>
  );
}

/** Ekranni yopish — solar:eye-closed-bold-duotone */
export function IconCurtain({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path fillRule="evenodd" d="M2.91858 6.60465C2.70062 6.09784 2.11327 5.86324 1.60603 6.08063C1.0984 6.29818 0.863613 6.8869 1.08117 7.39453L1.0816 7.39553L1.08267 7.39802L1.08566 7.4049L1.09505 7.42618C1.10282 7.44366 1.11363 7.46765 1.12752 7.49772C1.15529 7.55783 1.19539 7.64235 1.2481 7.74777C1.35345 7.95845 1.5096 8.25357 1.71879 8.605C2.12772 9.29201 2.74529 10.2043 3.59029 11.1241L2.79285 11.9215C2.40232 12.312 2.40232 12.9452 2.79285 13.3357C3.18337 13.7262 3.81654 13.7262 4.20706 13.3357L5.04746 12.4953C5.61245 12.9515 6.24405 13.3814 6.94417 13.7519L6.16177 14.9544C5.86056 15.4173 5.99165 16.0367 6.45457 16.338C6.91748 16.6392 7.53693 16.5081 7.83814 16.0452L8.82334 14.531C9.50014 14.7386 10.2253 14.8864 11 14.9556V16.4998C11 17.0521 11.4477 17.4998 12 17.4998V12.9998C9.25227 12.9998 7.18102 11.8012 5.69633 10.4109C5.68823 10.4031 5.68003 10.3954 5.67173 10.3878C5.47324 10.2009 5.28532 10.0105 5.10775 9.81932C4.35439 9.00801 3.80137 8.19355 3.43737 7.58204C3.25594 7.27722 3.12302 7.02546 3.03696 6.85334C2.99397 6.76735 2.96278 6.70147 2.94319 6.65905C2.93339 6.63785 2.92651 6.62253 2.9225 6.61352L2.91858 6.60465ZM1.08117 7.39453L1.99995 6.99977C1.08081 7.39369 1.08117 7.39453 1.08117 7.39453Z" clipRule="evenodd"/><path d="M15.2209 12.3984C14.2784 12.7694 13.209 13.0002 12 13.0002V17.5002C12.5523 17.5002 13 17.0525 13 16.5002V14.9559C13.772 14.8867 14.4974 14.7392 15.1764 14.5311L16.1618 16.0456C16.463 16.5085 17.0825 16.6396 17.5454 16.3384C18.0083 16.0372 18.1394 15.4177 17.8382 14.9548L17.0558 13.7524C17.757 13.3816 18.3885 12.9517 18.9527 12.496L19.7929 13.3361C20.1834 13.7267 20.8166 13.7267 21.2071 13.3361C21.5976 12.9456 21.5976 12.3124 21.2071 11.9219L20.4097 11.1245C21.1521 10.3164 21.7181 9.51502 22.1207 8.86887C22.384 8.44627 22.5799 8.08609 22.7116 7.82793C22.7775 7.69874 22.8274 7.59476 22.8619 7.5209C22.8791 7.48397 22.8924 7.45453 22.902 7.4332L22.9134 7.40736L22.917 7.39913L22.9191 7.39411C23.1367 6.88648 22.9015 6.2986 22.3939 6.08105C21.8864 5.86355 21.2985 6.09892 21.0809 6.60627L21.0759 6.61747C21.0706 6.62926 21.0617 6.6489 21.0492 6.6758C21.0241 6.72962 20.9844 6.81235 20.9299 6.91928C20.8207 7.13337 20.6526 7.4431 20.4233 7.81119C19.9628 8.55023 19.2652 9.50857 18.3156 10.3999C17.4746 11.1893 16.4469 11.9158 15.2209 12.3984Z" opacity=".5"/></g>
    </svg>
  );
}

/** Yopish — solar:close-circle-bold-duotone */
export function IconClose({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" opacity=".5"/><path d="M8.96967 8.96967C9.26256 8.67678 9.73744 8.67678 10.0303 8.96967L12 10.9394L13.9697 8.96969C14.2626 8.6768 14.7374 8.6768 15.0303 8.96969C15.3232 9.26258 15.3232 9.73746 15.0303 10.0304L13.0607 12L15.0303 13.9696C15.3232 14.2625 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2625 15.3232 13.9696 15.0303L12 13.0607L10.0304 15.0303C9.73746 15.3232 9.26258 15.3232 8.96969 15.0303C8.6768 14.7374 8.6768 14.2626 8.96969 13.9697L10.9394 12L8.96967 10.0303C8.67678 9.73744 8.67678 9.26256 8.96967 8.96967Z"/></g>
    </svg>
  );
}

/** Gʻildirak — solar:wheel-bold-duotone (`<g fill>` olib tashlangan) */
export function IconWheel({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("doska-icon", className)} aria-hidden="true">
      <g><g opacity=".5"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"/><path fillRule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" clipRule="evenodd"/></g><path d="M9.67217 17.5313L11.1967 14.8908C10.7001 14.7531 10.2553 14.491 9.89804 14.1401L8.37377 16.7802C8.77077 17.0818 9.2065 17.3351 9.67217 17.5313Z"/><path d="M6.0464 12.7494H9.09446C9.0328 12.5097 9 12.2585 9 11.9996C9 11.7405 9.03283 11.4891 9.09456 11.2494H6.04644C6.01579 11.4951 6 11.7455 6 11.9996C6 12.2535 6.01577 12.5037 6.0464 12.7494Z"/><path d="M8.37388 7.21886L9.89814 9.85896C10.2555 9.50807 10.7003 9.24594 11.1968 9.1083L9.6723 6.4678C9.20662 6.66399 8.77089 6.91726 8.37388 7.21886Z"/><path d="M12.8031 9.10828L14.3276 6.46777C14.7933 6.66396 15.2291 6.91723 15.6261 7.21882L14.1018 9.85892C13.7445 9.50803 13.2997 9.24592 12.8031 9.10828Z"/><path d="M14.9055 12.7494C14.9672 12.5097 15 12.2585 15 11.9996C15 11.7405 14.9672 11.4891 14.9054 11.2494H17.9536C17.9842 11.4951 18 11.7455 18 11.9996C18 12.2535 17.9842 12.5037 17.9536 12.7494H14.9055Z"/><path d="M12.8034 14.8908C13.3 14.7531 13.7447 14.4909 14.102 14.14L15.6263 16.7801C15.2293 17.0818 14.7936 17.335 14.3279 17.5313L12.8034 14.8908Z"/></g>
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
  { name: "IconPresentation", source: "oʻzimiz:taqdimot", Icon: IconPresentation },
  { name: "IconWheel", source: "solar:wheel", Icon: IconWheel },
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
  { name: "IconCopy", source: "oʻzimiz:nusxalash", Icon: IconCopy },
  { name: "IconBringForward", source: "oʻzimiz:oldinga", Icon: IconBringForward },
  { name: "IconChevronUp", source: "oʻzimiz:chevron-yuqori", Icon: IconChevronUp },
  { name: "IconChevronDown", source: "oʻzimiz:chevron-past", Icon: IconChevronDown },
  { name: "IconArrowRight", source: "solar:alt-arrow-right", Icon: IconArrowRight },
  { name: "IconUndo", source: "solar:undo-left-round", Icon: IconUndo },
  { name: "IconRedo", source: "solar:undo-right-round", Icon: IconRedo },
  { name: "IconSettings", source: "solar:tuning-2", Icon: IconSettings },
  { name: "IconLock", source: "solar:lock-keyhole-minimalistic", Icon: IconLock },
  { name: "IconUnlock", source: "solar:lock-keyhole-minimalistic-unlocked", Icon: IconUnlock },
  { name: "IconSpotlight", source: "solar:maximize-square-minimalistic", Icon: IconSpotlight },
  { name: "IconSpotlightExit", source: "solar:minimize-square-minimalistic", Icon: IconSpotlightExit },
  { name: "IconQuiet", source: "solar:volume-cross", Icon: IconQuiet },
  { name: "IconWhisper", source: "solar:volume-small", Icon: IconWhisper },
  { name: "IconTalk", source: "solar:chat-round-dots", Icon: IconTalk },
  { name: "IconPlay", source: "solar:play", Icon: IconPlay },
  { name: "IconPause", source: "solar:pause", Icon: IconPause },
  { name: "IconRestart", source: "solar:restart", Icon: IconRestart },
  { name: "IconBell", source: "solar:bell", Icon: IconBell },
  { name: "IconCurtain", source: "solar:eye-closed", Icon: IconCurtain },
  { name: "IconClose", source: "solar:close-circle", Icon: IconClose },
];
