"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Menu, X, Globe, Send, Mail, Phone, ArrowRight } from 'lucide-react';
import { IconChartSquare, IconWidget, IconUsersGroup, IconBuildings } from "./product-icons";
import Logo from "@/assets/logo/logo";
import { Button } from "@/components/ui/button";
import ButtonWithIcon from "@/components/shadcn-space/button/button-01";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";
import { PRODUCTS, type NavItem } from "@/lib/landing-nav";

/** Header dropdown'dagi tile ikonalari — `PRODUCTS` bilan slug orqali bogʻlanadi (indeks emas). */
const PRODUCT_ICONS: Record<(typeof PRODUCTS)[number]["slug"], typeof IconChartSquare> = {
  baholash: IconChartSquare,
  doska: IconWidget,
  shogird: IconUsersGroup,
  boshqaruv: IconBuildings,
};

/**
 * Har mahsulotga oʻz rangi (TYPE_META naqshi — changelog-meta.ts'dagi
 * kabi semantik Tailwind ranglar + dark variant). Bu landing'ning
 * yagona rangli joyi — atayin, mono qoida shu yerda ongli ravishda buziladi.
 *
 * Ikonbox statik qoladi — hoverda butun QATOR shu rangga toʻyinadi
 * (`PRODUCT_ROW_HOVER_STYLE`), ikonbox emas (Notion/Slack workspace-list
 * uslubi).
 */
