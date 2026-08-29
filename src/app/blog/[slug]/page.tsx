import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf } from "@/store/useFeedbackStore";
import { formatFullDateUz } from "@/lib/localization";
import { readingTimeLabelUz } from "@/lib/reading-time";
import { getPublishedPostBySlug, listComments } from "@/server/dal/blog";
import { getSession } from "@/server/session";
import { BlogHeader } from "../_components/BlogHeader";
import { CommentSection } from "./_components/CommentSection";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt || undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();
  const [comments, session] = await Promise.all([listComments(post.id), getSession()]);

  return (
    <>
      <BlogHeader />

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

          {/* Muallif qatori — avatar + ism birinchi darajada, sana va oʻqish
              vaqti ikkinchi qatorda xira. Medium/Substack naqshi: oʻquvchi
              avval KIM yozganini koʻradi, keyin qachon va qancha vaqt
              ketishini. Sana toʻliq yoziladi (`2026-yil 29-avgust`) —
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
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{post.authorName}</p>
              <p className="text-xs text-muted-foreground">
                {post.publishedAt && <>{formatFullDateUz(post.publishedAt)} · </>}
                {readingTimeLabelUz(post.content)}
              </p>
            </div>
          </div>

          {/* Tiptap muharriri chiqargan HTML — dars muharriri bilan bir xil
              ishonch modeli: faqat autentifikatsiyadan oʻtgan oʻqituvchining
              oʻz kontenti (lesson-editor/LessonEditor.tsx da ham sanitize
              qilinmaydi). */}
          <div
            className="lesson-prose blog-prose mt-8 max-w-none border-t border-border pt-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <CommentSection
          postId={post.id}
          initialComments={comments}
          viewer={
            session
              ? { name: session.user.name ?? "", avatarUrl: session.user.image ?? null }
              : null
          }
        />
      </div>
    </>
  );
}
