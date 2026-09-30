import { cn } from "@/lib/utils";
import type { Product } from "@/lib/landing-nav";

/* ════════════════════════════════════════════════════════════════════
   HEADER "OSTLOYIHALAR" DROPDOWN IKONALARI — Solar bold-duotone.

   Nega paket emas, inline SVG: `@iconify/react` ikonalarni runtime'da
   api.iconify.design'dan yuklaydi (prodda tashqi soʻrov), offline paket
   esa 1305+ ikonani olib keladi — bizga 4 tasi kerak (xuddi
   `src/components/doska/icons.tsx` naqshi).

   Duotone = ikki rang emas, bitta `currentColor` + `opacity` qatlam —
   fon toʻqligiga, tanlangan tusga va temaga oʻzi moslashadi.
   ════════════════════════════════════════════════════════════════════ */

type IconProps = { className?: string };

/** solar:clipboard-list-bold-duotone — Ustozona (asosiy: jurnal, davomat) */
export function IconClipboard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          d="M8.44 3.007C8.16 3.309 8 3.75 8 4.632c0 .881.16 1.322.44 1.624.28.302.69.474 1.51.474h4.1c.82 0 1.23-.172 1.51-.474.28-.302.44-.743.44-1.624 0-.882-.16-1.323-.44-1.625-.28-.302-.69-.474-1.51-.474h-4.1c-.82 0-1.23.172-1.51.474Z"
        />
        <path
          d="M6.5 4.038c-.464.007-.86.03-1.201.104a3.25 3.25 0 0 0-2.457 2.457C2.75 7.354 2.75 8.243 2.75 9.5v7c0 1.257 0 2.146.092 2.901a3.25 3.25 0 0 0 2.457 2.457c.755.092 1.644.092 2.901.092h7.6c1.257 0 2.146 0 2.901-.092a3.25 3.25 0 0 0 2.457-2.457c.092-.755.092-1.644.092-2.901v-7c0-1.257 0-2.146-.092-2.901a3.25 3.25 0 0 0-2.457-2.457c-.34-.074-.737-.097-1.201-.104.001.033.001.066.001.099 0 .95-.14 1.887-.83 2.632-.72.776-1.75 1.001-2.842 1.001h-4.1c-1.092 0-2.122-.225-2.842-1.001-.69-.745-.83-1.681-.83-2.632 0-.033 0-.066.001-.099Z"
          opacity=".5"
        />
        <path d="M7.25 11c0-.414.336-.75.75-.75h.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75Zm4 0c0-.414.336-.75.75-.75h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Zm-4 4c0-.414.336-.75.75-.75h.5a.75.75 0 0 1 0 1.5H8a.75.75 0 0 1-.75-.75Zm4 0c0-.414.336-.75.75-.75h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1-.75-.75Z" />
      </g>
    </svg>
  );
}

/** solar:notebook-bold-duotone — Blog */
export function IconNotebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          d="M6 3.25C4.48122 3.25 3.25 4.48122 3.25 6V18C3.25 19.5188 4.48122 20.75 6 20.75H18C19.5188 20.75 20.75 19.5188 20.75 18V6C20.75 4.48122 19.5188 3.25 18 3.25H6Z"
          opacity=".5"
        />
        <path d="M8.25 2.5C8.25 2.08579 7.91421 1.75 7.5 1.75C7.08579 1.75 6.75 2.08579 6.75 2.5V5.5C6.75 5.91421 7.08579 6.25 7.5 6.25C7.91421 6.25 8.25 5.91421 8.25 5.5V2.5Z" />
        <path d="M8 9.25C7.58579 9.25 7.25 9.58579 7.25 10C7.25 10.4142 7.58579 10.75 8 10.75H16C16.4142 10.75 16.75 10.4142 16.75 10C16.75 9.58579 16.4142 9.25 16 9.25H8Z" />
        <path d="M8 13.25C7.58579 13.25 7.25 13.5858 7.25 14C7.25 14.4142 7.58579 14.75 8 14.75H13C13.4142 14.75 13.75 14.4142 13.75 14C13.75 13.5858 13.4142 13.25 13 13.25H8Z" />
        <path d="M17.25 2.5C17.25 2.08579 16.9142 1.75 16.5 1.75C16.0858 1.75 15.75 2.08579 15.75 2.5V5.5C15.75 5.91421 16.0858 6.25 16.5 6.25C16.9142 6.25 17.25 5.91421 17.25 5.5V2.5Z" />
      </g>
    </svg>
  );
}

