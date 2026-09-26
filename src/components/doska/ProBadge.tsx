"use client";

import { useTranslations } from "next-intl";

/**
 * Pro belgisi — sariq doira ichida yulduzcha. Pullik band OʻCHIRILMAYDI,
 * yonida shu belgi turadi va bosilganda taklif ochiladi (Doska biznes
 * modeli, `DoskaMenu` sarlavhasi).
 *
 * Rang mavjud `--warning` tokenidan; yangi rang kiritilmaydi. Menyu ham,
 * gʻildirak ham shu bitta komponentni ishlatadi.
 */
export function ProBadge() {
  const t = useTranslations("Doska.bar");
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" role="img" aria-label={t("proFeature")}>
      <rect width="20" height="20" rx="10" fill="var(--warning)" />
      <path
        fill="#fff"
        d="m11.504 11.77-1.082 2.936a.45.45 0 0 1-.844 0L8.496 11.77a.45.45 0 0 0-.266-.267l-2.935-1.082a.45.45 0 0 1 0-.844L8.23 8.496a.45.45 0 0 0 .266-.266l1.082-2.935a.45.45 0 0 1 .844 0l1.082 2.935a.45.45 0 0 0 .267.266l2.934 1.082a.45.45 0 0 1 0 .844l-2.934 1.082a.45.45 0 0 0-.267.267Z"
      />
    </svg>
  );
}
