import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, ClockIcon, EyeIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BrandShield } from "@/assets/logo/brand-shield";
import { initialsOf } from "@/store/useFeedbackStore";
import { formatFullDateUz } from "@/lib/localization";
import { readingTimeShortUz } from "@/lib/reading-time";
import { formatCountUz, viewsLabelUz } from "@/lib/format-count";
import { stripDuplicateTitle, trimProseHtml } from "@/lib/prose-html";
import { getPublishedPostBySlug, getPreviewPostBySlug, listComments, listPublishedPosts } from "@/server/dal/blog";
import { getSession } from "@/server/session";
import { BlogFooter, BlogHero } from "../_components/BlogGrid";
import { BlogHeader } from "../_components/BlogHeader";
import { CommentSection } from "./_components/CommentSection";
import { PreviewBanner } from "./_components/PreviewBanner";
import { ShareButton } from "./_components/ShareButton";
import { ViewBeacon } from "./_components/ViewBeacon";
import { VideoEmbedHydrator } from "@/components/video-embed/VideoEmbedHydrator";
import { abs, SITE_URL } from "@/lib/site-url";
import { resolveExcerpt } from "@/lib/blog-excerpt";

/** OMMAVIY versiyaning oxirgi oʻzgarish vaqti.
 *
 *  `updatedAt` toʻgʻridan-toʻgʻri ishlatilmaydi: u qoralama tahrirlanganda
 *  ham suriladi, ommaviy matn esa suratdan oʻqiladi va oʻzgarmaydi
 *  (docs/blog-nashr-modeli.md). Nashr qilinmagan oʻzgarish turgan boʻlsa,
 *  ommaviy nusxa oxirgi marta NASHR paytida oʻzgargan. */