/** solar:chart-square-bold-duotone — Baholash */
export function IconChartSquare({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          d="M12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22Z"
          opacity=".5"
        />
        <path d="M12 5.25C12.4142 5.25 12.75 5.58579 12.75 6V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V6C11.25 5.58579 11.5858 5.25 12 5.25Z" />
        <path d="M7 8.25C7.41421 8.25 7.75 8.58579 7.75 9V18C7.75 18.4142 7.41421 18.75 7 18.75C6.58579 18.75 6.25 18.4142 6.25 18V9C6.25 8.58579 6.58579 8.25 7 8.25Z" />
        <path d="M17 12.25C17.4142 12.25 17.75 12.5858 17.75 13V18C17.75 18.4142 17.4142 18.75 17 18.75C16.5858 18.75 16.25 18.4142 16.25 18V13C16.25 12.5858 16.5858 12.25 17 12.25Z" />
      </g>
    </svg>
  );
}

/** Gamepad (duotone, shu toʻplam uslubida) — Ustozona-Games */
export function IconGamepad({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          d="M7.5 5.5h9c3.04 0 5.5 2.46 5.5 5.5v2.2c0 2.93-2.37 5.3-5.3 5.3-1.5 0-2.92-.64-3.93-1.75l-.27-.3a.66.66 0 0 0-.98 0l-.27.3A5.3 5.3 0 0 1 7.3 18.5C4.37 18.5 2 16.13 2 13.2V11c0-3.04 2.46-5.5 5.5-5.5Z"
          opacity=".5"
        />
        <path d="M7.5 9.25c.41 0 .75.34.75.75v1.25H9.5a.75.75 0 0 1 0 1.5H8.25V14a.75.75 0 0 1-1.5 0v-1.25H5.5a.75.75 0 0 1 0-1.5h1.25V10c0-.41.34-.75.75-.75Z" />
        <circle cx="16" cy="10.75" r="1.25" />
        <circle cx="18" cy="13.75" r="1.25" />
      </g>
    </svg>
  );
}

/** solar:presentation-graph-bold-duotone — Doska (doska tayanchda) */
export function IconBoard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          d="M4 10.5V2.75H20V10.5C20 13.5641 20 15.0962 18.9958 16.0481C17.9916 17 16.3753 17 13.1429 17H12.75H11.25H10.8571C7.62465 17 6.00841 17 5.00421 16.0481C4 15.0962 4 13.5641 4 10.5Z"
          opacity=".5"
        />
        <path d="M12.75 17V20.5361L14.3359 21.3291C14.7061 21.5144 14.8558 21.9646 14.6709 22.335C14.4857 22.7054 14.0355 22.8559 13.665 22.6709L12 21.8389L10.3359 22.6709C9.96545 22.8561 9.51434 22.7054 9.3291 22.335C9.14421 21.9646 9.29471 21.5143 9.66504 21.3291L11.25 20.5361V17H12.75Z" />
        <path d="M14.4697 7.96973C14.7626 7.67683 15.2374 7.67683 15.5303 7.96973C15.8232 8.26262 15.8232 8.73738 15.5303 9.03027L14.2129 10.3477C14.0679 10.4927 13.9109 10.6491 13.7607 10.7637C13.5848 10.8979 13.3335 11.043 13 11.043C12.6668 11.043 12.4152 10.8988 12.2393 10.7646C12.0891 10.6501 11.9321 10.4927 11.7871 10.3477L11.1768 9.7373C11.1068 9.66733 11.0499 9.61078 11 9.5625C10.9501 9.61078 10.8932 9.66733 10.8232 9.7373L9.53027 11.0303C9.23738 11.3232 8.76262 11.3232 8.46973 11.0303C8.17683 10.7374 8.17683 10.2626 8.46973 9.96973L9.78711 8.65234C9.93205 8.50729 10.0891 8.35088 10.2393 8.23633C10.4152 8.1021 10.6665 7.95703 11 7.95703C11.3335 7.95703 11.5848 8.1021 11.7607 8.23633C11.9109 8.35088 12.0679 8.50729 12.2129 8.65234L12.8232 9.2627C12.8932 9.33267 12.9501 9.38922 13 9.4375C13.0499 9.38922 13.1068 9.33267 13.1768 9.2627L14.4697 7.96973Z" />
        <path d="M22 1.25C22.4142 1.25 22.75 1.58579 22.75 2C22.75 2.41421 22.4142 2.75 22 2.75H2C1.58579 2.75 1.25 2.41421 1.25 2C1.25 1.58579 1.58579 1.25 2 1.25H22Z" />
      </g>
    </svg>
  );
}

