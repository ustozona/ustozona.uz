import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import type { Metadata } from "next";
import { ClockIcon, EyeIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/store/useFeedbackStore";
import { formatFullDateUz } from "@/lib/localization";
import { readingTimeShortUz } from "@/lib/reading-time";
import { formatCountUz, viewsLabelUz } from "@/lib/format-count";
import { trimProseHtml } from "@/lib/prose-html";
import { getPublishedPostBySlug, getPreviewPostBySlug, listComments } from "@/server/dal/blog";
import { getSession } from "@/server/session";
import { BlogHeader } from "../_components/BlogHeader";
import { CommentSection } from "./_components/CommentSection";
import { PreviewBanner } from "./_components/PreviewBanner";
import { ShareButton } from "./_components/ShareButton";
import { ViewBeacon } from "./_components/ViewBeacon";
import { VideoEmbedHydrator } from "@/components/video-embed/VideoEmbedHydrator";
import { abs, SITE_URL } from "@/lib/site-url";

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
  const description = post.excerpt || undefined;
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

  const [comments, session] = await Promise.all([listComments(post.id), getSession()]);
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
              description: post.excerpt || undefined,
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

      <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-14">
        <article className="readable-scale readable-scale-lg">
          {post.coverImageUrl && (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImageUrl} alt="" className="size-full object-cover" />
            </div>
          )}
          {/* readable-scale-lg (Minor Third 6-qadam, 48px) — endi serifsiz,
              oʻlcham/qalinlik `heading-page` orqali beriladi. */}
          <h1 className="heading-page leading-tight">{post.title}</h1>
          {post.excerpt && (
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
          )}

          {/* Muallif qatori («Sokin» — Substack/Medium uslubi): avatar +
              ism birinchi darajada, ostida `sana · N daqiqa oʻqish` xira.
              Koʻrishlar soni oʻngda, koʻz ikonasi bilan kichik; undan keyin
              ulashish tugmasi. Sana toʻliq yoziladi (`2026-yil 29-avgust`) —
              `29/08/2026` koʻrinishida qaysi raqam kun ekani noaniq. */}
          <div className="mt-6 flex items-center gap-3">
            <Avatar className="size-10">
              {post.authorAvatarUrl && (
                <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                {initialsOf(post.authorName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{post.authorName}</p>
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                {post.publishedAt && (
                  <>
                    <span>{formatFullDateUz(post.publishedAt)}</span>
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
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
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

          {/* Tiptap muharriri chiqargan HTML — dars muharriri bilan bir xil
              ishonch modeli: faqat autentifikatsiyadan oʻtgan oʻqituvchining
              oʻz kontenti (lesson-editor/LessonEditor.tsx da ham sanitize
              qilinmaydi). */}
          <div
            className="lesson-prose blog-prose mt-8 max-w-none border-t border-border pt-8"
            dangerouslySetInnerHTML={{ __html: trimProseHtml(post.content) }}
          />

          {/* Kontent ichidagi video placeholder'lari React fasadiga
              almashtiriladi (iframe faqat ▶︎ bosilgach yuklanadi).
              Selektor yagona: .blog-prose shu sahifada bitta. */}
          <VideoEmbedHydrator selector=".blog-prose" />
        </article>

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
    </>
  );
}
