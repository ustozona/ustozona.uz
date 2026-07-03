import { notFound } from "next/navigation";
import Header, { type NavigationSection } from "@/components/shadcn-space/blocks/hero-01/header";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";
import { Blogpost1 } from "@/components/blogpost1";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog-posts";

const navigationData: NavigationSection[] = [
  { title: "Asosiy", href: "/" },
  { title: "Imkoniyatlar", href: "/#features" },
  { title: "Narxlar", href: "/#pricing" },
  { title: "Blog", href: "/blog", isActive: true },
  { title: "FAQ", href: "/#faq" },
];

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Maqola topilmadi — Ustozona" };
  return { title: `${post.title} — Ustozona`, description: post.description };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="min-h-screen flex flex-col theme-landing-mono">
      <Header navigationData={navigationData} />
      <main className="flex-1">
        <Blogpost1
          title={post.title}
          description={post.description}
          author={post.author}
          pubDate={new Date(post.date)}
        />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}