const PRODUCT_ICON_STYLE: Record<(typeof PRODUCTS)[number]["slug"], string> = {
  baholash: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  doska: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  shogird: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  boshqaruv: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

/** Qator hoverida — fon + matn + strelka shu mahsulot ranggiga oʻtadi. */
const PRODUCT_ROW_HOVER_STYLE: Record<(typeof PRODUCTS)[number]["slug"], string> = {
  baholash: "hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:[&_.tile-label]:text-violet-700 dark:hover:[&_.tile-label]:text-violet-300 hover:[&_.tile-arrow]:text-violet-600 dark:hover:[&_.tile-arrow]:text-violet-400",
  doska: "hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:[&_.tile-label]:text-emerald-700 dark:hover:[&_.tile-label]:text-emerald-300 hover:[&_.tile-arrow]:text-emerald-600 dark:hover:[&_.tile-arrow]:text-emerald-400",
  shogird: "hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:[&_.tile-label]:text-blue-700 dark:hover:[&_.tile-label]:text-blue-300 hover:[&_.tile-arrow]:text-blue-600 dark:hover:[&_.tile-arrow]:text-blue-400",
  boshqaruv: "hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:[&_.tile-label]:text-amber-700 dark:hover:[&_.tile-label]:text-amber-300 hover:[&_.tile-arrow]:text-amber-600 dark:hover:[&_.tile-arrow]:text-amber-400",
};

type HeaderProps = {
  navigationData: NavItem[];
  className?: string;
};

const CollaborateButton = ({ className }: { className?: string }) => {
  const t = useTranslations("Landing.common");
  return (
    <ButtonWithIcon href="/register" size="sm" className={className}>
      {t("register")}
    </ButtonWithIcon>
  );
};

const Header = ({ navigationData, className }: HeaderProps) => {
  const t = useTranslations("Landing");
  const pathname = usePathname();
  const [sticky, setSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  /**
   * Faol havola. Hash-boʻlimli sahifada (landing) scroll-spy aniqlaydi;
   * alohida sahifada (masalan /blog) — joriy yoʻl boʻyicha.
   */
  const [activeHref, setActiveHref] = useState(
    () =>
      // `/blog/maqola` ham "Blog"ni yoqsin — shuning uchun prefiks boʻyicha.
      navigationData.find(
        (item) => item.href !== "/" && !item.href.startsWith("#") && pathname.startsWith(item.href),
      )?.href ??
      navigationData[0]?.href ??
      "#top",
  );

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50);
  }, []);

  const handleResize = useCallback(() => {
    if (window.innerWidth >= 768) setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [handleScroll, handleResize]);

  /**
   * Scroll-spy: qaysi boʻlim ekranning yuqori yarmida boʻlsa, oʻsha yoritiladi.
   * Ilgari "Asosiy" qoʻlda `isActive: true` qilingan va hech qachon
   * oʻzgarmasdi — foydalanuvchi Narxlarga tushsa ham "Asosiy" yonib turardi.
   */
  useEffect(() => {
    const anchors = navigationData
      .filter((item) => item.href.startsWith("#") && item.href !== "#top")
      .map((item) => item.href);

    const sections = anchors
      .map((href) => document.querySelector(href))
      .filter((el): el is Element => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveHref(`#${visible[0].target.id}`);
        } else if (window.scrollY < 200) {
          setActiveHref(navigationData[0]?.href ?? "#top");
        }
      },
      // Yuqori 20% — "hozir oʻqilayotgan" zona.
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));

    const onScrollTop = () => {
      if (window.scrollY < 200) setActiveHref(navigationData[0]?.href ?? "#top");
    };
    window.addEventListener("scroll", onScrollTop, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScrollTop);
    };
  }, [navigationData]);

  return (
    <header
      className={cn(
        "inset-x-0 z-50 px-4 flex items-center justify-center sticky top-0 h-20 animate-in fade-in slide-in-from-top-4 duration-700",
        className,
      )}
    >
      <div
        className={cn(
          "w-full max-w-6xl flex items-center h-fit justify-between gap-3.5 lg:gap-6 transition-all duration-500",
          sticky
            ? "p-2.5 bg-background/60 backdrop-blur-lg border border-border/40 shadow-2xl shadow-primary/5 rounded-full"
            : "bg-transparent border-transparent",
        )}
      >
        {/* Logo */}
        <div>
          <a href="/">
            <Logo className="gap-3" />
          </a>
        </div>

        {/* Desktop Navigation */}
        <div>
          <NavigationMenu className="max-lg:hidden bg-muted p-0.5 rounded-full">
            <NavigationMenuList className="flex gap-0">
              {navigationData.map((navItem) => {
                const isActive = navItem.href === activeHref;

                // "Mahsulotlar" — oddiy havola oʻrniga mega-menyu: hech biri
                // tayyor boʻlmasa ham, 4 mahsulot bir bosishda koʻrinadi.
                if (navItem.key === "products") {
                  return (
                    <NavigationMenuItem key={navItem.key}>
                      <NavigationMenuTrigger
                        className={cn(
                          "h-auto bg-transparent px-2 lg:px-4 py-2 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-background data-[state=open]:bg-background data-[state=open]:text-foreground",
                          isActive ? "bg-background text-foreground shadow-xs" : "",
                        )}
                      >
                        {t(`nav.${navItem.key}`)}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-64 p-2">
                          <ul className="flex flex-col gap-0.5">
                            {PRODUCTS.map((p) => {
                              const Icon = PRODUCT_ICONS[p.slug];
                              return (
                                <li key={p.slug}>
                                  <NavigationMenuLink
                                    href={`/${p.slug}`}
                                    className={cn(
                                      "flex-row items-center gap-3 rounded-lg p-2 transition-colors hover:[&_.tile-arrow]:translate-x-0 hover:[&_.tile-arrow]:opacity-100",
                                      PRODUCT_ROW_HOVER_STYLE[p.slug],
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                                        PRODUCT_ICON_STYLE[p.slug],
                                      )}
                                    >
                                      <Icon className="size-[18px] text-current" />
                                    </span>
                                    <span className="tile-label flex-1 whitespace-nowrap text-sm font-medium text-foreground transition-colors">
                                      {p.name}
                                    </span>
                                    <ArrowRight className="tile-arrow size-3.5 -translate-x-0.5 text-muted-foreground opacity-0 transition-all" />
                                  </NavigationMenuLink>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                }

                return (
                  <NavigationMenuItem key={navItem.key}>
                    <NavigationMenuLink
                      href={navItem.href}
                      aria-current={isActive ? "true" : undefined}
                      className={cn("px-2 lg:px-4 py-2 text-sm font-medium rounded-full text-muted-foreground hover:text-foreground hover:bg-background outline outline-transparent hover:outline-border hover:shadow-xs transition tracking-normal", isActive ? "bg-background text-foreground shadow-xs" : "")}
                    >
                      {t(`nav.${navItem.key}`)}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop CTA — landing standarti: "Kirish" xira havola (mavjud
            foydalanuvchi oʻzi topadi), asosiy tugma esa roʻyxatdan oʻtish
            (sahifaning maqsadi — yangi oʻqituvchi jalb qilish). */}
        <div className="flex items-center gap-2 lg:gap-3">
          <LanguageSwitcher className="hidden lg:inline-flex" />
          <Button
            asChild
            variant="ghost"
            className="hidden lg:flex rounded-full h-10 px-5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            <a href="/login">{t("common.login")}</a>
          </Button>
          <CollaborateButton className="hidden lg:flex" />

          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger">
                <span className="rounded-full border border-border p-2 block">
                  <Menu
                    width={20}
                    height={20}
                  />
                  <span className="sr-only">{t("nav.menu")}</span>
                </span>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full sm:w-96 p-0 border-l-0"
              >
                <div className="flex items-center justify-between p-6">
                  <a href="/">
                    <Logo className="gap-2" />
                  </a>
                  <SheetClose id="mobile-menu-close">
                    <span className="rounded-full border border-border p-2.5 block">
                      <X width={16} height={16} />
                    </span>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-12 px-6 pb-6 overflow-y-auto">
                  <div className="flex flex-col gap-8">
                    <SheetTitle className="sr-only">{t("nav.menu")}</SheetTitle>
                    <NavigationMenu
                      orientation="vertical"
                      className="items-start flex-none"
                    >
                      <NavigationMenuList className="flex flex-col items-start gap-3">
                        {navigationData.map((item) => {
                          const isActive = item.href === activeHref;
                          return (
                            <NavigationMenuItem key={item.key}>
                              <NavigationMenuLink
                                href={item.href}
                                aria-current={isActive ? "true" : undefined}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                  "group/nav flex items-center text-2xl font-semibold tracking-tight transition-all p-0 hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                                  isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:translate-x-2",
                                )}
                              >
                                <div
                                  className={cn(
                                    "h-0.5 bg-primary transition-all duration-300 overflow-hidden",
                                    isActive
                                      ? "w-4 mr-2 opacity-100"
                                      : "w-0 opacity-0 group-hover/nav:w-4 group-hover/nav:mr-2 group-hover/nav:opacity-100",
                                  )}
                                />
                                {t(`nav.${item.key}`)}
                              </NavigationMenuLink>
                            </NavigationMenuItem>
                          );
                        })}
                      </NavigationMenuList>
                    </NavigationMenu>

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
                    <div className="flex gap-3">
                      {[
                        { icon: Send, label: t("social.telegram") },
                        { icon: Globe, label: t("social.web") },
                        { icon: Mail, label: t("social.email") },
                        { icon: Phone, label: t("social.phone") },
                      ].map(({ icon: SocialIcon, label }) => (
                        <a
                          key={label}
                          href="#"
                          className="flex items-center justify-center rounded-full outline outline-border hover:bg-muted transition p-3 shadow-xs"
                        >
                          <SocialIcon size={16} />
                        </a>
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      © 2026 Ustozona
                    </p>
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