function publicModifiedAt(post: { updatedAt: string; publishedAt: string | null; hasUnpublishedChanges: boolean }): string {
  if (post.hasUnpublishedChanges && post.publishedAt) return post.publishedAt;
  return post.updatedAt;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  /* Nashr qilinmagan (preview rejimida koʻrilayotgan qoralama) — indekslanmasin.
     Amalda robot bu yerga yetib kelmaydi (draftMode cookie'siz sahifa 404
     boʻladi), lekin havola tasodifan ulashilsa himoya boʻlib qoladi. */
  if (!post) return { robots: { index: false, follow: false } };

  const url = abs(`/blog/${post.slug}`);
  const description = resolveExcerpt(post.excerpt, post.content) || undefined;
  const modifiedTime = publicModifiedAt(post);

  return {
    title: post.title,
    description,
    authors: [{ name: post.authorName }],
    alternates: { canonical: `/blog/${post.slug}` },
    /* ⚠️ `openGraph` sayoz birlashadi — ildizdagi obyektni butunlay
       almashtiradi. Shuning uchun `siteName`/`locale` shu yerda QAYTA
       yoziladi, aks holda ular yoʻqoladi. */
    openGraph: {
      type: "article",
      url,
      siteName: "Ustozona",
      locale: "uz_UZ",
      title: post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime,
      authors: [post.authorName],
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
    twitter: {
      card: post.coverImageUrl ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { isEnabled: previewMode } = await draftMode();

  /* Preview: draftMode cookie bor VA koʻruvchi shu postning egasi boʻlsa
     ishchi nusxa koʻrsatiladi. Aks holda (begona odam, yoki nashr
     qilingan post) — ommaviy surat. */
  let post = previewMode ? await getPreviewPostBySlug(slug) : null;
  const isPreview = post !== null;
  if (!post) post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const [comments, session, allPosts] = await Promise.all([
    listComments(post.id),
    getSession(),
    listPublishedPosts(),
  ]);
  const postId = post.id;
  const related = allPosts.filter((p) => p.id !== postId).slice(0, 3);
  const canComment = !isPreview && post.status === "published";

  return (
    <>
      {isPreview && (
        <PreviewBanner slug={post.slug} variant={post.status === "published" ? "changes" : "draft"} />
      )}
      <BlogHeader />

      {/* JSON-LD `Article` — Googlega maqolaning muallifi, sanasi va
          rasmini aniq aytadi (metadata teglaridan mustaqil, kuchliroq
          signal). Faqat haqiqatan nashr qilingan sahifada chiqadi:
          preview'da yolgʻon sana berib qoʻymaslik uchun. */}
      {!isPreview && post.status === "published" && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: resolveExcerpt(post.excerpt, post.content) || undefined,
              image: post.coverImageUrl || undefined,
              datePublished: post.publishedAt ?? undefined,
              dateModified: publicModifiedAt(post),
              author: { "@type": "Person", name: post.authorName },
              publisher: { "@type": "Organization", name: "Ustozona", url: SITE_URL },
              mainEntityOfPage: abs(`/blog/${post.slug}`),
              inLanguage: "uz",
            }),
          }}
        />
      )}

      {!isPreview && <ViewBeacon postId={post.id} />}

      {/* Oʻqish uchun blog tuzilishi: ← tugmasi, sarlavha, subtitr, muallif
          qatori va matn — HAMMASI bitta markaziy ustunda (~680px), chap
          chegarasi bir xil. Muqova ustundan biroz kengroq. Yon panel yoʻq —
          meta (sana, oʻqish vaqti, koʻrishlar, ulashish) muallif qatorida. */}
      <BlogHero className="pb-6 md:pb-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Button asChild variant="outline" size="icon" className="size-8">
          <Link href="/blog" aria-label="Blogga qaytish">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-medium tracking-tighter text-balance text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-muted-foreground md:text-lg md:text-pretty">{post.excerpt}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <Avatar className="size-10 border border-border">
            {post.authorAvatarUrl && (
              <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
              {initialsOf(post.authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{post.authorName}</p>
            <p className="text-caption flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
              {post.publishedAt && (
                <>
                  <time dateTime={post.publishedAt}>{formatFullDateUz(post.publishedAt)}</time>
                  <span aria-hidden>·</span>
                </>
              )}
              <span className="inline-flex items-center gap-1" title="Taxminiy oʻqish vaqti">
                <ClockIcon className="size-3" />
                {readingTimeShortUz(post.content)}
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="text-caption inline-flex items-center gap-1.5 text-muted-foreground"
              title={viewsLabelUz(post.viewCount)}
            >
              <EyeIcon className="size-3.5" />
              {formatCountUz(post.viewCount)}
            </span>
            {!isPreview && post.status === "published" && (
              <ShareButton slug={post.slug} title={post.title} />
            )}
          </div>
        </div>
        </div>
      </BlogHero>

      {/* Tana — ramka chiziqlarisiz: oʻqish sahifasida faqat matn va fon. */}
      <main className="mx-auto w-full max-w-7xl">
        <div className="px-6 pt-8 pb-10 lg:pb-14">
          {post.coverImageUrl && (
            <div className="mx-auto mb-10 aspect-video w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImageUrl} alt="" className="size-full object-cover" />
            </div>
          )}

          <article className="readable-scale readable-scale-lg mx-auto max-w-2xl">
            {/* Tiptap muharriri chiqargan HTML — dars muharriri bilan bir xil
                ishonch modeli: faqat autentifikatsiyadan oʻtgan oʻqituvchining
                oʻz kontenti (lesson-editor/LessonEditor.tsx da ham sanitize
                qilinmaydi). */}
            <div
              className="lesson-prose blog-prose max-w-none"
              dangerouslySetInnerHTML={{ __html: stripDuplicateTitle(trimProseHtml(post.content), post.title) }}
            />

            {/* Kontent ichidagi video placeholder'lari React fasadiga
                almashtiriladi (iframe faqat ▶︎ bosilgach yuklanadi).
                Selektor yagona: .blog-prose shu sahifada bitta. */}
            <VideoEmbedHydrator selector=".blog-prose" />
          </article>

          <div className="mx-auto max-w-2xl">
            {canComment ? (
              <CommentSection
                postId={post.id}
                initialComments={comments}
                canModerate={session != null && session.user.id === post.teacherId}
                viewer={
                  session
                    ? { name: session.user.name ?? "", avatarUrl: session.user.image ?? null }
                    : null
                }
              />
            ) : isPreview ? (
              <p className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
                Fikrlar nashr qilingandan keyin koʻrinadi.
              </p>
            ) : null}
          </div>
        </div>
      </main>

      {/* «Boshqa maqolalar» — matn bilan bir xil oʻqish ustunida (koʻz bir
          chiziqda qoladi), qatorlar orasida chiziq emas — boʻshliq: muqova, sarlavha, 2 qatorli subtitr,
          muallif va sana. Eng soʻnggi uchta nashr, joriy maqoladan tashqari. */}
      {related.length > 0 && (
        <section className="border-t border-border px-6 py-10 lg:py-14">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-2xl font-medium tracking-tight text-foreground">Boshqa maqolalar</h2>
            <div className="flex flex-col gap-8">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted sm:w-56">
                    {r.coverImageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={r.coverImageUrl}
                        alt=""
                        className="size-full object-cover transition-opacity group-hover:opacity-80"
                      />
                    ) : (
                      <BrandShield className="size-9 opacity-30 grayscale" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h3 className="line-clamp-2 text-lg leading-snug font-semibold text-foreground underline-offset-4 group-hover:underline">
                      {r.title}
                    </h3>
                    {r.excerpt && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{r.excerpt}</p>
                    )}
                    <div className="text-caption flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <Avatar className="size-5 border border-border">
                        {r.authorAvatarUrl && (
                          <AvatarImage src={r.authorAvatarUrl} alt={r.authorName} referrerPolicy="no-referrer" />
                        )}
                        <AvatarFallback className="bg-muted text-[9px] font-semibold text-muted-foreground">
                          {initialsOf(r.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{r.authorName}</span>
                      {r.publishedAt && (
                        <>
                          <span aria-hidden>·</span>
                          <time dateTime={r.publishedAt} className="shrink-0">
                            {formatFullDateUz(r.publishedAt)}
                          </time>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <BlogFooter />
    </>
  );
}
