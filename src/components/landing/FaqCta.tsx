"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, PlusIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TELEGRAM_URL } from "@/lib/landing-nav";

/**
 * FAQ + yakuniy chaqiriq — bitta boʻlimda, ikki ustun.
 *
 * Chapda savollar, oʻngda chaqiriq kartasi. Kartani katta ekranda
 * `sticky` qilamiz: uzun savollar roʻyxatini oʻqiyotgan odam roʻyxatdan
 * oʻtish tugmasini koʻzdan yoʻqotmaydi. Telefonda karta savollardan
 * keyin turadi.
 */
export function FaqCta() {
  const t = useTranslations("Landing");
  const items = t.raw("faq.items") as { question: string; answer: string }[];
  return (
    <section className="bg-muted/30 py-12 md:py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 md:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:px-8">
        <div>
          <h2 className="mb-3 text-landing-4 font-semibold text-foreground">{t("faq.heading")}</h2>
          <p className="mb-6 text-base text-muted-foreground">{t("faq.subtitle")}</p>

          <Accordion type="single" collapsible defaultValue="item-0" className="flex flex-col gap-3">
            {items.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                value={`item-${index}`}
                className="rounded-xl border border-border bg-card px-5 transition-colors last:border-b data-[state=open]:border-foreground/20"
              >
                <AccordionTrigger className="py-4 text-base font-semibold hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden [&[data-state=open]>svg]:rotate-45 cursor-pointer">
                  {faq.question}
                  <PlusIcon className="size-5 shrink-0 text-muted-foreground transition-transform duration-200" />
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <p className="mt-5 text-sm text-muted-foreground">
            {t("faq.contactPrompt")}{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
            >
              {t("faq.contactCta")}
              <ArrowUpRight className="size-4" />
            </a>
          </p>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground lg:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary-foreground/10" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-12 size-40 rounded-full bg-primary-foreground/10" />
            <div className="relative">
              <h3 className="text-landing-4 font-semibold text-balance">
                {t("cta.headingLine1")}{" "}
                <span className="text-primary-foreground/70">{t("cta.headingLine2")}</span>
              </h3>
              <p className="mt-4 text-sm text-primary-foreground/80">{t("cta.desc")}</p>
              <a
                href="/register"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-foreground px-6 text-base font-semibold text-primary transition-colors duration-fast ease-standard hover:bg-primary-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
              >
                {t("cta.ctaLabel")}
                <ArrowUpRight className="size-5" />
              </a>
              <p className="mt-4 text-xs text-primary-foreground/70">{t("cta.trust")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FaqCta;
