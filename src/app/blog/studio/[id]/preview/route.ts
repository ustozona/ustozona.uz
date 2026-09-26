import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getMyPostById } from "@/server/dal/blog";

/* Preview'ni yoqadi (draftMode cookie) va ommaviy sahifaga oʻtkazadi.
   `getMyPostById` egalikni tekshiradi — begona odam bu havolani ochsa
   `/blog/studio` ga tushadi, cookie qoʻyilmaydi.

   Route handler (server action emas) — Next hujjatida draftMode'ni yoqish
   uchun tavsiya etilgan yoʻl (node_modules/next/dist/docs/01-app/
   02-guides/draft-mode.md). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getMyPostById(id).catch(() => null);
  if (!post) redirect("/blog/studio");
  const draft = await draftMode();
  draft.enable();
  redirect(`/blog/${post.slug}`);
}
