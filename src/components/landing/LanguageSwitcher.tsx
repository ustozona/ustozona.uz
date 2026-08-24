"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { LOCALES, LOCALE_LABELS, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Bayroqlar — `public/flags/*.svg` (circle-flags, MIT). Ular ALLAQACHON
 * doira shaklida (512×512, ichida `<mask>`), shuning uchun qirqish yoki
 * masshtablash kerak emas.
 *
 * `<img>` ATAYLAB — inline SVG emas: har bir fayl ichida `id="a"` mask bor,
 * bitta sahifada bir nechtasi inline qilinsa ID'lar toʻqnashadi va hammasi
 * birinchi mask'ka bogʻlanib qoladi.
 *
 * Lotin va kirill oʻzbekcha ayni bitta bayroqni ulashadi — ular bir tilning
 * ikki yozuvi (menyuda ajratgich chizigʻi shuni koʻrsatadi).
 */
const FLAG_FILE: Record<Locale, string> = {
  uz: "uz",
  "uz-Cyrl": "uz",
  kaa: "kaa",
  ky: "kg",
  kk: "kz",
  ru: "ru",
  en: "gb",
};

function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <img
      src={`/flags/${FLAG_FILE[locale]}.svg`}
      alt=""
      draggable={false}
      className={cn("shrink-0 rounded-full", className)}
    />
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();

  const handleLocaleSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    const next = e.currentTarget.dataset.locale as Locale | undefined;
    if (!next || next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <DropdownMenu>
      {/* 40px (size-10) — chap tomondagi nav pillining balandligiga mos
          (rounded-full bg-muted p-0.5 + item py-2 text-sm ≈ 40px). Sichqoncha
          bilan hover/ochiq holatda halqa YOʻQ — faqat fon toʻyinadi
          (bg-muted → bg-accent) va toʻliq opasiy boʻladi (GitHub/X uslubi).
          Fokus halqasi (`ring-[3px] ring-ring/50`, ui/* standart) faqat
          klaviatura navigatsiyasida chiqadi — bosishda koʻrinmaydi. */}
      <DropdownMenuTrigger
        aria-label={LOCALE_LABELS[locale]}
        className={cn(
          "group relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-muted opacity-70 outline-none transition-[opacity,background-color] hover:bg-accent hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent data-[state=open]:opacity-100",
          className,
        )}
      >
        <LocaleFlag locale={locale} className="size-[27px]" />
        <span className="absolute -right-px -bottom-px flex size-[13px] items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
          <ChevronDown className="size-2.5 transition-transform group-data-[state=open]:rotate-180" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {LOCALES.map((l) => (
          <div key={l} className="contents">
            <DropdownMenuItem data-locale={l} onClick={handleLocaleSelect} className="gap-2.5">
              <LocaleFlag locale={l} className="size-[22px]" />
              <span className={cn(l === locale && "font-medium")}>{LOCALE_LABELS[l]}</span>
              {l === locale && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            {/* Oʻzbekchaning ikki yozuvi qolgan tillardan ajratiladi. */}
            {l === "uz-Cyrl" && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
