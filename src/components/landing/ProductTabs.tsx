"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Tabs as TabsPrimitive } from "radix-ui";
import {
  ArrowRight,
  BellRing,
  CalendarRange,
  FileUp,
  House,
  MessageCircleQuestion,
  MonitorPlay,
  Presentation,
  QrCode,
  ScanLine,
  Smartphone,
  Sparkles,
  StickyNote,
  Timer,
  UserCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LANDING_TONES, type LandingTone } from "@/components/landing/landing-tones";
import {
  AssessmentMock,
  BoardMock,
  JournalMock,
  PresentationMock,
} from "@/components/landing/landing-mocks";
import {
  IconChartSquare,
  IconClipboard,
  IconWidget,
} from "@/components/shadcn-space/blocks/hero-01/product-icons";
import { IconTrafficLight } from "@/components/doska/icons";

type Icon = ComponentType<{ className?: string }>;

/**
 * «Ustozonada nima bor?» — har mahsulotga bitta tab.
 *
 * Tab ichida chapda katta karta (vizual namuna + ogʻriq savol shaklida +
 * havola), oʻngda 4 ta fakt kartasi. Fakt shakli qatʼiy: qalin qism —
 * nima qiladi, davomi — oʻqituvchiga nima beradi. Bitta jumla.
 *
 * Matn tarjimada (`Landing.what.tabs`, tartib shu massiv bilan bir xil),
 * manzil, rang, ikonka va namuna shu yerda. Faktlar faqat tekshirilgan
 * imkoniyatlardan — yangi vaʼda shu yerda paydo boʻlmasin.
 *
 * Hamma panel HTML'da turadi (`forceMount`), faqat faoli koʻrinadi —
 * qidiruv tizimi yashirin tablarni ham oʻqiydi.
 *
 * `#jurnal`, `#baholash` … havolalari (header, hero vazifalari) shu
 * boʻlimga olib keladi va mos tabni ochadi. Tanlangan tab manzilga
 * yoziladi (`replaceState`): aks holda manzil `#jurnal` da turganda
 * boshqa tab tanlanib, keyin yana `#jurnal` havolasi bosilsa, `hashchange`
 * chiqmasdi va Jurnal ochilmasdi.
 *
 * JS yuklanguncha (gidratatsiyadan oldin) toʻgʻri panelni CSS koʻrsatadi:
 * `:target` + `:has()`, `data-hydrated` yoʻq paytda
 * (globals.css, «Mahsulot tablari»). Aks holda `/#doska` bilan kelgan
 * odam avval Jurnalni koʻrib, keyin almashishini kuzatardi.
 */
const TABS: {
  key: string;
  tone: LandingTone;
  href: string;
  TabIcon: Icon;
  Mock: ComponentType;
  factIcons: [Icon, Icon, Icon, Icon];
}[] = [
  {
    key: "jurnal",
    tone: "jurnal",
    href: "/register",
    TabIcon: IconClipboard,
    Mock: JournalMock,
    factIcons: [BellRing, UserCheck, CalendarRange, Sparkles],
  },
  {
    key: "baholash",
    tone: "baholash",
    href: "/baholash",
    TabIcon: IconChartSquare,
    Mock: AssessmentMock,
    factIcons: [Smartphone, QrCode, ScanLine, House],
  },
  {
    key: "taqdimot",
    tone: "taqdimot",
    href: "/baholash",
    TabIcon: Presentation,
    Mock: PresentationMock,
    factIcons: [FileUp, MessageCircleQuestion, Smartphone, MonitorPlay],
  },
  {
    key: "doska",
    tone: "doska",
    href: "/doska",
    TabIcon: IconWidget,
    Mock: BoardMock,
    factIcons: [Timer, IconTrafficLight, StickyNote, Zap],
  },
];

type TabText = {
  label: string;
  question: string;
  summary: string;
  cta: string;
  facts: { lead: string; text: string }[];
};

export function ProductTabs() {
  const t = useTranslations("Landing.what");
  const texts = t.raw("tabs") as TabText[];
  const [active, setActive] = useState(TABS[0].key);
  const [hydrated, setHydrated] = useState(false);

  /* Havoladagi langar mos tabni ochadi — sahifa yuklanganda ham, sahifa
     ichidagi `#…` havola bosilganda ham. `setHydrated` shu renderda —
     CSS qoidasi React tanlagan tab bilan bir vaqtda oʻchadi, oraliq kadr
     boʻlmaydi. */
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1);
      if (TABS.some((tab) => tab.key === hash)) setActive(hash);
    };
    sync();
    setHydrated(true);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const select = (key: string) => {
    setActive(key);
    window.history.replaceState(null, "", `#${key}`);
  };

  return (
    <section
      data-product-tabs=""
      data-hydrated={hydrated ? "" : undefined}
      className="relative py-12 md:py-16"
    >
      {/* Langarlar — hammasi boʻlim boshida; sticky header ostida
          qolmasligi uchun `scroll-mt`. */}
      {TABS.map((tab) => (
        <span key={tab.key} id={tab.key} aria-hidden className="absolute top-0 scroll-mt-24" />
      ))}
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-landing-4 font-semibold text-foreground md:mb-8">
          {t("heading")}
        </h2>

        <TabsPrimitive.Root value={active} onValueChange={select}>
          <TabsPrimitive.List
            aria-label={t("heading")}
            className="mx-auto mb-6 grid max-w-md grid-cols-2 gap-2 sm:flex sm:max-w-none sm:justify-center md:mb-8"
          >
            {TABS.map((tab, i) => {
              const tone = LANDING_TONES[tab.tone];
              const isActive = tab.key === active;
              return (
                <TabsPrimitive.Trigger
                  key={tab.key}
                  value={tab.key}
                  data-tab-trigger={tab.key}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? cn("border-transparent", tone.soft)
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <tab.TabIcon className="size-4" />
                  {texts[i]?.label}
                </TabsPrimitive.Trigger>
              );
            })}
          </TabsPrimitive.List>

          {TABS.map((tab, i) => {
            const text = texts[i];
            if (!text) return null;
            const tone = LANDING_TONES[tab.tone];
            return (
              <TabsPrimitive.Content
                key={tab.key}
                value={tab.key}
                data-tab-panel={tab.key}
                forceMount
                className="grid gap-4 focus-visible:outline-none data-[state=inactive]:hidden lg:grid-cols-5"
              >
                <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
                  <tab.Mock />
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <h3 className="text-landing-2 font-semibold text-foreground text-balance">
                      {text.question}
                    </h3>
                    <p className="mt-2 text-base text-muted-foreground">{text.summary}</p>
                    <a
                      href={tab.href}
                      className={cn(
                        "group mt-auto inline-flex items-center gap-1 self-start pt-5 text-sm font-medium",
                        tone.text,
                      )}
                    >
                      {text.cta}
                      <ArrowRight className="size-4 transition-transform duration-fast ease-standard group-hover:translate-x-0.5" />
                    </a>
                  </div>
                </article>

                <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
                  {text.facts.map((fact, j) => {
                    const FactIcon = tab.factIcons[j] ?? tab.factIcons[0];
                    return (
                      <li
                        key={fact.lead}
                        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:p-6"
                      >
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            tone.soft,
                          )}
                        >
                          <FactIcon className="size-5" />
                        </span>
                        <p className="text-base text-muted-foreground">
                          <strong className="font-semibold text-foreground">{fact.lead}</strong>
                          {" — "}
                          {fact.text}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </TabsPrimitive.Content>
            );
          })}
        </TabsPrimitive.Root>
      </div>
    </section>
  );
}

export default ProductTabs;
