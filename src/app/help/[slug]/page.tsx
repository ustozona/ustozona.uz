import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import ArticleClosing from "@/components/article/ArticleClosing";
import { Callout } from "@/components/article/Callout";
import { HelpIcon } from "../_components/HelpIcon";
import { getHelpArticle, getArticleCategory, getNextArticle } from "@/lib/help-content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  return { title: article?.metaTitle ?? "Yordam | Ustozona EMS" };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  const category = getArticleCategory(slug);
  const next = getNextArticle(slug);
  const nextArticle = next ? getHelpArticle(next.slug) : undefined;
  const nextCategory = next ? getArticleCategory(next.slug) : undefined;

  return (
    <div className="w-full px-6 py-8 md:px-10 md:py-12">
      <div className="readable-scale mx-auto min-w-0 max-w-[680px]">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/help" className="transition-colors hover:text-foreground">
            Yordam
          </Link>
          {category && (
            <>
              <ChevronRight className="size-3.5 shrink-0" />
              {/* Kategoriyaning birinchi maqolasi hali yozilmagan boʻlishi
                  mumkin (HelpNav/hub'dagi "Tez orada" bilan bir xil holat) —
                  bunda link emas, oddiy matn koʻrsatiladi (/help/undefined
                  yoki 404'ga olib bormasin). */}
              {getHelpArticle(category.articles[0]?.slug ?? "") ? (
                <Link href={`/help/${category.articles[0]!.slug}`} className="transition-colors hover:text-foreground">
                  {category.label}
                </Link>
              ) : (
                <span>{category.label}</span>
              )}
            </>
          )}
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="text-foreground">{article.title}</span>
        </nav>

        <header id="kirish" className="scroll-mt-20">
          {/* readable-scale (yuqorida) `--typo-page`ni Minor Third
              shkalasining 4-qadamiga (33px) qayta belgilaydi — global
              `heading-page` (24px) shu doiradan tashqarida oʻzgarmaydi. */}
          <h1 className="heading-page mt-4 text-balance">{article.title}</h1>

          {category && (
            <div className="mt-6 flex aspect-[16/7] w-full items-center justify-center rounded-xl border border-border bg-muted/40">
              <HelpIcon name={category.icon} className="size-16 text-muted-foreground/40" />
            </div>
          )}
        </header>

        <hr className="mt-8 border-border" />

        <div className="mt-10 space-y-10">
          {article.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20 space-y-3">
              <h2 className="heading-section">{s.title}</h2>
              <div className="space-y-3.5">
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-body leading-7">
                    {p}
                  </p>
                ))}
                {s.callout && (
                  <Callout type={s.callout.type} title={s.callout.title}>
                    {s.callout.text}
                  </Callout>
                )}
              </div>
            </section>
          ))}
        </div>

        {next && nextArticle && (
          <Link
            href={`/help/${next.slug}`}
            className="group mt-12 flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            {nextCategory && (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <HelpIcon name={nextCategory.icon} className="size-5 text-primary" />
              </div>
            )}
            <p className="min-w-0 flex-1 text-base font-semibold text-foreground">{next.title}</p>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
              Davom etish
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        <ArticleClosing />
      </div>
    </div>
  );
}