/** solar:users-group-rounded-bold-duotone — Shogird */
export function IconUsersGroup({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <circle cx="15" cy="6" r="3" opacity=".5" />
        <ellipse cx="16" cy="17" opacity=".5" rx="5" ry="3" />
        <circle cx="9.001" cy="6" r="4" />
        <ellipse cx="9.001" cy="17.001" rx="7" ry="4" />
      </g>
    </svg>
  );
}

/** solar:buildings-bold-duotone — Boshqaruv */
export function IconBuildings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7 5H11C12.8856 5 13.8284 5 14.4142 5.58579C15 6.17157 15 7.11438 15 9V21.25H16.5H21H22C22.4142 21.25 22.75 21.5858 22.75 22C22.75 22.4142 22.4142 22.75 22 22.75H2C1.58579 22.75 1.25 22.4142 1.25 22C1.25 21.5858 1.58579 21.25 2 21.25H3V9C3 7.11438 3 6.17157 3.58579 5.58579C4.17157 5 5.11438 5 7 5ZM5.25 8C5.25 7.58579 5.58579 7.25 6 7.25H12C12.4142 7.25 12.75 7.58579 12.75 8C12.75 8.41421 12.4142 8.75 12 8.75H6C5.58579 8.75 5.25 8.41421 5.25 8ZM5.25 11C5.25 10.5858 5.58579 10.25 6 10.25H12C12.4142 10.25 12.75 10.5858 12.75 11C12.75 11.4142 12.4142 11.75 12 11.75H6C5.58579 11.75 5.25 11.4142 5.25 11ZM5.25 14C5.25 13.5858 5.58579 13.25 6 13.25H12C12.4142 13.25 12.75 13.5858 12.75 14C12.75 14.4142 12.4142 14.75 12 14.75H6C5.58579 14.75 5.25 14.4142 5.25 14ZM9 18.25C9.41421 18.25 9.75 18.5858 9.75 19V21.25H8.25V19C8.25 18.5858 8.58579 18.25 9 18.25Z"
        />
        <path
          opacity=".5"
          d="M15 2H17C18.8856 2 19.8284 2 20.4142 2.58579C21 3.17157 21 4.11438 21 6V21.25H15V9C15 7.11438 15 6.17157 14.4142 5.58579C13.8416 5.01319 12.9279 5.0003 11.126 5.00001V3.49999C11.2103 3.11275 11.351 2.82059 11.5858 2.58579C12.1715 2 13.1144 2 15 2Z"
        />
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   OST-LOYIHA IKONA + RANG XARITASI — YAGONA manba.

   Header dropdown (`hero-01/header.tsx`) ham, "Mahsulotlar" boʻlimi
   (`landing/ProductsSection.tsx`) ham shu yerdan oʻqiydi. Ilgari header
   ichida yozilgan edi va boʻlim bilan ikki xil boʻlish xavfi bor edi.

   Rang: bitta tus + ikki shaffoflik (ochiq fon / toʻq matn) —
   [[ikona-ranglash-ierarxik]] naqshi.
   ════════════════════════════════════════════════════════════════════ */

export const PRODUCT_ICONS: Record<Product["slug"], typeof IconChartSquare> = {
  blog: IconNotebook,
  games: IconGamepad,
  baholash: IconChartSquare,
  doska: IconBoard,
  shogird: IconUsersGroup,
  boshqaruv: IconBuildings,
};

export const PRODUCT_ICON_STYLE: Record<Product["slug"], string> = {
  blog: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  games: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  baholash: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  doska: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  shogird: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  boshqaruv: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};
