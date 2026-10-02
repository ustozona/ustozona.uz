"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  PRODUCT_ICONS,
  PRODUCT_ICON_STYLE,
} from "@/components/shadcn-space/blocks/hero-01/product-icons";

/* Doska, Oʻyinlar va Blog — headerdagi yozuvli kirish tugmalari.

   Rang va ikona — mahsulotning OʻZ manbasidan: landing menyusi bilan bir
   xil (`PRODUCT_ICON_STYLE` tus, `PRODUCT_ICONS` Solar duotone). Yangi
   token yoki ikona yoʻq; mahsulot rangi oʻzgarsa, header ham ergashadi.
   Hover — faqat fon bir pogʻona toʻyinadi (bitta hover-harakat).

   Yozuv ATAYLAB koʻrinib turadi (`lg+`): yangi kirish nuqtasi ikonadan
   yolgʻiz tanilmaydi. `md–lg` oraligʻida faqat ikona, nom esa `sr-only`da
   qoladi — ekran oʻqigich va `title` uchun. Telefonda (`< md`) butunlay
   yashirin: u yerda header allaqachon toʻla, Oʻyinlar esa yon panelda.

   Doska — `/dashboard` dan TASHQARIDAGI alohida mahsulot (toʻliq ekran),
   shuning uchun yangi tabda ochiladi: dashboard holati (fokus taymeri,
   bildirishnomalar) joyida qoladi. Oʻyinlar dashboard ICHIDA ochiladi,
   shu sabab oddiy `Link`. Blog ham alohida mahsulot (/dashboard'dan
   tashqarida, ochiq sahifa), lekin oddiy oʻqish sahifasi — avval yon
   panelda ham shunday, shu tabda ochilardi.

   ⚠️ Hover klasslari toʻliq yozilgan (`hover:bg-emerald-200`), birlashtirib
   yasalmagan: Tailwind dinamik nomlarni koʻrmaydi. Ular `ghost`
   variantining `hover:bg-accent` / `hover:text-accent-foreground` ini
   bosib ketadi. */
const HOVER = {
  doska:
    "hover:bg-emerald-200 hover:text-emerald-700 active:bg-emerald-300 dark:hover:bg-emerald-500/25 dark:hover:text-emerald-400 dark:active:bg-emerald-500/35",
  games:
    "hover:bg-orange-200 hover:text-orange-700 active:bg-orange-300 dark:hover:bg-orange-500/25 dark:hover:text-orange-400 dark:active:bg-orange-500/35",
  blog:
    "hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300 dark:hover:bg-slate-500/25 dark:hover:text-slate-200 dark:active:bg-slate-500/35",
} as const;

export default function HeaderToolLinks() {
  const t = useTranslations("Header");
  const DoskaIcon = PRODUCT_ICONS.doska;
  const GamesIcon = PRODUCT_ICONS.games;
  const BlogIcon = PRODUCT_ICONS.blog;

  return (
    <div className="hidden items-center gap-1 md:flex">
      <Button
        variant="ghost"
        size="sm"
        className={cn(PRODUCT_ICON_STYLE.doska, HOVER.doska)}
        asChild
      >
        <a href="/doska" target="_blank" rel="noopener" title={t("doska")}>
          <DoskaIcon className="size-4" />
          <span className="sr-only lg:not-sr-only">{t("doska")}</span>
        </a>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(PRODUCT_ICON_STYLE.games, HOVER.games)}
        asChild
      >
        <Link href="/dashboard/games" title={t("games")}>
          <GamesIcon className="size-4" />
          <span className="sr-only lg:not-sr-only">{t("games")}</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(PRODUCT_ICON_STYLE.blog, HOVER.blog)}
        asChild
      >
        <Link href="/blog" title={t("blog")}>
          <BlogIcon className="size-4" />
          <span className="sr-only lg:not-sr-only">{t("blog")}</span>
        </Link>
      </Button>
      <Separator orientation="vertical" className="mx-1 !h-6" />
    </div>
  );
}
