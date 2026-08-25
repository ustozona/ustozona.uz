import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { getPublishedPostBySlug, listComments } from "@/server/dal/blog";
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
  const comments = await listComments(post.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:py-14">
      <Link href="/blog" className="inline-flex">
        <BrandWordmark shieldClassName="size-7" textClassName="text-sm" gapClassName="gap-2" rollerSize="sm" />
      </Link>

      <article className="readable-scale readable-scale-lg mt-8">
        {post.coverImageUrl && (
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverImageUrl} alt="" className="size-full object-cover" />
          </div>
        )}
        {/* readable-scale-lg (Minor Third 6-qadam, 48px) — endi serifsiz,
            oʻlcham/qalinlik `heading-page` orqali beriladi. */}
        <h1 className="heading-page leading-tight">{post.title}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{post.authorName}</span>
          <span>·</span>
          <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("uz-UZ") : ""}</span>
        </div>

        {/* Tiptap muharriri chiqargan HTML — dars muharriri bilan bir xil
            ishonch modeli: faqat autentifikatsiyadan oʻtgan oʻqituvchining
            oʻz kontenti (lesson-editor/LessonEditor.tsx da ham sanitize
            qilinmaydi). */}
        <div
          className="lesson-prose blog-prose mt-8 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <CommentSection postId={post.id} initialComments={comments} />
    </div>
  );
}
