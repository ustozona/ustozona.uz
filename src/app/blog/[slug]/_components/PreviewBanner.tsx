import Link from "next/link";

/* Preview rejimi bannerı — muallif ishchi nusxani koʻrayotganini ochiq
   bildiradi. `prefetch={false}` MAJBURIY: aks holda Next havolani oldindan
   yuklab, draftMode cookie'ni beixtiyor oʻchirib qoʻyishi mumkin
   (node_modules/next/dist/docs/.../draft-mode.md). */
export function PreviewBanner({
  slug,
  variant,
}: {
  slug: string;
  variant: "draft" | "changes";
}) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-foreground px-4 py-2 text-center text-xs font-medium text-background">
      <span>
        {variant === "draft"
          ? "Koʻrib chiqish — bu maqola hali nashr qilinmagan, faqat siz koʻryapsiz."
          : "Koʻrib chiqish — saqlangan, lekin hali nashr qilinmagan oʻzgarishlar."}
      </span>
      <Link
        href={`/api/blog/preview-exit?to=/blog/${slug}`}
        prefetch={false}
        className="underline underline-offset-2"
      >
        Chiqish
      </Link>
    </div>
  );
}
