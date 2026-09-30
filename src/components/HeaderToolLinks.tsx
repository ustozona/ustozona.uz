"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Gamepad2, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/* Doska va Oʻyinlar — headerdagi ikkita yozuvli kirish tugmasi.

   Yozuv ATAYLAB koʻrinib turadi (`lg+`): yangi kirish nuqtasi ikonadan
   yolgʻiz tanilmaydi. `md–lg` oraligʻida faqat ikona, nom esa `sr-only`da
   qoladi — ekran oʻqigich va `title` uchun. Telefonda (`< md`) butunlay
   yashirin: u yerda header allaqachon toʻla, Oʻyinlar esa yon panelda.

   Doska — `/dashboard` dan TASHQARIDAGI alohida mahsulot (toʻliq ekran),
   shuning uchun yangi tabda ochiladi: dashboard holati (fokus taymeri,
   bildirishnomalar) joyida qoladi. Oʻyinlar dashboard ICHIDA ochiladi,
   shu sabab oddiy `Link`. */
export default function HeaderToolLinks() {
  const t = useTranslations("Header");

  return (
    <div className="hidden items-center gap-1 md:flex">
      <Button variant="outline" size="sm" asChild>
        <a href="/doska" target="_blank" rel="noopener" title={t("doska")}>
          <Presentation className="text-muted-foreground" />
          <span className="sr-only lg:not-sr-only">{t("doska")}</span>
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/games" title={t("games")}>
          <Gamepad2 className="text-muted-foreground" />
          <span className="sr-only lg:not-sr-only">{t("games")}</span>
        </Link>
      </Button>
      <Separator orientation="vertical" className="mx-1 !h-6" />
    </div>
  );
}
