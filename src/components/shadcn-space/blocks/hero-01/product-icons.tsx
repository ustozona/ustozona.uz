import { cn } from "@/lib/utils";

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

/** solar:widget-4-bold-duotone — Doska */
export function IconWidget({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-5", className)} aria-hidden="true">
      <g fill="currentColor">
        <path
          d="M2 6.21053C2 4.22567 2 3.23323 2.65901 2.61662C3.31802 2 4.37868 2 6.5 2C8.62132 2 9.68198 2 10.341 2.61662C11 3.23323 11 4.22567 11 6.21053V17.7895C11 19.7743 11 20.7668 10.341 21.3834C9.68198 22 8.62132 22 6.5 22C4.37868 22 3.31802 22 2.65901 21.3834C2 20.7668 2 19.7743 2 17.7895V6.21053Z"
          opacity=".5"
        />
        <path d="M13 15.4C13 13.3258 13 12.2887 13.659 11.6444C14.318 11 15.3787 11 17.5 11C19.6213 11 20.682 11 21.341 11.6444C22 12.2887 22 13.3258 22 15.4V17.6C22 19.6742 22 20.7113 21.341 21.3556C20.682 22 19.6213 22 17.5 22C15.3787 22 14.318 22 13.659 21.3556C13 20.7113 13 19.6742 13 17.6V15.4Z" />
        <path d="M13 5.5C13 4.4128 13 3.8692 13.1713 3.44041C13.3996 2.86867 13.8376 2.41443 14.389 2.17761C14.8024 2 15.3266 2 16.375 2H18.625C19.6734 2 20.1976 2 20.611 2.17761C21.1624 2.41443 21.6004 2.86867 21.8287 3.44041C22 3.8692 22 4.4128 22 5.5C22 6.5872 22 7.1308 21.8287 7.55959C21.6004 8.13133 21.1624 8.58557 20.611 8.82239C20.1976 9 19.6734 9 18.625 9H16.375C15.3266 9 14.8024 9 14.389 8.82239C13.8376 8.58557 13.3996 8.13133 13.1713 7.55959C13 7.1308 13 6.5872 13 5.5Z" />
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
