"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, X, Send } from "lucide-react";
import { IconChartSquare, IconClipboard, IconNotebook, PRODUCT_ICONS } from "./product-icons";
import Logo from "@/assets/logo/logo";
import { Button } from "@/components/ui/button";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { HEADER_NAV, TELEGRAM_URL, type HeaderNavItem } from "@/lib/landing-nav";
import { LANDING_TONES } from "@/components/landing/landing-tones";

/**
 * Header havolalari — faqat ishlayotgan mahsulotlar (`HEADER_NAV`), har
 * birida ikonka. Ikonkalar `product-icons.tsx` dagi Solar duotone
 * toʻplamidan — header, «Mahsulotlar» boʻlimi va mahsulot sahifalari
 * bir xil belgini koʻrsatadi.
 */
const NAV_ICONS: Record<HeaderNavItem["key"], typeof IconClipboard> = {
  jurnal: IconClipboard,
  baholash: IconChartSquare,
  blog: IconNotebook,
};

/**
 * Doska — roʻyxatdan oʻtmasdan ochiladigan yagona mahsulot, shuning uchun
 * menyuda alohida, oʻz rangida turadi. Kirgan odam uchun eng qisqa «sinab
 * koʻrish» yoʻli. Rang `LANDING_TONES.doska` dan — tablar, hero vazifalari
 * va ikonkalar bilan bitta manba.
 */
const DoskaIcon = PRODUCT_ICONS.doska;
const DOSKA_PILL = cn(
  "inline-flex h-10 items-center gap-2 rounded-full border border-transparent px-4 text-sm font-medium transition-colors duration-fast ease-standard",
  LANDING_TONES.doska.soft,
  LANDING_TONES.doska.hoverBorder,
);

const CollaborateButton = ({ className }: { className?: string }) => {
  const t = useTranslations("Landing.common");
  return (
    <ButtonWithIcon href="/register" size="sm" className={className}>
      {t("register")}
    </ButtonWithIcon>
  );
};

