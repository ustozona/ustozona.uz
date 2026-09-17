import Link from "next/link";
import { CalendarDaysIcon, EyeIcon } from "lucide-react";
import { BrandShield } from "@/assets/logo/brand-shield";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatCountUz, viewsLabelUz } from "@/lib/format-count";
import { formatFullDateUz } from "@/lib/localization";
import { initialsOf } from "@/store/useFeedbackStore";
import type { BlogPostSummary } from "@/server/dal/blog";

/* Blog roʻyxati — chiziqli setka: kartalar orasida boʻshliq yoʻq, ularni
   faqat 1px chiziqlar ajratadi. Har karta oʻzining chap (`before`) va
   yuqori (`after`) chizigʻini choʻzib chizadi, konteyner `overflow-hidden`
   bilan ortiqchasini kesadi — ustun/qator soni qanday boʻlmasin, setka
   uzluksiz chiqadi. */
export function BlogGrid({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <div className="relative grid grid-cols-1 overflow-hidden border-x border-b border-border md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

/* Karta pasporti: muqova doim 16:9, sarlavha va tavsif koʻpi bilan 2
   qatordan, boʻsh joy esa muallif qatori USTIDA yigʻiladi (`mt-auto`) —
   shunda bir qatordagi kartalarning muallif qatori bir chiziqda turadi,
   sarlavha bilan tavsif orasida esa ortiqcha boʻshliq chiqmaydi. */
function PostCard({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col before:absolute before:-left-px before:top-0 before:z-10 before:h-screen before:w-px before:bg-border after:absolute after:-top-px after:left-0 after:h-px after:w-screen after:bg-border"
    >
      <Cover post={post} className="border-b border-border" />
      <div className="flex flex-1 flex-col gap-2 p-6">
        {post.publishedAt && (
          <time dateTime={post.publishedAt} className="text-caption inline-flex items-center gap-1.5 text-muted-foreground">
            <CalendarDaysIcon className="size-3.5" />
            {formatFullDateUz(post.publishedAt)}
          </time>
        )}
        <h3 className="heading-section line-clamp-2 text-card-foreground underline-offset-4 group-hover:underline">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        )}
        <AuthorRow post={post} />
      </div>
    </Link>
  );
}

/* Muqova yoʻq boʻlsa kulrang boʻsh quti emas — brend qalqoni bilan
   xira fon: sahifa «buzilgan rasm» kabi koʻrinmaydi. */
function Cover({ post, className }: { post: BlogPostSummary; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-video w-full items-center justify-center overflow-hidden bg-muted",
        className,
      )}
    >
      {post.coverImageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={post.coverImageUrl}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <BrandShield className="size-12 opacity-30 grayscale" />
      )}
    </div>
  );
}

function AuthorRow({ post }: { post: BlogPostSummary }) {
  return (
    <div className="mt-auto flex items-center gap-2.5 pt-4">
      <Avatar className="size-7 shrink-0 border border-border">
        {post.authorAvatarUrl && (
          <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} referrerPolicy="no-referrer" />
        )}
        <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
          {initialsOf(post.authorName)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{post.authorName}</span>
      {/* Oʻng tomonda tugma emas — koʻrishlar soni: butun karta baribir
          havola, qoʻshimcha «oʻqish» belgisi faqat shovqin edi. */}
      <span
        className="text-caption inline-flex shrink-0 items-center gap-1.5 text-muted-foreground"
        title={viewsLabelUz(post.viewCount)}
      >
        <EyeIcon className="size-3.5" />
        {formatCountUz(post.viewCount)}
      </span>
    </div>
  );
}

/* Sahifa boshidagi qism — miltillovchi nuqtali fon (pastga qarab soʻnadi)
   ustida sarlavha va tavsif. Indeks va maqola sahifasi ikkalasi ham shu
   qobiqni ishlatadi, shuning uchun alohida eksport. */
export function BlogHero({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[200px] [mask-image:linear-gradient(to_top,transparent_25%,black_95%)]"
      >
        <FlickeringGrid
          className="absolute inset-0"
          squareSize={4}
          gridGap={6}
          color="var(--muted-foreground)"
          maxOpacity={0.2}
          flickerChance={0.1}
        />
      </div>
      <div className={cn("relative mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-10 md:py-12 xl:px-0", className)}>
        {children}
      </div>
    </div>
  );
}

export function BlogFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="text-caption mx-auto w-full max-w-7xl p-6 text-center text-muted-foreground xl:px-0">
        © {new Date().getFullYear()} Ustozona. Barcha huquqlar himoyalangan.
      </div>
    </footer>
  );
}