const Header = ({ className }: { className?: string }) => {
  const t = useTranslations("Landing");
  const pathname = usePathname();
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  /* Faol havola — joriy yoʻl boʻyicha (`/blog/maqola` ham «Blog»ni
     yoqsin, shuning uchun prefiks). Jurnal landing boʻlimi — langar,
     uni faol deb belgilamaymiz. */
  const activeKey = HEADER_NAV.find(
    (item) => !item.href.includes("#") && pathname.startsWith(item.href),
  )?.key;

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  /* Menyu `xl` (1280px) gacha koʻrinadi — shu chegaradan yopamiz. Ilgari
     768 edi: planshetda istalgan `resize` (manzil qatori yigʻilishi,
     klaviatura) ochiq menyuni darhol yopib qoʻyardi. */
  const handleResize = useCallback(() => {
    if (window.innerWidth >= 1280) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  return (
    <header
      className={cn(
        "inset-x-0 z-50 px-4 flex items-center justify-center sticky top-0 h-20 animate-in fade-in slide-in-from-top-4 duration-700",
        className,
      )}
    >
      <div
        className={cn(
          "w-full max-w-7xl flex items-center h-fit justify-between gap-3 lg:gap-6 transition-all duration-500",
          sticky
            ? "p-3 bg-background/60 backdrop-blur-lg border border-border/40 shadow-2xl shadow-primary/5 rounded-full"
            : "bg-transparent border-transparent",
        )}
      >
        {/* Logo */}
        <div>
          <a href="/">
            <Logo className="gap-3" />
          </a>
        </div>

        {/* Desktop — mahsulotlar. `xl` (1280px) dan: 1024px da ruscha yozuvlar
            («Оценивание», «Зарегистрироваться») bilan header sigʻmay, gorizontal
            skroll chiqardi. Undan torda — gamburger menyu. */}
        <nav aria-label={t("nav.menu")} className="max-xl:hidden flex items-center gap-1">
          {HEADER_NAV.map((item) => {
            const Icon = NAV_ICONS[item.key];
            const isActive = item.key === activeKey;
            return (
              <a
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors duration-fast ease-standard",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {t(`nav.${item.key}`)}
              </a>
            );
          })}
          <a href="/doska" className={cn(DOSKA_PILL, "ml-1")}>
            <DoskaIcon className="size-4" />
            {t("nav.doska")}
          </a>
        </nav>

        {/* Desktop CTA — landing standarti: "Kirish" xira havola (mavjud
            foydalanuvchi oʻzi topadi), asosiy tugma esa roʻyxatdan oʻtish
            (sahifaning maqsadi — yangi oʻqituvchi jalb qilish). */}
        <div className="flex items-center gap-2 lg:gap-3">
          <LanguageSwitcher className="hidden xl:inline-flex" />
          {/* Oʻquvchining kirish eshigi — telefonda ham menyuga
              yashirilmaydi: uni darsda, oʻqituvchi kodni ekranga
              chiqargan paytda qidirishadi. Telefonda qisqa yozuv: logo
              aylanuvchi soʻz bilan ~190px oladi, toʻliq yozuv hamburgerni
              ekrandan itarib chiqarardi. 360px dan tor ekranda umuman
              sigʻmaydi — u yerda hero'dagi tugma qoladi. */}
          <Button
            asChild
            variant="outline"
            className="max-[359px]:hidden rounded-full h-10 px-4 text-sm font-medium cursor-pointer"
          >
            <a href="/play" aria-label={t("nav.enterCode")}>
              <span className="sm:hidden">{t("nav.enterCodeShort")}</span>
              <span className="max-sm:hidden">{t("nav.enterCode")}</span>
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="hidden xl:flex rounded-full h-10 px-5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <a href="/login">{t("common.login")}</a>
          </Button>
          <CollaborateButton className="hidden xl:flex" />

          <div className="xl:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger">
                <span className="rounded-full border border-border p-2 block">
                  <Menu width={20} height={20} />
                  <span className="sr-only">{t("nav.menu")}</span>
                </span>
              </SheetTrigger>

              <SheetContent side="right" className="w-full sm:w-96 p-0 border-l-0">
                <div className="flex items-center justify-between p-6">
                  <a href="/">
                    <Logo className="gap-2" />
                  </a>
                  <SheetClose id="mobile-menu-close">
                    <span className="rounded-full border border-border p-3 block">
                      <X width={16} height={16} />
                    </span>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-12 px-6 pb-6 scrollbar-hover overflow-y-auto">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                    <nav className="flex flex-col items-start gap-4">
                      {HEADER_NAV.map((item) => {
                        const Icon = NAV_ICONS[item.key];
                        const isActive = item.key === activeKey;
                        return (
                          <a
                            key={item.key}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center gap-3 text-2xl font-semibold tracking-tight transition-colors",
                              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="size-6" />
                            {t(`nav.${item.key}`)}
                          </a>
                        );
                      })}
                    </nav>

                    <a href="/doska" onClick={() => setIsOpen(false)} className={cn(DOSKA_PILL, "w-fit")}>
                      <DoskaIcon className="size-4" />
                      {t("nav.doska")}
                    </a>

                    <LanguageSwitcher />

                    <div className="flex flex-col gap-3 w-fit">
                      <CollaborateButton />
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full h-10 px-5 text-sm font-medium w-fit cursor-pointer"
                      >
                        <a href="/login">{t("common.login")}</a>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-4">
                    {/* Faqat haqiqiy manzili bor kanal. Ilgari veb, email va
                        telefon ham `href="#"` bilan turardi — bosilganda
                        sahifa tepaga sakrardi xolos. */}
                    <a
                      href={TELEGRAM_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("social.telegram")}
                      className="flex w-fit items-center justify-center rounded-full outline outline-border hover:bg-muted transition p-3 shadow-xs"
                    >
                      <Send size={16} />
                    </a>

                    <p className="text-sm text-muted-foreground">© 2026 Ustozona</p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
